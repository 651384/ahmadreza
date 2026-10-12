# SIMOT Visual Control Plane — Architecture Index & Handoff

**Canonical graph artifact:** `simot-visual-control-plane/src/graph-v1.json`  
**Graph:** `simot-core-overview`, schema version 1, revision 25  
**Graph size:** 70 nodes, 155 edges  
**Working branch:** `feat/simot-visual-control-plane-react-flow`  
**Latest graph commit:** `088b28c0eeb9f231b510572a82d5ca79a819dbc4`

## Architecture documents

1. `ARCHITECTURE.md` — VCP implementation specification, reconciled to graph revision 25.
2. `ARCHITECTURE-OPERATING-MODEL.md` — core roles, source-of-truth hierarchy, request-to-result flow, continuity and safety.
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

## Architecture scope represented in the graph

- SIMOT Core, orchestration, task lifecycle, planner/executor, context and result assembly.
- VPS Master Memory and continuity contract as canonical operational state.
- Cloudflare Worker Gateway, VPC/service boundary, D1, queues/DLQ and AI Workers as distinct runtime roles.
- Client Channel Adapters for desktop/web, Android/OpenClaw, text/voice, and file/image/document flows; Tailscale private operator access.
- GitHub, Notion, SharePoint/OneDrive, Asana, HubSpot, and Cloudflare integration adapters.
- API/message contracts, correlation/idempotency, cancellation/timeout, structured failure and evidence records.
- Data governance/classification, source-of-truth policy, connector scopes, identity/secrets boundaries and human approval.
- Operational modes, change/release gates, recovery policy, model routing/cost policy, graph schema/review/validation/history.

## Current phase and explicit boundaries

- **Phase:** architecture expansion in progress; the user requested architecture completion before testing/verification.
- **Tests/build/runtime probes:** NOT RUN in this phase by design.
- **Graph and documents:** committed to the existing feature branch only.
- **Inspector scope:** `src/App.jsx` now supports selecting a relationship to inspect its relation, status, evidence, and permission; manually drawn links also receive explicit contract fields. This is source-level work only and has not been built or tested.
- **Documentation alignment:** `ARCHITECTURE.md`, `ARCHITECTURE-OPERATING-MODEL.md`, and this index reference graph revision 25 and 70 nodes / 155 edges; all edges carry relation, status, evidence, and permission metadata at top level, with no duplicate nested status/evidence fields.
- **Runtime integration:** graph nodes are not proof of live connectivity or permissions. Keep PLANNED/NOT TESTED where evidence is absent.
- **Deployment:** no public deployment and no merge to master.
- **VPS source sync — VERIFIED:** The user supplied PuTTY output confirming a successful fast-forward from `27c49c5` to `669c420ba2c880cf9ad61553a9387eea410de6cb`. The VPS checkout reports graph revision 25, 70 nodes, 155 edges, and `feat/simot-visual-control-plane-react-flow...origin/feat/simot-visual-control-plane-react-flow` with no ahead/behind marker. The local `vite.config.js` modification and untracked `dist/`, `node_modules/`, and `package-lock.json` remain preserved. Scope is source synchronization only: UI rendering, build, service health, and live SIMOT integrations remain NOT TESTED.
- **Safety:** no new costs, credentials, secrets, or infrastructure were created or changed.

## Next continuation

Continue architecture-only work on the feature branch until the model is complete. After the user confirms the architecture gate, reconcile the graph and documents with actual code/runtime evidence, then perform tests and verification. Before claiming the phone/VPS UI reflects the newest graph, obtain fresh evidence that the VPS checkout was updated and the interface is serving that revision.
