const WORKER_RE = /^SIMOT-AI-[0-9]{2}$/;
const ACTION_RE = /^[A-Z][A-Z0-9_:-]{1,63}$/;
const TOOL_RE = /^[A-Z][A-Z0-9_.:-]{1,127}$/;

export function validateActionRouting(input = {}) {
  const action = input.action == null ? null : String(input.action).toUpperCase();
  const toolRefs = Array.isArray(input.tool_refs) ? input.tool_refs.map(String) : [];
  const worker = input.worker == null ? null : String(input.worker);

  if (action !== null && !ACTION_RE.test(action)) {
    return { ok: false, error: "INVALID_ACTION" };
  }
  if (toolRefs.some(x => !TOOL_RE.test(x))) {
    return { ok: false, error: "INVALID_TOOL_REF" };
  }
  if (worker !== null && !WORKER_RE.test(worker) && worker !== "SIMOT-MASTER") {
    return { ok: false, error: "INVALID_WORKER_REF" };
  }
  if (input.memory_refs != null && !Array.isArray(input.memory_refs)) {
    return { ok: false, error: "INVALID_MEMORY_REFS" };
  }

  return {
    ok: true,
    routing: {
      action,
      tool_refs: toolRefs,
      worker,
      memory_refs: input.memory_refs ?? []
    }
  };
}

export const ACTION_ROUTING_EXTENSION = Object.freeze({
  version: "SIMOT-MSG v2.1-extension",
  backward_compatible: true,
  optional_fields: ["ACTION", "TOOL-REFS", "WORKER-REF", "MEMORY-REFS"],
  rule: "optional routing fields never override AUTHORITY or Source-of-Truth rules"
});
