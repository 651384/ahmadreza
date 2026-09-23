import test from "node:test";
import assert from "node:assert/strict";
import { WATCHDOG_POLICY, evaluateWatchdog, normalizeHeartbeat } from "../src/watchdog.js";

test("watchdog policy is fixed to 3m/1m/10m/15m", () => {
  assert.deepEqual(WATCHDOG_POLICY, {
    interval_minutes: 3,
    heartbeat_interval_minutes: 1,
    stale_threshold_minutes: 10,
    recovery_threshold_minutes: 15,
    recovery_mode: "STATE_ONLY_FAIL_CLOSED",
    run_id_policy: "RUN_IDS_ARE_LOG_IDS_ONLY",
    attempt_count_is_not_completion_criterion: true
  });
});

test("idle controller never becomes stale merely because time passed", () => {
  const result = evaluateWatchdog({
    controllerStatus: "IDLE",
    lastHeartbeatAt: new Date(Date.now() - 60 * 60_000).toISOString()
  });
  assert.equal(result.state, "IDLE");
  assert.equal(result.action, "NO_ACTION");
});

test("active controller is healthy inside threshold", () => {
  const now = Date.parse("2026-09-22T15:00:00.000Z");
  const result = evaluateWatchdog({
    controllerStatus: "ACTIVE",
    lastHeartbeatAt: "2026-09-22T14:52:00.000Z",
    nowMs: now
  });
  assert.equal(result.state, "HEALTHY");
  assert.equal(result.action, "NO_ACTION");
});

test("active controller becomes stale at 10 minutes", () => {
  const now = Date.parse("2026-09-22T15:00:00.000Z");
  const result = evaluateWatchdog({
    controllerStatus: "ACTIVE",
    lastHeartbeatAt: "2026-09-22T14:50:00.000Z",
    nowMs: now
  });
  assert.equal(result.state, "STALE");
  assert.equal(result.action, "RECOVERY_CANDIDATE");
});

test("active controller requires recovery at 15 minutes", () => {
  const now = Date.parse("2026-09-22T15:00:00.000Z");
  const result = evaluateWatchdog({
    controllerStatus: "ACTIVE",
    lastHeartbeatAt: "2026-09-22T14:45:00.000Z",
    nowMs: now
  });
  assert.equal(result.state, "RECOVERY_REQUIRED");
  assert.equal(result.action, "RECOVERY_REQUIRED");
});

test("active controller without heartbeat fails closed", () => {
  const result = evaluateWatchdog({
    controllerStatus: "ACTIVE",
    lastHeartbeatAt: null
  });
  assert.equal(result.state, "RECOVERY_REQUIRED");
});

test("heartbeat rejects invalid status and requires instance for active", () => {
  assert.throws(() => normalizeHeartbeat({ status: "BROKEN" }), /INVALID_CONTROLLER_STATUS/);
  assert.throws(() => normalizeHeartbeat({ status: "ACTIVE" }), /MISSING_CONTROLLER_INSTANCE_ID/);
  assert.deepEqual(
    normalizeHeartbeat({
      status: "ACTIVE",
      instance_id: "controller-1",
      current_operation: "RECONCILE",
      state_version: "v1"
    }),
    {
      status: "ACTIVE",
      instance_id: "controller-1",
      current_operation: "RECONCILE",
      state_version: "v1"
    }
  );
});
