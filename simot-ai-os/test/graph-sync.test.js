import test from "node:test";
import assert from "node:assert/strict";
import { handleGraphSync } from "../src/graph-sync.js";

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
function mockDb(initial = null) {
  let row = initial;
  return {
    prepare(sql) {
      let values = [];
      const statement = {
        bind(...args) { values = args; return statement; },
        async run() {
          if (sql.startsWith("INSERT INTO control_plane_graphs")) {
            row = { graph_id: values[0], schema_version: values[1], revision: values[2], content_sha256: values[3], content_json: values[4], source_memory_version: values[5], source_memory_sha256: values[6], synced_at: values[7] };
          }
          return { success: true };
        },
        async first() {
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
