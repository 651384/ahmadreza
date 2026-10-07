# SIMOT AI OS — Core Runtime State & Execution Route

Status: VERIFIED
Effective: 2026-10-07
Control Plane: CLOUDFLARE
Phase: BUILD / CONTROLLED MANUAL EXECUTION
Execution Standard: 2.2.0 (LOCKED)
SOT ID: SOT-ARCH-CLOUDFLARE-CORE-002
SOT Version: 2.2.0
SOT Status: LOCKED

## 1. Canonical execution route

OpenClaw mobile UI
→ Jarvis/OpenClaw bridge
→ SIMOT Cloudflare MCP gateway
→ SIMOT-MASTER
→ authority/capability routing
→ D1 runtime state + Master Memory read
→ specialized worker / configured adapter
→ execution
→ verification
→ mailbox result
→ Jarvis/OpenClaw
→ user

Verified E2E:
JARVIS_TO_SIMOT → SIMOT execution → SIMOT_TO_JARVIS = COMPLETED.

## 2. Runtime

Worker:
simot-ai-os-gateway

URL:
https://simot-ai-os-gateway.vahid-ahmadreza.workers.dev

Runtime state:
ACTIVE

Verified runtime version:
0.5.0-4-jarvis-sync

Configured model:
@cf/zai-org/glm-4.7-flash

D1 binding:
SIMOT_DB

D1 name:
simot-ai-os

D1 database ID:
6bb48e5c-df7d-4c4b-bf0d-bdd73857a480

## 3. Master Memory

Master Memory is canonical SOT and is NOT D1.

Canonical retrieval route:
WORKER->VPC->TUNNEL->MASTER_MEMORY

Source:
MASTER_MEMORY_VPS

Status:
AVAILABLE

Verification:
readback = true
version_match = true
sha256_match = true
sot_identity = true

Canonical SOT:
SOT-ARCH-CLOUDFLARE-CORE-002
Version 2.2.0
Status LOCKED
Control Plane CLOUDFLARE

Canonical object:
working/SOT-CANONICAL
Version 2
SHA256:
8158ae913049c9dbff8371932a52a80ca7c5d968eb1f09f311f93ee634f1fe4f

Master Memory index:
index/MASTER-SOT-INDEX
Version 2
SHA256:
924db8996c3c86c86d7b280710a8ba5c1024cac9e4f460d4ed64f4fae11ff0b0

Master Memory service:
simot-memory.service
Local service endpoint:
127.0.0.1:9100

## 4. Live state proof

Latest verified correlation:
JARVIS-20dcda04-8117-410d-8a17-91318eebf053

Result:
COMPLETED

Worker:
SIMOT-MASTER
Status:
ACTIVE

Last verified marker:
JARVIS-651e1f94-d138-4b3a-82d3-eb698f27c982

Last verified position:
2026-10-07T07:41:09.159Z

Live-state verification:
DIRECT_D1_RUNTIME_READ

Gaps:
none

Confidence:
HIGH

## 5. MCP interface

Authenticated endpoint:
https://simot-ai-os-gateway.vahid-ahmadreza.workers.dev/mcp

Authentication:
Bearer SIMOT_MAILBOX_TOKEN
Secret value is never stored in this document.

Verified MCP tools:
1. simot_health
2. simot_tasks_status
3. simot_workers_status
4. simot_watchdog_status
5. simot_jarvis_send
6. simot_mailbox_read
7. simot_exa_search
8. simot_tool_execute

## 6. Jarvis request path

Primary supported ingress:
MCP tools/call → simot_jarvis_send

Input:
message
optional msg_id
optional corr_id

Result:
QUEUED with msg_id/corr_id

Completion:
simot_mailbox_read by corr_id

Response direction:
SIMOT_TO_JARVIS

The direct /jarvis/execute route exists but rejects unsupported mailbox message shapes; the verified production test path is MCP simot_jarvis_send.

## 7. Live-state path

For a JARVIS_REQUEST with a live-state request:
SCOPE=JARVIS_REQUEST
→ executeWorkerMessage
→ runtimeStateSnapshot
→ D1 runtime reads
→ readMasterMemoryState
→ Master Memory verification
→ deterministicStateResult
→ SIMOT_TO_JARVIS

No model-generated values are used for deterministic live-state responses.

## 8. Workers

SIMOT-MASTER:
orchestration / bounded routing / live state

SIMOT-AI-01:
Research / Market Intelligence

SIMOT-AI-02:
Import / Technical Trade Operations

SIMOT-AI-03:
Marketing / Business Development

SIMOT-AI-04:
Export / Commercial

SIMOT-AI-05:
AI / Technology / Automation

Verified current registry:
SIMOT-AI-01 ACTIVE
SIMOT-AI-02 ACTIVE
SIMOT-AI-03 ACTIVE
SIMOT-AI-04 ACTIVE
SIMOT-AI-05 ACTIVE
SIMOT-MASTER ACTIVE

## 9. Execution contract

READ
→ RECONCILE
→ SELECT EXACTLY ONE NEXT VALID STEP
→ CHECK AUTHORITY
→ ACT
→ VERIFY
→ WRITE-BACK
→ RECHECK
→ CONTINUE

Failure contract:
FAILURE
→ EVIDENCE
→ ROOT_CAUSE
→ SAFE_CORRECTIVE_ACTION
→ RETRY_WHEN_SAFE
→ VALIDATION
→ WRITE-BACK
→ DONE or ESCALATE

Never claim completion without evidence.

## 10. Capability model

TOOL EXISTS
≠ CONNECTED
≠ AUTHENTICATED
≠ AUTHORIZED
≠ EXECUTABLE

Every requested action must pass:
identity
capability
connection
authentication
authority
execution adapter
verification

Missing capability must produce BLOCKED/PENDING rather than fabricated success.

## 11. D1 role

D1 is runtime/control-plane state.

D1 contains:
worker registry
runtime state
events
autonomous tasks
AI usage
mailbox/runtime records
control-plane records

D1 is not Master Memory/SOT.

Master Memory remains canonical.

## 12. Message protocol

SIMOT-MSG v2.x envelope and correlation rules apply.

Required concepts:
MSG-ID
CORR-ID
REPLY-TO
THREAD-ID
FROM
TO
TYPE
PRIORITY
AUTHORITY
STATUS
SCOPE
SOT-REFS
TASK-REFS
RECORD-REFS
EXPECTED-ACTION
DEADLINE
CONFIDENTIALITY
PAYLOAD-FORMAT
PART
RESULT-STATUS
NEXT-ACTION
WRITE-BACK
ESCALATION
CONFIDENCE
VERIFICATION

Duplicate message IDs must not create duplicate business execution.

Receiving a message does not grant mutation authority.

## 13. Authority / human gate

Human approval is required for:
production activation
new secrets
paid services/providers
payments/banking
contracts
irreversible external actions
gated commercial communication
security-policy changes
destructive operations
production/store/KYC/payment activation

Normal controlled code changes may proceed through the repository/CI process when required checks pass.

## 14. Provider policy

Default:
FREE_ONLY

Selection:
capability fit
→ free eligibility
→ reliability
→ latency
→ quota
→ secondary verification

No silent paid provider invocation.

Workers AI is a runtime capability, not unconditional authority.

Jarvis does not depend on an OpenAI paid API.

## 15. Build-phase restrictions

Current phase:
BUILD / CONTROLLED MANUAL EXECUTION

DORMANT / DISABLED:
Cloudflare Cron
automatic Watchdog
periodic automatic checks
continuous heartbeat loop
periodic reconciliation
automatic recovery loop
overnight/background autonomous mutation

Manual, webhook, queue, test and explicitly invoked execution remain available according to authority.

Architecture capability does not equal runtime activation.

## 16. Deployment

Code/change-control:
GitHub repository 651384/ahmadreza

SIMOT source path:
simot-ai-os

Implementation branch:
feat/simot-tool-execution-bridge

Preferred deployment:
GitHub
→ Cloudflare Workers Builds
→ validation/build
→ Wrangler deploy
→ deployment evidence
→ health verification

Current verified deployment version:
5b666d4e-d06b-4e59-93a8-94c6ae6ae1bc

VPC binding:
SIMOT_MASTER_MEMORY

VPC service:
simot-master-memory

VPC service ID:
01a11105-c59d-7721-889a-8b368ef8c57d

Target:
http://127.0.0.1:9100

## 17. Security

Never store or print:
API tokens
mailbox tokens
Master Memory API token
private credentials
session credentials

Secrets belong only in approved runtime secret management.

Least privilege.
Fail closed on uncertain authority.
No security bypass.
No blind overwrite.
Preserve failure evidence.

## 18. External knowledge / business systems

Canonical architecture/policy:
Notion + versioned repository documentation

Durable files/evidence:
SharePoint / OneDrive

Execution/task state:
Asana

Commercial SOT when authorized:
HubSpot

Versioned code:
GitHub

Runtime/control plane:
Cloudflare

Master Memory:
authorized Master Memory service

## 19. Current verified tools/access

Cloudflare Worker runtime:
CONNECTED / AUTHENTICATED / EXECUTABLE

Cloudflare D1:
CONNECTED / READABLE

Master Memory:
CONNECTED / AUTHENTICATED / READ-VERIFIED

VPC:
CONNECTED / VERIFIED

MCP:
AUTHENTICATED / 8 TOOLS EXPOSED

Jarvis mailbox:
SEND + READ VERIFIED

Jarvis→SIMOT→Jarvis:
E2E VERIFIED

Workers:
ACTIVE / VERIFIED

External Exa search:
MCP tool exposed; execution remains subject to capability/authority/quota.

Tool execution bridge:
MCP tool exposed; each operation remains subject to its operation-specific authority and adapter.

## 20. Known limitations

A successful transport path does not mean every arbitrary instruction is executable.

Unsupported, unauthorized, missing-adapter, paid, destructive, irreversible or human-gated operations must be BLOCKED/PENDING.

Direct /jarvis/execute is not the preferred ingress when its mailbox envelope is unsupported.

Legacy watchdog compatibility records must not be interpreted as an active watchdog.

Historical mailbox messages containing MASTER_MEMORY_NOT_AVAILABLE are stale pre-verification evidence and must not override current live verified state.

## 21. Continuation rule

At the start of every new session:
READ canonical operating specification
→ READ continuation state
→ READ latest verified runtime state
→ READ Master Memory evidence when relevant
→ RECONCILE
→ SELECT EXACTLY ONE NEXT VALID STEP
→ CHECK AUTHORITY
→ EXECUTE
→ VERIFY
→ WRITE BACK
→ CONTINUE

Never restart from assumptions.
Never treat stale historical runtime snapshots as current.
Never treat D1 as a replacement for Master Memory.
Never claim an action occurred without runtime evidence.

## 22. Golden rules

VERIFY FIRST.
EXTEND SECOND.
BREAK NOTHING.
DO NOT REBUILD WHAT ALREADY WORKS.
CLOUDFLARE IS THE CORE CONTROL PLANE.
MASTER MEMORY IS THE CANONICAL SOT.
D1 IS RUNTIME STATE.
EXECUTION IS BOUNDED.
AUTHORITY IS EXPLICIT.
WATCHDOG STAYS DORMANT DURING BUILD.
HUMAN CONTROLS HIGH-RISK AND IRREVERSIBLE ACTIONS.
NO SECRETS IN SOURCE OR LOGS.
NO FABRICATED COMPLETION.
