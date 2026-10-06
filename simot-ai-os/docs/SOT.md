# SIMOT AI OS — Source of Truth

## Locked architecture

- ID: `SOT-ARCH-CLOUDFLARE-CORE-002`
- Version: `2.2.0`
- Phase: BUILD / CONTROLLED MANUAL EXECUTION
- Status: LOCKED
- Control plane: CLOUDFLARE
- Local PC dependency: FALSE

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

Active:
- Cloudflare Workers
- Cloudflare D1
- Cloudflare Queues / DLQ
- Workers AI
- runtime observability

Dormant during BUILD:
- Cloudflare Cron
- periodic scheduler
- automatic Watchdog
- continuous heartbeat loop
- periodic reconciliation
- automatic recovery loop

No dormant capability may be reactivated implicitly.

## Source-of-truth roles

- GitHub: versioned code and change control
- Cloudflare D1: runtime state and control-plane records
- Notion: canonical structured policy/decision knowledge
- Microsoft OneDrive/SharePoint: canonical durable file/evidence memory
- Asana: task execution state when connected
- HubSpot: commercial SOT when connected and authorized

## Master Memory boundary

D1 MUST NOT replace canonical Master Memory.

The runtime's reference-first memory contracts define the intended pattern:
- store/transport memory references and metadata first;
- retrieve canonical content on demand through an authorized Memory Retrieval Layer;
- keep connector credentials outside source code;
- fail closed when canonical memory cannot be retrieved or verified.

Current state: `MASTER_MEMORY_NOT_AVAILABLE`.

The canonical OneDrive structure `SIMOT-AI-OS/MEMORY/{INDEX,INPUTS,EVIDENCE,OUTPUTS}` exists, but the current verified contents do not constitute a complete machine-readable SOT index. No live Worker-side OneDrive/SharePoint retrieval adapter is connected.

## Change and authority rule

High-risk, irreversible, paid, secret, production, and security-policy operations require the applicable human gate. Activation of dormant Cron/Watchdog/recovery loops requires a separate approved change with evidence and runtime read-back.

## Completion integrity

No action is DONE without:
desired result
+ acceptance
+ evidence
+ SOT write-back.
