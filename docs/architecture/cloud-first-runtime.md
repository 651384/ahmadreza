# SIMOT AI OS — Cloud-First Runtime Architecture

## Status
**Effective:** 2026-09-23  
**Decision:** Runtime and source-of-truth operation must not depend on the user's personal Windows machine.

## Canonical boundaries
- **GitHub:** canonical code/version-control surface for SIMOT AI OS.
- **Cloudflare Workers:** runtime/deployment platform.
- **Cloudflare D1:** runtime state and persistence.
- **Cloudflare Queues + DLQ:** asynchronous message transport and recovery.
- **GitHub Actions / Cloudflare Builds:** automated validation and deployment path.
- **Approved SOT/Notion:** architecture, decisions, SOPs, and project-control documentation.
- **Local Windows tools:** optional migration/debugging aids only; never a runtime dependency.

## Acceptance criteria
The system is considered cloud-independent only when:
1. Runtime code is present in GitHub.
2. Cloudflare deployment is sourced from GitHub/Cloudflare Builds.
3. Runtime state is held in Cloudflare services rather than local files.
4. Secrets are stored only in approved secret/configuration stores.
5. Validation can run in GitHub-hosted automation.
6. Health, webhook, queue, D1 and recovery behavior are observable without a local IDE.
7. A local computer can be offline without stopping the deployed runtime.

## Cloud-native controller (added 2026-09-23)
The controller heartbeat no longer depends on any external/local process. With
`SIMOT_CONTROLLER_MODE=CLOUD` (default in `wrangler.toml`), the Worker's own
`*/3 * * * *` cron emits a `CLOUD-CRON:*` controller heartbeat before each
watchdog evaluation. An external ACTIVE controller is never overwritten, so an
abandoned external controller still degrades to STALE/RECOVERY_REQUIRED and is
signaled by the GitHub Actions watchdog. This closes acceptance criterion 7 for
the control plane: a powered-off laptop cannot leave the watchdog permanently
IDLE.

## Arena boundary
No Arena runtime integration exists; see
`simot-ai-os/docs/arena-integration-status.md`. GitHub remains the only
boundary between Arena-assisted development and the runtime.

## Current verified evidence
- Repository: `651384/ahmadreza`
- Runtime package: `simot-ai-os/`
- Worker: `simot-ai-os-gateway`
- D1: `simot-ai-os`
- Queue: `simot-events`
- DLQ: `simot-events-dlq`
- GitHub validation workflow exists.
- GitHub live-smoke workflow exists.
- Cloudflare Git integration has previously produced a successful production deployment for commit `135e48510c050f492338cfe360f8b7b376c8d882`.
- A later watchdog hardening preview build failed; this remains an open verification item and is not treated as a successful deployment.

## Local machine policy
The existing local copy may be used only to recover or inspect legacy state during migration. It must not be required for normal operation, deployment, monitoring, or project continuation.

## Safety
This architecture decision does not authorize provider execution, secret insertion, Telegram activation, payments, contracts, irreversible actions, or automatic PR merges.
