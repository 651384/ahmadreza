import test from "node:test";
import assert from "node:assert/strict";
import { handleGraphSync, handleGitHubGraphSync } from "../src/graph-sync.js";

const content = JSON.stringify({
  schema: "simot.visual-control-plane.graph",
  schemaVersion: 1,
  graphId: "simot-core-overview",
  revision: 46,
  nodes: [{ id: "a" }, { id: "b" }],
  edges: [{ id: "e1", source: "a", target: "b" }]
});
async function hash(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function mockDb(initial = null, beforeWrite = null) {
  let row = initial;
  return {
    prepare(sql) {
      let values = [];
      const statement = {
        bind(...args) { values = args; return statement; },
        async run() {
          if (sql.startsWith("INSERT INTO control_plane_graphs")) {
            if (beforeWrite) beforeWrite({ get: () => row, set: value => { row = value; } });
            const expectedRevision = values[8];
            if ((!row && expectedRevision !== 0) || (row && Number(row.revision) !== expectedRevision)) {
              return { success: true, meta: { changes: 0 } };
            }
            row = { graph_id: values[0], schema_version: values[1], revision: values[2], content_sha256: values[3], content_json: values[4], source_memory_version: values[5], source_memory_sha256: values[6], synced_at: values[7] };
            return { success: true, meta: { changes: 1 } };
          }
          return { success: true, meta: { changes: 0 } };
        },
        async first() {
          if (sql.includes("sqlite_master")) return row ? { name: "control_plane_graphs" } : null;
          if (sql.includes("WHERE graph_id=?")) return row;
          return null;
        }
      };
      return statement;
    }
  };
}
const req = (body) => new Request("https://worker.test/control-plane/graph-sync", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body)
});
test("D1 graph sync validates source hash and verifies readback", async () => {
  const digest = await hash(content);
  const db = mockDb();
  const response = await handleGraphSync(req({
    bucket: "working", object_id: "simot-core-overview", content, expected_d1_revision: 0,
    source_memory: { system: "VPS_MASTER_MEMORY", version: 6, sha256: digest }
  }), { SIMOT_DB: db });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.verified, true);
  assert.equal(body.revision, 46);
});
test("D1 graph sync rejects an incorrect source hash", async () => {
  const response = await handleGraphSync(req({
    bucket: "working", object_id: "simot-core-overview", content, expected_d1_revision: 0,
    source_memory: { system: "VPS_MASTER_MEMORY", version: 6, sha256: "0".repeat(64) }
  }), { SIMOT_DB: mockDb() });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, "SOURCE_MEMORY_HASH_MISMATCH");
});
test("D1 graph sync rejects a revision conflict", async () => {
  const digest = await hash(content);
  const existing = { revision: 45, content_sha256: "f".repeat(64), source_memory_sha256: "f".repeat(64) };
  const response = await handleGraphSync(req({
    bucket: "working", object_id: "simot-core-overview", content, expected_d1_revision: 44,
    source_memory: { system: "VPS_MASTER_MEMORY", version: 6, sha256: digest }
  }), { SIMOT_DB: mockDb(existing) });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, "D1_REVISION_CONFLICT");
});

test("D1 graph sync rejects a concurrent insert after the initial revision check", async () => {
  const digest = await hash(content);
  const response = await handleGraphSync(req({
    bucket: "working", object_id: "simot-core-overview", content, expected_d1_revision: 0,
    source_memory: { system: "VPS_MASTER_MEMORY", version: 6, sha256: digest }
  }), {
    SIMOT_DB: mockDb(null, ({ set }) => set({
      graph_id: "simot-core-overview",
      schema_version: 1,
      revision: 45,
      content_sha256: "f".repeat(64),
      source_memory_sha256: "f".repeat(64)
    }))
  });
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.error, "D1_REVISION_CONFLICT");
  assert.equal(body.current_d1_revision, 45);
});

test("GitHub graph sync stays blocked when no approved token/config is present", async () => {
  const response = await handleGitHubGraphSync(req({
    bucket: "working", object_id: "simot-core-overview", content,
    source_memory: { system: "VPS_MASTER_MEMORY", version: 6, sha256: await hash(content) }
  }), {});
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "GITHUB_SYNC_NOT_CONFIGURED");
});

test("canonical orchestration fails closed when VPS Master Memory binding is absent", async () => {
  const response = await (await import("../src/graph-sync.js")).handleCanonicalGraphSync(
    new Request("https://worker.test/control-plane/graph-sync/run", { method: "POST" }),
    { SIMOT_DB: mockDb() }
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "MASTER_MEMORY_BRIDGE_NOT_CONFIGURED");
});

test("GitHub graph sync verifies exact readback and is idempotent for identical content", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET" });
    if (!init.method && calls.filter(call => call.method === "GET").length === 1) {
      return new Response("not found", { status: 404 });
    }
    if (init.method === "PUT") {
      return new Response(JSON.stringify({
        content: { sha: "blob-verified" },
        commit: { sha: "commit-verified", committer: { date: "2026-10-15T00:00:00Z" } }
      }), { status: 201, headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify({
      sha: "blob-verified",
      encoding: "base64",
      content: Buffer.from(content, "utf8").toString("base64")
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const response = await handleGitHubGraphSync(req({
      bucket: "working", object_id: "simot-core-overview", content,
      source_memory: { system: "VPS_MASTER_MEMORY", version: 6, sha256: await hash(content) }
    }), {
      SIMOT_GITHUB_TOKEN: "test-token",
      SIMOT_GITHUB_REPOSITORY: "651384/ahmadreza",
      SIMOT_GITHUB_BRANCH: "feat/simot-graph-sync-d1"
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.verified, true);
    assert.equal(body.content_sha, "blob-verified");
    assert.equal(calls.filter(call => call.method === "PUT").length, 1);
    assert.equal(calls.filter(call => call.method === "GET").length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("GitHub graph sync fails closed when readback content differs", async () => {
  const originalFetch = globalThis.fetch;
  let gets = 0;
  globalThis.fetch = async (_url, init = {}) => {
    if (!init.method) {
      gets += 1;
      if (gets === 1) return new Response("not found", { status: 404 });
      return new Response(JSON.stringify({
        sha: "blob-verified",
        encoding: "base64",
        content: Buffer.from(content + "tampered", "utf8").toString("base64")
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify({
      content: { sha: "blob-verified" },
      commit: { sha: "commit-verified" }
    }), { status: 201, headers: { "content-type": "application/json" } });
  };
  try {
    const response = await handleGitHubGraphSync(req({
      bucket: "working", object_id: "simot-core-overview", content,
      source_memory: { system: "VPS_MASTER_MEMORY", version: 6, sha256: await hash(content) }
    }), {
      SIMOT_GITHUB_TOKEN: "test-token",
      SIMOT_GITHUB_REPOSITORY: "651384/ahmadreza",
      SIMOT_GITHUB_BRANCH: "feat/simot-graph-sync-d1"
    });
    assert.equal(response.status, 502);
    assert.equal((await response.json()).error, "GITHUB_READBACK_MISMATCH");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
