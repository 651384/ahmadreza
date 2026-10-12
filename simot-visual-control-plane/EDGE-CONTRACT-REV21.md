# SIMOT Visual Control Plane — Edge Contract (Revision 21)

**Graph:** `simot-core-overview`, schema version 1, revision 21  
**Graph size:** 69 nodes, 153 edges  
**Branch:** `feat/simot-visual-control-plane-react-flow`

## Required edge fields

Every edge must carry:
- `id`: stable unique identifier.
- `source` and `target`: existing node identifiers.
- `label`: concise relationship label for display.
- `relation`: normalized relationship contract; when no separate vocabulary is defined, it mirrors `label`.
- `status`: one of the graph's supported statuses.
- `evidence`: evidence for the specific edge claim, or an explicit statement that live implementation evidence has not been recorded.
- `permission`: execution scope and permission boundary. A planned edge must never imply a granted runtime permission.

## Status-specific interpretation

- `VERIFIED`: only the exact relationship claim supported by its evidence is verified; this does not make adjacent nodes or other edges verified.
- `PLANNED`: intended architecture only; implementation/runtime evidence is not recorded and runtime permission is not implied.
- `NOT TESTED`: current result is unknown; do not infer healthy or failed. This is the conservative status for a relationship whose status was missing or cannot be established from available evidence.
- `BLOCKED`: do not activate the relationship until the blocker is resolved and the required approval exists.
- `FAILED`: preserve the failure evidence and do not display the relationship as successful.
- `CONFIG_ONLY`, `NOT_VERIFIED`, and `NOT_CONNECTED`: preserve their distinct meanings and do not collapse them into `NOT TESTED`.

## Security and source-of-truth boundary

This contract describes graph metadata only. It does not grant permissions, create connections, run a test, write to VPS Master Memory, or change any runtime component. The existing VPS Master Memory remains the canonical operational continuity record. Sensitive writes, production changes, merges, secret changes, and cost-bearing operations remain gated by explicit approval.

## Revision 21 change

A static architecture review found 109 of 153 edges had no explicit `status`. Revision 21 fills those missing values with `NOT TESTED`, without changing any previously present status, node ID, edge ID, source, or target. The graph now has explicit statuses on all 153 edges: 119 `NOT TESTED`, 25 `PLANNED`, 6 `VERIFIED`, and 3 `BLOCKED`. These counts describe model metadata, not runtime health.

The same revision does not run tests, build the application, probe runtime services, deploy, merge to master, or write to VPS Master Memory.
