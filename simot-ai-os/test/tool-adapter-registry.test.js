import test from "node:test";
import assert from "node:assert/strict";
import {
  getToolAdapter,
  listToolAdapters,
  validateToolAdapterRegistry,
  TOOL_ADAPTER_REGISTRY_CONTRACT
} from "../src/tool-adapter-registry.js";

test("registry contains verified connected read adapters", () => {
  const adapters = listToolAdapters();
  assert.ok(adapters.length >= 5);
  for (const adapter of adapters) {
    assert.equal(adapter.mode, "READ");
    assert.equal(adapter.authority, "INFORMATIONAL");
  }
});

test("known adapters resolve and unknown refs fail closed", () => {
  assert.equal(getToolAdapter("ONEDRIVE").system, "ONEDRIVE");
  assert.equal(getToolAdapter("NOTION").system, "NOTION");
  assert.equal(getToolAdapter("UNKNOWN"), null);
});

test("OneDrive exposes raw binary retrieval through the connector fetch boundary", () => {
  const adapter = getToolAdapter("ONEDRIVE");
  assert.ok(adapter.operations.includes("fetch"));
  assert.ok(adapter.operations.includes("fetch_raw_file"));
});

test("every registry entry passes the adapter contract", () => {
  const checks = validateToolAdapterRegistry();
  assert.ok(checks.every(x => x.ok === true));
});

test("registry does not grant write authority", () => {
  assert.equal(TOOL_ADAPTER_REGISTRY_CONTRACT.write_activation_requires_separate_gate, true);
  assert.equal(TOOL_ADAPTER_REGISTRY_CONTRACT.fail_closed, true);
  assert.equal(TOOL_ADAPTER_REGISTRY_CONTRACT.raw_binary_retrieval, true);
});
