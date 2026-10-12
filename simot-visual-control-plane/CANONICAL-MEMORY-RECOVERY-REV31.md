# Canonical Memory Backup & Recovery Contract — Revision 31

## Scope
Define safe backup and recovery expectations for the existing VPS Master Memory continuity package. This contract does not create a backup service or authorize a restore.

## Protected record
The canonical package remains the existing five-file set:
- `CONTINUITY_CONTRACT.md`
- `CURRENT_STATE.json`
- `DECISIONS.json`
- `EVIDENCE_INDEX.json`
- `TASK_LOG.jsonl`

Do not create a competing memory system. Any backup is a recoverability copy of the canonical source, not a new source of truth.

## Required controls
- A backup must have a timestamp, source/version reference, integrity evidence, and access scope.
- Secrets and sensitive payloads must be excluded or protected; never print secret values in logs.
- Before restore, capture the current state and preserve a rollback copy where feasible.
- Restore requires explicit owner approval and a declared target scope; no automatic rollback or destructive overwrite.
- Validate file completeness, parseability, cross-file consistency, state version, and task/evidence linkage after restore.
- Record actor, reason, before/after state references, outcome, and verification evidence in the canonical task/evidence history.
- If backup freshness, integrity, permissions, or restore target are ambiguous, stop and escalate.

## Architecture path
`backup-rollback-policy → master-memory` describes policy governance only. Actual backup/restore mechanisms and current backup health remain `NOT TESTED` until inspected after the architecture-completion gate.

## Status
This is an architecture contract only. No backup was created, no restore was run, and no VPS or production state was changed.
