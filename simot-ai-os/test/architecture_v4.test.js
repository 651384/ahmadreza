import test from "node:test";
import assert from "node:assert/strict";
import { selectProvider, ProviderRouterError } from "../src/provider-router.js";
import { AI_PROVIDER_REGISTRY, AI_PROVIDER_POLICY } from "../src/ai-provider-registry.js";
import { evaluateCompletionEvidence } from "../src/completion_gate.js";

test("free-only provider router selects the verified free Cloudflare model", () => {
  const provider = selectProvider(AI_PROVIDER_REGISTRY, "TEXT_GENERATION", { data_class: "INTERNAL" });
  assert.equal(provider.model, "@cf/zai-org/glm-4.7-flash");
  assert.equal(AI_PROVIDER_POLICY.mode, "FREE_FIRST");
  assert.equal(AI_PROVIDER_POLICY.hard_cost_guard, true);
});

test("provider router rejects paid or unverified providers", () => {
  assert.throws(
    () => selectProvider([{ id:"PAID", capabilities:["TEXT_GENERATION"], data_classes:["INTERNAL"], access_class:"PAID", verified_free:false, payment_enabled:true, enabled:true }], "TEXT_GENERATION", { data_class:"INTERNAL" }),
    (error) => error instanceof ProviderRouterError && error.code === "NO_FREE_PROVIDER"
  );
});

test("completion evidence cannot verify a completion without runtime evidence", () => {
  const gate = evaluateCompletionEvidence({
    result: { result_status:"COMPLETED", verification:"VERIFIED", evidence:["runtime action"], gaps:[] },
    runtimeEvidence: { verified:false }
  });
  assert.equal(gate.verified, false);
  assert.match(gate.reasons.join(","), /RUNTIME_VERSION_UNVERIFIED/);
});

test("completion evidence verifies only when every gate is satisfied", () => {
  const gate = evaluateCompletionEvidence({
    result: { result_status:"COMPLETED", verification:"VERIFIED", evidence:["runtime action"], gaps:[] },
    runtimeEvidence: { verified:true }
  });
  assert.equal(gate.verified, true);
});
