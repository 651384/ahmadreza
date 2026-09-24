import test from "node:test";
import assert from "node:assert/strict";
import { EXECUTION_STANDARD, EXECUTION_STANDARD_ID, validateExecutionStandard, assertNoLocalRuntimeDependency } from "../src/execution_standard.js";

test("execution standard locks Cloudflare as control plane", () => {
  assert.equal(EXECUTION_STANDARD_ID, "SOT-ARCH-LOCAL-PC-001");
  assert.equal(EXECUTION_STANDARD.version, "2.1.0");
  assert.equal(EXECUTION_STANDARD.control_plane, "CLOUDFLARE");
  assert.equal(EXECUTION_STANDARD.local_pc_dependency, false);
});

test("preflight passes only for the locked standard", () => {
  assert.equal(validateExecutionStandard({ env: {} }).ok, true);
  assert.throws(() => validateExecutionStandard({ env: { SIMOT_EXECUTION_STANDARD_VERSION: "1.0.0" } }), /VERSION_MISMATCH/);
});

test("forbidden local runtime dependencies are rejected", () => {
  assert.equal(assertNoLocalRuntimeDependency(["Cloudflare Workers", "D1"]), true);
  assert.throws(() => assertNoLocalRuntimeDependency(["Cloudflare Workers", "Local PC"]), /FORBIDDEN_RUNTIME_DEPENDENCY/);
});
