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

- `VERIFIED`: only the exact relationship claim supported by its cited evidence is verified; this does not make adjacent nodes or other edges verified.
- `PLANNED`: intended architecture only; implementation/runtime evidence is not recorded and runtime permission is not implied.
- `NOT TESTED`: current result is unknown; do not infer healthy or failed.
- `BLOCKED`: do not activate the relationship until the blocker is resolved and the required approval exists.
- `FAILED`: preserve the failure evidence and do not display the relationship as successful.
- `CONFIG_ONLY`, `NOT_VERIFIED`, and `NOT_CONNECTED`: preserve their distinct meanings and do not collapse them into `NOT TESTED`.

## Security and source-of-truth boundary

This contract describes graph metadata only. It does not grant permissions, create connections, run a test, write to VPS Master Memory, or change any runtime component. The existing VPS Master Memory remains the canonical operational continuity record. Sensitive writes, production changes, merges, secret changes, and cost-bearing operations remain gated by explicit approval.

## Revision 21 change

Revision 21 completes missing `relation`, `evidence`, and `permission` fields on the graph's existing 153 edges without changing node/edge identities or changing the existing edge status labels. For planned and blocked relationships, metadata explicitly states that runtime access/implementation is not thereby verified.

No build, test, runtime probe, deployment, merge to master, or canonical memory write was performed for this revision.
