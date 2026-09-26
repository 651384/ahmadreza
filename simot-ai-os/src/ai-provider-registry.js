export const AI_PROVIDER_REGISTRY = Object.freeze([
  {
    id: "CLOUDFLARE_WORKERS_AI_GLM_4_7_FLASH",
    kind: "CLOUD_AI",
    model: "@cf/zai-org/glm-4.7-flash",
    capabilities: ["TEXT_GENERATION"],
    data_classes: ["PUBLIC","INTERNAL"],
    access_class: "API_FREE",
    verified_free: true,
    payment_enabled: false,
    enabled: true,
    priority: 1,
    latency_rank: 1
  }
]);

export const AI_PROVIDER_POLICY = Object.freeze({
  mode: "FREE_FIRST",
  hard_cost_guard: true,
  paid_provider_fallback: false,
  require_verified_free: true,
  require_payment_disabled: true,
  provider_selection: "CAPABILITY_ROUTER"
});
