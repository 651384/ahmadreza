const SYSTEM_RE = /^[A-Z][A-Z0-9_-]{1,63}$/;
const OP_RE = /^[A-Z][A-Z0-9_.:-]{1,127}$/;
const MODES = new Set(["READ","WRITE","EXECUTE"]);
const AUTHORITIES = new Set(["INFORMATIONAL","ANALYSIS_ONLY","EXECUTE_WITHIN_ROLE","APPROVAL_REQUIRED","HUMAN_ONLY","SYSTEM_WRITE_ALLOWED"]);

export function validateToolAdapter(adapter = {}) {
  const system = String(adapter.system ?? "").toUpperCase();
  const operations = Array.isArray(adapter.operations) ? adapter.operations.map(x => String(x).toUpperCase()) : [];
  const mode = String(adapter.mode ?? "READ").toUpperCase();
  const authority = String(adapter.authority ?? "INFORMATIONAL").toUpperCase();

  if (!SYSTEM_RE.test(system)) return {ok:false,error:"INVALID_ADAPTER_SYSTEM"};
  if (!operations.length || operations.some(x => !OP_RE.test(x))) return {ok:false,error:"INVALID_ADAPTER_OPERATIONS"};
  if (!MODES.has(mode)) return {ok:false,error:"INVALID_ADAPTER_MODE"};
  if (!AUTHORITIES.has(authority)) return {ok:false,error:"INVALID_ADAPTER_AUTHORITY"};

  return {
    ok:true,
    adapter:{
      system,
      operations,
      mode,
      authority,
      reference_first: adapter.reference_first !== false,
      supports_idempotency: adapter.supports_idempotency === true,
      supports_readback: adapter.supports_readback !== false
    }
  };
}

export function canDispatchTool(adapter, requestedMode, requestedAuthority) {
  const check = validateToolAdapter(adapter);
  if (!check.ok) return check;
  const mode = String(requestedMode ?? "").toUpperCase();
  const authority = String(requestedAuthority ?? "").toUpperCase();
  if (mode !== check.adapter.mode) return {ok:false,error:"TOOL_MODE_MISMATCH"};
  if (!check.adapter.supports_readback && mode === "WRITE") return {ok:false,error:"WRITE_READBACK_REQUIRED"};
  if (!AUTHORITIES.has(authority)) return {ok:false,error:"INVALID_REQUEST_AUTHORITY"};
  const order = ["INFORMATIONAL","ANALYSIS_ONLY","EXECUTE_WITHIN_ROLE","APPROVAL_REQUIRED","HUMAN_ONLY","SYSTEM_WRITE_ALLOWED"];
  if (order.indexOf(authority) < order.indexOf(check.adapter.authority)) return {ok:false,error:"TOOL_AUTHORITY_INSUFFICIENT"};
  return {ok:true,adapter:check.adapter};
}
