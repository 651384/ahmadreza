# SIMOT AI OS Integration Access Registry

Updated: 2026-09-24

| Integration | Target capability | Current state | Next action |
|---|---|---|---|
| Cloudflare Management API | Direct control plane | BLOCKED | Create dedicated account-owned API token and expose it only as a runtime secret |
| Telegram Bot | Bot messaging/webhooks | NOT CONNECTED | Obtain bot token; then wire adapter |
| Email Provider | Transactional/inbound email | AVAILABLE VIA CONNECTORS | Resend/Outlook options require connection |
| WhatsApp Business | Customer messaging | NO DIRECT CONNECTOR FOUND | Use approved API/provider credential and adapter |
| CRM | Customer/deal system | HUBSPOT CONNECTOR INSTALLED | Verify account connection |
| ERP | ERP operations | CONNECTOR OPTIONS FOUND | Select actual ERP and connect |
| Accounting | Accounting operations | CONNECTOR OPTIONS FOUND | Select actual accounting system and connect |
| Supplier Databases | Supplier discovery/enrichment | PARTIAL | Add concrete provider(s) |
| Trade Databases | Trade intelligence | PARTIAL | Add concrete provider(s) |
| Google Services | Drive/Gmail/etc. | SOME CONNECTORS ADMIN-DISABLED | Requires available/approved connector |
| Cloud Storage | Persistent documents | CONNECTOR OPTIONS FOUND | Select storage provider |
| Customer Communication | Omnichannel messaging | PARTIAL | Select channels/providers |
| External AI Providers | Model/provider routing | PARTIAL | Add provider credentials only when required |
| Search APIs | Programmatic search | EXA INSTALLED | Verify connection |
| Market Intelligence | Company/market intelligence | OPTIONS FOUND | Select provider based on workflow |

## Rule
Work top-to-bottom. Do not claim an integration is connected merely because a connector exists. A connected account and successful authenticated test are required.

## Safety
No Cloudflare Access, WAF, DNS security, or other existing security policy may be deleted, disabled, or changed as part of this access bootstrap unless explicitly authorized.
