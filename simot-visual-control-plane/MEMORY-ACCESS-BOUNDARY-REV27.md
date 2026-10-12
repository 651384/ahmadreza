# Canonical Memory Access Boundary — Revision 27

**Graph:** `simot-core-overview`, schema version 1, revision 27  
**Graph size:** 71 nodes, 157 edges  
**Graph commit:** `a98e9cb507dd46daa5de90bc6a17ca3ba0a81e50`

## Decision

The logical SIMOT core must not access VPS Master Memory through a second direct path. All canonical reads and writes are modeled through the Master Memory API and its applicable guards.

## Target paths

- Context read: `orchestration → context-assembler → simot-master-api → master-memory`
- Result write: `result-assembler → simot-master-api → canonical-memory-write-guard → master-memory`
- The API and write guard must enforce caller identity/authority, schema validation, stale-version protection, idempotency, audit evidence, and human approval for sensitive mutations.

## Revision 27 change

Removed edge `e-memory-core` (`simot-core → master-memory`, `READS`) because it implied a direct access route in parallel with the guarded API route. This is a model correction only; it does not change a running service or prove the API route is live.

## Verification boundary

Static source inspection may confirm that the graph contains the intended paths and no direct core-to-memory edge. It does not verify runtime connectivity, API permissions, or successful memory reads/writes. No tests, build, service restart, deployment, master merge, or canonical-memory write was performed for this change.
