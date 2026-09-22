import { validateToolAdapter } from "./tool-adapter-contract.js";

const ADAPTERS = Object.freeze([
  {
    ref: "ONEDRIVE",
    connector: "mcp__Microsoft_SharePoint__",
    system: "ONEDRIVE",
    operations: [
      "search_drive_items",
      "list_drive_item_children",
      "get_drive_item",
      "list_item_versions"
    ],
    mode: "READ",
    authority: "INFORMATIONAL",
    reference_first: true,
    supports_idempotency: false,
    supports_readback: true
  },
  {
    ref: "NOTION",
    connector: "mcp__Notion__",
    system: "NOTION",
    operations: ["search", "fetch"],
    mode: "READ",
    authority: "INFORMATIONAL",
    reference_first: true,
    supports_idempotency: false,
    supports_readback: true
  },
  {
    ref: "EXA",
    connector: "mcp__Exa__",
    system: "EXA",
    operations: ["web_search_exa", "web_fetch_exa"],
    mode: "READ",
    authority: "INFORMATIONAL",
    reference_first: false,
    supports_idempotency: false,
    supports_readback: true
  },
  {
    ref: "HUBSPOT",
    connector: "mcp__HubSpot__",
    system: "HUBSPOT",
    operations: ["search_crm_objects", "get_crm_objects", "get_properties"],
    mode: "READ",
    authority: "INFORMATIONAL",
    reference_first: true,
    supports_idempotency: false,
    supports_readback: true
  },
  {
    ref: "ASANA",
    connector: "mcp__Asana__",
    system: "ASANA",
    operations: ["search_tasks", "get_task", "get_project", "get_projects"],
    mode: "READ",
    authority: "INFORMATIONAL",
    reference_first: true,
    supports_idempotency: false,
    supports_readback: true
  },
  {
    ref: "CANVA",
    connector: "mcp__Canva__",
    system: "CANVA",
    operations: ["search", "fetch", "get_design", "get_design_content"],
    mode: "READ",
    authority: "INFORMATIONAL",
    reference_first: true,
    supports_idempotency: false,
    supports_readback: true
  },
  {
    ref: "DESCRIPT",
    connector: "mcp__Descript__",
    system: "DESCRIPT",
    operations: ["list_projects", "get_project", "list_jobs"],
    mode: "READ",
    authority: "INFORMATIONAL",
    reference_first: true,
    supports_idempotency: false,
    supports_readback: true
  },
  {
    ref: "HEYGEN",
    connector: "mcp__HeyGen__",
    system: "HEYGEN",
    operations: ["list_videos", "get_video", "list_assets", "get_asset"],
    mode: "READ",
    authority: "INFORMATIONAL",
    reference_first: true,
    supports_idempotency: false,
    supports_readback: true
  },
  {
    ref: "GITHUB",
    connector: "mcp__GitHub__",
    system: "GITHUB",
    operations: ["fetch", "fetch_file", "fetch_commit_workflow_runs", "get_pr_info"],
    mode: "READ",
    authority: "INFORMATIONAL",
    reference_first: true,
    supports_idempotency: false,
    supports_readback: true
  }
]);

export function listToolAdapters() {
  return ADAPTERS.map(adapter => ({ ...adapter, operations: [...adapter.operations] }));
}

export function getToolAdapter(ref) {
  const key = String(ref ?? "").trim().toUpperCase();
  return ADAPTERS.find(adapter => adapter.ref === key) ?? null;
}

export function validateToolAdapterRegistry() {
  return ADAPTERS.map(adapter => {
    const check = validateToolAdapter(adapter);
    return { ref: adapter.ref, ...check };
  });
}

export const TOOL_ADAPTER_REGISTRY_CONTRACT = Object.freeze({
  purpose: "explicit registry of connected tool capabilities",
  principle: "registry describes verified connector capabilities; it does not grant authority",
  default_mode: "READ",
  default_authority: "INFORMATIONAL",
  fail_closed: true,
  reference_first: true,
  write_activation_requires_separate_gate: true
});
