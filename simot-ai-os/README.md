# SIMOT AI OS Runtime

Serverless runtime for SIMOT-MASTER and bounded Workers on Cloudflare. The runtime is intentionally independent of Codex, Arena, and any single developer tool or local machine.

## Current phase
Cloud-native execution runtime (v0.4.2). The gateway validates the SIMOT-MSG v2 envelope, performs duplicate protection, records operational state in Cloudflare D1, queues accepted messages on Cloudflare Queues, and executes worker messages through the Workers AI binding under a strict daily free-quota guard.

## Provisioned Cloudflare resources
- Worker: `simot-ai-os-gateway` (deployed via Cloudflare Workers Builds Git integration from `master`).
- D1 database: `simot-ai-os` (binding `SIMOT_DB`) — schema in `schema.sql`; runtime also auto-creates `ai_daily_usage` and `worker_registry`.
- Queue: `simot-events` with dead-letter queue `simot-events-dlq` (binding `SIMOT_QUEUE`).
- Workers AI binding `AI` (default model `@cf/zai-org/glm-4.7-flash`), capped by `SIMOT_AI_MAX_REQUESTS_PER_DAY` (default 200/day) enforced in D1 before every model call.
- Cron trigger `* * * * *` runs the watchdog and, in CLOUD controller mode, the cloud controller heartbeat.

## Worker execution
Messages addressed to `SIMOT-MASTER` or `SIMOT-AI-01..05` are executed by the queue consumer using the profiles in `src/worker_profiles.js`. Inter-worker routing re-queues follow-up envelopes; `SCOPE=E2E_SMOKE` suppresses routing fan-out. Results, registry state, and idempotency status are persisted in D1 and observable at `/workers/status`.

## Cloud-native controller / watchdog
`SIMOT_CONTROLLER_MODE=CLOUD` (set in `wrangler.toml`) makes the deployed Worker its own controller: each cron run emits a `CLOUD-CRON:*` heartbeat before the watchdog evaluation, so no laptop or external process is required for the control plane. Fail-safe rules (see `src/watchdog.js` `planCloudHeartbeat`):
- An external ACTIVE controller heartbeat is never overwritten — a stale external controller still surfaces as `STALE`/`RECOVERY_REQUIRED`.
- The cloud heartbeat is emitted only when no controller exists, when refreshing its own cloud instance, or when the external controller declared `IDLE`.
`POST /controller/heartbeat` remains available for an optional external controller and stays fail-closed behind `SIMOT_CONTROLLER_HEARTBEAT_SECRET`.

## Channel adapters
Telegram adapter and controlled webhook boundary are present. `src/adapters/telegram.js` normalizes supported Telegram update shapes, maps them into the SIMOT-MSG v2 envelope, and constructs a provider-neutral outbound `sendMessage` request shape. The Worker exposes `/telegram/webhook` only when the secret `TELEGRAM_WEBHOOK_SECRET` is configured; requests must supply the matching `X-Telegram-Bot-Api-Secret-Token` header. The webhook stores no token in source and does not call the Telegram Bot API.

Arena: no runtime integration exists; see `docs/arena-integration-status.md` for the evidence-based decision and the preconditions for adding one.

## Runtime states
FULL / DEGRADED / MANUAL. PAID is prohibited by default; the provider router (`src/provider-router.js`) fails closed unless free status, data-class eligibility and payment-disabled conditions are verified.

## Security
Secrets are runtime environment variables/secrets only. Never commit API keys, bot tokens, or Cloudflare credentials. Endpoints guarded by secrets fail closed (503) when the secret is not configured.

The message envelope is an application-level protocol, not cryptographic authentication. Stronger authentication/integrity must be provided by the transport or authoritative access-control layer when required.

## Validation
- Deterministic tests: `npm test` (Node 22, `node --test`).
- CI: `.github/workflows/simot-ai-os-validation.yml` (tests + `wrangler deploy --dry-run`), live smoke, worker E2E, and a 5-minute GitHub Actions watchdog probe — all GitHub-hosted; no local machine is required.

## Current limitations
- Deployment is performed by Cloudflare Workers Builds configured in the Cloudflare dashboard; the repository contains no push-based deploy credentials by design.
- External tool adapters (Notion, HubSpot, OneDrive, Asana, etc.) exist as validated contracts only; no live tool credentials or calls are wired into the runtime.
- **Developer-tool independence:** Codex/Arena are not runtime dependencies and are not required for operation, validation, source-of-truth management, or deployment. The system of record remains GitHub plus the approved SIMOT SOT.


## Locked execution standard
The runtime enforces **Execution Standard 2.1.0** before scheduled, HTTP, queue, and management execution. SOT invariant **SOT-ARCH-LOCAL-PC-001** permanently removes Local PC from the runtime dependency chain. The Cloudflare control plane owns runtime scheduling, state, queueing, watchdog, and worker execution. See `docs/EXECUTION_STANDARD.md`, `docs/SOT.md`, and `docs/CONTROL_PLANE_MANIFEST.md`.
