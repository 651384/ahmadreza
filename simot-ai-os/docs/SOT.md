# SIMOT AI OS — Source of Truth

## Locked architecture

- ID: `SOT-ARCH-CLOUDFLARE-CORE-002`
- Version: `2.2.0`
- Phase: BUILD / CONTROLLED MANUAL EXECUTION
- Status: LOCKED
- Control plane: CLOUDFLARE
- Local PC dependency: FALSE
- Canonical operational-continuity memory: VPS MASTER MEMORY

## Required execution order

1. Load/consult the Execution Standard.
2. Run mandatory preflight.
3. Reconcile authoritative state.
4. Select exactly one next valid step.
5. Check authority before action.
6. Execute only through an authorized runtime path.
7. Verify from source-of-truth/runtime evidence.
8. Write back durable evidence.
9. Recheck and continue.
10. Fail closed on uncertainty or standard mismatch.

## Runtime architecture

Active runtime components:
- Cloudflare Workers
- Cloudflare D1
- Cloudflare Queues / DLQ
- Workers AI
- runtime observability
- existing Cloudflare VPC path to the VPS Master Memory service, subject to evidence-backed availability checks

Dormant during BUILD:
- Cloudflare Cron
- periodic scheduler
- automatic Watchdog
- continuous heartbeat loop
- periodic reconciliation
- automatic recovery loop

No dormant capability may be reactivated implicitly.

## Source-of-truth roles

- **VPS Master Memory:** canonical operational continuity, current task position, durable operational evidence, and task write-back. Existing VPS root: `/srv/simot-memory/`; existing local API: `http://127.0.0.1:9100`.
- **Cloudflare Workers:** runtime orchestration/control plane and bounded worker execution.
- **Cloudflare D1:** runtime state, control-plane records, task/worker registry, usage guards, and audit events. D1 is not a replacement or competing canonical copy of VPS Master Memory.
- **Cloudflare Queues / DLQ:** durable runtime handoff and failed-message handling.
- **Notion:** architecture, policies, and structured decisions.
- **Microsoft SharePoint / OneDrive:** supporting documents, inputs, and evidence; not the canonical operational-continuity store.
- **GitHub:** versioned code and change control.
- **Asana:** execution/task state when connected and authorized.
- **HubSpot:** commercial/CRM source of truth when connected and authorized.
- **ChatGPT memory/history:** context only; never the operational source of truth.

## Master Memory boundary and integration

The canonical Master Memory is the existing VPS service, not OneDrive/SharePoint.

The Cloudflare Worker uses the existing VPC service binding `SIMOT_MASTER_MEMORY` targeting `simot-master-memory`, with the existing `SIMOT_MASTER_MEMORY_TOKEN` secret. The existing adapter uses the VPS service API through that binding; historical E2E write/readback evidence has been recorded.

The previous `MASTER_MEMORY_NOT_AVAILABLE` statement and the claim that canonical Master Memory must be retrieved from OneDrive/SharePoint are superseded and must not be used as the current architecture description.

Verification claims must remain distinct:
- resource/configuration exists;
- network path is available;
- request is authenticated and authorized;
- read succeeds;
- write succeeds;
- end-to-end write/readback matches.

Use the most recent evidence for each claim. A historical E2E result is useful evidence but does not, by itself, prove current endpoint health. Do not create a duplicate memory system or move canonical continuity into D1.

## Change and authority rule

High-risk, irreversible, paid, secret, production, and security-policy operations require the applicable human gate. Activation of dormant Cron/Watchdog/recovery loops requires a separate approved change with evidence and runtime read-back.

## Completion integrity

No action is DONE without:
desired result
+ acceptance
+ evidence
+ SOT write-back.
