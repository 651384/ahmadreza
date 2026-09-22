import test from "node:test";
import assert from "node:assert/strict";
import { validateToolAdapter, canDispatchTool } from "../src/tool-adapter-contract.js";

const readAdapter = {
  system:"ONEDRIVE",
  operations:["SEARCH","GET_METADATA","DOWNLOAD"],
  mode:"READ",
  authority:"INFORMATIONAL",
  reference_first:true,
  supports_readback:true
};

test("validates reference-first read adapter", () => {
  const r=validateToolAdapter(readAdapter);
  assert.equal(r.ok,true);
  assert.equal(r.adapter.reference_first,true);
});

test("rejects malformed adapter", () => {
  assert.equal(validateToolAdapter({system:"bad space",operations:["READ"]}).error,"INVALID_ADAPTER_SYSTEM");
  assert.equal(validateToolAdapter({system:"ONEDRIVE",operations:[]}).error,"INVALID_ADAPTER_OPERATIONS");
});

test("allows read dispatch at informational authority", () => {
  const r=canDispatchTool(readAdapter,"READ","INFORMATIONAL");
  assert.equal(r.ok,true);
});

test("fails closed on mode/readback mismatch", () => {
  assert.equal(canDispatchTool(readAdapter,"WRITE","SYSTEM_WRITE_ALLOWED").error,"TOOL_MODE_MISMATCH");
  assert.equal(canDispatchTool({...readAdapter,mode:"WRITE",supports_readback:false},"WRITE","SYSTEM_WRITE_ALLOWED").error,"WRITE_READBACK_REQUIRED");
});
