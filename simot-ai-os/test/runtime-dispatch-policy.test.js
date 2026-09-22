import test from "node:test";
import assert from "node:assert/strict";
import { planRuntimeDispatch, RUNTIME_DISPATCH_CONTRACT } from "../src/runtime-dispatch-policy.js";

const base = {
  domain: "IMPORT",
  action: "RFQ_PREPARATION",
  authority: "EXECUTE_WITHIN_ROLE",
  worker_id: "SIMOT-AI-02",
  requirement_id: "REQ-1",
  rfq_id: "RFQ-1"
};

test("creates a bounded pre-dispatch plan without side effects", () => {
  const result = planRuntimeDispatch(base);
  assert.equal(result.status, "PENDING");
  assert.equal(result.worker_id, "SIMOT-AI-02");
  assert.equal(result.execution, "BOUNDED");
  assert.equal(result.next_action, "DISPATCH_TO_WORKER");
});

test("does not infer routing from incomplete context", () => {
  const result = planRuntimeDispatch({ authority: "EXECUTE_WITHIN_ROLE" });
  assert.equal(result.status, "CLARIFICATION");
  assert.equal(result.error_code, "ROUTING_CONTEXT_INCOMPLETE");
});

test("blocks commitment actions before dispatch", () => {
  const result = planRuntimeDispatch({
    ...base,
    action: "PAYMENT",
    authority: "APPROVAL_REQUIRED"
  });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.error_code, "COMMITMENT_GATE");
});

test("blocks unknown tool references", () => {
  const result = planRuntimeDispatch({
    ...base,
    tool_refs: ["UNKNOWN_TOOL"]
  });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.error_code, "UNKNOWN_TOOL_REF");
});

test("read tool reference remains informationally bounded", () => {
  const result = planRuntimeDispatch({
    ...base,
    tool_refs: ["ONEDRIVE"],
    tool_mode: "READ"
  });
  assert.equal(result.status, "PENDING");
  assert.deepEqual(result.tools, ["ONEDRIVE"]);
});

test("worker policy blocks missing critical requirements", () => {
  const result = planRuntimeDispatch({
    ...base,
    missing_critical_requirements: ["quantity"]
  });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.error_code, "CRITICAL_REQUIREMENT_MISSING");
});

test("commitment execution and provider execution remain impossible in this policy", () => {
  assert.equal(RUNTIME_DISPATCH_CONTRACT.side_effects, false);
  assert.equal(RUNTIME_DISPATCH_CONTRACT.provider_execution, false);
  assert.equal(RUNTIME_DISPATCH_CONTRACT.commitment_execution, false);
  assert.equal(RUNTIME_DISPATCH_CONTRACT.fail_closed, true);
});
