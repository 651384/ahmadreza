export const EXECUTION_STANDARD = Object.freeze({
  version: "2.2.0",
  status: "LOCKED",
  control_plane: "CLOUDFLARE",
  local_pc_dependency: false,
  required_preflight: true,
  fail_closed_on_standard_mismatch: true,
  source_of_truth: ["GitHub SOT", "Cloudflare D1 control-plane manifest"],
  runtime_dependencies: ["Cloudflare Workers", "Cloudflare D1", "Cloudflare Queues", "Workers AI"],
  dormant_capabilities: ["Cloudflare Cron", "periodic scheduler", "automatic Watchdog", "continuous heartbeat loop", "periodic reconciliation", "automatic recovery loop"],
  forbidden_runtime_dependencies: ["Local PC", "PowerShell", "Desktop Commander", "Wrangler CLI", "Codex", "Arena"],
  financial_or_irreversible_autonomy: false
});

export const EXECUTION_STANDARD_ID = "SOT-ARCH-CLOUDFLARE-CORE-002";

export function validateExecutionStandard({ env = {}, sourceVersion = EXECUTION_STANDARD.version } = {}) {
  const configured = String(env.SIMOT_EXECUTION_STANDARD_VERSION ?? EXECUTION_STANDARD.version);
  if (sourceVersion !== EXECUTION_STANDARD.version) {
    throw new Error("EXECUTION_STANDARD_CODE_MISMATCH");
  }
  if (configured !== EXECUTION_STANDARD.version) {
    throw new Error("EXECUTION_STANDARD_VERSION_MISMATCH");
  }
  if (EXECUTION_STANDARD.control_plane !== "CLOUDFLARE") {
    throw new Error("INVALID_CONTROL_PLANE");
  }
  if (EXECUTION_STANDARD.local_pc_dependency !== false) {
    throw new Error("LOCAL_PC_DEPENDENCY_FORBIDDEN");
  }
  return {
    ok: true,
    standard_id: EXECUTION_STANDARD_ID,
    version: EXECUTION_STANDARD.version,
    control_plane: EXECUTION_STANDARD.control_plane,
    local_pc_dependency: false
  };
}

export function assertNoLocalRuntimeDependency(dependencies = []) {
  const forbidden = new Set(EXECUTION_STANDARD.forbidden_runtime_dependencies);
  const found = dependencies.filter((x) => forbidden.has(String(x)));
  if (found.length) throw new Error("FORBIDDEN_RUNTIME_DEPENDENCY:" + found.join(","));
  return true;
}
