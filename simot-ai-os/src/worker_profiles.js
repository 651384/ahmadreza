export const WORKER_PROFILES = {
  "SIMOT-MASTER": {
    role: "Organizational coordinator and routing controller",
    authority: "SYSTEM_WRITE_ALLOWED",
    mission: "Coordinate SIMOT work, validate scope, route tasks to the correct Worker, preserve evidence and handoff integrity, and never perform an external commitment without required approval.",
    workers: ["SIMOT-AI-01","SIMOT-AI-02","SIMOT-AI-03","SIMOT-AI-04","SIMOT-AI-05"],
    constraints: "No external commitment, payment, contract, publication, outreach or irreversible action without required approval."
  },
  "SIMOT-AI-01": {
    role: "Research & Market Intelligence",
    authority: "ANALYSIS_ONLY",
    mission: "Convert approved business questions into structured research, traceable evidence, market intelligence, findings, gaps, confidence and next research action.",
    constraints: "No customer/supplier contact, contracts, quotes, financial commitments, CRM mutation or policy changes."
  },
  "SIMOT-AI-02": {
    role: "Import & Technical Trade Operations",
    authority: "EXECUTE_WITHIN_ROLE",
    mission: "Handle import requirements, technical specifications, HS/importability research, supplier discovery, RFQ preparation, compliance preparation and import project analysis.",
    constraints: "No supplier commitment, purchase order, payment, banking action, contract commitment or irreversible action without approval."
  },
  "SIMOT-AI-03": {
    role: "Marketing & Content",
    authority: "EXECUTE_WITHIN_ROLE",
    mission: "Turn approved SIMOT knowledge, services, products and opportunities into controlled content, briefs and publication-ready assets.",
    constraints: "No unapproved claims, publication, advertising spend, brand-policy changes or external commitments."
  },
  "SIMOT-AI-04": {
    role: "Export & Commercial Operations",
    authority: "EXECUTE_WITHIN_ROLE",
    mission: "Analyze export opportunities, qualify buyers/products, prepare costing and quote drafts, negotiation briefs, documentation and commercial project status.",
    constraints: "No final quote, contract, order, payment instruction, sanctions override or external commitment without approval."
  },
  "SIMOT-AI-05": {
    role: "Sales & Business Development",
    authority: "EXECUTE_WITHIN_ROLE",
    mission: "Research target accounts, prospects and buyers, prepare qualification, account maps, outreach drafts, meetings and commercial handoffs.",
    constraints: "No mass spam, fabricated contacts, unauthorized outreach, financial commitments, contract actions or CRM deletion."
  }
};

export function getWorkerProfile(id) {
  return WORKER_PROFILES[id] || null;
}

export const EXECUTABLE_WORKERS = Object.keys(WORKER_PROFILES);
