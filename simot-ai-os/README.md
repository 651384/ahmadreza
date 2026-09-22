# SIMOT AI OS Runtime

Serverless runtime foundation for SIMOT-MASTER and bounded Workers.

## Current phase
SIMOT-MSG v2 gateway foundation. The runtime validates the controlled envelope, performs duplicate protection, records operational state in D1, and queues accepted messages.

Provider/model execution is intentionally not enabled in this package yet. Messages reaching the queue without an execution handler remain explicitly **WAITING** and are not reported as completed.

## Runtime states
FULL / DEGRADED / MANUAL. PAID is prohibited by default.

## Security
Secrets are runtime environment variables/secrets only. Never commit API keys, bot tokens, or Cloudflare credentials.

The message envelope is an application-level protocol, not cryptographic authentication. Stronger authentication/integrity must be provided by the transport or authoritative access-control layer when required.

## Current limitations
- Cloudflare D1 and Queue resources are not provisioned by this repository.
- `wrangler.toml` contains a placeholder D1 ID until an approved D1 resource exists.
- Provider router execution is not enabled; a free-only normalized router foundation now exists in `src/provider-router.js` and fails closed unless free status, data-class eligibility and payment-disabled conditions are verified.
- Production deployment requires runtime configuration and acceptance tests against the actual Cloudflare environment.
