# Google OAuth setup — one-time user step

1. Open Google Cloud Console and create/select a project dedicated to SIMOT-AI-OS.
2. Enable:
   - Gmail API
   - Google Drive API
   - Google Calendar API
3. Configure the OAuth consent screen.
4. Create OAuth Client ID -> Web application.
5. Add this exact Authorized redirect URI after the SIMOT gateway hostname is confirmed:
   https://<SIMOT-GATEWAY-HOST>/google/oauth/callback
6. Do NOT paste the client secret into chat or GitHub.
7. Provide only the OAuth Client ID to the SIMOT setup process if requested; the client secret must be entered as a Cloudflare Worker secret.
8. Complete the Google consent flow with vahid.ahmadreza@gmail.com.

Important:
- The refresh token must remain server-side.
- Never commit client_secret.json.
- Do not use a Google service-account key for this personal Gmail account; user OAuth is the appropriate model.
