const FREE_ACCESS = new Set(["API_FREE", "AGGREGATOR_FREE"]);
const CONDITIONAL_ACCESS = new Set(["CONDITIONAL_FREE"]);

export class ProviderRouterError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ProviderRouterError";
    this.code = code;
  }
}

export function assertFreeOnly(provider) {
  if (!provider || typeof provider !== "object") {
    throw new ProviderRouterError("INVALID_PROVIDER", "Provider definition is required.");
  }
  if (!FREE_ACCESS.has(provider.access_class) && !CONDITIONAL_ACCESS.has(provider.access_class)) {
    throw new ProviderRouterError("PAID_PROVIDER_BLOCKED", "Provider is not eligible for the SIMOT free-only runtime.");
  }
  if (provider.verified_free !== true) {
    throw new ProviderRouterError("FREE_STATUS_UNVERIFIED", "Provider free status is not verified at activation time.");
  }
  if (provider.payment_enabled !== false) {
    throw new ProviderRouterError("PAYMENT_STATE_UNVERIFIED", "Provider payment-disabled state must be explicitly verified before activation.");
  }
  return true;
}

export function selectProvider(registry, capability, options = {}) {
  const data = Array.isArray(registry) ? registry : [];
  const candidates = data
    .filter((p) => p && p.capabilities?.includes(capability))
    .filter((p) => p.enabled === true)
    .filter((p) => p.data_classes?.includes(options.data_class || "PUBLIC"))
    .filter((p) => {
      try {
        assertFreeOnly(p);
        return true;
      } catch {
        return false;
      }
    })
    .sort((a, b) =>
      (a.priority ?? 999) - (b.priority ?? 999) ||
      (a.latency_rank ?? 999) - (b.latency_rank ?? 999)
    );

  if (!candidates.length) {
    throw new ProviderRouterError("NO_FREE_PROVIDER", "No eligible verified-free provider is available.");
  }
  return candidates[0];
}

export function createRouter(registry) {
  return {
    select(capability, options = {}) {
      return selectProvider(registry, capability, options);
    },
    async execute() {
      throw new ProviderRouterError(
        "PROVIDER_EXECUTION_NOT_CONFIGURED",
        "Provider execution is intentionally disabled until the approved runtime stage."
      );
    },
    async health() {
      return (Array.isArray(registry) ? registry : []).map((provider) => ({
        provider: provider.id,
        status: provider.enabled === true && provider.verified_free === true ? "ELIGIBLE" : "UNAVAILABLE"
      }));
    }
  };
}
