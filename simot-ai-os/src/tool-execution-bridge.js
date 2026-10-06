import { exaSearch } from "./adapters/exa.js";

const OP_RE = /^[A-Z][A-Z0-9_.:-]{1,127}$/;

function normalize(value) {
  return String(value ?? "").trim().toUpperCase();
}

function blocked(error_code, next_action, extra = {}) {
  return { ok: false, status: "BLOCKED", error_code, next_action, ...extra };
}

function requireAuthority(authority) {
  const value = normalize(authority);
  const allowed = new Set([
    "INFORMATIONAL",
    "ANALYSIS_ONLY",
    "EXECUTE_WITHIN_ROLE",
    "APPROVAL_REQUIRED",
    "HUMAN_ONLY",
    "SYSTEM_WRITE_ALLOWED"
  ]);
  return allowed.has(value) ? value : null;
}

async function cloudflareManagement(env, operation, args = {}) {
  if (!env.CLOUDFLARE_MANAGEMENT_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) {
    return blocked("CLOUDFLARE_MANAGEMENT_NOT_CONFIGURED", "CONFIGURE_CLOUDFLARE_MANAGEMENT");
  }

  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const scriptName = String(args.script_name || "simot-ai-os-gateway");
  const routes = {
    LIST_WORKERS: `/accounts/${accountId}/workers/scripts?per_page=100`,
    LIST_D1: `/accounts/${accountId}/d1/database?per_page=100`,
    LIST_QUEUES: `/accounts/${accountId}/queues`,
    LIST_WORKFLOWS: `/accounts/${accountId}/workflows?per_page=100`,
    GET_WORKER: `/accounts/${accountId}/workers/scripts/${encodeURIComponent(scriptName)}`,
    LIST_VERSIONS: `/accounts/${accountId}/workers/scripts/${encodeURIComponent(scriptName)}/versions?per_page=100`,
    LIST_DEPLOYMENTS: `/accounts/${accountId}/workers/scripts/${encodeURIComponent(scriptName)}/deployments?per_page=100`
  };

  const path = routes[operation];
  if (!path) return blocked("UNSUPPORTED_CLOUDFLARE_OPERATION", "CLARIFY_TOOL_OPERATION", { operation });

  const response = await fetch("https://api.cloudflare.com/client/v4" + path, {
    headers: {
      Authorization: "Bearer " + env.CLOUDFLARE_MANAGEMENT_API_TOKEN,
      accept: "application/json",
      "content-type": "application/json"
    }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success !== true) {
    return blocked("CLOUDFLARE_API_FAILED", "REVIEW_CLOUDFLARE_RESPONSE", {
      http_status: response.status,
      errors: Array.isArray(payload?.errors)
        ? payload.errors.slice(0, 3).map(e => ({ code: e?.code ?? null, message: e?.message ?? null }))
        : []
    });
  }

  return {
    ok: true,
    status: "COMPLETED",
    verification: "DIRECT_CLOUDFLARE_API_READ",
    operation,
    result: payload.result ?? null
  };
}

export async function executeToolRequest(env, input = {}) {
  const toolRef = normalize(input.tool_ref);
  const operation = normalize(input.operation);

  if (!toolRef || !OP_RE.test(operation)) {
    return blocked("INVALID_TOOL_REQUEST", "CLARIFY_TOOL_REQUEST");
  }

  const authority = requireAuthority(input.authority);
  if (!authority) return blocked("INVALID_TOOL_AUTHORITY", "TOOL_AUTHORITY_GATE");

  const mode = normalize(input.mode || "READ");
  if (mode !== "READ") {
    return blocked(
      "WRITE_EXECUTION_NOT_ENABLED_IN_RUNTIME_BRIDGE",
      "USE_SEPARATE_APPROVAL_AND_WRITE_ADAPTER",
      { tool_ref: toolRef, operation }
    );
  }

  if (toolRef === "EXA") {
    if (!["WEB_SEARCH_EXA", "WEB_FETCH_EXA"].includes(operation)) {
      return blocked("UNSUPPORTED_EXA_OPERATION", "CLARIFY_TOOL_OPERATION", { operation });
    }
    if (operation === "WEB_SEARCH_EXA") {
      const result = await exaSearch(env, {
        query: String(input.args?.query || ""),
        numResults: Math.min(10, Math.max(1, Number(input.args?.numResults || 5)))
      });
      return {
        ok: true,
        status: result.status || "COMPLETED",
        verification: "DIRECT_EXA_ADAPTER",
        operation,
        result
      };
    }
    return blocked("WEB_FETCH_REQUIRES_ADAPTER_EXTENSION", "ADD_EXA_FETCH_ADAPTER");
  }

  if (toolRef === "CLOUDFLARE") {
    if (authority === "INFORMATIONAL" || authority === "ANALYSIS_ONLY" || authority === "EXECUTE_WITHIN_ROLE" || authority === "SYSTEM_WRITE_ALLOWED") {
      return cloudflareManagement(env, operation, input.args || {});
    }
    return blocked("CLOUDFLARE_TOOL_AUTHORITY_BLOCKED", "TOOL_AUTHORITY_GATE");
  }

  if (toolRef === "SIMOT") {
    if (operation === "HEALTH") {
      return {
        ok: true,
        status: "COMPLETED",
        verification: "DIRECT_RUNTIME_READ",
        result: {
          service: "simot-ai-os-gateway",
          version: env.SIMOT_RUNTIME_VERSION || "unknown",
          state: env.SIMOT_DEFAULT_STATE || "UNKNOWN"
        }
      };
    }
    return blocked("UNSUPPORTED_SIMOT_OPERATION", "CLARIFY_TOOL_OPERATION", { operation });
  }

  return blocked(
    "CONNECTOR_EXECUTION_NOT_AVAILABLE_IN_CLOUDFLARE_RUNTIME",
    "ROUTE_THROUGH_EXTERNAL_EXECUTION_RELAY",
    { tool_ref: toolRef, operation }
  );
}

export const TOOL_EXECUTION_BRIDGE_CONTRACT = Object.freeze({
  version: "1.0.0",
  purpose: "bounded runtime execution bridge",
  default_mode: "READ",
  write_execution: false,
  fail_closed: true,
  secret_values_never_returned: true,
  unsupported_connectors_are_explicitly_blocked: true
});
