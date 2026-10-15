const GRAPH_ID = "simot-core-overview";
const GRAPH_SCHEMA = "simot.visual-control-plane.graph";
const MAX_CONTENT_BYTES = 1_000_000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function validateGraph(graph) {
  if (!graph || typeof graph !== "object" || Array.isArray(graph)) return "INVALID_GRAPH";
  if (graph.schema !== GRAPH_SCHEMA || graph.schemaVersion !== 1 || graph.graphId !== GRAPH_ID) return "GRAPH_SCHEMA_MISMATCH";
  if (!Number.isInteger(graph.revision) || graph.revision < 1) return "INVALID_GRAPH_REVISION";
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return "INVALID_GRAPH_COLLECTIONS";
  const nodeIds = new Set();
  for (const node of graph.nodes) {
    if (!node || typeof node.id !== "string" || !node.id || nodeIds.has(node.id)) return "INVALID_OR_DUPLICATE_NODE_ID";
    nodeIds.add(node.id);
  }
  const edgeIds = new Set();
  for (const edge of graph.edges) {
    if (!edge || typeof edge.id !== "string" || !edge.id || edgeIds.has(edge.id)) return "INVALID_OR_DUPLICATE_EDGE_ID";
    if (typeof edge.source !== "string" || typeof edge.target !== "string" || !nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return "INVALID_EDGE_ENDPOINT";
    edgeIds.add(edge.id);
  }
  return null;
}

async function ensureTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS control_plane_graphs (
    graph_id TEXT PRIMARY KEY,
    schema_version INTEGER NOT NULL,
    revision INTEGER NOT NULL,
    content_sha256 TEXT NOT NULL,
    content_json TEXT NOT NULL,
    source_memory_version INTEGER NOT NULL,
    source_memory_sha256 TEXT NOT NULL,
    synced_at TEXT NOT NULL
  )`).run();
}

export async function handleGraphSync(request, env) {
  if (!env?.SIMOT_DB) return json({ ok: false, error: "RUNTIME_NOT_CONFIGURED" }, 503);
  try {
    if (request.method === "GET") {
      const table = await env.SIMOT_DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='control_plane_graphs'"
      ).first();
      if (!table) return json({ ok: true, synced: false, graph_id: GRAPH_ID, d1_revision: 0 });
      const row = await env.SIMOT_DB.prepare(
        "SELECT graph_id,schema_version,revision,content_sha256,content_json,source_memory_version,source_memory_sha256,synced_at FROM control_plane_graphs WHERE graph_id=?"
      ).bind(GRAPH_ID).first();
      if (!row) return json({ ok: true, synced: false, graph_id: GRAPH_ID, d1_revision: 0 });
      return json({
        ok: true,
        synced: true,
        graph_id: row.graph_id,
        schema_version: row.schema_version,
        revision: row.revision,
        content_sha256: row.content_sha256,
        content: row.content_json,
        source_memory: { system: "VPS_MASTER_MEMORY", version: row.source_memory_version, sha256: row.source_memory_sha256 },
        synced_at: row.synced_at
      });
    }
    if (request.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
    await ensureTable(env.SIMOT_DB);
    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_CONTENT_BYTES + 100_000) return json({ ok: false, error: "GRAPH_PAYLOAD_TOO_LARGE" }, 413);
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, error: "INVALID_JSON" }, 400); }
    if (!body || typeof body !== "object" || typeof body.content !== "string" ||
        !Number.isInteger(body.expected_d1_revision) || body.expected_d1_revision < 0 ||
        body.bucket !== "working" || body.object_id !== GRAPH_ID ||
        body.source_memory?.system !== "VPS_MASTER_MEMORY" ||
        !Number.isInteger(body.source_memory?.version) || body.source_memory.version < 1 ||
        !isSha256(body.source_memory?.sha256)) {
      return json({ ok: false, error: "INVALID_GRAPH_SYNC_PAYLOAD" }, 400);
    }
    if (new TextEncoder().encode(body.content).byteLength > MAX_CONTENT_BYTES) return json({ ok: false, error: "GRAPH_PAYLOAD_TOO_LARGE" }, 413);
    const contentHash = await sha256Hex(body.content);
    if (contentHash !== body.source_memory.sha256.toLowerCase()) return json({ ok: false, error: "SOURCE_MEMORY_HASH_MISMATCH" }, 409);
    let graph;
    try { graph = JSON.parse(body.content); } catch { return json({ ok: false, error: "INVALID_GRAPH_JSON" }, 400); }
    const validationError = validateGraph(graph);
    if (validationError) return json({ ok: false, error: validationError }, 400);

    const db = env.SIMOT_DB;
    const existing = await db.prepare("SELECT revision,content_sha256,source_memory_version,source_memory_sha256 FROM control_plane_graphs WHERE graph_id=?").bind(GRAPH_ID).first();
    const currentRevision = Number(existing?.revision || 0);
    if (currentRevision !== body.expected_d1_revision) {
      return json({ ok: false, error: "D1_REVISION_CONFLICT", expected_d1_revision: body.expected_d1_revision, current_d1_revision: currentRevision }, 409);
    }
    if (existing && graph.revision < currentRevision) {
      return json({ ok: false, error: "STALE_GRAPH_REVISION", current_d1_revision: currentRevision, incoming_revision: graph.revision }, 409);
    }
    if (existing && graph.revision === currentRevision) {
      if (existing.source_memory_sha256 === contentHash) {
        return json({ ok: true, synced: true, idempotent: true, graph_id: GRAPH_ID, revision: currentRevision, content_sha256: contentHash, source_memory_version: body.source_memory.version });
      }
      return json({ ok: false, error: "SAME_REVISION_DIFFERENT_CONTENT" }, 409);
    }
    const syncedAt = new Date().toISOString();
    const write = await db.prepare(`INSERT INTO control_plane_graphs(graph_id,schema_version,revision,content_sha256,content_json,source_memory_version,source_memory_sha256,synced_at)
      VALUES(?,?,?,?,?,?,?,?)
      ON CONFLICT(graph_id) DO UPDATE SET schema_version=excluded.schema_version,revision=excluded.revision,content_sha256=excluded.content_sha256,content_json=excluded.content_json,source_memory_version=excluded.source_memory_version,source_memory_sha256=excluded.source_memory_sha256,synced_at=excluded.synced_at
      WHERE control_plane_graphs.revision = ?`)
      .bind(GRAPH_ID, graph.schemaVersion, graph.revision, contentHash, body.content, body.source_memory.version, contentHash, syncedAt, body.expected_d1_revision).run();
    if (Number(write?.meta?.changes ?? 0) === 0) {
      const latest = await db.prepare("SELECT revision FROM control_plane_graphs WHERE graph_id=?").bind(GRAPH_ID).first();
      return json({
        ok: false,
        error: "D1_REVISION_CONFLICT",
        expected_d1_revision: body.expected_d1_revision,
        current_d1_revision: Number(latest?.revision || 0)
      }, 409);
    }
    const verified = await db.prepare("SELECT revision,content_sha256,content_json,source_memory_version FROM control_plane_graphs WHERE graph_id=?").bind(GRAPH_ID).first();
    if (!verified || verified.revision !== graph.revision || verified.content_sha256 !== contentHash || verified.content_json !== body.content || verified.source_memory_version !== body.source_memory.version) {
      return json({ ok: false, error: "D1_WRITE_READBACK_MISMATCH" }, 502);
    }
    return json({
      ok: true, synced: true, verified: true, graph_id: GRAPH_ID,
      revision: verified.revision, content_sha256: verified.content_sha256,
      source_memory_version: verified.source_memory_version, synced_at: syncedAt
    });
  } catch {
    return json({ ok: false, error: "GRAPH_SYNC_UNAVAILABLE" }, 503);
  }
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export async function handleGitHubGraphSync(request, env) {
  if (request.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
  if (typeof env?.SIMOT_GITHUB_TOKEN !== "string" || !env.SIMOT_GITHUB_TOKEN ||
      typeof env?.SIMOT_GITHUB_REPOSITORY !== "string" || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(env.SIMOT_GITHUB_REPOSITORY) ||
      typeof env?.SIMOT_GITHUB_BRANCH !== "string" || !/^[A-Za-z0-9._/-]{1,200}$/.test(env.SIMOT_GITHUB_BRANCH) ||
      env.SIMOT_GITHUB_BRANCH.includes("..")) {
    return json({ ok: false, error: "GITHUB_SYNC_NOT_CONFIGURED" }, 503);
  }
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "INVALID_JSON" }, 400); }
  if (!body || typeof body !== "object" || typeof body.content !== "string" ||
      body.bucket !== "working" || body.object_id !== GRAPH_ID ||
      body.source_memory?.system !== "VPS_MASTER_MEMORY" ||
      !Number.isInteger(body.source_memory?.version) || body.source_memory.version < 1 ||
      !isSha256(body.source_memory?.sha256)) {
    return json({ ok: false, error: "INVALID_GRAPH_SYNC_PAYLOAD" }, 400);
  }
  if (new TextEncoder().encode(body.content).byteLength > MAX_CONTENT_BYTES) return json({ ok: false, error: "GRAPH_PAYLOAD_TOO_LARGE" }, 413);
  const digest = await sha256Hex(body.content);
  if (digest !== body.source_memory.sha256.toLowerCase()) return json({ ok: false, error: "SOURCE_MEMORY_HASH_MISMATCH" }, 409);
  let graph;
  try { graph = JSON.parse(body.content); } catch { return json({ ok: false, error: "INVALID_GRAPH_JSON" }, 400); }
  const validationError = validateGraph(graph);
  if (validationError) return json({ ok: false, error: validationError }, 400);

  const repository = env.SIMOT_GITHUB_REPOSITORY;
  const branch = env.SIMOT_GITHUB_BRANCH;
  const path = "simot-ai-os/data/control-plane-graphs/simot-core-overview.json";
  const api = "https://api.github.com/repos/" + repository + "/contents/" + path;
  const headers = {
    "authorization": "Bearer " + env.SIMOT_GITHUB_TOKEN,
    "accept": "application/vnd.github+json",
    "content-type": "application/json",
    "user-agent": "SIMOT-Visual-Control-Plane",
    "x-github-api-version": "2022-11-28"
  };
  try {
    const currentResponse = await fetch(api + "?ref=" + encodeURIComponent(branch), { headers });
    let current = null;
    if (currentResponse.status === 200) current = await currentResponse.json();
    else if (currentResponse.status !== 404) return json({ ok: false, error: "GITHUB_READ_FAILED", upstream_status: currentResponse.status }, 502);
    const payload = {
      message: "sync: update canonical SIMOT graph from VPS Master Memory",
      branch,
      content: encodeBase64Utf8(body.content),
      ...(current?.sha ? { sha: current.sha } : {})
    };
    const writeResponse = await fetch(api, { method: "PUT", headers, body: JSON.stringify(payload) });
    const writeResult = await writeResponse.json().catch(() => null);
    if (!writeResponse.ok || !writeResult?.content?.sha || !writeResult?.commit?.sha) {
      return json({ ok: false, error: "GITHUB_WRITE_FAILED", upstream_status: writeResponse.status }, 502);
    }
    return json({
      ok: true, verified: true, destination: "GITHUB",
      repository, branch, path,
      graph_id: GRAPH_ID, revision: graph.revision,
      source_memory_version: body.source_memory.version,
      source_memory_sha256: digest,
      content_sha: writeResult.content.sha,
      commit_sha: writeResult.commit.sha,
      updated_at: writeResult.commit.committer?.date || null
    });
  } catch {
    return json({ ok: false, error: "GITHUB_SYNC_UNAVAILABLE" }, 503);
  }
}

export async function handleCanonicalGraphSync(request, env) {
  if (request.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
  if (!env?.SIMOT_MASTER_MEMORY || typeof env?.SIMOT_MASTER_MEMORY_TOKEN !== "string" || !env.SIMOT_MASTER_MEMORY_TOKEN) {
    return json({ ok: false, error: "MASTER_MEMORY_BRIDGE_NOT_CONFIGURED" }, 503);
  }
  try {
    const upstream = await env.SIMOT_MASTER_MEMORY.fetch(
      "http://127.0.0.1:9100/memory/working/" + encodeURIComponent(GRAPH_ID),
      { headers: { "Authorization": "Bearer " + env.SIMOT_MASTER_MEMORY_TOKEN } }
    );
    const memory = await upstream.json().catch(() => null);
    if (!upstream.ok || memory?.ok !== true || typeof memory.content !== "string" ||
        !Number.isInteger(memory.metadata?.version) || !isSha256(memory.metadata?.sha256)) {
      return json({ ok: false, error: "CANONICAL_MEMORY_READ_FAILED", upstream_status: upstream.status }, 502);
    }
    const contentHash = await sha256Hex(memory.content);
    if (contentHash !== memory.metadata.sha256.toLowerCase()) {
      return json({ ok: false, error: "CANONICAL_MEMORY_HASH_MISMATCH" }, 409);
    }
    let graph;
    try { graph = JSON.parse(memory.content); } catch { return json({ ok: false, error: "CANONICAL_GRAPH_INVALID_JSON" }, 409); }
    const validationError = validateGraph(graph);
    if (validationError) return json({ ok: false, error: "CANONICAL_" + validationError }, 409);

    const d1Read = await handleGraphSync(new Request("https://worker.internal/control-plane/graph-sync", { method: "GET" }), env);
    const d1State = await d1Read.json();
    if (!d1Read.ok || d1State.ok !== true) return json({ ok: false, error: "D1_STATE_READ_FAILED", d1: d1State }, 502);
    const d1Write = await handleGraphSync(new Request("https://worker.internal/control-plane/graph-sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        bucket: "working", object_id: GRAPH_ID, expected_d1_revision: d1State.revision || 0,
        content: memory.content,
        source_memory: { system: "VPS_MASTER_MEMORY", version: memory.metadata.version, sha256: contentHash }
      })
    }), env);
    const d1 = await d1Write.json();
    if (!d1Write.ok || d1.ok !== true) {
      return json({ ok: false, partial: false, source: { system: "VPS_MASTER_MEMORY", version: memory.metadata.version, sha256: contentHash }, d1, github: { status: "NOT_ATTEMPTED" } }, d1Write.status);
    }

    const githubRequest = new Request("https://worker.internal/control-plane/graph-sync/github", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        bucket: "working", object_id: GRAPH_ID, content: memory.content,
        source_memory: { system: "VPS_MASTER_MEMORY", version: memory.metadata.version, sha256: contentHash }
      })
    });
    const githubResponse = await handleGitHubGraphSync(githubRequest, env);
    const github = await githubResponse.json();
    return json({
      ok: d1.verified === true && githubResponse.ok && github.ok === true,
      partial: !(d1.verified === true && githubResponse.ok && github.ok === true),
      source: { system: "VPS_MASTER_MEMORY", version: memory.metadata.version, sha256: contentHash, graph_revision: graph.revision },
      d1,
      github: githubResponse.ok && github.ok ? github : { status: "BLOCKED_OR_FAILED", http_status: githubResponse.status, error: github.error || "GITHUB_SYNC_FAILED" }
    }, 200);
  } catch {
    return json({ ok: false, error: "CANONICAL_GRAPH_SYNC_FAILED" }, 503);
  }
}
