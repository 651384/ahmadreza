import test from "node:test";
import assert from "node:assert/strict";
import { executeToolRequest } from "../src/tool-execution-bridge.js";

function makeDb() {
  return {
    prepare(sql) {
      return {
        bind() { return this; },
        async all() {
          if (sql.includes("sqlite_master")) return { results: [{ name: "events", type: "table" }] };
          if (sql.startsWith("PRAGMA table_info")) return { results: [{ cid: 0, name: "id", type: "TEXT", pk: 1 }] };
          if (sql.startsWith("SELECT id FROM events")) return { results: [{ id: "e1" }] };
          return { results: [] };
        }
      };
    }
  };
}

test("D1 list tables is a verified read", async () => {
  const result = await executeToolRequest(
    { SIMOT_DB: makeDb() },
    { tool_ref: "D1", operation: "D1_LIST_TABLES", mode: "READ", authority: "INFORMATIONAL" }
  );
  assert.equal(result.ok, true);
  assert.equal(result.verification, "DIRECT_D1_READ");
  assert.deepEqual(result.result.tables, [{ name: "events", type: "table" }]);
});

test("D1 row reads are bounded and reject unsafe identifiers", async () => {
  const db = makeDb();
  const result = await executeToolRequest(
    { SIMOT_DB: db },
    { tool_ref: "D1", operation: "D1_READ_ROWS", mode: "READ", authority: "ANALYSIS_ONLY", args: { table: "events", columns: ["id"], limit: 500 } }
  );
  assert.equal(result.ok, true);
  assert.equal(result.result.limit, 100);

  const blocked = await executeToolRequest(
    { SIMOT_DB: db },
    { tool_ref: "D1", operation: "D1_READ_ROWS", mode: "READ", authority: "ANALYSIS_ONLY", args: { table: "events;DROP" } }
  );
  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, "BLOCKED");
  assert.equal(blocked.error_code, "TABLE_INVALID");
});

test("D1 writes remain fail-closed", async () => {
  const result = await executeToolRequest(
    { SIMOT_DB: makeDb() },
    { tool_ref: "D1", operation: "D1_READ_ROWS", mode: "WRITE", authority: "SYSTEM_WRITE_ALLOWED", args: { table: "events" } }
  );
  assert.equal(result.ok, false);
  assert.equal(result.error_code, "WRITE_EXECUTION_NOT_ENABLED_IN_RUNTIME_BRIDGE");
});
