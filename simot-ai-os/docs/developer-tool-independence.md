# SIMOT AI OS — Developer Tool Independence

## Decision
SIMOT AI OS MUST NOT depend on Codex, a specific IDE, a specific local CLI, or a specific developer session for runtime operation.

## Required boundaries
- GitHub is the code/version source of truth for the runtime repository.
- Notion is the authoritative SOT for architecture, decisions, SOPs, and implementation control.
- Cloudflare is the target runtime platform only after explicit activation/release gates.
- Local developer tools are optional implementation aids, not runtime dependencies.
- Provider execution remains disabled until separately approved.

## Operational rule
If Codex becomes unavailable, rate-limited, or removed, SIMOT AI OS must remain architecturally valid and resumable from GitHub + SOT. No runtime contract, worker identity, queue contract, D1 schema, SIMOT-MSG protocol, or provider policy may require Codex.

## Change-control rule
Do not introduce Codex-specific environment variables, commands, APIs, workflows, credentials, or runtime assumptions into the SIMOT AI OS architecture.

## Current status
This decision changes dependency architecture only. It does not authorize Cloudflare provisioning, deployment, provider execution, PR merge, or paid services.
