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
  },
  {
    id: "GOOGLE_GEMINI",
    kind: "CLOUD_AI",
    model: "gemini-2.5-flash",
    capabilities: ["TEXT_GENERATION"],
    data_classes: ["PUBLIC","INTERNAL"],
    access_class: "CONDITIONAL_FREE",
    verified_free: true,
    payment_enabled: false,
    enabled: true,
    priority: 2,
    latency_rank: 2,
    execution_adapter: "./adapters/gemini.js",
    activation: "REQUIRES_GEMINI_API_KEY_AND_FREE_MODE"
  },
  {
    id: "EXA",
    kind: "RESEARCH_PROVIDER",
    capabilities: ["WEB_SEARCH","RESEARCH"],
    data_classes: ["PUBLIC"],
    access_class: "AGGREGATOR_FREE",
    verified_free: true,
    payment_enabled: false,
    enabled: true,
    priority: 1,
    latency_rank: 1,
    execution_adapter: "./adapters/exa.js",
    activation: "REQUIRES_EXA_API_KEY"
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
