# Evidence Freshness & Reconciliation Contract — Revision 36

**Graph:** `simot-core-overview`, schema version 1, revision 36  
**Scope:** Evidence provenance, freshness-aware status claims, and read-only reconciliation  
**Status:** Architecture contract only; implementation and runtime enforcement are NOT TESTED.

## 1. Purpose

Prevent historical evidence from being presented as proof of current health. Every status claim must identify exactly what is asserted and what evidence supports it.

## 2. Minimum evidence provenance

Where available, an evidence record should identify:

- **Evidence ID** — stable reference to the evidence record.
- **Subject and claim scope** — exact component, endpoint, operation, or behavior the evidence covers.
- **Source** — system/tool that produced the evidence; a source name alone is not proof.
- **Observed-at** — when the source was actually observed or tested.
- **Recorded-at** — when the evidence was recorded in the canonical continuity record.
- **Method and outcome** — read-only inspection, configuration inspection, build, test, or runtime call; preserve the distinction.
- **Limitations** — what the evidence does not establish, including auth, path, environment, or time boundaries.

Do not store secret values or unnecessary sensitive payloads in evidence.

## 3. Freshness rules

1. Freshness is specific to the source and claim. Do not invent one universal TTL.
2. A successful historical request proves only that the tested request succeeded at that time and within its tested scope.
3. Configuration, route, binding, repository content, and build success do not independently prove runtime connectivity or health.
4. If timestamp, provenance, or scope is insufficient, current status remains `NOT TESTED` / unknown.
5. Stale evidence may be retained and shown as historical; it must not silently upgrade a current status to `VERIFIED`.
6. `VERIFIED` is scoped to the exact claim supported by evidence; it does not imply all adjacent components or edges are verified.

## 4. Reconciliation procedure

1. Identify the status claim and exact source of truth.
2. Retrieve existing evidence first; do not repeat a test merely to restate a known historical result.
3. Compare subject, claim scope, observed-at time, method, and outcome.
4. Classify the evidence as current for that claim, historical/stale, insufficient, blocked, or failed.
5. Keep unresolved status unknown and record the blocker/next action.
6. During architecture work, reconciliation is read-only. Do not automatically mutate VPS Master Memory or graph statuses.
7. When operational write-back is later authorized, use the existing Master Memory API and canonical write guard; preserve audit/evidence linkage and require approval for sensitive actions.

## 5. Control-plane presentation

- Show status, evidence reference, source, observed-at, and limitation together where available.
- Clearly distinguish current evidence from historical evidence.
- Do not render unknown as healthy or infer live health from a node's presence in the graph.
- The React Flow graph is versioned architecture, not the operational source of truth.
- VPS Master Memory remains the canonical operational continuity record. Do not create a parallel evidence store.

## 6. Revision 36 graph changes

Added node: `evidence-freshness-policy`.

Added planned relationships:

- `monitoring → evidence-freshness-policy`: enforce evidence freshness.
- `evidence-contract → evidence-freshness-policy`: supply provenance and time.
- `evidence-freshness-policy → vcp`: gate status display on valid evidence.
- `evidence-freshness-policy → audit-ledger`: record reconciliation outcomes.
- `evidence-freshness-policy → result-assembler`: block unsupported current-status claims.

All additions remain `PLANNED`. This document does not claim implementation, deployment, or runtime verification.

## 7. Acceptance criteria for a future implementation phase

- Evidence schema can distinguish observed-at from recorded-at.
- Status claims link to a subject, scope, and evidence reference.
- Historical evidence cannot by itself produce a current `VERIFIED` status.
- Missing/insufficient evidence remains unknown.
- Reconciliation is read-only unless a separately authorized write path is invoked.
- Audit records avoid secrets and preserve evidence references.
- Tests cover stale evidence, missing timestamps, mismatched scope, historical success, and fresh evidence.
