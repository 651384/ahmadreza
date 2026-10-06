# SIMOT AI OS Runtime

Serverless runtime for SIMOT-MASTER and bounded Workers on Cloudflare. The runtime is intentionally independent of Codex, Arena, and any single developer tool or local machine.

## Current phase

Cloud-native execution runtime (v0.5.0). The gateway validates the SIMOT-MSG v2 envelope, performs duplicate protection, records operational state in Cloudflare D1, queues accepted messages on Cloudflare Queues, and executes worker messages through the Workers AI binding under a strict free-only provider router, daily request guard, rate/cooldown guard, and completion evidence gate.

## Provisioned Cloudflare resources

- Worker: `simot-ai-os-gateway`. The currently verified production deployment is from branch `feat/simot-tool-execution-bridge` at commit `22549bcd7fecfd3d760832802d1d8d9d92a93857`; this branch is not merged to `master`.
- D1 database: `simot-ai-os` (binding `SIMOT_DB`) — schema in `schema.sql`; runtime also auto-creates `ai_daily_usage` and `worker_registry`.
- Queue: `simot-events` with dead-letter queue `simot-events-dlq` (binding `SIMOT_QUEUE`).
- Workers AI binding `AI` uses a verified-free provider registry. The current free provider is `@cf/zai-org/glm-4.7-flash`; paid/unverified providers are hard-blocked. D1 enforces a conservative request budget plus a minimum inter-request interval before every model call.
- Cron/watchdog/scheduled control is defined but DORMANT during the current BUILD / CONTROLLED MANUAL EXECUTION phase.

## Worker execution

Messages addressed to `SIMOT-MASTER` or `SIMOT-AI-01..05` are executed by the queue consumer using the profiles in `src/worker_profiles.js`. Inter-worker routing re-queues follow-up envelopes. Results, registry state, and idempotency status are persisted in D1 and observable at `/workers/status`.

## Control-plane execution safeguards

- **Mandatory preflight:** Execution Standard 2.2.0 is validated before HTTP, queue/worker, management/status, and explicit manual execution.
- **Fail closed:** missing/mismatched/violated standards and unsupported capabilities stop execution.
- **No false completion:** external actions are not reported completed without adapter evidence and completion-gate verification.
- **No automatic loops in BUILD:** Cron, Watchdog, periodic reconciliation, continuous heartbeat, and automatic recovery are dormant.
- **Authority gate:** capability existence does not grant execution authority.
- **Human gates:** production activation, secrets, paid services, irreversible actions, and security-policy changes remain gated.

## Memory / Source-of-Truth architecture

- Canonical structured policy/decision memory: Notion.
- Canonical durable file/evidence memory: Microsoft OneDrive/SharePoint at `SIMOT-AI-OS/MEMORY/`.
- D1 is **runtime state**, not the primary company-memory store.
- The runtime contains reference-first memory contracts (`memory-contract.js` / `memory-binary-contract.js`), but no live Worker-side OneDrive/SharePoint retrieval adapter is currently connected.
- The intended future path is: Jarvis → SIMOT Gateway → Memory Retrieval Layer → canonical OneDrive/SharePoint memory → evidence/canonical context → SIMOT-MASTER.
- Current memory gap is explicit: `MASTER_MEMORY_NOT_AVAILABLE`; do not substitute D1 runtime records for canonical memory.

## External tools

External tool adapters (Notion, HubSpot, OneDrive, Asana, etc.) remain controlled contracts unless a live runtime adapter and authenticated execution path are independently verified. ChatGPT-side connector availability is not evidence that the Cloudflare Worker can call the connector.

## Security

Secrets are runtime environment variables/secrets only. Never commit API keys, bot tokens, or Cloudflare credentials. Endpoints guarded by secrets fail closed when the secret is not configured.

## Validation

- Deterministic tests: `npm test` (Node 22, `node --test`).
- CI: `.github/workflows/simot-ai-os-validation.yml` (tests + `wrangler deploy --dry-run` and other repository checks).

## Locked execution standard

The runtime enforces **Execution Standard 2.2.0**. SOT invariant `SOT-ARCH-CLOUDFLARE-CORE-002` makes Cloudflare the active runtime/control plane and removes Local PC from the runtime dependency chain. See `docs/EXECUTION_STANDARD.md`, `docs/SOT.md`, and `docs/CONTROL_PLANE_MANIFEST.md`.
