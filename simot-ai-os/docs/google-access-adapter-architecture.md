# SIMOT-AI-OS Google Access Adapter Architecture

## Decision
SIMOT-AI-OS does not depend on simottrade.com and does not require a local computer.

Google access is implemented as an adapter layer. The Cloudflare Worker remains the system core; external Google-capable connectors are treated as provider adapters and are selected per capability.

## Current adapter matrix

| Capability | Adapter | Current state | Mode |
|---|---|---|---|
| Gmail read/search | Notion Mail / Gmail-backed connection | connector tool is present in the environment but not callable from the current runtime | READ |
| Gmail send/reply | Superhuman Mail | available for connection; user connection required | WRITE |
| Google Calendar read/write | Superhuman Mail | available for connection; user connection required | READ/WRITE |
| Google Sheets | Windsor.ai | authorization URL available | READ |
| Google Analytics 4 | Windsor.ai | authorization URL available | READ |
| Google Search Console | Windsor.ai | authorization URL available | READ |
| YouTube | Windsor.ai | already connected for the Google account | READ/WRITE only where Windsor exposes it |
| Google Ads | Windsor.ai | authorization URL available | READ/WRITE where Windsor exposes it |
| Google Business Profile | Windsor.ai | authorization URL available | READ/WRITE where Windsor exposes it |
| Google Merchant Center | Windsor.ai | authorization URL available | READ |
| Google Workspace Admin Reports | Windsor.ai | authorization URL available | READ |

## Explicit non-capabilities
The native Google Drive, Gmail, Calendar and Contacts connectors are unavailable in this ChatGPT environment because they are disabled by the administrator. The architecture must not depend on them.

## Control-plane rule
Cloudflare does not store Google passwords. Provider adapters hold their own OAuth sessions/tokens. SIMOT-AI-OS receives normalized data/actions through adapter contracts and records evidence in its own D1 state.

## Required normalized contract

Each adapter operation should return:
- provider
- capability
- operation
- account
- status
- evidence
- external_reference
- data
- error
- retryable
- timestamp

No operation may be reported as completed unless the adapter returned successful evidence.

## Security
- Never place Google passwords, OAuth client secrets, refresh tokens, or provider credentials in GitHub.
- Do not invent country, address, billing identity, or Google Cloud credentials.
- Prefer provider OAuth consent flows.
- Keep provider-specific credentials outside SIMOT-AI-OS source code.
- Cloudflare remains the orchestration/control-plane layer.

## Production boundary
Production Worker:
https://simot-ai-os-gateway.vahid-ahmadreza.workers.dev

Google OAuth, where native Google Cloud credentials are unavailable, must not be coupled to simottrade.com.

## Current practical route
1. Use existing connected intermediary capabilities immediately.
2. Connect Superhuman Mail for Gmail + Google Calendar access.
3. Connect Google Sheets / Analytics / Search Console / Ads / Business Profile / Merchant / Workspace Reports through Windsor.ai authorization flows.
4. Feed normalized adapter results into SIMOT-AI-OS as evidence-backed events.
5. Keep native Google Cloud OAuth as an optional adapter, not a system dependency.

## Limitation
An intermediary cannot magically grant an API capability it does not expose. Gmail write, Drive/Docs/Slides direct manipulation, Contacts, and other Google products require an intermediary that explicitly exposes those operations. The system must record such gaps as BLOCKED capability states rather than pretending access exists.
