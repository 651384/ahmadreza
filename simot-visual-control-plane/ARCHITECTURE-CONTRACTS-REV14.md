# SIMOT AI OS — API, Message, Permission & Failure Contracts

**Graph revision:** 14  
**Graph size:** 60 nodes, 114 edges  
**Branch:** `feat/simot-visual-control-plane-react-flow`

This is a proposed architecture contract, not an assertion that the fields or behaviors are already implemented in live endpoints. Reconcile it against existing schemas during the later verification phase; do not create duplicate APIs or memory stores.

## Request envelope

Proposed fields:
- `schema_version`: version of the message contract.
- `MSG-ID`: unique message identifier.
- `CORR-ID`: end-to-end correlation identifier.
- `REPLY-TO`: reply target or request reference.
- `FROM`, `TO`: logical sender and recipient.
- `timestamp`: message creation time.
- `PART x/N`: optional part index and total for multipart messages.
- `idempotency_key`: required where retries could repeat side effects.

Required behavior:
- Validate required fields and schema version before orchestration.
- Reject malformed, inconsistent, or unauthorized requests explicitly.
- Preserve correlation identifiers through queue, execution, failure, audit, and response paths.
- Do not put credentials or secret values in the envelope.
- Treat duplicate delivery as possible; side-effecting operations need idempotency protection.

## Response and acknowledgement contract

A response must distinguish transport acknowledgement from task completion.

- **ACCEPTED / IN_PROGRESS:** request accepted, no claim of successful completion.
- **SUCCEEDED:** terminal success with result and permitted evidence references.
- **FAILED:** terminal execution or external-service failure.
- **BLOCKED:** cannot proceed because of policy, permissions, missing prerequisites, or a human decision.
- **CANCELLED:** task cancellation was accepted and reached a terminal state; it does not promise rollback of side effects already performed.
- **TIMED_OUT:** deadline expired without confirmed completion; never infer success from a missing response.

Where appropriate, return `task_id`, `CORR-ID`, timestamp, status, result or structured error, and evidence references. Do not expose stack traces, secrets, or sensitive internals to clients.

## Structured error model

Target error fields:
- `code`: stable machine-readable category.
- `message`: safe human-readable explanation.
- `retryable`: explicit boolean determined by policy.
- `CORR-ID` / `task_id`: trace identifiers.
- `evidence_ref`: reference to redacted evidence when available.

Failure classes should distinguish validation, authentication, authorization, rate limiting, transient network/service failure, timeout, permanent external-service failure, cancellation, and internal policy blocks.

Retry policy:
- Retry only explicitly retryable failures.
- Bound attempts and use backoff for transient failures.
- Preserve correlation and idempotency keys across retries.
- Do not retry authorization/policy failures as if they were transient.
- Route exhausted or non-retryable failures to a configured DLQ or human escalation path.
- Record the terminal outcome; never turn timeout or missing output into success.

## Connector permission matrix

For each connector, separately record:
1. Declared capabilities.
2. Requested operation and scope.
3. Actually granted permissions.
4. Evidence that access was tested (to be gathered only in the verification phase).
5. Data domain, trust boundary, owner, and evidence freshness.

Operation classes: `READ`, `CREATE`, `UPDATE`, `DELETE`, `EXECUTE`. Default to read-only. A connector being available in ChatGPT or listed in the graph does not prove SIMOT runtime access or write permission. Sensitive writes, deletion, secret changes, production release, and cost-bearing operations require explicit human approval.

## Identity, audit, and canonical persistence

- Authenticate and authorize ingress before executing tools.
- Check granted connector scope immediately before the operation.
- Audit actor, action, outcome, task/correlation IDs, timestamp, and redacted before/after summary where appropriate.
- Keep secret values out of logs and evidence.
- Canonical operational continuity remains in the existing VPS Master Memory files; these contracts do not create a competing memory system.
- Map evidence to existing `EVIDENCE_INDEX.json` and `TASK_LOG.jsonl` structures after the architecture phase, without assuming a schema until inspected.

## Architecture phase gate

Revision 14 models 60 nodes and 114 edges. The API/message/permission/error links are currently architectural targets. No tests, build, endpoint calls, permission probes, deployment, or merge were performed as part of this update. When the user declares the architecture complete, reconcile these proposed contracts with actual code and runtime evidence before changing statuses from PLANNED / NOT TESTED.
