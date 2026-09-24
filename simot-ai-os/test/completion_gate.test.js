import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCompletionEvidence, runtimeEvidence } from "../src/completion_gate.js";

test("completion gate refuses AI-only or unverified completion", () => {
  const result = evaluateCompletionEvidence({
    result: { result_status: "COMPLETED", verification: "AI-INFERRED", evidence: ["model output"], gaps: [] },
    runtimeEvidence: { verified: true }
  });
  assert.equal(result.verified, false);
  assert.deepEqual(result.reasons, ["RESULT_NOT_VERIFIED"]);
});

test("completion gate requires runtime version evidence and explicit evidence", () => {
  const result = evaluateCompletionEvidence({
    result: { result_status: "COMPLETED", verification: "VERIFIED", evidence: ["runtime action"], gaps: [] },
    runtimeEvidence: { verified: false }
  });
  assert.equal(result.verified, false);
  assert.deepEqual(result.reasons, ["RUNTIME_VERSION_UNVERIFIED"]);
});

test("completion gate accepts independently verified runtime evidence", () => {
  const result = evaluateCompletionEvidence({
    result: { result_status: "COMPLETED", verification: "VERIFIED", evidence: ["runtime action"], gaps: [] },
    runtimeEvidence: { verified: true }
  });
  assert.equal(result.verified, true);
  assert.equal(result.status, "VERIFIED");
});

test("runtime evidence exposes Cloudflare version metadata without secrets", () => {
  const result = runtimeEvidence({
    CF_VERSION_METADATA: { id: "version-123", tag: "master-abc", timestamp: "2026-09-24T22:00:00Z" },
    SIMOT_RUNTIME_VERSION: "0.4.2"
  });
  assert.deepEqual(result, {
    verified: true,
    version_id: "version-123",
    version_tag: "master-abc",
    version_timestamp: "2026-09-24T22:00:00Z",
    runtime_version: "0.4.2"
  });
});
