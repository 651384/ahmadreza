import test from "node:test";
import assert from "node:assert/strict";
import { validateContinuityState } from "../src/continuity-contract.js";

const valid = {
  schema: "SIMOT-CONTINUITY-v1",
  state_version: 10,
  state_status: "ACTIVE",
  canonical_standard: { id: "SIMOT-CANONICAL-001", version: "3.0.0" },
  user_constraints: [],
  locked_decisions: [],
  current_project: { id: "SIMOT-CONTINUITY-001" },
  current_objective: { id: "CONTINUITY-001" },
  current_phase: "ACTIVE",
  last_verified_position: "verified",
  last_completed_task: "T010",
  last_task_evidence: [],
  blocker: null,
  next_action: "Read canonical state",
  do_not_do: [],
  continuity_locations: { canonical_runtime_target: "/srv/simot-memory/" }
};

test("accepts canonical continuity state", () => {
  assert.deepEqual(validateContinuityState(valid), { ok: true });
});

test("rejects runtime SOT standard as continuity standard", () => {
  assert.equal(
    validateContinuityState({ ...valid, canonical_standard: { id: "SOT-ARCH-CLOUDFLARE-CORE-002", version: "2.2.0" } }).error,
    "CONTINUITY_STANDARD_INVALID"
  );
});

test("fails closed when next action is missing", () => {
  assert.equal(validateContinuityState({ ...valid, next_action: "" }).error, "CONTINUITY_NEXT_ACTION_MISSING");
});
