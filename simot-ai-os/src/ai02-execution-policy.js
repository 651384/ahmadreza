const WORKER_ID = "SIMOT-AI-02";
const ALLOWED_AUTHORITY = "EXECUTE_WITHIN_ROLE";
const APPROVAL_AUTHORITIES = new Set(["APPROVAL_REQUIRED", "HUMAN_ONLY"]);

const ACTIONS = Object.freeze({
  ANALYZE: "ANALYZE",
  PREPARE: "PREPARE",
  TECHNICAL_REVIEW: "TECHNICAL_REVIEW",
  HS_RESEARCH: "HS_RESEARCH",
  SUPPLIER_DISCOVERY: "SUPPLIER_DISCOVERY",
  SUPPLIER_QUALIFICATION: "SUPPLIER_QUALIFICATION",
  RFQ_PREPARATION: "RFQ_PREPARATION",
  QUOTATION_COMPARISON: "QUOTATION_COMPARISON",
  COMPLIANCE_PREPARATION: "COMPLIANCE_PREPARATION",
  STATUS_REPORT: "STATUS_REPORT",
  SUPPLIER_SELECTION: "SUPPLIER_SELECTION",
  PO_ISSUANCE: "PO_ISSUANCE",
  PAYMENT: "PAYMENT",
  BANKING: "BANKING",
  CONTRACT_COMMITMENT: "CONTRACT_COMMITMENT",
  EXTERNAL_CONTACT: "EXTERNAL_CONTACT",
  IRREVERSIBLE_ACTION: "IRREVERSIBLE_ACTION"
});

const PREPARATION_ACTIONS = new Set([
  ACTIONS.ANALYZE, ACTIONS.PREPARE, ACTIONS.TECHNICAL_REVIEW,
  ACTIONS.HS_RESEARCH, ACTIONS.SUPPLIER_DISCOVERY,
  ACTIONS.SUPPLIER_QUALIFICATION, ACTIONS.RFQ_PREPARATION,
  ACTIONS.QUOTATION_COMPARISON, ACTIONS.COMPLIANCE_PREPARATION,
  ACTIONS.STATUS_REPORT
]);

const COMMITMENT_ACTIONS = new Set([
  ACTIONS.SUPPLIER_SELECTION, ACTIONS.PO_ISSUANCE, ACTIONS.PAYMENT,
  ACTIONS.BANKING, ACTIONS.CONTRACT_COMMITMENT, ACTIONS.EXTERNAL_CONTACT,
  ACTIONS.IRREVERSIBLE_ACTION
]);

function normalizeList(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [String(value)];
}

function preserveContext(input) {
  return {
    requirement_ids: normalizeList(input.requirement_ids ?? input.requirement_id),
    rfq_ids: normalizeList(input.rfq_ids ?? input.rfq_id),
    assumptions: normalizeList(input.assumptions)
  };
}

function blocked(code, reason, input) {
  return {
    decision: "BLOCKED",
    result_status: "BLOCKED",
    next_action: "ESCALATE_OR_REQUEST_APPROVAL",
    error_code: code,
    reason,
    context: preserveContext(input)
  };
}

export function evaluateAI02Execution(input = {}) {
  const workerId = String(input.worker_id ?? "");
  const authority = String(input.authority ?? "");
  const action = String(input.action ?? "").toUpperCase();
  const context = preserveContext(input);

  if (workerId !== WORKER_ID) {
    return {
      decision: "REJECTED",
      result_status: "REJECTED",
      next_action: "ROUTE_TO_AI_02",
      error_code: "AI02_ROLE_MISMATCH",
      reason: "Execution contract is restricted to SIMOT-AI-02.",
      context
    };
  }

  if (COMMITMENT_ACTIONS.has(action)) {
    if (!APPROVAL_AUTHORITIES.has(authority)) {
      return blocked("APPROVAL_REQUIRED", "Action is a commercial, financial, external, contractual, or irreversible commitment.", input);
    }
    return blocked("HUMAN_OR_APPROVAL_GATE_REQUIRED", "Approval authority does not itself execute the commitment; a separate approved human/system action is required.", input);
  }

  if (!PREPARATION_ACTIONS.has(action)) {
    return {
      decision: "REJECTED",
      result_status: "REJECTED",
      next_action: "CLARIFY_ACTION",
      error_code: "AI02_ACTION_UNDEFINED",
      reason: "Action is outside the defined AI-02 execution contract.",
      context
    };
  }

  if (authority !== ALLOWED_AUTHORITY) {
    return blocked("INVALID_EXECUTION_AUTHORITY", "Analysis/preparation execution requires EXECUTE_WITHIN_ROLE.", input);
  }

  const criticalMissing = normalizeList(input.missing_critical_requirements);
  if (criticalMissing.length) {
    return blocked("CRITICAL_REQUIREMENT_MISSING", "Critical requirement/specification data is missing.", {
      ...input,
      assumptions: [...context.assumptions, ...criticalMissing.map(x => "MISSING:" + x)]
    });
  }

  const restrictedPartyConcern = Boolean(input.sanctions_concern || input.restricted_party_concern);
  if (restrictedPartyConcern) {
    return blocked("SANCTIONS_OR_RESTRICTED_PARTY_CONCERN", "Sanctions or restricted-party concern requires escalation.", input);
  }

  return {
    decision: "ALLOWED",
    result_status: "PENDING",
    next_action: "EXECUTE_WITHIN_ROLE",
    error_code: null,
    reason: "AI-02 may perform bounded analysis/preparation only; this decision is not completion.",
    context
  };
}

export { ACTIONS };
