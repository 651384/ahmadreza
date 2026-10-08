# SIMOT AI OS — Canonical Continuity Contract

Standard ID: SIMOT-CANONICAL-001
Version: 3.0.0
Status: LOCKED / CANONICAL
Effective: 2026-10-08

This file is the ONE operating standard for SIMOT. No other document may act as a competing standard.

## Authority
1. Current explicit human instruction.
2. Verified canonical Master Memory current state.
3. Locked decisions.
4. Verified live runtime evidence.
5. GitHub code/version history.
6. Supporting evidence/documents.
7. Chat history.

Lower sources never silently override higher sources.

## Canonical continuity memory
Live canonical path: /srv/simot-memory/
Required files: CURRENT_STATE.json, DECISIONS.json, EVIDENCE_INDEX.json, TASK_LOG.jsonl, CONTINUITY_CONTRACT.md.
The repository continuity/ directory is the versioned installation package, not a second live memory.
D1 is runtime/application state, not project-continuity SOT. ChatGPT memory/history is never project SOT.
Notion, SharePoint/OneDrive, Asana, HubSpot and GitHub have supporting roles; they are not alternate current-position memories.

## Mandatory boot
LOAD -> VALIDATE -> RECONCILE -> SELECT ONE NEXT STEP -> EXECUTE -> VERIFY -> RECORD -> CONTINUE

Every new session must read CURRENT_STATE, relevant locked decisions and necessary evidence before execution. Missing, stale or contradictory state means STOP; never guess.

The session must be able to state: current objective, current phase, last verified position, last completed task, blocker, exactly one next action, and do-not-do constraints.

## One-step execution
There is exactly one active next step. No competing parallel task path may change project direction, state, architecture or authority.

Every task follows:
UNDERSTAND -> RECONCILE -> PLAN -> EXECUTE -> TEST -> VERIFY -> RECORD IMMEDIATELY -> CONTINUE

## Immediate write-back
After every meaningful task, including failure or blocker:
1. append TASK_LOG;
2. update EVIDENCE_INDEX;
3. update CURRENT_STATE;
4. verify the written state.

NO VERIFIED WRITE-BACK = NOT DONE.
Do not wait for chat capacity, session end, or a milestone.

## Locked architecture
- SIMOT is the canonical brain.
- Client/interface is replaceable.
- No custom mobile app while a suitable client exists.
- OpenClaw is a client/interface, not a second brain.
- No paid API/service/provider without explicit approval.
- No new secret/credential without explicit approval.
- Human gate is required for production activation, destructive deletion, payment/KYC, security-policy changes and irreversible external actions.
- Cron, Watchdog, heartbeat, periodic reconciliation and automatic recovery remain DORMANT during BUILD unless separately approved as a new change.

## Runtime architecture
Human / Client -> SIMOT-MASTER -> authority gate -> bounded worker/tool execution -> verification -> write-back.
Active runtime: Cloudflare Worker gateway, D1, Queue + DLQ, Workers AI, health/verification.
GitHub is code/change control.
Local PC is not a runtime dependency.
VPS is infrastructure/bridge only; it is not a competing control plane or SOT.

## Automation policy
Current phase: BUILD / CONTROLLED MANUAL EXECUTION.
Dormant: Cron, periodic scheduler, automatic Watchdog, continuous heartbeat, periodic reconciliation, automatic recovery loop, background autonomous mutation.
A dormant capability may not become active through inference, old configuration or undocumented code.
Future activation requires a separate human-approved change with scope, monitoring contract, failure definition, allowed recovery, tests, runtime read-back and write-back.

## Authority model
EXISTS != CONNECTED != AUTHENTICATED != AUTHORIZED != EXECUTABLE.
Fail closed on missing standard, standard mismatch, missing/contradictory state, uncertain authorization or uncertain execution.

## Completion integrity
Never report DONE without desired result + acceptance criteria + verification evidence + durable write-back.
If any element is missing, status is BLOCKED or UNVERIFIED as appropriate.

## Cleanup rule
When duplicate or obsolete instructions are found:
1. identify the conflict;
2. use this contract as authority;
3. migrate useful facts into canonical records;
4. remove or explicitly retire the obsolete artifact;
5. verify references;
6. record the cleanup task immediately.

Two active standards are forbidden.

## Current continuity project
Project: SIMOT-CONTINUITY-001
Objective: make continuation deterministic across new chats, sessions and interfaces.
Current blocker: canonical Master Memory installation on VPS requires an already-authorized VPS write path.
Next permitted action: install/reconcile the repository continuity package at /srv/simot-memory/ using an existing authorized VPS path. Do not create a new credential.

## Golden invariants
ONE STANDARD
ONE CURRENT STATE
ONE CANONICAL CONTINUITY MEMORY
ONE ACTIVE NEXT STEP
IMMEDIATE WRITE-BACK
VERIFY BEFORE DONE
FAIL CLOSED ON UNCERTAINTY
NO SILENT SCOPE CHANGE
NO PARALLEL COMPETING PATHS
