# Cloudflare Management Connector Access Plan

## Objective
Make Cloudflare the directly manageable control plane for SIMOT AI OS without changing existing security policies.

## Required control surface
- Account management
- Workers production configuration and deployments
- Worker secrets
- D1 administration
- Queues administration
- Workflows administration
- Workers Observability administration
- Production configuration inspection and controlled mutation
- API/account metadata

## Authorization
Use a dedicated account-owned Cloudflare API token/service principal. Cloudflare documents account-owned tokens as durable integrations and states that creating/updating them requires Super Administrator permission.

Minimum permissions should be scoped to the required account and resources. Do not use a Global API Key.

Required permission families:
- Account Management: Read/Edit as needed
- Workers: Admin/Editor at the narrowest practical scope
- D1: Read/Write
- Queues: Read/Write
- Workflows: Read/Write
- Workers Observability: Read/Write where required
- Workers Scripts: Read/Write where required
- Workers Routes: Read/Write only if routes/custom domains must be managed

## Security constraints
1. Never store the Cloudflare token in Git.
2. Never print the token to logs.
3. Store it only as a runtime secret.
4. Do not modify Access/WAF/security policies during bootstrap.
5. Default new management operations to read-only verification.
6. Require explicit authorization for destructive or security-sensitive mutations.
7. Log every management action to the SIMOT state/audit layer without recording secret values.

## Current blocker
There is no direct Cloudflare Management connector exposed to this ChatGPT session.

## Required user action
Create one dedicated Cloudflare account-owned API token with the permissions above and add it to the runtime secret store as the connector credential. Once the credential exists, the connector can be tested and expanded without changing existing security policies.

## Verification sequence
1. Authenticate.
2. Verify account identity and token scope.
3. Read Workers inventory.
4. Read D1 inventory.
5. Read Queues inventory.
6. Read Workflows inventory.
7. Read Observability configuration.
8. Read Worker secret metadata without exposing secret values.
9. Run a non-mutating end-to-end health check.
10. Only then enable controlled write operations.

## Source
Cloudflare API token documentation and current permission matrix were checked on 2026-09-24.
