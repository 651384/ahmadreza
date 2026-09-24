# SIMOT AI OS — Source of Truth

## Locked architecture correction

- ID: SOT-ARCH-LOCAL-PC-001
- Version: 2.1.0
- Effective: 2026-09-25
- Status: LOCKED
- Control plane: CLOUDFLARE
- Local PC dependency: FALSE

## Required execution order

1. Load/consult the Execution Standard.
2. Run mandatory preflight.
3. Fail closed if the standard is unavailable, mismatched, or violated.
4. Execute only through Cloudflare runtime paths.
5. Persist state/evidence to D1.
6. Continue autonomous watchdog/recovery through Cloud Cron.

## Prohibited regression

Do not route runtime work through a laptop, PowerShell, Desktop Commander, Wrangler CLI, Codex, or Arena.

## Operational rule

This SOT correction is an architectural invariant, not a suggestion. Future implementation work must preserve it.
