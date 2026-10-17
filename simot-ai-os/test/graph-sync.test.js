import test from "node:test";
import assert from "node:assert/strict";
import { handleCanonicalGraphSync } from "../src/graph-sync.js";

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function makeGraph() {
  return JSON.stringify({
    schema: "simot.visual-control-plane.graph",
    schemaVersion: 1,
    graphId: "simot-core-overview",
    revision: 46,
    nodes: [{ id: "a" }, { id: "b" }],
    edges: [{ id: "ab", source: "a", target: "b" }]
  });
}

function makeEnv({ sourceContent, existing }) {
  const calls = { memoryReads: 0, updates: 0, inserts: 0 };
  const db = {
    prepare(sql) {
      const statement = params => ({
        async run() {
          if (sql.startsWith("CREATE TABLE")) return { success: true };
          if (sql.startsWith("UPDATE control_plane_graph_snapshots")) {
            calls.updates++;
            const [graphJson, updatedAt, syncedAt, graphId, revision, sha256, sourceId, schemaName, schemaVersion, sourceVersion] = params;
            if (existing && existing.graph_id === graphId && existing.revision === revision &&
                existing.sha256 === sha256 && existing.source_object_id === sourceId &&
                existing.schema_name === schemaName && existing.schema_version === schemaVersion &&
                existing.source_memory_version === sourceVersion) {
              Object.assign(existing, { graph_json: graphJson, updated_at: updatedAt, synced_at: syncedAt });
            }
            return { success: true, meta: { changes: calls.updates ? 1 : 0 } };
          }
          if (sql.startsWith("INSERT")) calls.inserts++;
          return { success: true };
        },
        async first() {
          return existing ? structuredClone(existing) : null;
        }
      });
      return { ...statement([]), bind(...params) { return statement(params); } };
    }
  };
  return {
    calls,
    env: {
      SIMOT_DB: db,
      SIMOT_MASTER_MEMORY_TOKEN: "test-only",
      SIMOT_MASTER_MEMORY: {
        async fetch() {
          calls.memoryReads++;
          return new Response(JSON.stringify({
            ok: true,
            content: sourceContent,
            metadata: { version: 6, sha256: await sha256Hex(sourceContent), updated_at: "2026-10-17T00:00:00.000Z" }
          }), { status: 200, headers: { "content-type": "application/json" } });
        }
      }
    }
  };
}

function makeExisting(sourceContent, overrides = {}) {
  return {
    graph_id: "simot-core-overview",
    schema_name: "simot.visual-control-plane.graph",
    schema_version: 1,
    revision: 46,
    updated_at: "2026-10-16T00:00:00.000Z",
    source_object_id: "simot-core-overview",
    source_memory_version: 6,
    sha256: null,
    graph_json: "{corrupt stored text}",
    synced_at: "2026-10-16T00:00:00.000Z",
    ...overrides
  };
}

test("sync preflight refuses writes without explicit confirmation", async () => {
  let memoryReads = 0;
  let d1Calls = 0;
  const response = await handleCanonicalGraphSync(new Request("https://worker.test/control-plane/graph-sync/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirm: false })
  }), {
    SIMOT_DB: { prepare() { d1Calls++; throw new Error("D1 must not be touched"); } },
    SIMOT_MASTER_MEMORY: { async fetch() { memoryReads++; throw new Error("Memory must not be read"); } },
    SIMOT_MASTER_MEMORY_TOKEN: "test-only"
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, "EXPLICIT_SYNC_CONFIRMATION_REQUIRED");
  assert.equal(body.write_performed, false);
  assert.equal(memoryReads, 0);
  assert.equal(d1Calls, 0);
});

test("same-revision corrupted D1 content is diagnosed but not written without repair opt-in", async () => {
  const sourceContent = makeGraph();
  const existing = makeExisting(sourceContent, { sha256: await sha256Hex(sourceContent) });
  const { env, calls } = makeEnv({ sourceContent, existing });
  const response = await handleCanonicalGraphSync(new Request("https://worker.test/control-plane/graph-sync/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirm: true })
  }), env);
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.equal(body.error, "D1_SNAPSHOT_CONTENT_HASH_MISMATCH");
  assert.equal(body.diagnostic.repair_eligible, true);
  assert.equal(calls.updates, 0);
  assert.equal(existing.graph_json, "{corrupt stored text}");
});

test("explicit repair only replaces corrupted graph_json and verifies readback", async () => {
  const sourceContent = makeGraph();
  const existing = makeExisting(sourceContent, { sha256: await sha256Hex(sourceContent) });
  const { env, calls } = makeEnv({ sourceContent, existing });
  const response = await handleCanonicalGraphSync(new Request("https://worker.test/control-plane/graph-sync/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirm: true, repair_corrupt_snapshot: true })
  }), env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.verified, true);
  assert.equal(body.repaired, true);
  assert.equal(existing.graph_json, sourceContent);
  assert.equal(await sha256Hex(existing.graph_json), existing.sha256);
  assert.equal(calls.updates, 1);
  assert.equal(calls.inserts, 0);
});

test("explicit repair refuses rows whose source metadata does not match", async () => {
  const sourceContent = makeGraph();
  const existing = makeExisting(sourceContent, {
    sha256: await sha256Hex(sourceContent),
    source_memory_version: 5
  });
  const { env, calls } = makeEnv({ sourceContent, existing });
  const response = await handleCanonicalGraphSync(new Request("https://worker.test/control-plane/graph-sync/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirm: true, repair_corrupt_snapshot: true })
  }), env);
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.equal(body.error, "D1_SNAPSHOT_REPAIR_NOT_SAFE");
  assert.equal(body.write_performed, false);
  assert.equal(calls.updates, 0);
  assert.equal(existing.graph_json, "{corrupt stored text}");
});
