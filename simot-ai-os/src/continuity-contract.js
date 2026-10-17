const REQUIRED_ARRAYS = ["user_constraints", "locked_decisions", "last_task_evidence", "do_not_do"];

export function validateContinuityState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return { ok: false, error: "CONTINUITY_STATE_NOT_OBJECT" };
  if (state.schema !== "SIMOT-CONTINUITY-v1") return { ok: false, error: "CONTINUITY_SCHEMA_INVALID" };
  if (state.state_status !== "ACTIVE") return { ok: false, error: "CONTINUITY_STATE_NOT_ACTIVE" };
  if (state.canonical_standard?.id !== "SIMOT-CANONICAL-001" || state.canonical_standard?.version !== "3.0.0") {
    return { ok: false, error: "CONTINUITY_STANDARD_INVALID" };
  }
  if (!Number.isInteger(state.state_version) || state.state_version < 1) return { ok: false, error: "CONTINUITY_STATE_VERSION_INVALID" };
  if (!state.current_project?.id || !state.current_objective?.id) return { ok: false, error: "CONTINUITY_PROJECT_OBJECTIVE_MISSING" };
  if (typeof state.current_phase !== "string" || !state.current_phase.trim()) return { ok: false, error: "CONTINUITY_PHASE_MISSING" };
  if (typeof state.last_verified_position !== "string" || !state.last_verified_position.trim()) return { ok: false, error: "CONTINUITY_LAST_POSITION_MISSING" };
  if (typeof state.last_completed_task !== "string" || !state.last_completed_task.trim()) return { ok: false, error: "CONTINUITY_LAST_TASK_MISSING" };
  if (state.blocker !== null && typeof state.blocker !== "string") return { ok: false, error: "CONTINUITY_BLOCKER_INVALID" };
  if (typeof state.next_action !== "string" || !state.next_action.trim()) return { ok: false, error: "CONTINUITY_NEXT_ACTION_MISSING" };
  for (const key of REQUIRED_ARRAYS) {
    if (!Array.isArray(state[key])) return { ok: false, error: "CONTINUITY_" + key.toUpperCase() + "_INVALID" };
  }
  if (!state.continuity_locations?.canonical_runtime_target) return { ok: false, error: "CONTINUITY_RUNTIME_TARGET_MISSING" };
  return { ok: true };
}
