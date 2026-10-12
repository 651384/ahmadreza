# Execution Dispatch Mode Contract — Revision 32

## Purpose
Prevent a single task from being dispatched accidentally through both the synchronous Gateway-to-AI-Workers path and the asynchronous queue path.

## Dispatch rule
For each task, the dispatch policy selects exactly one execution mode:
- `SYNC`: `Cloudflare Gateway → AI Workers`
- `ASYNC`: `Cloudflare Gateway → simot-events Queue → Queue Consumer → AI Workers`

The graph represents both modes behind `execution-dispatch-policy`; there must be no bypass edge that lets the Gateway independently dispatch the same task to both targets.

## Required decision fields
The policy decision should be traceable to task ID, correlation ID, idempotency key, selected mode, policy/version, decision time, and outcome. Do not log secrets or sensitive raw payloads.

## Delivery and retry
- Queue redelivery is at-least-once unless the actual queue contract proves otherwise; consumers must be idempotent.
- Retries must preserve task/correlation identity and must not create a second independent task.
- Switching modes after dispatch has started is not an ordinary retry. It requires explicit reconciliation of prior dispatch outcome and a policy-approved recovery path.
- Intentional fan-out requires an explicit task contract with distinct child task IDs and correlation links.

## Failure behavior
If the dispatch decision is missing, ambiguous, or cannot be recorded, fail closed rather than dispatching on both paths. Use the existing failure-handler/evidence contract. Queue/DLQ runtime availability is not implied by this design.

## Status
This is architecture-only. All new nodes and edges remain `PLANNED`; no code, queue configuration, worker, or production behavior was changed.
