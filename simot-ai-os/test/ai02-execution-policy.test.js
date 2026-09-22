import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAI02Execution, ACTIONS } from "../src/ai02-execution-policy.js";

const base = {
  worker_id: "SIMOT-AI-02",
  authority: "EXECUTE_WITHIN_ROLE",
  requirement_id: "REQ-100",
  rfq_id: "RFQ-200",
  assumptions: ["Incoterm is pending confirmation"]
};

test("allows bounded analysis/preparation", () => {
  const r = evaluateAI02Execution({...base, action: ACTIONS.RFQ_PREPARATION});
  assert.equal(r.decision, "ALLOWED");
  assert.equal(r.result_status, "PENDING");
  assert.deepEqual(r.context.requirement_ids, ["REQ-100"]);
  assert.deepEqual(r.context.rfq_ids, ["RFQ-200"]);
});

for (const action of [
  ACTIONS.SUPPLIER_SELECTION, ACTIONS.PO_ISSUANCE, ACTIONS.PAYMENT,
  ACTIONS.BANKING, ACTIONS.CONTRACT_COMMITMENT, ACTIONS.IRREVERSIBLE_ACTION
]) {
  test("blocks " + action + " without approval", () => {
    const r = evaluateAI02Execution({...base, action});
    assert.equal(r.decision, "BLOCKED");
    assert.notEqual(r.result_status, "COMPLETED");
  });
}

test("approval authority still does not silently execute a commitment", () => {
  const r = evaluateAI02Execution({...base, action: ACTIONS.PO_ISSUANCE, authority: "APPROVAL_REQUIRED"});
  assert.equal(r.decision, "BLOCKED");
  assert.equal(r.error_code, "HUMAN_OR_APPROVAL_GATE_REQUIRED");
});

test("blocks missing critical requirements", () => {
  const r = evaluateAI02Execution({...base, action: ACTIONS.TECHNICAL_REVIEW, missing_critical_requirements: ["quantity", "specification"]});
  assert.equal(r.decision, "BLOCKED");
  assert.equal(r.error_code, "CRITICAL_REQUIREMENT_MISSING");
  assert.ok(r.context.assumptions.includes("MISSING:quantity"));
});

test("blocks sanctions or restricted-party concern", () => {
  const r = evaluateAI02Execution({...base, action: ACTIONS.SUPPLIER_QUALIFICATION, restricted_party_concern: true});
  assert.equal(r.decision, "BLOCKED");
  assert.equal(r.error_code, "SANCTIONS_OR_RESTRICTED_PARTY_CONCERN");
});

test("rejects wrong worker identity", () => {
  const r = evaluateAI02Execution({...base, worker_id: "SIMOT-AI-01", action: ACTIONS.ANALYZE});
  assert.equal(r.decision, "REJECTED");
  assert.equal(r.error_code, "AI02_ROLE_MISMATCH");
});

test("rejects undefined action", () => {
  const r = evaluateAI02Execution({...base, action: "AUTONOMOUS_IMPORT_EXECUTION"});
  assert.equal(r.decision, "REJECTED");
  assert.equal(r.error_code, "AI02_ACTION_UNDEFINED");
});

test("rejects preparation when authority is not EXECUTE_WITHIN_ROLE", () => {
  const r = evaluateAI02Execution({...base, authority: "INFORMATIONAL", action: ACTIONS.ANALYZE});
  assert.equal(r.decision, "BLOCKED");
  assert.equal(r.error_code, "INVALID_EXECUTION_AUTHORITY");
});
