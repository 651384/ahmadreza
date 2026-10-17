import test from "node:test";
import assert from "node:assert/strict";
import { handleCanonicalGraphSync } from "../src/graph-sync.js";

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
