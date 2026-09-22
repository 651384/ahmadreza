import { validateActionRouting } from "./action-routing-contract.js";
import { planMasterRoute } from "./master-orchestration-policy.js";
import { evaluateAI02Execution } from "./ai02-execution-policy.js";
import { getToolAdapter, validateToolAdapterRegistry } from "./tool-adapter-registry.js";
import { canDispatchTool } from "./tool-adapter-contract.js";

function normalize(value) {
  return String(value ?? "").trim().toUpperCase();
}

function blocked(error_code, next_action, extra = {}) {
  return { status: "BLOCKED", error_code, next_action, ...extra };
}

export function planRuntimeDispatch(input = {}) {
  const routing = validateActionRouting({
    action: input.action,
    tool_refs: input.tool_refs,
    worker: input.worker_id,
    memory_refs: input.memory_refs
  });

  if (!routing.ok) {
    return blocked(routing.error, "CLARIFY_OR_REJECT_ROUTING_INPUT");
  }

  const domain = normalize(input.domain);
  const action = routing.routing.action;

  if (!domain || !action) {
    return { status: "CLARIFICATION", error_code: "ROUTING_CONTEXT_INCOMPLETE", next_action: "PROVIDE_DOMAIN_AND_ACTION" };
  }

  const masterPlan = planMasterRoute({
    domain,
    action,
    authority: normalize(input.authority),
    worker_id: routing.routing.worker
  });

  if (masterPlan.status !== "PENDING") return masterPlan;

  if (routing.routing.tool_refs.length) {
    const registryChecks = validateToolAdapterRegistry();
    const invalidRegistry = registryChecks.find(x => !x.ok);
    if (invalidRegistry) {
      return blocked("TOOL_REGISTRY_INVALID", "RECONCILE_TOOL_REGISTRY", { ref: invalidRegistry.ref });
    }

    for (const ref of routing.routing.tool_refs) {
      const adapter = getToolAdapter(ref);
      if (!adapter) {
        return blocked("UNKNOWN_TOOL_REF", "CLARIFY_TOOL_REF", { tool_ref: ref });
      }
      const toolMode = normalize(input.tool_mode || "READ");
      const toolAuthority = normalize(input.authority);
      const toolDecision = canDispatchTool(adapter, toolMode, toolAuthority);
      if (!toolDecision.ok) {
        return blocked(toolDecision.error, "TOOL_AUTHORITY_GATE", { tool_ref: ref });
      }
    }
  }

  if (masterPlan.worker_id === "SIMOT-AI-02") {
    const workerPlan = evaluateAI02Execution({
      worker_id: masterPlan.worker_id,
      authority: normalize(input.authority),
      action,
      requirement_ids: input.requirement_ids,
      requirement_id: input.requirement_id,
      rfq_ids: input.rfq_ids,
      rfq_id: input.rfq_id,
      assumptions: input.assumptions,
      missing_critical_requirements: input.missing_critical_requirements,
      sanctions_concern: input.sanctions_concern,
      restricted_party_concern: input.restricted_party_concern
    });

    if (workerPlan.decision !== "ALLOWED") return workerPlan;
    return {
      status: "PENDING",
      worker_id: masterPlan.worker_id,
      action,
      domain,
      authority: normalize(input.authority),
      tools: routing.routing.tool_refs,
      memory_refs: routing.routing.memory_refs,
      worker_policy: workerPlan,
      next_action: "DISPATCH_TO_WORKER",
      execution: "BOUNDED"
    };
  }

  return {
    status: "PENDING",
    worker_id: masterPlan.worker_id,
    action,
    domain,
    authority: normalize(input.authority),
    tools: routing.routing.tool_refs,
    memory_refs: routing.routing.memory_refs,
    next_action: "DISPATCH_TO_WORKER",
    execution: "BOUNDED"
  };
}

export const RUNTIME_DISPATCH_CONTRACT = Object.freeze({
  purpose: "deterministic pre-dispatch gate",
  side_effects: false,
  provider_execution: false,
  external_network: false,
  commitment_execution: false,
  fail_closed: true,
  authority_source: "MASTER_AND_WORKER_POLICY",
  tool_authority_required: true,
  protocol: "SIMOT-MSG v2.1 optional routing extension"
});
