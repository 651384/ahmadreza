# Canonical Memory Access Contract — Revision 29

## Purpose
Keep one unambiguous boundary for every logical read or write of VPS Master Memory. The React Flow graph is a target architecture, not evidence that these paths are implemented or healthy.

## Canonical paths
- Context read: `orchestration → context-assembler → simot-master-api → master-memory`.
- Canonical state read: `simot-master-api → master-memory`, read-only for callers that only need context.
- Result/evidence write: `result-assembler → simot-master-api → canonical-memory-write-guard → master-memory`.
- Audit persistence: `audit-ledger → simot-master-api → canonical-memory-write-guard → master-memory`, when the canonical record requires an audit write.
- Evidence/task record persistence: `evidence-contract → simot-master-api → canonical-memory-write-guard → master-memory`.

## Prohibited architecture shortcuts
- No direct `simot-core → master-memory` edge.
- No direct `simot-core → simot-master-api` shortcut that bypasses context assembly or result assembly.
- No unguarded API-to-storage write path.
- Audit and evidence records must not write directly to the storage node.
- The VPS hosting relationship is topology, not an application-level read/write path.

## Write guard requirements
Before mutation, validate schema and caller identity; enforce scope and policy; detect stale state/version; apply idempotency; require human approval for sensitive mutations; redact secrets from audit output; and return explicit success/failure evidence. Unknown, stale, expired, or ambiguous authorization fails closed.

## Status and verification
All paths introduced or clarified here remain `PLANNED` until supported by implementation and runtime evidence. This revision changes the graph/document contract only. It does not change the VPS API, Worker, D1, queues, service configuration, or production deployment.
