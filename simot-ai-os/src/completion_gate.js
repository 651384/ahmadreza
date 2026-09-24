const COMPLETION_GATE_VERSION = "1.0.0";

export function evaluateCompletionEvidence({ result, runtimeEvidence }) {
  const status = String(result?.result_status || "").toUpperCase();
  const verification = String(result?.verification || "").toUpperCase();
  const evidence = Array.isArray(result?.evidence) ? result.evidence.filter(Boolean) : [];
  const gaps = Array.isArray(result?.gaps) ? result.gaps.filter(Boolean) : [];
  const runtimeVerified = Boolean(runtimeEvidence?.verified);
  const reasons = [];
  if (status !== "COMPLETED") reasons.push("RESULT_NOT_COMPLETED");
  if (verification !== "VERIFIED") reasons.push("RESULT_NOT_VERIFIED");
  if (!evidence.length) reasons.push("NO_EVIDENCE");
  if (gaps.length) reasons.push("UNRESOLVED_GAPS");
  if (!runtimeVerified) reasons.push("RUNTIME_VERSION_UNVERIFIED");
  return {
    gate_version: COMPLETION_GATE_VERSION,
    verified: reasons.length === 0,
    status: reasons.length === 0 ? "VERIFIED" : "UNVERIFIED",
    reasons
  };
}

export function runtimeEvidence(env) {
  const metadata = env?.CF_VERSION_METADATA;
  return {
    verified: Boolean(metadata?.id),
    version_id: metadata?.id || null,
    version_tag: metadata?.tag || null,
    version_timestamp: metadata?.timestamp || null,
    runtime_version: env?.SIMOT_RUNTIME_VERSION || null
  };
}
