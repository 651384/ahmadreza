# SIMOT Google OAuth Bridge

Status: IMPLEMENTATION READY — user OAuth consent required

## Purpose
Connect the SIMOT-AI-OS Cloudflare Gateway to the user's Google account without any local-PC dependency.

## Services
- Gmail API
- Google Drive API
- Google Calendar API

## OAuth model
Use Google OAuth 2.0 Web Server flow with offline access. The Cloudflare Worker stores the refresh token as a secret; access tokens are obtained/renewed server-side.

Google requires the APIs to be enabled in the Google Cloud project and an OAuth 2.0 Web application client with an exact redirect URI.

## Initial scopes
Gmail:
- https://www.googleapis.com/auth/gmail.readonly
- https://www.googleapis.com/auth/gmail.send

Drive:
- https://www.googleapis.com/auth/drive.readonly

Calendar:
- https://www.googleapis.com/auth/calendar.readonly
- https://www.googleapis.com/auth/calendar.events

These are intentionally separated so access can be reduced later.

## Planned Worker endpoints
- GET /google/oauth/start
- GET /google/oauth/callback
- GET /google/status
- POST /google/gmail/send
- GET /google/gmail/messages
- GET /google/drive/files
- GET /google/calendar/events
- POST /google/calendar/events

## Required secrets
Never commit these to GitHub:
- GOOGLE_OAUTH_CLIENT_ID
- GOOGLE_OAUTH_CLIENT_SECRET
- GOOGLE_OAUTH_REDIRECT_URI
- GOOGLE_OAUTH_REFRESH_TOKEN

## Required Cloudflare Worker variables
GOOGLE_OAUTH_REDIRECT_URI should point to the deployed gateway callback:
https://<gateway-domain>/google/oauth/callback

## Security
- OAuth state must be cryptographically random and validated on callback.
- Refresh token must never be returned by API responses or logged.
- Access tokens must be kept server-side.
- Gmail/Drive/Calendar payloads must be redacted from generic audit logs unless explicitly required.
- No Google write operation should execute without an explicit SIMOT authority path.
- No secrets belong in Git history.

## Current blocker
The code repository is ready for the bridge implementation, but the Google OAuth client credentials and redirect URI must exist before the callback can be authorized. The user must create/authorize the Google OAuth client once; after that the Cloudflare runtime can operate without a local computer.
