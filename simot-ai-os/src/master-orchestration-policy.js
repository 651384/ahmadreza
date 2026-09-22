const WORKER_CAPABILITIES = Object.freeze([
  {
    worker_id: "SIMOT-AI-01",
    domains: ["RESEARCH","MARKET_INTELLIGENCE","COUNTRY","INDUSTRY","SEGMENT","PRODUCT","OPPORTUNITY","BUYER","COMPETITOR","SUPPLIER"],
    actions: ["ANALYZE","RESEARCH","STATUS_REPORT"],
    tools: ["WEB_RESEARCH","EXA","NOTION_READ"],
    authority: ["ANALYSIS_ONLY","EXECUTE_WITHIN_ROLE"]
  },
  {
    worker_id: "SIMOT-AI-02",
    domains: ["IMPORT","TECHNICAL_TRADE","SOURCING","RFQ","COMPLIANCE","CUSTOMS"],
    actions: ["ANALYZE","PREPARE","TECHNICAL_REVIEW","HS_RESEARCH","SUPPLIER_DISCOVERY","SUPPLIER_QUALIFICATION","RFQ_PREPARATION","QUOTATION_COMPARISON","COMPLIANCE_PREPARATION","STATUS_REPORT","SUPPLIER_SELECTION","PO_ISSUANCE","PAYMENT","BANKING","CONTRACT_COMMITMENT","EXTERNAL_CONTACT","IRREVERSIBLE_ACTION"],
    tools: ["ONEDRIVE_READ","NOTION_READ","ASANA_READ","HUBSPOT_READ"],
    authority: ["EXECUTE_WITHIN_ROLE","APPROVAL_REQUIRED","HUMAN_ONLY"]
  },
  {
    worker_id: "SIMOT-AI-03",
    domains: ["MARKETING","CONTENT","BRANDING"],
    actions: ["ANALYZE","PREPARE","RESEARCH","STATUS_REPORT"],
    tools: ["NOTION_READ","CANVA","DESCRIPT","HEYGEN"],
    authority: ["ANALYSIS_ONLY","EXECUTE_WITHIN_ROLE"]
  },
  {
    worker_id: "SIMOT-AI-04",
    domains: ["EXPORT","COMMERCIAL","SALES_OPERATIONS"],
    actions: ["ANALYZE","PREPARE","RESEARCH","STATUS_REPORT"],
    tools: ["HUBSPOT_READ","ONEDRIVE_READ","NOTION_READ","ASANA_READ"],
    authority: ["ANALYSIS_ONLY","EXECUTE_WITHIN_ROLE","APPROVAL_REQUIRED"]
  }
]);

const COMMITMENT_ACTIONS = new Set([
  "SUPPLIER_SELECTION","PO_ISSUANCE","PAYMENT","BANKING",
  "CONTRACT_COMMITMENT","EXTERNAL_CONTACT","IRREVERSIBLE_ACTION"
]);

function normalize(value) {
  return String(value ?? "").trim().toUpperCase();
}

function candidatesFor(domain, action) {
  return WORKER_CAPABILITIES.filter(cap =>
    cap.domains.includes(domain) && cap.actions.includes(action)
  );
}

export function planMasterRoute(input = {}) {
  const domain = normalize(input.domain);
  const action = normalize(input.action);
  const authority = normalize(input.authority);
  const requestedWorker = input.worker_id ? normalize(input.worker_id) : null;

  if (!domain || !action) {
    return {
      status: "CLARIFICATION",
      error_code: "ROUTING_INPUT_MISSING",
      next_action: "PROVIDE_DOMAIN_AND_ACTION"
    };
  }

  const candidates = candidatesFor(domain, action);
  if (requestedWorker) {
    const exact = candidates.filter(x => x.worker_id === requestedWorker);
    if (!exact.length) {
      return {
        status: "REJECTED",
        error_code: "WORKER_CAPABILITY_MISMATCH",
        next_action: "ROUTE_TO_CAPABLE_WORKER"
      };
    }
  }

  if (candidates.length !== 1 && !requestedWorker) {
    return {
      status: "CLARIFICATION",
      error_code: candidates.length ? "ROUTING_AMBIGUOUS" : "NO_CAPABLE_WORKER",
      candidates: candidates.map(x => x.worker_id),
      next_action: candidates.length ? "SPECIFY_WORKER_OR_NARROW_DOMAIN" : "CREATE_OR_ASSIGN_CAPABILITY"
    };
  }

  const worker = candidates.find(x => x.worker_id === (requestedWorker || candidates[0].worker_id));
  if (!worker.authority.includes(authority)) {
    return {
      status: "BLOCKED",
      error_code: "AUTHORITY_NOT_PERMITTED",
      worker_id: worker.worker_id,
      next_action: "REQUEST_APPROVAL_OR_ESCALATE"
    };
  }

  if (COMMITMENT_ACTIONS.has(action)) {
    return {
      status: "BLOCKED",
      error_code: "COMMITMENT_GATE",
      worker_id: worker.worker_id,
      next_action: "HUMAN_OR_APPROVAL_GATE_REQUIRED"
    };
  }

  return {
    status: "PENDING",
    worker_id: worker.worker_id,
    action,
    domain,
    tools: worker.tools,
    authority,
    next_action: "DISPATCH_TO_WORKER",
    execution: "BOUNDED"
  };
}

export function listCapabilities() {
  return WORKER_CAPABILITIES.map(cap => ({
    worker_id: cap.worker_id,
    domains: [...cap.domains],
    actions: [...cap.actions],
    tools: [...cap.tools],
    authority: [...cap.authority]
  }));
}
