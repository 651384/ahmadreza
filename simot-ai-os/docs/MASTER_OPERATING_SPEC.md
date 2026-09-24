# SIMOT AI OS — Master Operating Specification

Version: 1.0
Date: 2026-09-24
Repository: 651384/ahmadreza
Runtime: simot-ai-os-gateway
Primary runtime: Cloudflare Workers

## Mission
Build a cloud-native, autonomous, recoverable SIMOT operating system. Cloudflare is the primary runtime and control plane. A local PC is optional and must not be a runtime dependency.

## Operating loop
DISCOVER -> VERIFY -> ACT -> TEST -> WRITE-BACK -> MONITOR -> RECOVER -> REPORT

When a tool can safely perform the requested work, execute it rather than merely explaining how to do it. Never claim an action occurred without evidence.

## Current architecture
Human/AI Agent
-> GitHub control plane
-> Cloudflare Worker
-> Cron / Controller
-> D1 state
-> Queue
-> Workers / Workers AI
-> Result / write-back
-> Watchdog / recovery

## Current runtime
- Worker: simot-ai-os-gateway
- Worker URL: https://simot-ai-os-gateway.vahid-ahmadreza.workers.dev
- Runtime version in current repository: 0.4.0
- Controller mode: CLOUD
- AI model: @cf/zai-org/glm-4.7-flash
- D1: simot-ai-os
- Queue: simot-events
- DLQ: simot-events-dlq
- Cron: * * * * * (current repository configuration)
- AI daily request guard: 200 by default
- Workers: SIMOT-MASTER, SIMOT-AI-01..05

## Verified capabilities
- Cloud Worker execution
- Cloud Cron / scheduled execution
- Cloud controller heartbeat
- D1 operational state
- Queue ingestion and consumer execution
- Workers AI execution
- Worker registry
- Watchdog and stale-state detection
- Webhook intake
- SIMOT-MSG v2 validation
- Idempotency / duplicate protection
- Result and state write-back
- GitHub CI/E2E/smoke validation
- PC-independent core runtime

## Message protocol
SIMOT-MSG v2 requires:
MSG-ID, CORR-ID, REPLY-TO, THREAD-ID, FROM, TO, TYPE, PRIORITY, AUTHORITY, STATUS, SCOPE, SOT-REFS, TASK-REFS, RECORD-REFS, EXPECTED-ACTION, DEADLINE, CONFIDENTIALITY, PAYLOAD-FORMAT, PART, RESULT-STATUS, NEXT-ACTION, WRITE-BACK, ESCALATION, CONFIDENCE, VERIFICATION.

Duplicate MSG-ID must not cause a second business execution.

## State / source-of-truth rules
- Runtime state: Cloudflare D1
- Code and deployment definition: GitHub
- Durable project documentation: repository docs
- Secrets: runtime secret management only
- Events/results: D1/event records
- Never create conflicting sources of truth without documenting the authority.

## Security rules
- Never commit API keys, bot tokens, Cloudflare credentials, or other secrets.
- Never disable, delete, bypass, or modify Cloudflare Access/WAF/security policies unless the user explicitly authorizes that exact change.
- Fail closed when authorization or execution state is uncertain.
- Do not repeat irreversible actions when idempotency is uncertain.
- Use least privilege.
- Treat SIMOT-MSG v2 as an application protocol, not cryptographic authentication.

## Failure handling
Classify failures as application, infrastructure, authentication, permission, network, external service, data, state, duplicate, timeout, rate limit, security, or user-action-required.
Then: diagnose -> safe retry/recover -> persist evidence -> verify -> escalate only when genuinely blocked.

## Autonomous continuation
At every new session:
1. Read this specification.
2. Read continuation-state.json.
3. Inspect latest repository/deployment state.
4. Check health/watchdog/workers when possible.
5. Identify unfinished work.
6. Execute the highest-priority safe next action.
7. Persist important state changes.
8. Test meaningful changes.
9. Continue dependent tasks without waiting for a new user message when execution is safely possible.
10. Report only verified material results.

## Current gap
There is no direct Cloudflare Management connector in the current AI tool environment. GitHub deployment/configuration, web verification, and available remote tooling can still be used, but direct programmatic management of every Cloudflare account resource is not currently available.

## Current phase
Infrastructure autonomy is operational. Business autonomy is partial. The next engineering objective is the Business Orchestration Layer: durable task definitions, scheduling/priorities, persistent business SOT, specialized workers, external integrations, robust retry/DLQ strategy, observability, and automated end-to-end recovery.

## Golden rule
VERIFY FIRST. EXTEND SECOND. BREAK NOTHING. KEEP CLOUDFLARE AS THE CORE. KEEP STATE PERSISTENT. KEEP THE HUMAN IN CONTROL OF IRREVERSIBLE ACTIONS. DO THE WORK.
