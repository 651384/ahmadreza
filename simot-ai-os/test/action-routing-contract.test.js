import test from "node:test";
import assert from "node:assert/strict";
import { validateActionRouting } from "../src/action-routing-contract.js";

test("accepts bounded optional routing metadata", () => {
  const result = validateActionRouting({
    action:"RFQ_PREPARATION",
    tool_refs:["SHAREPOINT.READ","NOTION.READ"],
    worker:"SIMOT-AI-02",
    memory_refs:["MEM-001"]
  });
  assert.equal(result.ok, true);
  assert.equal(result.routing.action, "RFQ_PREPARATION");
});

test("rejects malformed routing metadata", () => {
  assert.equal(validateActionRouting({action:"bad space"}).error, "INVALID_ACTION");
  assert.equal(validateActionRouting({tool_refs:["bad ref!"]}).error, "INVALID_TOOL_REF");
  assert.equal(validateActionRouting({worker:"SIMOT-AI-X"}).error, "INVALID_WORKER_REF");
  assert.equal(validateActionRouting({memory_refs:"MEM-1"}).error, "INVALID_MEMORY_REFS");
});

test("routing metadata never carries authority", () => {
  const result = validateActionRouting({action:"PAYMENT",worker:"SIMOT-AI-02"});
  assert.equal(result.ok, true);
  assert.equal("authority" in result.routing, false);
});
