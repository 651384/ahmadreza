import { EXECUTION_STANDARD, EXECUTION_STANDARD_ID } from "./execution_standard.js";

export const CONTROL_PLANE_MANIFEST = Object.freeze({
  manifest_version: "2.0.0",
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
  ],
  registry_meta: {
    org_processes: { count: 71, status: "REGISTRY_REQUIRED", source: "SOT" },
    main_data_entities: { count: 34, status: "REGISTRY_REQUIRED", source: "SOT" },
    data_elements: { count: 40, status: "REGISTRY_REQUIRED", source: "SOT" },
    controls_and_risks: { count: 15, status: "REGISTRY_REQUIRED", source: "SOT" },
    value_chains: { count: 12, status: "REGISTRY_REQUIRED", source: "SOT" }
  },
  task_registry: [
    { id: "TASK-001", name: "تکمیل حاکمیت Cloudflare به‌عنوان هسته مرکزی", priority: "CRITICAL", domain: "CONTROL_PLANE", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-002", name: "بارگذاری کامل SOT، استانداردها، دستورالعمل‌ها و معماری در Cloudflare", priority: "CRITICAL", domain: "CONTROL_PLANE", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-003", name: "اتصال کامل Master Memory به Cloudflare D1", priority: "CRITICAL", domain: "MASTER_MEMORY", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-004", name: "تکمیل رجیستری ۷۱ فرایند سازمانی", priority: "HIGH", domain: "GOVERNANCE", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-005", name: "تکمیل رجیستری ۳۴ موجودیت داده", priority: "HIGH", domain: "GOVERNANCE", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-006", name: "تکمیل رجیستری ۴۰ عنصر داده", priority: "HIGH", domain: "GOVERNANCE", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-007", name: "تکمیل رجیستری ۱۵ کنترل و ریسک", priority: "HIGH", domain: "GOVERNANCE", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-008", name: "تکمیل ۱۲ زنجیره ارزش", priority: "HIGH", domain: "VALUE_CHAIN", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-009", name: "اجرای اجباری Preflight قبل از هر عملیات", priority: "CRITICAL", domain: "RUNTIME", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-010", name: "تکمیل Fail-Closed و Self-Recovery", priority: "CRITICAL", domain: "RECOVERY", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-011", name: "تکمیل Watchdog مستقل و مداوم", priority: "CRITICAL", domain: "WATCHDOG", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-012", name: "فعال‌سازی کامل Workerهای SIMOT-AI", priority: "HIGH", domain: "WORKERS", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-013", name: "تکمیل مسیریابی و هماهنگی بین Workerها", priority: "HIGH", domain: "WORKERS", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-014", name: "تکمیل صف‌ها، DLQ و مدیریت Retry", priority: "HIGH", domain: "QUEUES", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-015", name: "تکمیل ثبت رویدادها و Audit Trail در D1", priority: "HIGH", domain: "AUDIT", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-016", name: "تکمیل کنترل Idempotency و جلوگیری از اجرای تکراری", priority: "HIGH", domain: "RELIABILITY", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-017", name: "تکمیل اتصال Workers AI به فرآیندهای عملیاتی", priority: "HIGH", domain: "AI", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-018", name: "تکمیل مدیریت Secrets و Credentials در Cloudflare", priority: "CRITICAL", domain: "SECURITY", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-019", name: "تکمیل اتصال و هماهنگی GitHub با Control Plane", priority: "HIGH", domain: "GITHUB", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-020", name: "تکمیل Adapterهای Notion / SharePoint / HubSpot", priority: "CONTROLLED", domain: "CONNECTORS", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-021", name: "تکمیل ارتباط با ابزارهای خارجی بدون وابستگی به Local PC", priority: "CRITICAL", domain: "CONNECTORS", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-022", name: "تکمیل اجرای خودکار Recovery در خطاها", priority: "CRITICAL", domain: "RECOVERY", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-023", name: "تکمیل سیستم تشخیص Blocker و حل خودکار", priority: "CRITICAL", domain: "RECOVERY", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-024", name: "تکمیل داشبورد وضعیت کل سیستم", priority: "MEDIUM", domain: "OBSERVABILITY", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-025", name: "تکمیل گزارش‌دهی و Handoff خودکار", priority: "HIGH", domain: "HANDOFF", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-026", name: "تکمیل تست فشار و تست خرابی", priority: "HIGH", domain: "TESTING", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-027", name: "تکمیل تست Recovery واقعی", priority: "CRITICAL", domain: "TESTING", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-028", name: "تکمیل تست End-to-End کل سیستم", priority: "CRITICAL", domain: "TESTING", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-029", name: "تکمیل پروژه Digital Catalog", priority: "CONTROLLED", domain: "PROJECT", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-030", name: "تکمیل اتصال پروژه‌ها و Workstreamها به Control Plane", priority: "HIGH", domain: "CONTROL_PLANE", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-031", name: "اجرای Audit نهایی کل SIMOT-AI OS", priority: "CRITICAL", domain: "AUDIT", status: "PENDING", execution: "AUTONOMOUS_TRACKED" },
    { id: "TASK-032", name: "فعال‌سازی حالت Autonomous کامل و پایدار", priority: "CRITICAL", domain: "AUTONOMY", status: "PENDING", execution: "AUTONOMOUS_TRACKED" }
  ]
});

export function manifestRows() {
  return [
    ["EXECUTION_STANDARD", EXECUTION_STANDARD_ID, JSON.stringify(EXECUTION_STANDARD)],
    ["CONTROL_PLANE_MANIFEST", CONTROL_PLANE_MANIFEST.manifest_version, JSON.stringify(CONTROL_PLANE_MANIFEST)]
  ];
}
