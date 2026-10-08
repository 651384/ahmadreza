# SIMOT Continuity Contract v1

## Purpose
Prevent loss of project direction across ChatGPT chats, VPS sessions, OpenClaw sessions, model changes, restarts, and outages.

## Authority
- CURRENT_STATE.json is the canonical current-position authority.
- DECISIONS.json is the authority for locked architectural/product decisions.
- EVIDENCE_INDEX.json records verifiable evidence.
- TASK_LOG.jsonl records completed tasks immediately after verification.
- Chat history and ChatGPT memory are not project-state authorities.

## Mandatory boot
1. Read CURRENT_STATE.json.
2. Validate state_version and state_status.
3. Read DECISIONS.json when architecture/scope is involved.
4. Read only evidence required for the current task.
5. Reconcile the current position.
6. State CURRENT OBJECTIVE, LAST VERIFIED, BLOCKER, NEXT ACTION, and DO NOT DO before execution.
7. Do not execute if CURRENT_STATE is missing, invalid, stale beyond the defined policy, or contradictory; repair/reconcile state first.

## Mandatory execution rule
Every meaningful task must be:
UNDERSTAND -> RECONCILE -> PLAN -> EXECUTE -> TEST -> VERIFY -> RECORD -> CONTINUE.

After VERIFY, immediately append a TASK_LOG entry and update CURRENT_STATE before starting the next task.

## Scope lock
A session must not silently change project, objective, architecture, or constraints. A scope change requires an explicit user decision and a state update.

## Decision lock
A decision marked LOCKED must not be reopened unless the user explicitly asks for an architecture/decision review.

## Human gates
No production activation, deletion, store/KYC/payment activation, new secret, new cost, or merge-to-master without explicit user approval.

## Continuity invariant
NO CURRENT_STATE = NO EXECUTION.
NO VERIFIED WRITE-BACK = NOT DONE.

## Current architecture baseline
SIMOT is the brain/orchestration system.
The user-facing client is replaceable.
OpenClaw is a candidate/primary client, not the brain.
Jarvis is not a separate autonomous brain; if retained, it is an assistant identity/persona/client layer.
