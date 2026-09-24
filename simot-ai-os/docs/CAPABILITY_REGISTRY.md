# SIMOT AI OS — Capability Registry

Date: 2026-09-24

## Core connected capabilities

### GitHub
Repository inspection, file read/create/update/delete, commits, branches, workflow runs/jobs/logs, artifacts, issues, pull requests, reviews, statuses, comparisons.

Repository: 651384/ahmadreza
Permissions verified: admin/maintain/push/pull/triage.

### Web
Current web research, official documentation, pages, PDFs, screenshots, image/business/product search, structured web results.

### Remote Desktop Commander
Authorized-machine discovery, filesystem operations, process inspection/control, terminal/process interaction and diagnostics. Use only when required; PC must remain optional.

### Files
Conversation/Library file search, read, find, list, materialize, and library management.

### OpenAI Platform
OpenAI API key setup/management workflows where the connector and account permissions allow them. Never expose credentials.

### Automation
Scheduled/recurring reminders, searches, conditional checks and supervisor-style automation. Use as external supervision/fallback, not as a replacement for the Cloudflare runtime.

### Notion
Search/read/create/update documentation, databases, comments and knowledge capture.

### Asana
Tasks, subtasks, projects, comments, attachments, status and project management.

### Todoist
Tasks, projects, sections, labels, filters, reminders, comments and productivity data.

### monday.com
Boards, items, columns, users, updates, workspaces, dashboards, automations, workflows and related management capabilities.

### Miro
Boards, spaces, sections, canvas objects, tables, images, SVG and visual architecture/process work.

### Canva
Design search/read/create/edit, brand assets/templates, resizing, bulk/autofill and related design operations.

### Gamma
Presentation/document generation, themes, templates, analytics, comments and export.

### HeyGen
Avatars, voices, video generation, translation, lipsync, clipping, templates and brand assets.

### Descript
Media/project operations, AI project workflows, publishing and job monitoring.

### LinkedIn
Professional person search.

### LinkedIn Ads
Ad accounts, ad sets/ads and performance operations available through the connector.

### HubSpot
CRM objects, companies, contacts, deals, campaigns, marketing content, analytics and related CRM operations.

### Apollo
Prospecting/company/contact discovery and enrichment capabilities exposed by the connector.

### Microsoft SharePoint / OneDrive
Search/read/write, folders/files, upload/move/copy/delete, permissions, versions, sharing and restore capabilities.

### Railway
Projects, services, deployments, variables, domains, metrics, logs, redeploy and related operations. Use only for workloads that genuinely belong outside the Cloudflare core.

### Ads Manager
Ad accounts, campaigns, ad groups, ads, insights, conversion sources/events, product feeds, creative operations and audit/onboarding functions exposed by the connector.

### Plugin Management
Search, inspect, suggest/install, permission and plugin lifecycle operations.

### Prompt Perfect
Prompt analysis, rewriting, rendering and prompt-library operations.

### Data / Analytics
Data quality, product/business analysis, KPI design, market sizing, dashboards, reports, visualization, notebooks and validation workflows.

## Important distinction
A connector being available does not prove that the user's external account is connected or that every operation is authorized. Verify the specific account/permission before claiming access.

## Missing high-value infrastructure access
No direct Cloudflare Management connector is currently available in the AI tool environment. This is the main infrastructure-management gap.

Potential future external credentials, only when needed:
- Telegram Bot
- Email provider
- WhatsApp Business
- CRM/ERP/accounting
- Banking/payment systems
- Trade/market intelligence providers
- Google services
- Cloud storage
- Customer communication systems
- Additional AI providers

Do not request or add integrations merely because they exist. Add them when a concrete workflow requires them.
