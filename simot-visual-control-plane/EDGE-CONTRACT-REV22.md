# SIMOT Visual Control Plane — Edge Contract (Revision 22)

**Graph:** `simot-core-overview`, schema version 1, revision 22  
**Graph size:** 69 nodes, 153 edges  
**Branch:** `feat/simot-visual-control-plane-react-flow`

## Canonical edge fields

Every edge stores its contract at the edge's top level:
- `id`, `source`, `target`, `label`
- `relation`
- `status`
- `evidence`
- `permission`

Do not duplicate `status` or `evidence` inside React Flow's optional `data` object. Conflicting copies can cause the inspector, metrics, export, and future consumers to disagree. The top-level fields are the canonical contract.

## Status meanings

- `VERIFIED`: only the exact relationship claim supported by its evidence is verified.
- `PLANNED`: intended architecture; implementation/runtime evidence is not recorded and runtime permission is not implied.
- `NOT TESTED`: current result is unknown; do not infer healthy or failed.
- `BLOCKED`: do not activate until the blocker is resolved and required approval exists.
- `FAILED`: preserve failure evidence and never display the relationship as successful.
- `CONFIG_ONLY`, `NOT_VERIFIED`, and `NOT_CONNECTED`: preserve their distinct meanings; do not collapse them into another status.

## Revision 22 correction

Revision 21 had introduced conflicting edge status/evidence copies: 109 edges were top-level `NOT TESTED` while their nested `data.status` remained `PLANNED`. Revision 22 restores those 109 statuses to `PLANNED`, retains the other existing statuses, promotes specific nested evidence where the top-level evidence was only a generic placeholder, and removes redundant nested copies. It does not change node IDs, edge IDs, sources, or targets.

Current top-level edge status counts: `NOT TESTED`: 10, `VERIFIED`: 6, `PLANNED`: 134, `BLOCKED`: 3. These are model labels, not runtime health results.

No tests, build, runtime probes, deployment, merge to master, or canonical memory write were performed.
