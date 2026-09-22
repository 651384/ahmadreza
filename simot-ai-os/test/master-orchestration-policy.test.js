import test from "node:test";
import assert from "node:assert/strict";
import { planMasterRoute, listCapabilities } from "../src/master-orchestration-policy.js";

test("routes import preparation to AI-02", () => {
  const result = planMasterRoute({
    domain:"IMPORT",
    action:"RFQ_PREPARATION",
    authority:"EXECUTE_WITHIN_ROLE"
  });
  assert.equal(result.status, "PENDING");
  assert.equal(result.worker_id, "SIMOT-AI-02");
  assert.equal(result.execution, "BOUNDED");
});

test("blocks authority mismatch", () => {
  const result = planMasterRoute({
    domain:"IMPORT",
    action:"RFQ_PREPARATION",
    authority:"ANALYSIS_ONLY"
  });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.error_code, "AUTHORITY_NOT_PERMITTED");
});

test("blocks commitments before dispatch", () => {
  const result = planMasterRoute({
    domain:"IMPORT",
    action:"PAYMENT",
    authority:"APPROVAL_REQUIRED",
    worker_id:"SIMOT-AI-02"
  });
  assert.equal(result.status, "REJECTED");
  assert.equal(result.error_code, "WORKER_CAPABILITY_MISMATCH");
});

test("does not guess missing routing inputs", () => {
  const result = planMasterRoute({domain:"IMPORT"});
  assert.equal(result.status, "CLARIFICATION");
});

test("capability registry is explicit", () => {
  const registry = listCapabilities();
  assert.ok(registry.some(x => x.worker_id === "SIMOT-AI-02"));
  assert.ok(registry.every(x => Array.isArray(x.tools)));
});
