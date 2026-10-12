# Operational Authority & Rollback Gate — Revision 35

## Purpose
Make authority and approval paths explicit for operational-mode transitions, deployment trust-boundary changes, and graph rollback.

## Contracts
- The human operator explicitly authorizes scoped operational-mode transitions. Sensitive or execution-capable modes never activate by inference.
- The policy engine governs deployment trust boundaries. Changes that expose services publicly, alter private access, or change infrastructure require explicit human approval.
- Graph rollback is a controlled change, not an automatic response. The approval gate authorizes a scoped rollback only after reviewing the proposed diff and preserving the current revision and evidence.
- The change/release gate applies to graph restore/revert actions; no merge to master or production change is implied.
- Approval requests must be explicit and scoped. Missing, ambiguous, stale, or denied approval means do not execute.
- The human operator remains the decision authority; the UI can propose and display but cannot manufacture approval.

## Status
All revision 35 edges are `PLANNED`. This is an architecture contract only. It does not assert that mode switching, approval enforcement, rollback, or deployment-boundary enforcement is implemented or runtime-verified.
