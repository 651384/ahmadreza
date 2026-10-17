# SIMOT graph synchronization contract

## Source of truth

- Canonical editable graph: VPS Master Memory object `working/simot-core-overview`.
- Cloudflare D1: synchronized operational replica in `control_plane_graphs`; it does not replace VPS Master Memory.
- GitHub: version-history mirror written to `simot-ai-os/data/control-plane-graphs/simot-core-overview.json` on an explicitly configured branch. It does not overwrite the UI's existing `src/graph-v1.json`.

## Authenticated Worker endpoints

All endpoints require `Authorization: Bearer <SIMOT_MAILBOX_TOKEN>`. The token value must never be logged or returned.

- `GET /control-plane/graph-sync`: read D1 mirror metadata/content.
- `POST /control-plane/graph-sync`: sync a graph snapshot into D1.
- `POST /control-plane/graph-sync/github`: commit the same canonical snapshot to GitHub.
- `POST /control-plane/graph-sync/run`: read the current canonical graph directly from VPS Master Memory, verify its exact SHA-256, sync to D1 with revision conflict protection, then attempt GitHub sync. This is the intended one-call operation for a trusted server-side client; browser-supplied graph content is not accepted by this route.

The canonical orchestration reads `/memory/working/simot-core-overview` using the existing `SIMOT_MASTER_MEMORY` VPC binding and `SIMOT_MASTER_MEMORY_TOKEN`. It checks the source metadata hash against the exact content before writing a replica.

## Payload contract for direct D1/GitHub routes

```json
{
  "bucket": "working",
  "object_id": "simot-core-overview",
  "expected_d1_revision": 0,
  "content": "<exact content string read from VPS Master Memory>",
  "source_memory": {
    "system": "VPS_MASTER_MEMORY",
    "version": 6,
    "sha256": "<SHA-256 of the exact content string>"
  }
}
```

For D1, `expected_d1_revision` must equal the current D1 revision (0 when absent). The handler validates graph schema, unique node/edge IDs, edge endpoints, payload size and hash; it rejects stale/conflicting writes and reads the row back after writing.

GitHub sync is disabled unless the existing Worker environment supplies `SIMOT_GITHUB_TOKEN`, `SIMOT_GITHUB_REPOSITORY`, and `SIMOT_GITHUB_BRANCH`. No secret is created by this change. The route uses the Contents API and returns only commit/blob metadata, never the token.

## VCP UI integration

- `simot-visual-control-plane/src/GraphSyncPanel.jsx` is a destination-aware control that displays source revision/hash and separate D1/GitHub outcomes.
- `simot-visual-control-plane/vite-graph-sync-proxy.js` forwards the UI request server-side to the Worker. It only accepts HTTPS `*.workers.dev` targets and reads `SIMOT_WORKER_URL` and `SIMOT_MAILBOX_TOKEN` from the Vite process environment; the token is never sent to browser JavaScript.
- Integrate the proxy into the **current** Vite config by importing `simotGraphSyncProxy` and adding it to the existing `plugins` array. Preserve the current custom VPS Master Memory proxy; do not replace the Vite config with the older copy in this branch.
- Mount `GraphSyncPanel` in the existing current `App.jsx`. Do not replace the current file with the older branch version, which does not include the live canonical VPS read/save behavior.
- If either server-side environment variable is missing, the proxy returns `GRAPH_SYNC_PROXY_NOT_CONFIGURED`; it fails closed.

## Operational rollout

This branch is implementation-only. It has not been merged or deployed. Do not configure a GitHub token or deploy the Worker until explicitly approved. The VCP UI still needs to mount the new panel and add the proxy plugin to the **current local working tree**, preserving its uncommitted canonical-memory integration. The orchestration returns a partial result if D1 succeeds but GitHub is not configured; callers must show per-destination status rather than treating HTTP 200 alone as full success.
