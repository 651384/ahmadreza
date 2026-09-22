import test from "node:test";
import assert from "node:assert/strict";
import { assertFreeOnly, selectProvider, ProviderRouterError } from "../src/provider-router.js";

test("rejects paid providers", () => {
  assert.throws(
    () => assertFreeOnly({ access_class: "NOT_FREE", verified_free: true, payment_enabled: false }),
    (error) => error instanceof ProviderRouterError && error.code === "PAID_PROVIDER_BLOCKED"
  );
});

test("rejects unverified payment state", () => {
  assert.throws(
    () => assertFreeOnly({ access_class: "API_FREE", verified_free: true }),
    (error) => error.code === "PAYMENT_STATE_UNVERIFIED"
  );
});

test("selects eligible free provider by priority then latency", () => {
  const provider = selectProvider([
    {
      id: "slow",
      enabled: true,
      access_class: "API_FREE",
      verified_free: true,
      payment_enabled: false,
      data_classes: ["PUBLIC"],
      capabilities: ["research"],
      priority: 2,
      latency_rank: 1
    },
    {
      id: "fast",
      enabled: true,
      access_class: "API_FREE",
      verified_free: true,
      payment_enabled: false,
      data_classes: ["PUBLIC"],
      capabilities: ["research"],
      priority: 1,
      latency_rank: 9
    }
  ], "research");

  assert.equal(provider.id, "fast");
});

test("fails closed when no eligible provider exists", () => {
  assert.throws(
    () => selectProvider([], "research"),
    (error) => error.code === "NO_FREE_PROVIDER"
  );
});
