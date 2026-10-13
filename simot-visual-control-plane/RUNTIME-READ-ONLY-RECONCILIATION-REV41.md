# Read-only Runtime Reconciliation — Revision 41

**Observed:** 2026-10-13  
**Branch:** `feat/simot-visual-control-plane-react-flow`  
**Graph:** `simot-core-overview`, schema v1, revision 41, 77 nodes / 190 edges  
**Scope:** Owner-provided read-only curl results plus source inspection of the current feature branch. No Worker/config/secret/VPS service changes, no write endpoint calls, no build, no browser test, no merge, and no deployment.

## 1. Live read-only evidence supplied by the owner

1. `GET /master-memory/test`
   - HTTP status: 200
   - `vpc_http_status=200`
   - `memory.ok=true`, service `simot-memory`
   - Route reported: `WORKER->VPC->TUNNEL->127.0.0.1:9100`

2. `GET /master-memory/e2e-read?object_id=E2E-BRIDGE-001`
   - HTTP status: 200
   - `vpc_http_status=200`
   - Object: `E2E-BRIDGE-001`, bucket `working`, version 1, status `ACTIVE`
   - Content: `SIMOT BRIDGE MEMORY PASS`
   - Route reported: `WORKER->VPC->TUNNEL->MASTER_MEMORY_READ`

These results verify the two tested read routes at the observed time. They do not verify queue-driven task execution, all Worker endpoints, provider health, external connector execution, or permanent availability. No memory write was performed.

## 2. Source inspection: React Flow is not yet live-connected

In the feature-branch `src/App.jsx`:
- Graph data is initialized from the static import `./graph-v1.json`.
- Export creates a browser `Blob` download and explicitly reports that it is not saved to Master Memory.
- No fetch/API call to VPS Master Memory or a status endpoint appears in this file.
- The VCP source directory contains `App.jsx`, `graph-v1.json`, `main.jsx`, and `styles.css`; there is no VCP-side `memory-contract.js` in this directory.

Therefore, the checked-in VCP app remains a static graph editor/viewer with local JSON export. Any local-only proxy or uncommitted VPS configuration is outside the evidence available from this GitHub source inspection and must not be assumed.

## 3. Existing Worker API boundary

The checked-in SIMOT Worker source defines:
- `GET /master-memory/test`: checks the upstream memory service health through the VPC binding.
- `GET /master-memory/e2e-read`: reads an allow-listed E2E object and checks its expected content.
- `GET|POST /master-memory/continuity-state`: requires `authorizeMasterMemoryBridge(request, env)`, uses the server-side `SIMOT_MASTER_MEMORY_TOKEN`, and proxies to `/continuity/state`.

The continuity-state endpoint must not be called directly from browser code with a secret exposed. The E2E endpoint is not a general current-state API. A safe VCP integration needs an already-authorized server-side/local proxy or a purpose-built read-only endpoint with an appropriate access boundary; the exact existing VPS proxy contract has not yet been inspected in this pass.

## 4. Revision 41 graph reconciliation

Updated only evidence-backed status fields in `src/graph-v1.json`:
- Nodes: `cloudflare-gateway`, `cloudflare-vpc`, `tunnel`, `vps`, `master-memory`.
- Edges: `e-worker-vpc`, `e-vpc-tunnel`, `e-tunnel-vps`, `e-vps-memory`.

Each update is scoped to the two successful read routes on 2026-10-13; it is not a blanket health claim. Graph size remains 77 nodes / 190 edges. Static checks after the edit found 0 duplicate node IDs, 0 duplicate edge IDs, and 0 dangling edge endpoints.

## 5. Remaining status

- Worker → VPC → Tunnel → VPS Master Memory read path: **VERIFIED** for the two tested GET routes.
- Static graph structure: **PASS** by equivalent checks against the updated JSON; the actual Node validator command was not run.
- VCP → live Master Memory/status API: **NOT IMPLEMENTED / NOT VERIFIED** in checked-in source.
- Vite build, browser/mobile UI, current VPS checkout and served revision: **NOT TESTED** in this pass.
- VPS sync: last previously verified only through revision 36; revision 41 is **NOT SYNCED** based on currently available evidence.
- Canonical VPS Master Memory write-back: **BLOCKED** in this session because no authorized direct VPS shell/API write path was available. No alternate memory store was created.

## 6. Next action

Inspect the existing VPS-side VCP service/proxy configuration read-only (without printing token values) to establish whether an authorized server-side read proxy already exists. Only then design the minimum read-only VCP integration. Do not expose `SIMOT_MASTER_MEMORY_TOKEN` or `.api-token` to browser code, do not use the E2E endpoint as canonical state, and do not deploy, merge, or enable writes.
