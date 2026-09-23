export const WATCHDOG_POLICY = Object.freeze({
  interval_minutes: 3,
  heartbeat_interval_minutes: 1,
  stale_threshold_minutes: 10,
  recovery_threshold_minutes: 15,
  recovery_mode: "STATE_ONLY_FAIL_CLOSED",
  run_id_policy: "RUN_IDS_ARE_LOG_IDS_ONLY",
  attempt_count_is_not_completion_criterion: true
});

const ACTIVE = "ACTIVE";
const IDLE = "IDLE";

export function evaluateWatchdog({
  controllerStatus = IDLE,
  lastHeartbeatAt = null,
  nowMs = Date.now(),
  staleThresholdMs = WATCHDOG_POLICY.stale_threshold_minutes * 60_000,
  recoveryThresholdMs = WATCHDOG_POLICY.recovery_threshold_minutes * 60_000
} = {}) {
  const status = String(controllerStatus || IDLE).toUpperCase();
  if (status !== ACTIVE) {
    return {
      state: "IDLE",
      action: "NO_ACTION",
      controller_status: status,
      age_ms: lastHeartbeatAt ? Math.max(0, nowMs - Date.parse(lastHeartbeatAt)) : null
    };
  }

  if (!lastHeartbeatAt) {
    return {
      state: "RECOVERY_REQUIRED",
      action: "RECOVERY_REQUIRED",
      controller_status: ACTIVE,
      age_ms: null,
      reason: "ACTIVE_CONTROLLER_WITHOUT_HEARTBEAT"
    };
  }

  const parsed = Date.parse(lastHeartbeatAt);
  if (!Number.isFinite(parsed)) {
    return {
      state: "RECOVERY_REQUIRED",
      action: "RECOVERY_REQUIRED",
      controller_status: ACTIVE,
      age_ms: null,
      reason: "INVALID_HEARTBEAT_TIMESTAMP"
    };
  }

  const ageMs = Math.max(0, nowMs - parsed);
  if (ageMs >= recoveryThresholdMs) {
    return {
      state: "RECOVERY_REQUIRED",
      action: "RECOVERY_REQUIRED",
      controller_status: ACTIVE,
      age_ms: ageMs,
      reason: "HEARTBEAT_EXCEEDED_RECOVERY_THRESHOLD"
    };
  }

  if (ageMs >= staleThresholdMs) {
    return {
      state: "STALE",
      action: "RECOVERY_CANDIDATE",
      controller_status: ACTIVE,
      age_ms: ageMs,
      reason: "HEARTBEAT_EXCEEDED_STALE_THRESHOLD"
    };
  }

  return {
    state: "HEALTHY",
    action: "NO_ACTION",
    controller_status: ACTIVE,
    age_ms: ageMs,
    reason: "HEARTBEAT_WITHIN_THRESHOLD"
  };
}

export function normalizeHeartbeat(input = {}) {
  const status = String(input.status ?? ACTIVE).toUpperCase();
  if (![ACTIVE, IDLE].includes(status)) throw new Error("INVALID_CONTROLLER_STATUS");

  const instanceId = String(input.instance_id ?? "").trim();
  if (status === ACTIVE && !instanceId) throw new Error("MISSING_CONTROLLER_INSTANCE_ID");

  return {
    status,
    instance_id: instanceId || null,
    current_operation: input.current_operation == null ? null : String(input.current_operation),
    state_version: input.state_version == null ? null : String(input.state_version)
  };
}

export function buildWatchdogRecord(evaluation, checkedAt = new Date().toISOString()) {
  return {
    checked_at: checkedAt,
    state: evaluation.state,
    action: evaluation.action,
    controller_status: evaluation.controller_status,
    age_ms: evaluation.age_ms,
    reason: evaluation.reason ?? null
  };
}
