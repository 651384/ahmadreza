# Cancellation, Deadline & Late-Result Contract — Revision 34

## Goal
Ensure cancellation and timeout are first-class task lifecycle outcomes across synchronous and queued execution, not merely UI messages.

## Required propagation
1. Request ingress validates and records a bounded deadline, task ID, correlation ID, and idempotency key.
2. Executor checks cancellation/deadline at safe checkpoints and stops work cooperatively where supported.
3. Queue consumer checks terminal task state before starting or retrying work; redelivery must not revive a cancelled/expired task.
4. Cancellation/timeout produces an explicit terminal outcome through the existing response and evidence contracts.
5. Retry/idempotency fences prevent new retries or duplicate dispatch after terminal cancellation/timeout.
6. A late worker result must not overwrite a newer terminal state or be reported as success. Reconcile using task identity and state/version checks.

## State semantics
- Cancellation requested is distinct from cancellation completed if an in-flight worker cannot stop immediately.
- Timed out means the task deadline expired; it does not necessarily prove the underlying external computation stopped.
- Terminal outcomes must be idempotent and auditable.
- Ambiguous state/version, missing identity, or conflicting terminal outcomes fail closed and escalate.

## Status
All revision 34 edges are `PLANNED`. This document is an architecture contract only; it does not claim runtime cancellation, worker interruption, queue purging, or timeout enforcement exists.
