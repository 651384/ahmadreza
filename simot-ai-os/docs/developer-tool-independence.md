# SIMOT AI OS — Developer Tool Independence

## Decision
SIMOT AI OS MUST NOT depend on Codex, a specific IDE, a specific local CLI, or a specific developer session for runtime operation.

## Required boundaries
- The canonical operating standard is `continuity/CONTINUITY_CONTRACT.md` (SIMOT-CANONICAL-001 v3.0.0).
- `continuity/CURRENT_STATE.json` is the canonical current-position record.
- `/srv/simot-memory/` is the canonical live continuity memory when installed; the repository `continuity/` directory is its versioned installation package.
- GitHub is the code/version-control surface, not an alternate project-current-state memory.
- Cloudflare is the target runtime platform only after explicit activation/release gates.
- Local developer tools are optional implementation aids, not runtime dependencies.
- Provider execution remains disabled until separately approved.
- Notion, SharePoint/OneDrive, Asana, HubSpot and other connected systems are supporting sources; they do not override the canonical continuity contract/current state.

## Operational rule
If Codex becomes unavailable, rate-limited, or removed, SIMOT AI OS must remain architecturally valid and resumable from the canonical continuity memory plus verified repository/runtime evidence. No runtime contract, worker identity, queue contract, D1 schema, SIMOT-MSG protocol, or provider policy may require Codex.

## Change-control rule
Do not introduce Codex-specific environment variables, commands, APIs, workflows, credentials, or runtime assumptions into the SIMOT AI OS architecture.

## Current status
This decision changes dependency architecture only. It does not authorize Cloudflare provisioning, deployment, provider execution, PR merge, or paid services.
