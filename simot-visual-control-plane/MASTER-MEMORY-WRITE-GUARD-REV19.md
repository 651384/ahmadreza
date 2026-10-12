# SIMOT AI OS — Canonical Master Memory Write Guard

**Graph revision:** 19  
**Graph size:** 69 nodes, 153 edges  
**Branch:** `feat/simot-visual-control-plane-react-flow`

## Purpose

All operational continuity remains in the existing VPS Master Memory. This policy does not introduce a second memory system, alternate database, or competing source of truth. The guard is a logical architecture layer between authorized API operations and the existing canonical files.

## Required write sequence

1. Authenticate the caller and authorize the requested operation.
2. Resolve the target canonical record/file and validate the expected schema.
3. Check whether the operation is read-only or a mutation.
4. Require explicit human approval for sensitive writes or changes that the project policy gates.
5. Check expected state/version to detect stale writes; do not silently overwrite newer canonical state.
6. Use task/correlation and idempotency identifiers where retries could duplicate a mutation.
7. Preserve required before/after context in redacted form; never log secret values.
8. Apply the mutation only through the existing authorized Master Memory API/path.
9. Return an explicit outcome; a timeout or missing response is not proof of success.
10. Record task/evidence references in the existing canonical continuity system.

## Canonical file responsibilities

- `CONTINUITY_CONTRACT.md`: contract for continuity and state transitions.
- `CURRENT_STATE.json`: current operational state and next unfinished task.
- `DECISIONS.json`: decisions and constraints.
- `EVIDENCE_INDEX.json`: index of evidence supporting claims and status.
- `TASK_LOG.jsonl`: append-oriented task execution record.

The exact write schema and concurrency guarantees must be reconciled with the existing API during the later verification phase; this architecture document does not claim that the API currently enforces every control listed above.

## VCP behavior

The VCP remains read-only for canonical state by default. Exporting a graph is a local file action, not a Master Memory write. A UI graph edit must not imply that VPS state was changed. Sensitive canonical writes, deletion, secret changes, production deployment, and merge-to-master require explicit approval.

## Current phase boundary

Revision 19 records the guard in the architecture graph. No canonical memory write, endpoint call, test, build, deployment, or permission change was performed in this update.
