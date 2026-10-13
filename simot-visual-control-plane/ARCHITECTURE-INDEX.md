# SIMOT Visual Control Plane — Architecture Index & Handoff

**Canonical graph artifact:** `simot-visual-control-plane/src/graph-v1.json`  
**Graph:** `simot-core-overview`, schema version 1, revision 41  
**Graph size:** 77 nodes, 190 edges  
**Working branch:** `feat/simot-visual-control-plane-react-flow`  
**Latest graph commit:** `a7d18780c1f449bad5247bf9bd9d319dd318b90c`

## Architecture documents

1. `ARCHITECTURE.md` — VCP implementation specification, reconciled to graph revision 41.
2. `ARCHITECTURE-OPERATING-MODEL.md` — core roles, source-of-truth hierarchy, request-to-result flow, continuity and safety, reconciled to graph revision 40.
3. `ARCHITECTURE-CONTRACTS-REV14.md` — API/message envelope, response/acknowledgement, structured error, connector scope.
4. `CONNECTOR-TRUST-BOUNDARIES-REV15.md` — connector trust matrix and intended deployment boundaries.
5. `OPERATIONAL-SAFETY-POLICY-REV16.md` — operational modes, classification, approval scope, backup/recovery policy.
6. `GRAPH-GOVERNANCE-REV17.md` — graph schema, proposed change review, validation requirements, history and rollback.
7. `MODEL-ROUTING-PRIVACY-COST-REV18.md` — free-first/local-first routing, data privacy, provider eligibility and cost gates.
8. `MASTER-MEMORY-WRITE-GUARD-REV19.md` — guarded writes to the existing canonical VPS Master Memory.
9. `EDGE-CONTRACT-REV20.md` — historical edge metadata and permission contract.
10. `EDGE-CONTRACT-REV21.md` — historical edge status coverage and conservative unknown-status semantics.
11. `EDGE-CONTRACT-REV22.md` — canonical top-level edge fields and status/evidence normalization.
12. `CLIENT-CHANNEL-ROUTING-REV24.md` — request/response path through channel adapters and OpenClaw.
13. `HUMAN-OPERATOR-APPROVAL-REV26.md` — explicit human decision actor, scoped approval, and escalation contract.
14. `MEMORY-ACCESS-BOUNDARY-REV27.md` — guarded API-only access to canonical VPS Master Memory.
15. `QUEUE-CONSUMER-CONTRACT-REV28.md` — asynchronous queue lifecycle, idempotency, failure, and DLQ contract.
16. `EXECUTION-DISPATCH-MODE-REV32.md` — exclusive sync/async dispatch mode and duplicate-dispatch prevention.
17. `CANONICAL-MEMORY-ACCESS-REV29.md` — single API boundary for reads, guarded writes, audit, and evidence persistence.
18. `SECURE-ARTIFACT-INTAKE-REV30.md` — untrusted file/image/document validation and extraction boundary.
19. `CANONICAL-MEMORY-RECOVERY-REV31.md` — guarded backup and restore requirements.
20. `D1-RUNTIME-METADATA-BOUNDARY-REV33.md` — D1 metadata-only boundary; VPS Master Memory remains canonical.
21. `CANCELLATION-DEADLINE-LATE-RESULT-REV34.md` — cancellation/timeout propagation and late-result fencing.
22. `OPERATIONAL-AUTHORITY-ROLLBACK-GATES-REV35.md` — explicit human authority, deployment boundary controls, and gated graph rollback.
23. `EVIDENCE-FRESHNESS-RECONCILIATION-REV36.md` — evidence provenance, source-specific freshness, stale status handling, and read-only reconciliation.
24. `PROJECT-SERVICE-REGISTRY-REV37.md` — unified read-first project/service inventory without a competing source of truth.
25. `ARCHITECTURE-COMPLETION-GATE-REV38.md` — historical acceptance checklist before moving from architecture-only work to code/runtime reconciliation.
26. `ARCHITECTURE-COVERAGE-AUDIT-REV39.md` — ten-domain conceptual coverage audit and runtime evidence boundary.
27. `GRAPH-VALIDATION-AUDIT-REV40.md` — static graph/schema validation results and unresolved build/runtime test boundary.

## Architecture scope represented in the graph

- SIMOT Core, orchestration, task lifecycle, planner/executor, context and result assembly.
- Project/service registry for ownership, lifecycle, repository/runtime references, dependencies, and evidence-based status.
- VPS Master Memory and continuity contract as canonical operational state.
- Cloudflare Worker Gateway, VPC/service boundary, D1, queues/DLQ and AI Workers as distinct runtime roles.
- Client Channel Adapters for desktop/web, Android/OpenClaw, text/voice, and file/image/document flows; Tailscale private operator access.
- GitHub, Notion, SharePoint/OneDrive, Asana, HubSpot, and Cloudflare integration adapters.
- API/message contracts, correlation/idempotency, cancellation/timeout, structured failure and evidence records.
- Data governance/classification, source-of-truth policy, connector scopes, identity/secrets boundaries, explicit human operator, and scoped approval.
- Operational modes, change/release gates, recovery policy, model routing/cost policy, graph schema/review/validation/history.

## Current phase and explicit boundaries

- **Phase:** conceptual architecture coverage is PASS; read-only runtime reconciliation is in progress. Build/UI/runtime implementation tests remain separate and are not assumed complete.
- **Tests/build/runtime probes:** NOT RUN in this phase by design.
- **Graph and documents:** committed to the existing feature branch only.
- **Inspector scope:** `src/App.jsx` now supports selecting a relationship to inspect its relation, status, evidence, and permission; manually drawn links also receive explicit contract fields. This is source-level work only and has not been built or tested.
- **Documentation alignment:** `ARCHITECTURE.md`, `ARCHITECTURE-OPERATING-MODEL.md`, and this index align to graph revision 41 and 77 nodes / 190 edges. The latest graph retains top-level relation, status, evidence, and permission metadata.
- **Runtime integration:** graph nodes are not proof of live connectivity or permissions. Keep PLANNED/NOT TESTED where evidence is absent.
- **Deployment:** no public deployment and no merge to master.
- **VPS source sync — last VERIFIED through revision 36:** User-provided PuTTY output confirmed commit `af7f20455dc0f5179465cb8184c72a1b9468dd71` with 75 nodes / 182 edges. Revision 41 is **NOT YET SYNCED** to VPS. Preserve the local `vite.config.js` modification and existing `dist/`, `node_modules/`, and `package-lock.json`; do not overwrite them blindly. Vite build and UI rendering remain NOT TESTED. Worker → VPC → Tunnel → VPS Master Memory was verified for two read-only GET routes on 2026-10-13; the VCP UI itself is still static and not live-connected to canonical status.
- **Safety:** no new costs, credentials, secrets, or infrastructure were created or changed.

## Next continuation

The conceptual model has passed its ten-domain coverage review. Revision 41 records the owner-run read-only Worker → VPC → Tunnel → VPS Master Memory checks and scopes those claims to the two tested GET routes. Source inspection also confirms that `src/App.jsx` still loads the static graph and downloads JSON locally; it does not read live canonical state. Next, inspect the existing VPS-side proxy/API configuration read-only without printing tokens, then design the smallest authorized read-only integration. Before claiming the phone/VPS UI reflects revision 41, verify the VPS checkout and served UI revision. Do not merge or deploy.


Revision 37 adds `project-service-registry` and five planned relationships. Revision 38 adds `architecture-acceptance-gate` and three planned relationships plus the acceptance checklist. No tests, build, runtime probes, deployment, or merge were performed.


## Revision 39 audit result

Architecture coverage is `PASS (conceptual coverage)`; revision 40 static schema audit passed. Revision 41 adds evidence-backed status updates for the two read-only Worker → VPS routes. Build/UI tests remain NOT TESTED; the VCP is not live-connected. VPS sync remains confirmed only through revision 36. No merge or deployment.


## Revision 40 schema audit result

Graph revision 40 contains 77 nodes and 190 edges. Static validator-equivalent checks passed after normalizing `human-escalation.data.capabilities` to an array. The actual Node validator command, Vite build, UI test and VPS runtime remained NOT TESTED in that audit. VPS sync was verified only through revision 36; revision 40 was not synced.


## Revision 41 read-only runtime reconciliation

See `RUNTIME-READ-ONLY-RECONCILIATION-REV41.md`. Owner-run GETs on 2026-10-13 verified the tested Worker → VPC → Tunnel → VPS Master Memory read path. This evidence does not prove task execution or make the VCP UI live. The VCP source still loads a static graph; current VPS-side proxy contract, Vite build, UI behavior, and revision 41 VPS sync remain NOT TESTED.
