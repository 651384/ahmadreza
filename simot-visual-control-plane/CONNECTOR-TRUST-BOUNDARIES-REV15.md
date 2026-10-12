# SIMOT AI OS — Connector Trust & Deployment Boundaries

**Graph revision:** 15  
**Graph size:** 62 nodes, 125 edges  
**Branch:** `feat/simot-visual-control-plane-react-flow`

This is an architecture model and reconciliation checklist. It does not assert that a ChatGPT connector is already wired into SIMOT runtime. No live permission probing was performed for this document.

## 1. Trust and access matrix

| System | Authoritative data domain | Target access pattern | Default posture | Evidence status in this architecture phase |
|---|---|---|---|---|
| VPS Master Memory | Canonical operational state, decisions, continuity, evidence index, task log | SIMOT internal API; VCP read-only view | Read by default; sensitive writes require approval | Prior project record says continuity API was verified; no new endpoint check in this phase |
| Cloudflare Worker Gateway | Cloud runtime routes and request ingress | Authenticated route to configured backend | Deny unauthenticated requests; route-specific authorization | Existing component represented; no new live test |
| Cloudflare VPC binding / SIMOT-MASTER | Private gateway-to-VPS service path | Bound service call with secret kept server-side | No token in graph/logs; fail closed | Current binding access not rechecked in this phase |
| Cloudflare D1 | Runtime relational data only where explicitly designed | Least-privilege Worker binding | Not a replacement for Master Memory | NOT TESTED in this phase |
| Cloudflare Queue / DLQ | Asynchronous events and terminal failures | Producer/consumer bindings with retry and dead-letter policy | Bounded retries; no silent drops | NOT TESTED in this phase |
| GitHub | Source code and version history | Branch-scoped read/write through approved connector | Feature branch; no master merge without approval | Graph edits were committed to the existing feature branch |
| Notion | Architecture and policies | Scoped documentation access | Not canonical operational state | SIMOT runtime access NOT TESTED |
| SharePoint / OneDrive | Documents and evidence artifacts | Scoped document access | Not canonical operational state | SIMOT runtime access NOT TESTED |
| Asana | Tasks and execution tracking | Scoped task operations | Not canonical operational state | SIMOT runtime access NOT TESTED |
| HubSpot | CRM records | Scoped CRM operations | Not canonical operational state | SIMOT runtime access NOT TESTED |
| OpenClaw / phone client | User interaction and bridge | Client-to-SIMOT request path | Client is not the brain; no canonical memory ownership | Current phone approval and gateway status not rechecked here |
| React Flow VCP | Operator visualization | Private Tailscale HTTPS path; read-only first | Display layer only; no canonical writes | Previously reported available; no new runtime test in this phase |
| Ollama / model providers | Inference only | Model Router under policy and cost limits | No implicit provider or cost authorization | Current model/provider access NOT TESTED |

## 2. Operation scopes

For each connector, separately track:
- **Declared capability:** what the provider/API can theoretically do.
- **Requested scope:** what a particular operation asks to do.
- **Granted scope:** what credentials and permissions actually allow.
- **Observed evidence:** what a controlled, approved test proves.
- **Approval gate:** whether human approval is required before the operation.
- **Data classification:** allowed data types and retention requirements.
- **Freshness:** timestamp and evidence ID of the last actual check.

Target operation classes: `READ`, `CREATE`, `UPDATE`, `DELETE`, and `EXECUTE`. Do not collapse them into one generic "connected" status. A successful read does not prove write access. A connector visible in ChatGPT does not prove it is integrated into SIMOT runtime.

## 3. Required controls

1. Authenticate ingress and authorize the operation before execution.
2. Check connector scope immediately before a side effect.
3. Keep secret values outside graph data, documentation, ordinary logs, and evidence.
4. Require human approval for sensitive memory writes, deletion, secret changes, production release, merge to master, and cost-bearing actions.
5. Use idempotency/correlation on retryable side effects.
6. Distinguish accepted, in-progress, and terminal task results.
7. Record redacted actor/action/outcome and evidence references in the existing VPS Master Memory continuity system.
8. Treat unknown, stale, or missing evidence as NOT TESTED—not healthy.
9. Preserve the private Tailscale path and existing routes; do not add public exposure or modify infrastructure merely to complete the diagram.
10. PC is not a permanent runtime component in the target architecture.

## 4. Deployment and trust boundaries

- **Client boundary:** phone/OpenClaw submits requests; it does not own canonical state.
- **Operator UI boundary:** React Flow displays the graph and later may request read-only state from Master Memory; UI state is not canonical.
- **Private operator network:** Tailscale is the preferred private access path for VPS/VCP administration.
- **VPS boundary:** Master Memory API and continuity files remain under VPS control.
- **Cloud boundary:** Worker Gateway, configured service bindings, D1, queues, and AI Workers operate under their own auth and least-privilege bindings.
- **Provider boundary:** external model and business connectors receive only the scoped data and operations allowed by policy.

The diagram documents intended boundaries only; it does not change firewall, routes, tokens, deployments, or service permissions.

## 5. Next phase gate

Revision 15 has 62 nodes and 125 edges. Next, finish architecture-level policy coverage for data classification/retention, operational modes, and change/rollback. Once the user declares architecture complete, reconcile the model against existing code and live evidence. Do not run tests or verification before that gate.
