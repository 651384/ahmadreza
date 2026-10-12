# SIMOT Visual Control Plane — Graph Governance Contract

**Graph revision:** 17  
**Graph size:** 68 nodes, 142 edges  
**Branch:** `feat/simot-visual-control-plane-react-flow`

## 1. Versioned graph model

The current graph artifact is `src/graph-v1.json`, with graph ID `simot-core-overview`, `schemaVersion: 1`, a monotonically increasing revision, and `updatedAt`. Node and edge IDs are intended to remain stable across revisions. A schemaVersion change is a compatibility change and should not be silently mixed with an ordinary graph revision.

The graph is an architecture model. It must distinguish:
- target/conceptual components from existing implementation,
- declared capability from granted permission,
- provider/connector availability from SIMOT runtime integration,
- last known evidence from fresh verification,
- status such as VERIFIED, FAILED, BLOCKED, PLANNED, and NOT TESTED.

## 2. Proposed change workflow

1. Start from the latest committed graph on the feature branch.
2. Propose a bounded change and show a before/after diff.
3. Explain affected nodes, edges, trust boundaries, data domains, and operational consequences.
4. Apply the change on the feature branch only.
5. Record commit/revision references.
6. Require human approval for merge to master, production deployment, sensitive changes, or any cost-bearing action.

The UI must not turn selection or editing into implicit permission to execute a runtime operation.

## 3. Validation policy (for the later test phase)

Before a graph revision is accepted, the planned validator should check:
- unique node IDs and unique edge IDs,
- every edge source and target exists,
- required node/edge fields and supported schema version,
- valid status values and clear separation of target design from observed evidence,
- positions and layout constraints sufficient to avoid unintended overlaps,
- no secret values in graph fields,
- policy-required approval and audit relationships for sensitive paths.

**No validation command or test was run for revision 17.** This list is a target contract for the phase after the user declares architecture complete.

## 4. History and rollback

Git commit history on the feature branch is the existing source for graph revisions. A rollback should be a new, reviewable change that references the prior commit and explains the reason. Avoid force-push or destructive history rewrite by default. A rollback of the graph does not roll back VPS Master Memory, Cloudflare, connector permissions, or other runtime state.

Before any runtime rollback, identify the target, blast radius, recovery point, owner, approval, and evidence required. Do not imply that a UI rollback action exists until implemented and tested.

## 5. Current phase boundary

Revision 17 models 68 nodes and 142 edges. This document records the graph governance target only. No UI editing, validator run, build, test, deployment, merge, or runtime write was performed as part of this architecture update.
