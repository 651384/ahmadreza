# SIMOT AI OS Runtime

Serverless runtime for SIMOT-MASTER and bounded Workers on Cloudflare. The runtime is intentionally independent of Codex, Arena, and any single developer tool or local machine.

## Current phase

Cloud-native execution runtime (v0.5.0). The gateway validates the SIMOT-MSG v2 envelope, performs duplicate protection, records operational state in Cloudflare D1, queues accepted messages on Cloudflare Queues, and executes worker messages through the Workers AI binding under a strict free-only provider router, daily request guard, rate/cooldown guard, and completion evidence gate.

## Provisioned Cloudflare resources

- Worker: `simot-ai-os-gateway`. The repository records a production deployment from branch `feat/simot-tool-execution-bridge` at commit `22549bcd7fecfd3d760832802d1d8d9d92a93857`; that branch is not merged to `master`. Verify current deployment state independently before relying on this historical record.
- D1 database: `simot-ai-os` (binding `SIMOT_DB`) — schema in `schema.sql`; runtime also auto-creates `ai_daily_usage` and `worker_registry`.
- Queue: `simot-events` with dead-letter queue `simot-events-dlq` (binding `SIMOT_QUEUE`).
- Workers AI binding `AI` uses a verified-free provider registry. The current configured free provider is `@cf/zai-org/glm-4.7-flash`; paid/unverified providers are hard-blocked. D1 enforces a conservative request budget plus a minimum inter-request interval before every model call.
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

## Master Memory and source-of-truth architecture

**VPS Master Memory is the canonical operational-continuity record for SIMOT.** The canonical service and files are hosted on the VPS under `/srv/simot-memory/`; the existing local API is served on `127.0.0.1:9100`. Do not describe OneDrive/SharePoint, Notion, D1, or ChatGPT memory as a replacement for VPS Master Memory.

- **VPS Master Memory:** canonical operational continuity and task/evidence write-back. Its existing Cloudflare path is represented by the Worker VPC binding `SIMOT_MASTER_MEMORY` targeting service `simot-master-memory`, using the existing `SIMOT_MASTER_MEMORY_TOKEN` secret. Historical E2E write/readback evidence exists; documentation alone does not prove current endpoint health.
- **Cloudflare D1:** runtime state, control-plane records, task/worker registry, usage guards, and audit events. D1 is not the canonical VPS Master Memory and must not silently become a competing continuity store.
- **Cloudflare Queues / DLQ:** durable handoff and failed-message handling for runtime work.
- **Notion:** architecture, policies, and structured decisions.
- **Microsoft SharePoint / OneDrive:** supporting documents, inputs, and evidence; not the canonical operational-continuity record.
- **GitHub:** versioned source code and change control.
- **Asana:** execution tasks when connected and authorized.
- **HubSpot:** commercial/CRM records when connected and authorized.
- **ChatGPT memory:** context only, never the operational source of truth.

The previous statements that the canonical memory was OneDrive/SharePoint and that runtime state must remain `MASTER_MEMORY_NOT_AVAILABLE` are superseded by this architecture. The Worker-to-VPS integration must be described using evidence from the existing VPC/API path, not by requiring a new OneDrive/SharePoint retrieval adapter. Keep live availability, authentication, authorization, and successful end-to-end read/write as separate verification claims.

## External tools

External tool adapters (Notion, HubSpot, SharePoint/OneDrive, Asana, etc.) remain controlled contracts unless a live runtime adapter and authenticated execution path are independently verified. ChatGPT-side connector availability is not evidence that the Cloudflare Worker itself can call that connector.

## Security

Secrets are runtime environment variables/secrets only. Never commit API keys, bot tokens, or Cloudflare credentials. Endpoints guarded by secrets fail closed when the secret is not configured.

## Validation

- Deterministic tests: `npm test` (Node 22, `node --test`).
- CI: `.github/workflows/simot-ai-os-validation.yml` (tests + `wrangler deploy --dry-run` and other repository checks).

## Locked execution standard

The runtime enforces **Execution Standard 2.2.0**. SOT invariant `SOT-ARCH-CLOUDFLARE-CORE-002` makes Cloudflare the active runtime/control plane and removes Local PC from the runtime dependency chain. See `docs/EXECUTION_STANDARD.md`, `docs/SOT.md`, and `docs/CONTROL_PLANE_MANIFEST.md`.
