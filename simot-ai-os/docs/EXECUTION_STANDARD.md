# SIMOT AI OS — Execution Standard 2.1.0

Status: LOCKED

## Mandatory gate

Before **every execution path** the runtime MUST validate this standard:
- scheduled/Cron execution
- HTTP/webhook execution
- Queue/Worker execution
- management/status execution

If validation fails, the runtime MUST fail closed and record a blocked state.

## Architecture invariant

**SOT-ARCH-LOCAL-PC-001**

The SIMOT-AI OS runtime is Cloudflare-native. Local PC is NOT part of the dependency chain.

Forbidden runtime dependencies:
- Local PC
- PowerShell
- Desktop Commander
- Wrangler CLI
- Codex
- Arena

Those tools may be used for optional development or inspection only. They must never be required for the running system.

## Control plane

Cloudflare Workers + Cron + D1 + Queues + Workers AI own the runtime control plane.

GitHub is the versioned source of truth and change-control layer.

## Recovery

Cloud Cron provides the heartbeat/watchdog loop. A stale external controller must not be masked by a cloud heartbeat.

## Completion integrity

No external action may be reported as completed without runtime evidence.

## Change rule

Any future architecture or implementation that introduces Local PC into the runtime dependency chain violates this standard and must be rejected before execution.
