# SIMOT Visual Control Plane — Architecture Index & Handoff

**Canonical graph artifact:** `simot-visual-control-plane/src/graph-v1.json`  
**Graph:** `simot-core-overview`, schema version 1, revision 40  
**Graph size:** 77 nodes, 190 edges  
**Working branch:** `feat/simot-visual-control-plane-react-flow`  
**Latest graph commit:** `10b2c435ab4ef6d058ea3dd7607d7d10b7644f20`

## Architecture documents

1. `ARCHITECTURE.md` — VCP implementation specification, reconciled to graph revision 40.
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

- **Phase:** architecture expansion in progress; the user requested architecture completion before testing/verification.
- **Tests/build/runtime probes:** NOT RUN in this phase by design.
- **Graph and documents:** committed to the existing feature branch only.
- **Inspector scope:** `src/App.jsx` now supports selecting a relationship to inspect its relation, status, evidence, and permission; manually drawn links also receive explicit contract fields. This is source-level work only and has not been built or tested.
- **Documentation alignment:** `ARCHITECTURE.md`, `ARCHITECTURE-OPERATING-MODEL.md`, and this index align to graph revision 38 and 77 nodes / 190 edges; all edges carry relation, status, evidence, and permission metadata at top level, with no duplicate nested status/evidence fields.
- **Runtime integration:** graph nodes are not proof of live connectivity or permissions. Keep PLANNED/NOT TESTED where evidence is absent.
- **Deployment:** no public deployment and no merge to master.
- **VPS source sync — VERIFIED through revision 36:** User-provided PuTTY output confirms the VPS checkout was synced to revision 36 at commit `af7f20455dc0f5179465cb8184c72a1b9468dd71`, with 75 nodes and 182 edges. Revision 38 is the current architecture target and is **NOT YET SYNCED** to VPS. The local `vite.config.js` modification and untracked `dist/`, `node_modules/`, and `package-lock.json` were preserved by the confirmed sync. UI rendering, build, service health, and live SIMOT integrations remain NOT TESTED.
- **Safety:** no new costs, credentials, secrets, or infrastructure were created or changed.

## Next continuation

Continue architecture-only work on the feature branch until the model is complete. Revisions 29–31 define canonical memory access, artifact intake, and recovery controls; revision 32 makes sync/async dispatch mutually exclusive; revision 33 limits D1 to runtime metadata; revision 34 defines cancellation, deadline propagation, and late-result fencing; revision 35 defines authority and rollback gates; revision 36 defines evidence freshness and read-only reconciliation; revision 37 adds a unified read-first project/service registry; revision 38 formalizes the architecture completion gate; revision 39 records the coverage audit and routes gateway ingress through request validation; revision 40 fixes the `human-escalation.capabilities` schema mismatch and records static validator-equivalent checks. After the user confirms the architecture gate, reconcile the graph and documents with actual code/runtime evidence, then perform tests and verification. Before claiming the phone/VPS UI reflects the newest graph, obtain fresh evidence that the VPS checkout was updated and the interface is serving that revision.


Revision 37 adds `project-service-registry` and five planned relationships. Revision 38 adds `architecture-acceptance-gate` and three planned relationships plus the acceptance checklist. No tests, build, runtime probes, deployment, or merge were performed.


## Revision 39 audit result

Architecture coverage is `PASS (conceptual coverage)`; graph static integrity is PASS. Build/tests/runtime and live integrations remain NOT TESTED. The gateway ingress edge correction is in the feature branch only. VPS remains confirmed through revision 36; revision 39 is NOT YET SYNCED. Continue only after explicit owner approval for the test/runtime reconciliation phase.


## Revision 40 schema audit result

Graph revision 40 contains 77 nodes and 190 edges. Static validator-equivalent checks PASS after normalizing `human-escalation.data.capabilities` to an array. The actual Node validator command, Vite build, UI test and VPS runtime remain NOT TESTED because no terminal is currently reachable. VPS remains verified only through revision 36; revision 40 is NOT YET SYNCED. Do not merge or deploy.
