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
- GitHub as versioned source/change-control SOT

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
10. Preserve human gates for production, secrets, paid services, irreversible actions and security-policy changes.

## SOT roles

- GitHub: code and versioned change control
- Cloudflare D1: runtime state and control-plane records
- Notion: architecture/policy/decision knowledge
- SharePoint/OneDrive: durable evidence/document memory
- Asana: execution/task state
- HubSpot: commercial SOT when connected and authorized

## Current infrastructure gap

No direct Cloudflare Management connector is available in the AI tool environment.

This is an access limitation, not evidence that the Cloudflare account or its resources do not exist.

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
