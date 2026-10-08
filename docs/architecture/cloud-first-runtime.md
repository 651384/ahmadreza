# RETIRED — SIMOT Cloud-First Runtime Architecture

Status: RETIRED / NON-CANONICAL
Retired: 2026-10-08
Authority: `continuity/CONTINUITY_CONTRACT.md` (SIMOT-CANONICAL-001 v3.0.0)

This document is retained only as historical context. It MUST NOT be used as an operating standard, runtime policy, current-state source, or authorization source.

The canonical rules now require:
- ONE STANDARD: `continuity/CONTINUITY_CONTRACT.md`
- ONE CURRENT STATE: `continuity/CURRENT_STATE.json`
- ONE CANONICAL CONTINUITY MEMORY: `/srv/simot-memory/`
- Cron, Watchdog, heartbeat, periodic reconciliation and automatic recovery are DORMANT unless separately approved.
- Local PC is not a runtime dependency.
- VPS is infrastructure/bridge only, not a competing control plane or SOT.

Historical statements in the previous version about an active Worker cron heartbeat/watchdog are obsolete and must not be reactivated by inference.

For current architecture and execution rules, use only the canonical continuity contract and current state.
