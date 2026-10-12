# Graph Validation Audit — Revision 40

**Graph:** `simot-core-overview`, schema v1, revision 40  
**Graph commit:** `10b2c435ab4ef6d058ea3dd7607d7d10b7644f20`  
**Branch:** `feat/simot-visual-control-plane-react-flow`

## Result

**Static graph/schema validation: PASS.**  
**Vite build / browser UI test / VPS runtime: NOT TESTED.**

The static validation mirrors the checks declared in `scripts/validate-graph.mjs`; it was run against the fetched revision 40 JSON. This is not a claim that the Node script or Vite build was executed.

## Finding and correction

Revision 39 had a schema mismatch on node `human-escalation`: `data.capabilities` was a string while the validator requires an array. Revision 40 normalizes it to a one-element array:

```json
["توقف ایمن و درخواست تصمیم انسانی هنگام ابهام یا ریسک"]
```

No node or edge was added or removed. Counts remain 77 nodes and 190 edges.

## Checks performed against revision 40

- Schema name and schemaVersion: PASS
- Positive integer revision: PASS (40)
- Node positions finite: PASS
- Required node data fields present: PASS
- Node capabilities arrays: PASS
- Node/edge statuses in allowed enum: PASS
- Unique node IDs: PASS (77/77)
- Unique edge IDs: PASS (190/190)
- Edge source/target references valid: PASS
- Duplicate semantic edges: PASS (none)
- Required edge relation/evidence/permission metadata: PASS
- Dangling edges: 0
- Unconnected nodes: 0

## Test execution boundary

The connected Desktop Commander device was offline during this pass, and this environment has no network route to retrieve the repository or install its dependencies. No remote shell/VPS execution connector is available in the current tool set. Therefore:

- `node scripts/validate-graph.mjs`: NOT EXECUTED as a command; equivalent static checks above passed against the fetched JSON.
- `npm run build`: NOT TESTED.
- Browser/mobile rendering: NOT TESTED.
- VPS checkout / served graph revision: NOT TESTED in this pass; last known verified VPS revision remains 36.
- No VPS file, service, deployment, branch merge, or production setting was changed.

## Next action

Resume build and runtime reconciliation when a terminal to the existing development/VPS environment is available. Preserve local VPS `dist/`, `node_modules/`, and `package-lock.json` artifacts; do not overwrite them blindly. Keep the current feature branch isolated and do not merge to `master`.
