import { EXECUTION_STANDARD, EXECUTION_STANDARD_ID } from "./execution_standard.js";

export const CONTROL_PLANE_MANIFEST = Object.freeze({
  manifest_version: "1.0.0",
  standard_id: EXECUTION_STANDARD_ID,
  execution_standard: EXECUTION_STANDARD,
  instructions: [
    {
      id: "INST-001",
      name: "Preflight before every execution",
      rule: "The execution standard must be validated before scheduled, webhook, queue, or management work begins.",
      enforcement: "RUNTIME_GATE"
    },
    {
      id: "INST-002",
      name: "Cloud-only runtime",
      rule: "Local PC, PowerShell, Desktop Commander, Wrangler CLI, Codex, and Arena are not runtime dependencies.",
      enforcement: "RUNTIME_INVARIANT"
    },
    {
      id: "INST-003",
      name: "Fail closed",
      rule: "If the standard is missing, mismatched, or violated, execution stops and records a blocked state.",
      enforcement: "FAIL_CLOSED"
    },
    {
      id: "INST-004",
      name: "Cloudflare owns control plane",
      rule: "Cloudflare Worker + Cron + D1 + Queues are the authoritative runtime control plane.",
      enforcement: "ARCHITECTURE"
    },
    {
      id: "INST-005",
      name: "No false completion",
      rule: "An external action is never reported as completed without runtime evidence from the configured adapter.",
      enforcement: "WORKER_CONTRACT"
    }
  ],
  tools: [
    { id: "TOOL-001", name: "Cloudflare Workers", role: "runtime/control-plane" },
    { id: "TOOL-002", name: "Cloudflare D1", role: "state/source-of-runtime-record" },
    { id: "TOOL-003", name: "Cloudflare Queues", role: "durable-work-handoff" },
    { id: "TOOL-004", name: "Cloudflare Cron", role: "autonomous-scheduling/watchdog" },
    { id: "TOOL-005", name: "Workers AI", role: "cloud-worker-execution" },
    { id: "TOOL-006", name: "GitHub", role: "source-of-truth/versioned-change-control" }
  ],
  projects: [
    { id: "PROJECT-001", name: "SIMOT AI OS", status: "ACTIVE", control_plane: "CLOUDFLARE" },
    { id: "PROJECT-002", name: "SIMOT Digital Catalog", status: "CONTROLLED", execution_dependency: "NONE" }
  ],
  architecture_components: [
    { id: "ARCH-001", name: "Master Memory", status: "LOCKED" },
    { id: "ARCH-002", name: "Data Governance v2.0", status: "LOCKED" },
    { id: "ARCH-003", name: "Source of Truth", status: "LOCKED" },
    { id: "ARCH-004", name: "Integration/Handoff Architecture v2.0", status: "LOCKED" },
    { id: "ARCH-005", name: "SIMOT-MSG v2", status: "LOCKED" },
    { id: "ARCH-006", name: "Watchdog + Cloud Controller", status: "ACTIVE" }
  ],
  system_scope: {
    org_processes: 71,
    main_data_entities: 34,
    data_elements: 40,
    controls_and_risks: 15,
    end_to_end_value_chains: 12
  },
  workstreams: [
    { id: "WS-001", name: "Cloudflare control-plane completion", priority: "CRITICAL", status: "ACTIVE" },
    { id: "WS-002", name: "Autonomous watchdog/recovery", priority: "CRITICAL", status: "ACTIVE" },
    { id: "WS-003", name: "Worker activation and routing", priority: "HIGH", status: "ACTIVE" },
    { id: "WS-004", name: "External connector adapters", priority: "CONTROLLED", status: "NOT_LIVE" },
    { id: "WS-005", name: "SIMOT Digital Catalog", priority: "CONTROLLED", status: "IN_PROGRESS" }
  ]
});

export function manifestRows() {
  return [
    ["EXECUTION_STANDARD", EXECUTION_STANDARD_ID, JSON.stringify(EXECUTION_STANDARD)],
    ["CONTROL_PLANE_MANIFEST", CONTROL_PLANE_MANIFEST.manifest_version, JSON.stringify(CONTROL_PLANE_MANIFEST)]
  ];
}
