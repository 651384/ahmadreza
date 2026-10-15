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
- `POST /control-plane/graph-sync/run`: read the current canonical graph directly from VPS Master Memory, verify the exact SHA-256, sync to D1 with revision conflict protection, then attempt GitHub sync. This is the intended one-call operation for a trusted server-side client; the graph content is not accepted from the browser for this route.

POST body:
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

For D1, `expected_d1_revision` must equal the current D1 revision (0 when absent). Source version/hash must come from the same VPS read as `content`. The handler validates graph schema, unique node/edge IDs, edge endpoints, payload size and hash; it rejects stale/conflicting writes and reads the row back after writing.

GitHub sync is disabled unless the existing Worker environment supplies `SIMOT_GITHUB_TOKEN`, `SIMOT_GITHUB_REPOSITORY`, and `SIMOT_GITHUB_BRANCH`. No secret is created by this change. The route uses the Contents API and returns only commit/blob metadata, never the token.

## Operational rollout

This branch is implementation-only. It has not been merged or deployed. Do not configure a GitHub token or deploy the Worker until explicitly approved. The current VPS-hosted VCP UI still needs a small integration patch to invoke `POST /control-plane/graph-sync/run` through a trusted server-side proxy; never expose `SIMOT_MAILBOX_TOKEN` in browser code. UI wiring is not complete. The orchestration returns a partial result if D1 succeeds but GitHub is not configured; callers must show per-destination status rather than treating HTTP 200 alone as full success.
