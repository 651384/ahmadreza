# SIMOT Visual Control Plane — Client Channel Routing (Revision 24)

**Graph:** `simot-core-overview`, schema version 1, revision 24  
**Graph size:** 70 nodes, 155 edges  
**Branch:** `feat/simot-visual-control-plane-react-flow`

## Intended request path

1. Desktop/web, Android/OpenClaw, text/voice, and file/image/document inputs are represented by the Client Channel Adapters layer.
2. OpenClaw remains a client/interface bridge, not the SIMOT brain. It forwards client requests into the channel layer.
3. Client Channel Adapters submits requests to Request Ingress.
4. Request Ingress validates identity/scope and creates the SIMOT message envelope.
5. Orchestration, context assembly, planning, policy checks, task lifecycle, execution, and result/evidence assembly proceed through the graph's defined contracts.

## Intended response path

1. Result Assembly passes the result to Response Delivery.
2. Response Delivery returns it to Client Channel Adapters with request correlation preserved.
3. The channel layer returns it through the relevant bridge/interface, including OpenClaw where applicable.

## Boundaries

- These edges describe the target architecture only. They do not claim that desktop, voice/live audio, file/image, or every mobile path is currently implemented.
- OpenClaw is not a separate brain and does not own VPS Master Memory.
- Clients and channel adapters do not write canonical memory directly.
- File/image/document content is untrusted input and must pass data classification, permission checks, and policy before model/tool routing.
- Every new or changed relationship has explicit top-level `relation`, `status`, `evidence`, and `permission` fields.
- No build, test, runtime probe, deployment, master merge, or canonical-memory write was performed.
