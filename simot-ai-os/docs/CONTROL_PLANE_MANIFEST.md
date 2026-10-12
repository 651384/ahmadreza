# SIMOT AI OS — Cloud Control Plane Manifest

Manifest version: 2.2.0
Phase: BUILD / CONTROLLED MANUAL EXECUTION

The runtime control plane preserves the following invariants.

## Active control-plane components

- Cloudflare Worker gateway
- Cloudflare D1 runtime state
- Cloudflare Queue + DLQ
- Workers AI
- health/status and verification paths
- existing VPC service path to VPS Master Memory, with current availability assessed from evidence
- GitHub as versioned source/change-control SOT

## Canonical Master Memory

VPS Master Memory is the canonical operational-continuity record for SIMOT. The existing service and five-file continuity package are hosted under `/srv/simot-memory/` on the VPS.

Cloudflare Worker integration uses the existing `SIMOT_MASTER_MEMORY` VPC binding targeting `simot-master-memory`, with the existing `SIMOT_MASTER_MEMORY_TOKEN` secret. Cloudflare D1 remains the runtime/control-plane state store; it must not replace or become a competing canonical Master Memory.

Microsoft SharePoint/OneDrive provide supporting documents and evidence. Notion provides architecture, policy, and structured decisions. Neither replaces VPS Master Memory for current operational continuity.

The previous repository description of `MASTER_MEMORY_NOT_AVAILABLE` and canonical OneDrive/SharePoint memory is superseded. Keep resource existence, connectivity, authentication, authorization, read success, write success, and E2E readback as distinct evidence claims.

## Dormant control capabilities

The following are architectural capabilities but MUST NOT execute automatically during BUILD phase:

- Cron triggers
- periodic scheduler
- automatic Watchdog
- continuous heartbeat loop
- periodic reconciliation
- automatic recovery loop

Activation of any dormant capability requires a separate human-approved change.

## Mandatory execution principles

1. Preflight before execution.
2. Reconcile authoritative state before mutation.
3. Select exactly one next valid step.
4. Check authority before action.
5. Verify result from source of truth.
6. Write back durable evidence.
7. Fail closed on uncertainty.
8. Never report DONE without acceptance and evidence.
9. Never infer connection or authorization from tool existence.
10. Preserve human gates for production activation, secrets, paid services, irreversible actions and security-policy changes; normal merge is controlled by CI/CD policy.

## SOT roles

- VPS Master Memory: canonical operational continuity and task/evidence write-back
- Cloudflare Workers: runtime orchestration and bounded execution
- Cloudflare D1: runtime state and control-plane records, not canonical Master Memory
- Cloudflare Queues / DLQ: durable runtime handoff and failed-message handling
- GitHub: code and versioned change control
- Notion: architecture/policy/decision knowledge
- SharePoint/OneDrive: supporting documents and evidence
- Asana: execution/task state when connected and authorized
- HubSpot: commercial SOT when connected and authorized
- ChatGPT memory/history: context only, not operational truth

## Connector and runtime boundary

A connected Cloudflare Management tool can inspect account resources from the management plane. That access does not imply that the deployed Worker can invoke arbitrary external connectors. Runtime connector execution requires its own adapter, credentials, authority checks, and evidence. Conversely, the absence of a generic connector adapter in the Worker is not evidence that Cloudflare resources do not exist.

## Future activation gate

Before enabling continuous monitoring, the system must define:

- real workload to monitor
- health signals
- stale threshold
- failure definition
- permitted recovery actions
- prohibited actions
- human gates
- test plan
- runtime read-back
- SOT write-back
