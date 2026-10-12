# Queue Consumer Contract — Revision 28

**Graph:** `simot-core-overview`, schema version 1, revision 28  
**Graph size:** 71 nodes, 160 edges  
**Graph commit:** `15d6620b1875a8cef5052b4faa53603750a7f56c`

## Purpose

Make the asynchronous queue path explicit without claiming that Cloudflare Queues, consumers, or dead-letter handling are live or verified.

## Required behavior

1. Validate the message envelope and its task/correlation identifiers before processing.
2. Record task lifecycle transitions for accepted, started, completed, retried, cancelled, and terminally failed work.
3. Apply idempotency/deduplication before repeating external effects on redelivery.
4. Bound retry attempts and classify retryable versus terminal failures.
5. Route terminal failures through the failure handler and the configured DLQ policy; preserve enough redacted evidence to investigate without logging secrets.
6. Ensure dispatch mode is explicit: direct gateway-to-worker execution versus asynchronous queue execution. A single task must not be unintentionally dispatched through both paths.
7. Preserve correlation across request, queue message, worker, result, and audit record.

## Revision 28 graph additions

- `e-consumer-lifecycle`: queue consumer → task lifecycle
- `e-consumer-idempotency`: queue consumer → retry/idempotency control
- `e-consumer-failure`: queue consumer → failure handler

All three edges are **PLANNED**. This is an architecture contract only. No queue, worker, service, or runtime configuration was changed or tested.
