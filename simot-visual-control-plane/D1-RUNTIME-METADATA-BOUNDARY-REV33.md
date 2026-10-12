# D1 Runtime Metadata Boundary — Revision 33

## Purpose
Keep Cloudflare D1's role explicit and prevent it from becoming an accidental second canonical memory system.

## Source-of-truth boundary
- VPS Master Memory remains the canonical operational continuity source.
- D1 is limited to runtime metadata required by the existing Gateway/event/queue workflow, subject to the actual schema and deployed bindings.
- D1 must not independently become the authoritative copy of `CURRENT_STATE.json`, decisions, continuity, evidence index, or task log.
- If a runtime operation requires canonical state, it must use the approved Master Memory API path rather than treating a D1 cache or event row as canonical truth.

## Data minimization and retention
- Persist only fields required for routing, correlation, deduplication, task/event status, and operational troubleshooting.
- Do not store secrets, bearer tokens, raw sensitive documents, or full prompt payloads by default.
- Apply classification before persistence, explicit retention/deletion rules, and redaction in logs.
- If D1 schema, retention, or binding scope is unknown, do not infer that controls exist; mark them NOT TESTED until inspected.

## Failure and consistency
- A D1 event/metadata record may aid delivery and troubleshooting but cannot silently override canonical VPS state.
- Reconciliation between queue/event metadata and canonical task state must use stable task/correlation/idempotency identifiers.
- Conflicts fail closed or escalate; they must not be resolved by assuming the newest timestamp is authoritative.

## Status
Architecture-only contract. No D1 schema, data, retention settings, Worker, or runtime configuration was changed or inspected as part of this revision.
