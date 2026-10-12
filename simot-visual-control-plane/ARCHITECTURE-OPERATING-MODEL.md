# SIMOT AI OS — Architecture Operating Model

**Scope:** Companion reference for the React Flow architecture graph.  
**Graph:** `simot-core-overview`, schema version 1, revision 31.  
**Current graph size:** 73 nodes, 163 edges.  
**Branch:** `feat/simot-visual-control-plane-react-flow`.

> This document describes the target architecture. A graph node or edge is not proof that a component is deployed, connected, healthy, or verified. Status must be supported by current evidence.

## 1. Canonical roles and source-of-truth policy

- **SIMOT AI OS / SIMOT Core:** orchestration and operational decision core.
- **VPS Master Memory:** canonical operational continuity record, including current state, decisions, evidence index, task log, and continuity contract.
- **Cloudflare runtime:** Worker Gateway, SIMOT-MASTER/VPC service binding, D1, Queues/DLQ, and AI Workers where actually configured. Runtime evidence must come from the corresponding live component.
- **GitHub:** source code and version history.
- **Notion:** architecture and policy documentation.
- **SharePoint / OneDrive:** documents and evidence artifacts.
- **Asana:** task execution records.
- **HubSpot:** CRM records.
- **React Flow VCP:** visualization and controlled operator surface, not a source of canonical operational state.
- **OpenClaw:** client/interface and bridge, not a separate brain.
- **ChatGPT conversation context:** temporary context only, never the canonical operational record.

The source-of-truth policy must be applied when assembling context and coordinated with data governance. Conflicts about operational state resolve to VPS Master Memory; each other system remains authoritative only for its assigned data domain.

## 2. Request-to-result flow

1. **Client Channel Adapters** represent desktop/web, Android/OpenClaw, text/voice, and file/image/document channels; each channel remains a client, not a separate brain. OpenClaw forwards client requests through this layer.
2. **Request ingress** validates the request and builds the standard envelope.
3. **SIMOT message envelope** carries correlation/reply identifiers and part sequencing where required.
4. **Orchestration** coordinates the task lifecycle.
5. **Context & Memory Assembler** retrieves relevant canonical state and scoped records through the appropriate adapters, applying source-of-truth, classification, retention, and permission policies.
6. **Planner** produces steps and expected outcomes.
7. **Task Lifecycle** governs allowed state transitions.
8. **Executor** invokes registered tools/adapters under least privilege.
9. **Policy Engine** checks permissions, classification, model/cost policy, and whether human approval is required.
10. **Retry / Idempotency** controls safe retries and duplicate effects.
11. **Result Assembler** prepares output and evidence; audit records are routed to the canonical record where appropriate.
12. **Response Delivery** returns the result through Client Channel Adapters to the requesting interface, preserving request correlation.
13. **Failure Handler** classifies terminal failures, routes them to DLQ when configured, and escalates decisions to a human.

This is a target flow, not a claim that every stage is implemented or live.

## 3. Runtime and integration boundaries

- The Worker Gateway is the public-facing cloud entry point only where routes are configured and authorized.
- The VPC/service binding separates the gateway from the VPS-hosted Master Memory API.
- D1 and queues are runtime components, not substitutes for the canonical VPS continuity package.
- Connector adapters provide scoped access to GitHub, Notion, SharePoint/OneDrive, Asana, and HubSpot.
- Model Router selects only permitted providers/models under the model-cost policy. A provider shown in the graph may be blocked or untested.
- OpenClaw and phone clients communicate with SIMOT as clients; they do not own canonical memory.
- Tailscale provides the intended private path for the VCP and VPS interfaces. Do not expose the control plane publicly merely to simplify access.

## 4. Security, governance, and change control

- **Identity & Access Boundary:** distinguish user and service identities; use least privilege.
- **Secrets Boundary:** secret values must not appear in graph data, logs, or ordinary reports. Document binding names and trust boundaries only.
- **Human Approval Gate:** required for sensitive memory writes, secret changes, merge/release, production activation, or cost-bearing changes.
- **Human operator/owner:** the explicit decision actor for approvals and escalations; approval is bound to a verified actor, action, scope, version, expiry, and outcome. Approval never bypasses policy or connector permissions. This is a target contract, not an implemented approval UI.
- **Canonical memory access:** the logical core reads/writes only through the Master Memory API. Context reads use `context-assembler → simot-master-api`; result writes use `result-assembler → simot-master-api → canonical-memory-write-guard`. No direct core-to-storage path is modeled. This is a target architecture, not proof of a live route.
- **Queue consumer:** asynchronous deliveries must update task lifecycle state, deduplicate redelivery through idempotency controls, and route terminal failures through the failure handler/DLQ policy. The direct gateway-to-worker path and queued path are distinct modes; dispatch selection must prevent accidental duplicate execution. These are planned contracts, not verified runtime behavior.
- **Audit Ledger:** capture actor, action, outcome, evidence reference, and before/after state for sensitive operations without recording secret values.
- **Data Governance / Classification:** define permitted handling and retention for each data category.
- **Change & Release Gate:** keep changes on a feature branch, review diffs, and require explicit approval before merge or production release.
- **Monitoring:** unknown status must never be represented as healthy; statuses need current evidence and timestamps.

These are architecture requirements; the graph alone does not enforce them.

## 5. Continuity and task protocol

The operational workflow is:

`UNDERSTAND → RECONCILE → PLAN → EXECUTE → TEST → VERIFY → RECORD → CONTINUE`

For this architecture-building phase, implementation of the graph comes first. Tests and verification are intentionally deferred until the user confirms the architecture is complete. Once that gate is passed, reconcile the graph with real runtime and connector evidence before changing any status from PLANNED / NOT TESTED.

The VPS Master Memory package remains the continuity source: `CONTINUITY_CONTRACT.md`, `CURRENT_STATE.json`, `DECISIONS.json`, `EVIDENCE_INDEX.json`, and `TASK_LOG.jsonl`.

## 6. Current phase and boundaries

- Graph revision 31 contains 73 nodes and 163 edges.
- The source-of-truth policy is connected to Master Memory, documents, code, UI, Notion, Asana, HubSpot, Cloudflare runtime evidence, context assembly, and data governance.
- Release governance is linked to policy; monitoring is linked to failure handling; task lifecycle is linked to terminal result assembly.
- `ARCHITECTURE.md`, this operating model, and `ARCHITECTURE-INDEX.md` are intended to describe the same graph revision; update their revision/count metadata together when the graph changes.
- No tests, build checks, runtime calls, production deploy, or merge are part of this phase.
- Do not mark conceptual components VERIFIED without fresh evidence from their actual source.


## Canonical memory access refinement (revision 29)

- Context reads: `orchestration → context-assembler → simot-master-api → master-memory`.
- Writes: `result-assembler` / `evidence-contract` / `audit-ledger → simot-master-api → canonical-memory-write-guard → master-memory` as applicable.
- `simot-core` does not directly call the memory API or storage; context and results use their dedicated assembly stages.
- The API-to-storage read edge is read-only. All mutations pass through the write guard. Hosting topology is not an application data-flow edge.
- Every route remains `PLANNED` until implementation and runtime evidence are reconciled after the architecture-completion gate.


## User-supplied artifact handling (revision 30)

File/image/document requests are distinct from text-only requests. The target route is `client-channel-adapters → artifact-intake → content-extractor → request-ingress`. Intake validates type/signature/size and records an artifact reference; extraction is limited to permitted existing capabilities. Raw content and extracted instructions remain untrusted, are subject to data classification, and must not override policy or approval. Do not assume malware scanning, OCR, storage, or external model access exists until separately evidenced. All paths are planned only.


## Canonical continuity backup and recovery (revision 31)

Backup/recovery policy applies to the existing VPS Master Memory package only; it must not create a parallel source of truth. Backup freshness and integrity require evidence. Restore is never automatic: obtain owner approval, preserve current state where feasible, validate all five files and cross-file consistency, and record the outcome. The architecture does not claim a backup or restore path is currently implemented.
