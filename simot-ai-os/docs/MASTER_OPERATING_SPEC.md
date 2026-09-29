# SIMOT AI OS — Master Operating Specification

Version: 2.0.0
Status: CANONICAL_OPERATING_BASELINE
Effective: 2026-09-29
Repository: 651384/ahmadreza
Implementation branch: simot-ai-os/remove-automatic-watchdog
Runtime: simot-ai-os-gateway
Primary runtime: Cloudflare Workers

## 1. Mission

SIMOT AI OS is a cloud-native operating system for orchestrating AI workers, tools, state, verification, recovery, and business workflows.

The primary runtime/control plane is Cloudflare.

The architecture is provider-neutral, read-first, fail-closed, reference-first, and human-gated for high-risk or irreversible actions.

The system must be able to operate independently of a local development machine during normal runtime.

## 2. Core architecture

Human / AI interface
→ SIMOT-MASTER
→ objective decomposition and bounded routing
→ authority gate
→ task/event handoff
→ SIMOT-MSG v2.1
→ specialized workers SIMOT-AI-01..05
→ tool adapters / AI providers / external systems
→ verification
→ D1 runtime state + durable SOT references
→ write-back
→ next valid action

Cloudflare is the runtime foundation:

- Workers: gateway and runtime execution
- D1: runtime state, registry, task/event records and control-plane records
- Queues + DLQ: durable event/task transport and failure isolation
- Workers AI: cloud AI execution
- Observability: health, logs and evidence
- Durable execution/workflows: future long-running workloads when concretely required
- Scheduled execution: architectural capability only while the system is in BUILD phase

## 3. Build-phase operating mode

Current phase: BUILD / CONTROLLED MANUAL EXECUTION.

The system is being constructed and validated. There is currently no approved continuous business workload that requires periodic autonomous reconciliation.

Therefore:

- Cloudflare Cron is DORMANT / DISABLED.
- Automatic Watchdog is DORMANT / DISABLED.
- Periodic automatic checks are DORMANT / DISABLED.
- Automatic recovery triggered by periodic monitoring is DORMANT / DISABLED.
- Overnight or background autonomous mutation is FORBIDDEN unless explicitly enabled by a future human-approved change.
- Manual, webhook, queue, test and explicitly invoked execution remain available according to authority.
- Watchdog, heartbeat, stale detection and recovery remain architectural capabilities for a later OPERATE phase; they are not active runtime behavior now.

This separation is mandatory:

ARCHITECTURE CAPABILITY ≠ RUNTIME ACTIVATION.

## 4. Operating loop

For every executable task:

READ
→ RECONCILE
→ SELECT EXACTLY ONE NEXT VALID STEP
→ CHECK AUTHORITY
→ ACT
→ VERIFY
→ WRITE-BACK
→ RECHECK
→ CONTINUE

For failures:

FAILURE
→ EVIDENCE
→ ROOT_CAUSE
→ SAFE_CORRECTIVE_ACTION
→ RETRY_WHEN_SAFE
→ VALIDATION
→ WRITE-BACK
→ DONE or ESCALATE

Never claim completion without desired result, acceptance criteria, evidence and SOT write-back.

## 5. Source-of-truth hierarchy

1. Explicit human approval
2. Authoritative live runtime state
3. GitHub source / review / CI
4. Notion architecture / policy / decision records
5. Asana execution state
6. SharePoint / OneDrive persistent evidence
7. GitHub Issue #3 operational timeline
8. ChatGPT conversation context

Access-path failure is not source absence.

Conflicts must be preserved and explicitly classified; never silently merge contradictory records.

## 6. Message protocol

SIMOT-MSG v2.1 is mandatory.

Required envelope fields include:

MSG-ID, CORR-ID, REPLY-TO, THREAD-ID, FROM, TO, TYPE, PRIORITY, AUTHORITY, STATUS, SCOPE, SOT-REFS, TASK-REFS, RECORD-REFS, EXPECTED-ACTION, DEADLINE, CONFIDENTIALITY, PAYLOAD-FORMAT, PART, RESULT-STATUS, NEXT-ACTION, WRITE-BACK, ESCALATION, CONFIDENCE, VERIFICATION.

Rules:

- Reject incomplete envelopes.
- Reject invalid framing.
- Preserve correlation.
- Duplicate MSG-ID must not cause duplicate business execution.
- Receiving a message does not grant mutation authority.
- Large payloads use durable references where appropriate.
- Data and instructions remain distinct.

## 7. Authority model

Capability states are distinct:

TOOL EXISTS
≠ CONNECTED
≠ AUTHENTICATED
≠ AUTHORIZED
≠ EXECUTABLE

Every adapter must declare capability, authority, read-first behavior, idempotency, minimal-diff behavior, read-back verification and fail-closed behavior.

Human gate is mandatory for:

- production activation
- merge: automated after required CI, policy, review and validation checks pass
- secret insertion
- paid services/providers
- payments/banking
- contracts
- irreversible external actions
- gated external commercial communication
- security-policy changes unless explicitly authorized

## 8. Runtime state and memory

Runtime state:
Cloudflare D1.

Code and deployment definition:
GitHub.

Architecture/policy/decisions:
Notion and versioned repository documentation.

Evidence/document memory:
SharePoint / OneDrive.

Commercial SOT:
HubSpot when connected and authorized.

Execution/task SOT:
Asana or designated execution system.

Secrets:
approved runtime secret management only.

D1 is runtime state, not a substitute for all company knowledge.

## 9. Worker organization

Master:
SIMOT-MASTER

Workers:
- SIMOT-AI-01 — Research / Market Intelligence
- SIMOT-AI-02 — Import / Technical Trade Operations
- SIMOT-AI-03 — Marketing / Business Development
- SIMOT-AI-04 — Export / Commercial
- SIMOT-AI-05 — AI / Technology / Automation

Worker identity is independent of model/provider identity.

Routing uses domain + action + capability + authority + commitment gates.

## 10. Provider policy

Provider-neutral by architecture.

Default policy:
FREE_ONLY.

Selection order:
capability fit
→ free eligibility
→ reliability
→ latency
→ quota
→ secondary verification.

Never silently invoke a paid provider or expose sensitive data to an unauthorized provider.

Workers AI is a runtime capability, not an unconditional execution authority.

## 11. Queue and event architecture

Incoming event
→ envelope validation
→ idempotency check
→ D1 state/evidence
→ Queue
→ bounded worker execution
→ verification
→ result/write-back
→ registry/state update.

Queue failures use retry and DLQ policy.

Uncertain execution state must fail closed to prevent duplicate business actions.

## 12. Watchdog and recovery architecture

Watchdog is a DEFINED FUTURE CONTROL capability.

Future responsibilities:

- heartbeat
- health evaluation
- stale detection
- state validation
- failure detection
- recovery decision
- bounded recovery

Current runtime status:

WATCHDOG = DORMANT
HEARTBEAT LOOP = DORMANT
PERIODIC RECONCILIATION = DORMANT
AUTOMATIC RECOVERY LOOP = DORMANT

Activation requires a separate human-approved architecture/runtime change after a real continuous workload exists and its monitoring contract is defined.

## 13. Cloudflare deployment architecture

Preferred deployment path:

GitHub
→ Cloudflare Workers Builds
→ validation/build
→ Wrangler deploy
→ deployment evidence
→ health verification
→ active deployment

Workers Builds is the preferred native CI/CD path when its Git integration is verified. GitHub remains the code/change-control SOT. Cloudflare dashboard/account state must never be assumed from repository configuration alone.

Production activation remains subject to the project's human-gate policy. Normal merge is not a human gate; merge is a controlled CI/CD stage and may proceed automatically when all required checks and repository policies pass.

## 14. Security

- No secrets in source, chat or logs.
- Least privilege.
- Fail closed on uncertain authority.
- Never bypass security controls.
- Never modify Access/WAF/firewall/security policies without explicit authorization.
- Never overwrite uncertain state blindly.
- Preserve failure evidence.
- No destructive operation without authorization.

## 15. Capability registry

Connected-tool availability is recorded separately from account connection and authorization.

The registry must identify at least:

IDENTITY
CAPABILITY
CONNECTION
AUTHENTICATION
AUTHORITY
EXECUTION_STATE
VERIFICATION_STATE

Missing direct Cloudflare Management Connector is an access gap, not proof that Cloudflare resources do not exist.

## 16. Business autonomy

Infrastructure autonomy and business autonomy are separate.

Current target state:

INFRASTRUCTURE AUTONOMY = CLOUD-NATIVE / CONTROLLED
BUSINESS AUTONOMY = PARTIAL

Business autonomy is expanded only through concrete task definitions, durable state, worker specialization, verified adapters, bounded authority and acceptance criteria.

## 17. Current engineering priorities

P0 — stabilize and verify Cloudflare Core and Git-connected deployment path.
P1 — durable business task model and bounded orchestrator.
P2 — persistent business SOT and memory integration.
P3 — worker specialization and routing.
P4 — verified external adapters and secrets.
P5 — observability and operational dashboard.
P6 — business automation.
P7 — future continuous monitoring / watchdog activation when justified.

Peripheral integrations must not displace Core stabilization.

## 18. Continuation protocol

Every new session:

1. Read this specification.
2. Read continuation state.
3. Read latest GitHub state.
4. Identify authoritative SOT for the current task.
5. Inspect live runtime when relevant.
6. Reconcile conflicts.
7. Select exactly one next valid step.
8. Check authority.
9. Execute.
10. Verify.
11. Write back.
12. Continue when safely possible.
13. Report only meaningful verified results.

Do not restart from assumptions.

## 19. Golden rules

VERIFY FIRST.
EXTEND SECOND.
BREAK NOTHING.
DO NOT REBUILD WHAT ALREADY WORKS.
KEEP CLOUDFLARE AS THE CORE.
KEEP STATE PERSISTENT.
KEEP EXECUTION BOUNDED.
KEEP WATCHDOG DORMANT DURING BUILD PHASE.
KEEP THE HUMAN IN CONTROL OF HIGH-RISK AND IRREVERSIBLE ACTIONS.
DO THE WORK.
