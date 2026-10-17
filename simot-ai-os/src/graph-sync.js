const GRAPH_ID = "simot-core-overview";
const GRAPH_SCHEMA = "simot.visual-control-plane.graph";
const TABLE = "control_plane_graph_snapshots";
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
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
function validateGraph(graph) {
  if (!graph || typeof graph !== "object" || Array.isArray(graph)) return "INVALID_GRAPH";
  if (graph.schema !== GRAPH_SCHEMA || graph.schemaVersion !== 1 || graph.graphId !== GRAPH_ID) return "GRAPH_SCHEMA_MISMATCH";
  if (!Number.isInteger(graph.revision) || graph.revision < 1) return "INVALID_GRAPH_REVISION";
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return "INVALID_GRAPH_COLLECTIONS";
  const nodes = new Set();
  for (const node of graph.nodes) {
    if (!node || typeof node.id !== "string" || !node.id || nodes.has(node.id)) return "INVALID_OR_DUPLICATE_NODE_ID";
    nodes.add(node.id);
  }
  const edges = new Set();
  for (const edge of graph.edges) {
    if (!edge || typeof edge.id !== "string" || !edge.id || edges.has(edge.id)) return "INVALID_OR_DUPLICATE_EDGE_ID";
    if (typeof edge.source !== "string" || typeof edge.target !== "string" || !nodes.has(edge.source) || !nodes.has(edge.target)) return "INVALID_EDGE_ENDPOINT";
    edges.add(edge.id);
  }
  return null;
}
async function ensureTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS ${TABLE} (
    graph_id TEXT PRIMARY KEY,
    schema_name TEXT NOT NULL,
    schema_version INTEGER NOT NULL,
    revision INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    source_object_id TEXT NOT NULL,
    source_memory_version INTEGER NOT NULL,
    sha256 TEXT NOT NULL,
    graph_json TEXT NOT NULL,
    synced_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`).run();
}

export async function handleCanonicalGraphSync(request, env) {
  if (request.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "INVALID_JSON" }, 400); }
  if (body?.confirm !== true) {
    return json({ ok: false, error: "EXPLICIT_SYNC_CONFIRMATION_REQUIRED", write_performed: false }, 400);
  }
  if (!env?.SIMOT_DB) return json({ ok: false, error: "RUNTIME_NOT_CONFIGURED" }, 503);
  if (!env?.SIMOT_MASTER_MEMORY || typeof env.SIMOT_MASTER_MEMORY_TOKEN !== "string" || !env.SIMOT_MASTER_MEMORY_TOKEN) {
    return json({ ok: false, error: "MASTER_MEMORY_BRIDGE_NOT_CONFIGURED" }, 503);
  }
  try {
    const upstream = await env.SIMOT_MASTER_MEMORY.fetch(
      "http://127.0.0.1:9100/memory/working/" + encodeURIComponent(GRAPH_ID),
      { headers: { Authorization: "Bearer " + env.SIMOT_MASTER_MEMORY_TOKEN } }
    );
    const memory = await upstream.json().catch(() => null);
    if (!upstream.ok || memory?.ok !== true || typeof memory.content !== "string" ||
        !Number.isInteger(memory.metadata?.version) || !isSha256(memory.metadata?.sha256)) {
      return json({ ok: false, error: "CANONICAL_MEMORY_READ_FAILED", upstream_status: upstream.status }, 502);
    }
    if (new TextEncoder().encode(memory.content).byteLength > MAX_CONTENT_BYTES) return json({ ok: false, error: "GRAPH_PAYLOAD_TOO_LARGE" }, 413);
    const digest = await sha256Hex(memory.content);
    if (digest !== memory.metadata.sha256.toLowerCase()) return json({ ok: false, error: "CANONICAL_MEMORY_HASH_MISMATCH" }, 409);
    let graph;
    try { graph = JSON.parse(memory.content); } catch { return json({ ok: false, error: "CANONICAL_GRAPH_INVALID_JSON" }, 409); }
    const validationError = validateGraph(graph);
    if (validationError) return json({ ok: false, error: "CANONICAL_" + validationError }, 409);

    const db = env.SIMOT_DB;
    await ensureTable(db);
    const existing = await db.prepare("SELECT graph_id,schema_name,schema_version,revision,updated_at,source_object_id,source_memory_version,sha256,graph_json,synced_at FROM " + TABLE + " WHERE graph_id=?").bind(GRAPH_ID).first();
    const currentRevision = Number(existing?.revision || 0);
    if (existing && graph.revision < currentRevision) {
      return json({ ok: false, error: "STALE_GRAPH_REVISION", current_revision: currentRevision, incoming_revision: graph.revision }, 409);
    }
    if (existing && graph.revision === currentRevision) {
      if (existing.sha256 === digest && existing.graph_json === memory.content && existing.source_object_id === GRAPH_ID && existing.schema_name === graph.schema && existing.schema_version === graph.schemaVersion) {
        return json({
          ok: true, verified: true, idempotent: true,
          source: { system: "VPS_MASTER_MEMORY", version: memory.metadata.version, sha256: digest, graph_revision: graph.revision },
          d1: { verified: true, graph_id: GRAPH_ID, revision: currentRevision, sha256: digest, synced_at: existing.synced_at, idempotent: true },
          content: memory.content
        });
      }
      return json({
        ok: false,
        error: "SAME_REVISION_DIFFERENT_CONTENT",
        diagnostic: {
          graph_id: GRAPH_ID,
          current_revision: currentRevision,
          incoming_revision: graph.revision,
          current_sha256: existing.sha256,
          incoming_sha256: digest,
          same_sha256: existing.sha256 === digest,
          same_graph_json: existing.graph_json === memory.content,
          expected_source_object: existing.source_object_id === GRAPH_ID,
          same_schema_name: existing.schema_name === graph.schema,
          same_schema_version: existing.schema_version === graph.schemaVersion,
          current_source_memory_version: existing.source_memory_version,
          incoming_source_memory_version: memory.metadata.version
        }
      }, 409);
    }

    const syncedAt = new Date().toISOString();
    await db.prepare("INSERT INTO " + TABLE + "(graph_id,schema_name,schema_version,revision,updated_at,source_object_id,source_memory_version,sha256,graph_json,synced_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(graph_id) DO UPDATE SET schema_name=excluded.schema_name,schema_version=excluded.schema_version,revision=excluded.revision,updated_at=excluded.updated_at,source_object_id=excluded.source_object_id,source_memory_version=excluded.source_memory_version,sha256=excluded.sha256,graph_json=excluded.graph_json,synced_at=excluded.synced_at WHERE " + TABLE + ".revision < excluded.revision")
      .bind(GRAPH_ID, graph.schema, graph.schemaVersion, graph.revision, memory.metadata.updated_at || syncedAt, GRAPH_ID, memory.metadata.version, digest, memory.content, syncedAt).run();
    const readback = await db.prepare("SELECT graph_id,schema_name,schema_version,revision,updated_at,source_object_id,source_memory_version,sha256,graph_json,synced_at FROM " + TABLE + " WHERE graph_id=?").bind(GRAPH_ID).first();
    if (!readback || readback.revision !== graph.revision || readback.sha256 !== digest ||
        readback.graph_json !== memory.content || readback.source_memory_version !== memory.metadata.version ||
        readback.source_object_id !== GRAPH_ID || readback.schema_name !== graph.schema || readback.schema_version !== graph.schemaVersion) {
      return json({ ok: false, error: "D1_WRITE_READBACK_MISMATCH" }, 502);
    }
    return json({
      ok: true, verified: true,
      source: { system: "VPS_MASTER_MEMORY", version: memory.metadata.version, sha256: digest, graph_revision: graph.revision },
      d1: { verified: true, graph_id: GRAPH_ID, revision: readback.revision, sha256: readback.sha256, synced_at: readback.synced_at },
      content: memory.content
    });
  } catch {
    return json({ ok: false, error: "CANONICAL_GRAPH_SYNC_FAILED" }, 503);
  }
}
