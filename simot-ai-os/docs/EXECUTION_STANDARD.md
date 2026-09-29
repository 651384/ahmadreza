# SIMOT AI OS — Execution Standard 2.2.0

Status: LOCKED
Phase: BUILD / CONTROLLED MANUAL EXECUTION

## Mandatory gate

Before every execution path the runtime MUST validate this standard:
- HTTP/webhook execution
- Queue/Worker execution
- management/status execution
- explicit manual execution

Scheduled/Cron execution is not an active execution path in the current BUILD phase.

If validation fails, the runtime MUST fail closed.

## Architecture invariant

SOT-ARCH-CLOUDFLARE-CORE-002

Cloudflare is the primary runtime/control plane.

The runtime architecture is provider-neutral, fail-closed and authority-gated.

## Runtime control plane

Active runtime components:
- Cloudflare Workers
- Cloudflare D1
- Cloudflare Queues / DLQ
- Workers AI
- runtime observability

Dormant architecture capabilities:
- Cloudflare Cron
- periodic scheduler
- automatic Watchdog
- continuous heartbeat loop
- periodic reconciliation
- automatic recovery loop

Dormant means defined for future use but not executing now.

## Source and change control

GitHub is the versioned code and change-control SOT.

Cloudflare deployment state must be independently verified; repository configuration is not proof of deployment or dashboard configuration.

## Authority

Capability does not imply authorization.

The runtime must distinguish:
EXISTS → CONNECTED → AUTHENTICATED → AUTHORIZED → EXECUTABLE.

High-risk, irreversible, paid, secret, production and security-policy operations require the applicable human gate.

## Recovery

Recovery logic may exist as bounded functions/contracts, but no continuous autonomous recovery loop may execute during BUILD phase.

## Completion integrity

No action is DONE without:
desired result
+ acceptance
+ evidence
+ SOT write-back.

## Change rule

Any future activation of Cron, Watchdog, periodic reconciliation or automatic recovery requires a separate human-approved change with:
- reason
- workload being monitored
- monitoring contract
- failure definition
- allowed recovery actions
- human-gate boundaries
- test evidence
- runtime read-back
- SOT write-back.
