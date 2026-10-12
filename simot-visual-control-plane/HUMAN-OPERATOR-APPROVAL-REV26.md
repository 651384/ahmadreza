# Human Operator & Approval Contract — Revision 26

**Graph:** `simot-core-overview`, schema version 1, revision 26  
**Graph size:** 71 nodes, 158 edges  
**Branch:** `feat/simot-visual-control-plane-react-flow`

## Why the actor is explicit

The architecture previously modeled a Human Approval Gate and Human Escalation but did not identify the human decision actor as a distinct node. Revision 26 adds `human-operator` and connects it to approval, escalation, and the visual control plane.

## Contract

- The human operator/owner is the decision authority for sensitive actions and escalations; this does not imply a new identity service.
- Every approval must be bound to an authenticated actor, a specific action, scope, version or change proposal, expiry, and recorded outcome.
- Approval is not a blanket authorization and never bypasses policy checks, connector permissions, identity checks, or cost/privacy restrictions.
- Missing, expired, ambiguous, or out-of-scope approval fails closed and must not trigger the protected action.
- The VCP remains a visualization/operator surface, not canonical operational memory. Graph edits and exports do not constitute VPS Master Memory writes.
- Audit evidence should record the request/correlation ID, actor identity reference (not a secret), decision, approved scope, version, timestamp, expiry, and outcome. Do not log secret values or unnecessary sensitive payloads.
- These nodes and edges are **PLANNED** architecture. No approval UI, authorization workflow, or audit implementation was activated or tested in this revision.

## Revision 26 change

Added node `human-operator` and edges:
- `e-operator-approval`: operator → approval gate (`DECIDES_APPROVAL`)
- `e-operator-escalation`: operator → human escalation (`RESOLVES_ESCALATION`)
- `e-operator-vcp`: operator → VCP (`OPERATES_CONTROL_PLANE`)

No tests, build, runtime probes, deployment, master merge, or canonical-memory writes were performed.
