# Project & Service Registry Contract — Revision 37

## Purpose
Provide a unified, read-first index of SIMOT projects, services, repositories, runtime components, owners/maintainers, lifecycle, dependencies, and authoritative references. This closes the architecture gap between component-level tool registration and whole-project/service management.

## Authority and non-duplication
- This registry is an index, not a second memory or source of operational truth.
- VPS Master Memory remains canonical for operational continuity and current state.
- GitHub remains authoritative for source and version history; Cloudflare for its runtime evidence; Notion for architecture/policy; SharePoint/OneDrive for documents/evidence; Asana for tasks; HubSpot for CRM records.
- Store references/identifiers and metadata, not copied canonical records or secret values.
- Every field should name its authoritative source; conflicts are resolved by the assigned data domain, not by last-write-wins.

## Minimum record shape
- stable project/service ID and display name
- kind and lifecycle state (planned, active, deprecated, blocked, retired)
- accountable owner/maintainer when known
- source-of-truth reference and last-observed evidence reference
- repository/source reference and deployment/runtime reference when applicable
- dependencies and integration/capability references
- environment/scope and evidence observed-at / recorded-at timestamps
- access classification and permitted operator actions

Unknown fields remain unknown; do not infer ownership, deployment, health, or permissions. Never include tokens, passwords, private keys, or secret values.

## Reconciliation and status
- Start read-only and reuse existing sources/connectors.
- A repository or service record does not prove that a runtime is deployed or healthy.
- Current health requires fresh, scoped evidence from the owning runtime/source. Stale or missing evidence means NOT TESTED / UNKNOWN.
- Registry refresh must not automatically mutate VPS Master Memory or change graph statuses.
- Deduplicate by stable identifiers and authoritative references; do not create duplicate services, connectors, memories, or credentials.

## VCP presentation
The React Flow VCP may visualize inventory records and dependencies but is not canonical storage. Any future write workflow must pass identity, least-privilege, policy, human approval where sensitive, audit, and the existing Master Memory API/write guard where canonical memory is affected.

## Scope and acceptance
Revision 37 adds a planned registry node and five planned relationships only. No runtime inventory was collected, no implementation was connected, and no build, test, deploy, merge, or VPS command was run.
