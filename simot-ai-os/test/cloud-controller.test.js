import test from "node:test";
import assert from "node:assert/strict";
import { planCloudHeartbeat, CLOUD_CONTROLLER, evaluateWatchdog } from "../src/watchdog.js";
import worker from "../src/worker.js";

const CLOUD_ID = CLOUD_CONTROLLER.instance_prefix + ":0.4.0";

test("cloud controller contract is fixed", () => {
  assert.equal(CLOUD_CONTROLLER.mode, "CLOUD");
  assert.equal(CLOUD_CONTROLLER.instance_prefix, "CLOUD-CRON");
  assert.equal(CLOUD_CONTROLLER.operation, "SCHEDULED_WATCHDOG_CONTROL");
});

test("emits heartbeat when no controller exists", () => {
  const plan = planCloudHeartbeat({ existing: null, instanceId: CLOUD_ID, stateVersion: "0.4.0" });
  assert.equal(plan.emit, true);
  assert.equal(plan.reason, "NO_EXISTING_CONTROLLER");
  assert.equal(plan.heartbeat.status, "ACTIVE");
  assert.equal(plan.heartbeat.instance_id, CLOUD_ID);
  assert.equal(plan.heartbeat.current_operation, "SCHEDULED_WATCHDOG_CONTROL");
});

test("refreshes its own cloud heartbeat", () => {
  const plan = planCloudHeartbeat({
    existing: { status: "ACTIVE", instance_id: "CLOUD-CRON:0.3.0" },
    instanceId: CLOUD_ID
  });
  assert.equal(plan.emit, true);
  assert.equal(plan.reason, "REFRESH_CLOUD_CONTROLLER");
});

test("takes over when an external controller declared IDLE", () => {
  const plan = planCloudHeartbeat({
    existing: { status: "IDLE", instance_id: "LAPTOP-SESSION-7" },
    instanceId: CLOUD_ID
  });
  assert.equal(plan.emit, true);
  assert.equal(plan.reason, "EXTERNAL_CONTROLLER_IDLE");
});

test("never overwrites an external ACTIVE controller, even a stale one", () => {
  const plan = planCloudHeartbeat({
    existing: {
      status: "ACTIVE",
      instance_id: "LAPTOP-SESSION-7",
      last_heartbeat_at: new Date(Date.now() - 60 * 60_000).toISOString()
    },
    instanceId: CLOUD_ID
  });
  assert.equal(plan.emit, false);
  assert.equal(plan.reason, "EXTERNAL_ACTIVE_CONTROLLER_PRESENT");
});

test("rejects non-cloud instance ids fail-closed", () => {
  const plan = planCloudHeartbeat({ existing: null, instanceId: "SOMETHING-ELSE" });
  assert.equal(plan.emit, false);
  assert.equal(plan.reason, "INVALID_CLOUD_INSTANCE_ID");
  const empty = planCloudHeartbeat({ existing: null, instanceId: "" });
  assert.equal(empty.emit, false);
});

test("stale external controller still surfaces RECOVERY_REQUIRED when cloud mode declines takeover", () => {
  const nowMs = Date.parse("2026-09-23T12:00:00.000Z");
  const staleExternal = {
    status: "ACTIVE",
    instance_id: "LAPTOP-SESSION-7",
    last_heartbeat_at: "2026-09-23T11:40:00.000Z"
  };
  const plan = planCloudHeartbeat({ existing: staleExternal, instanceId: CLOUD_ID });
  assert.equal(plan.emit, false);
  const evaluation = evaluateWatchdog({
    controllerStatus: staleExternal.status,
    lastHeartbeatAt: staleExternal.last_heartbeat_at,
    nowMs
  });
  assert.equal(evaluation.state, "RECOVERY_REQUIRED");
});

function makeScheduledDb() {
  const state = { heartbeat: null, watchdog: null, batches: 0 };
  return {
    state,
    async batch(statements) {
      state.batches += statements.length;
      return [];
    },
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              return null;
            },
            async run() {
              if (sql.startsWith("INSERT INTO controller_heartbeat")) {
                state.heartbeat = {
                  status: args[0],
                  instance_id: args[1],
                  last_heartbeat_at: args[2],
                  current_operation: args[3],
                  state_version: args[4]
                };
              } else if (sql.startsWith("INSERT INTO watchdog_state")) {
                state.watchdog = {
                  checked_at: args[0],
                  state: args[1],
                  action: args[2],
                  controller_status: args[3]
                };
              }
              return {};
            }
          };
        },
        async first() {
          if (sql.includes("FROM controller_heartbeat")) return state.heartbeat;
          return null;
        },
        async run() {
          return {};
        }
      };
    }
  };
}

test("scheduled handler in CLOUD mode emits a cloud heartbeat and records watchdog state", async () => {
  const db = makeScheduledDb();
  const env = { SIMOT_DB: db, SIMOT_CONTROLLER_MODE: "CLOUD", SIMOT_RUNTIME_VERSION: "0.4.0" };
  const waits = [];
  const ctx = { waitUntil(p) { waits.push(p); } };
  await worker.scheduled({ scheduledTime: Date.now() }, env, ctx);
  await Promise.all(waits);
  assert.ok(db.state.heartbeat, "cloud heartbeat was not persisted");
  assert.equal(db.state.heartbeat.status, "ACTIVE");
  assert.ok(db.state.heartbeat.instance_id.startsWith("CLOUD-CRON:"));
  assert.ok(db.state.watchdog, "watchdog state was not persisted");
  assert.equal(db.state.watchdog.controller_status, "ACTIVE");
  assert.equal(db.state.watchdog.state, "HEALTHY");
});

test("scheduled handler without CLOUD mode does not fabricate a heartbeat", async () => {
  const db = makeScheduledDb();
  const env = { SIMOT_DB: db };
  const waits = [];
  const ctx = { waitUntil(p) { waits.push(p); } };
  await worker.scheduled({ scheduledTime: Date.now() }, env, ctx);
  await Promise.all(waits);
  assert.equal(db.state.heartbeat, null);
  assert.ok(db.state.watchdog, "watchdog state should still be recorded");
  assert.equal(db.state.watchdog.state, "IDLE");
});
