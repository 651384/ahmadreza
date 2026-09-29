# SIMOT Server Change Guard

## Purpose

This policy is mandatory before any future work on the shared SIMOT VPS.

The VPS may be shared by SIMOT and an independent external project. SIMOT must not make changes that can unintentionally break the external project's network access, SSH access, ports, routing, firewall behavior, kernel/network behavior, or future node connectivity.

## Current VPS baseline

- VPS public IPv4: 103.75.198.41
- OS: Ubuntu 24.04.4 LTS
- CPU: 1 vCPU
- RAM: ~1.9 GiB
- Disk: 116 GB total, ~108 GB free at last verified baseline
- Internet: verified healthy, 0% packet loss to 1.1.1.1
- VPS -> Cloudflare SIMOT Worker: verified reachable
- Lotus/Filecoin software: not installed/detected at last verification
- Listening ports observed at baseline: no Lotus ports; active connections observed were SSH only

## Mandatory preflight before ANY server change

1. Re-check current SSH connectivity and preserve the active management path.
2. Inspect listening sockets and active network connections.
3. Inspect firewall state before changing it.
4. Inspect installed/enabled services before disabling or removing anything.
5. Inspect routes, DNS, and network configuration before changing them.
6. Check current CPU/RAM/disk state.
7. Check for newly installed or externally managed services that may belong to the independent project.
8. Compare the live state with the last recorded baseline.
9. If an unknown service, port, route, credential, or dependency is discovered, STOP and do not disable, delete, block, rotate, or overwrite it without explicit human approval.
10. Prefer reversible, additive changes. Never perform destructive cleanup as part of routine SIMOT setup.

## Firewall/network safety

- Do not blindly apply a restrictive firewall policy.
- Do not close or repurpose ports based only on the current absence of a listener.
- Do not change SSH port, authentication, routing, DNS, MTU, kernel networking, or outbound network policy without a verified rollback path.
- Do not block outbound connectivity needed by unknown/future services.
- After every network/security change, verify SSH, internet, DNS, and required SIMOT connectivity before continuing.

## Update policy

- OS security updates may be applied only after the preflight.
- Do not perform major distribution upgrades as routine maintenance.
- Do not remove packages merely because they are currently unused.
- Reboot only when necessary and only after confirming SSH recovery and service startup behavior.

## SIMOT isolation

- SIMOT services must remain logically separate from unrelated services/projects on the VPS.
- Do not import unrelated project credentials, keys, wallets, API tokens, or data into SIMOT.
- Do not store secrets in Git, source code, shell history, or ordinary logs.
- The VPS is an execution/bridge resource for SIMOT, not the source of truth for SIMOT architecture.

## Change gate

Every server change follows:

AUDIT -> PLAN -> APPROVAL IF RISKY -> CHANGE -> VERIFY -> RECORD

A change is not considered complete until its effect on SSH, network reachability, existing services, and SIMOT connectivity is verified and recorded.

## Important invariant

SIMOT configuration must NEVER assume that an unobserved or currently inactive service is unnecessary. Absence from the current process list is not proof that a service may safely be blocked, removed, or made unreachable.
