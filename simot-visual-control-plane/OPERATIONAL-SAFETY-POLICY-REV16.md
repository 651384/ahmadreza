# SIMOT AI OS — Operational Modes, Data Handling & Recovery Gates

**Graph revision:** 16  
**Graph size:** 64 nodes, 133 edges  
**Branch:** `feat/simot-visual-control-plane-react-flow`

This document records target policy, not verified runtime enforcement. No tests, deployments, backup operations, restores, or rollback actions were performed.

## 1. Operational modes

- **READ_ONLY:** default. Inspect and display information; do not mutate canonical state or external systems.
- **DESIGN_ONLY:** modify architecture artifacts on an approved development branch; do not test or activate runtime behavior until the architecture phase is declared complete.
- **AWAITING_APPROVAL:** pause the affected operation and preserve context; do not continue by timeout or assumption.
- **EXECUTION_ENABLED:** permitted only when the relevant identity, policy, scope, approval and runtime evidence are all valid. This is not a global switch that bypasses per-action authorization.
- **DEGRADED:** restrict operations when a required dependency, evidence source or authorization state is unavailable or stale.
- **MAINTENANCE:** block normal side effects while a declared maintenance/recovery action is in progress.

Unknown or contradictory mode must fail closed. A UI selection or architecture node does not itself enable execution. Mode transitions should record the actor, reason, timestamp, scope, and evidence in the existing canonical continuity system.

## 2. Data classification and handling

Proposed classification labels, to be reconciled with existing governance before enforcement:
- **PUBLIC:** approved for public release.
- **INTERNAL:** operational information limited to intended internal use.
- **CONFIDENTIAL:** restricted business or personal information.
- **RESTRICTED:** credentials, secrets, highly sensitive records, or data requiring the strongest handling controls.

Required policy dimensions:
- Purpose limitation and minimum necessary context.
- Allowed destinations/providers for each classification.
- Retention period, owner, and deletion authority by data domain.
- Redaction of secrets and unnecessary personal data from logs, evidence, and model prompts.
- Explicit handling of multipart payloads and attachments.
- Unknown classification blocks external transfer until resolved.
- Evidence retention follows task/audit requirements without creating a second memory store.

The labels above are a proposed taxonomy, not a claim that the current runtime applies them.

## 3. Human approval scope

Approval is scoped to one action or change and must not become blanket authorization. Record the action, target, proposed scope, approver/actor, decision, timestamp, expiry or applicable version, and outcome. Approval does not override policy, authentication, connector permissions, or data classification.

Human approval is required before:
- Sensitive writes to VPS Master Memory.
- Secret creation/rotation or trust-boundary changes.
- Deletion or irreversible external side effects.
- Merge to master or production deployment.
- Cost-bearing actions, new paid dependencies, or infrastructure changes.

## 4. Backup, recovery, and rollback

Before risky changes, the change gate should require a recovery plan appropriate to the affected data/system:
1. Identify the target and blast radius.
2. Identify an existing backup/recovery point; do not invent or create a duplicate backup system.
3. Confirm the recovery point is applicable and preserve newer canonical data.
4. Define rollback trigger, owner, and procedure.
5. Record the change and evidence reference.
6. After recovery, reconcile state and verify integrity before resuming operations.

Never perform destructive restore, deletion, or rollback without explicit authorization. A graph node does not prove that a backup exists or is restorable. The actual backup method must be discovered during the later verification phase.

## 5. Architecture phase gate

Revision 16 contains 64 nodes and 133 edges. The graph now models operational modes, classification boundaries, approval scope, and recovery readiness. These are architectural target controls; runtime enforcement remains untested. Do not run tests or verification until the user confirms the architecture is complete. Do not merge to master, deploy publicly, change secrets, alter infrastructure, or enable write paths without explicit approval.
