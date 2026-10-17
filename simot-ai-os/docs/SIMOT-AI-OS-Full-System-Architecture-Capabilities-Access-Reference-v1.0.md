# SIMOT AI OS — مرجع جامع هسته، معماری، دسترسی‌ها و وضعیت اجرا

**شناسه:** SIMOT-OS-REFERENCE-001 | **نسخه:** 1.0 | **تاریخ:** 2026-10-17  
**دامنه:** هسته SIMOT، Cloudflare، VPS Master Memory، React Flow VCP، GitHub، OpenClaw، adapters و backlog.

> این سند بر پایهٔ source GitHub، اسناد Notion/Asana و اجرای واقعی GitHub Actions تهیه شده است. وضعیت زنده فقط برای زمان‌های ثبت‌شده تأیید شده؛ secretها عمداً افشا نمی‌شوند.

## 1. خلاصهٔ مدیریتی

SIMOT AI OS هستهٔ ابری برای orchestration، routing به AI Workerهای تخصصی، authority gate، handoff، state، evidence و completion gate است. Cloudflare control plane است؛ VPS Master Memory منبع canonical تداوم عملیاتی است؛ D1 محل state اجرایی runtime است؛ GitHub منبع کد/CI/change control است. OpenClaw و React Flow رابط/bridge هستند، نه مغز SIMOT.

**Execution Standard:** 2.2.0  
**Standard ID:** SOT-ARCH-CLOUDFLARE-CORE-002  
**Runtime version در live health:** 0.5.0-4-jarvis-sync  
**Runtime state در آزمون:** ACTIVE  
**Operating mode:** BUILD / CONTROLLED MANUAL EXECUTION

ACTIVE به معنی فعال بودن سرویس است، نه مجاز بودن کارهای تجاری خودکار. Cron، watchdog، heartbeat پیوسته، periodic reconciliation و automatic recovery در BUILD dormant/disabled هستند.

چرخهٔ اجباری: **READ → RECONCILE → SELECT ONE NEXT STEP → CHECK AUTHORITY → ACT → VERIFY → WRITE-BACK → RECHECK → CONTINUE**.

## 2. معماری و نقش‌ها

~~~text
Interface / React Flow / OpenClaw
              |
              v
         SIMOT-MASTER
              |
      SIMOT-MSG v2.1
              |
     Cloudflare Worker
       /      |       \
      D1    Queues     Workers AI
              |
      SIMOT-AI-01..05
              |
    adapters + authority gates
              |
     evidence + completion gate
         /                 \
VPS Master Memory       GitHub source/CI
~~~

- **SIMOT-MASTER:** coordinator، task decomposition، routing، authority و handoff.
- **AI-01:** Research & Market Intelligence؛ تحلیل/تحقیق.
- **AI-02:** Import & Technical Trade؛ specification، HS/importability research، supplier discovery، RFQ/compliance preparation؛ commitment نیازمند approval.
- **AI-03:** Marketing & Content؛ محتوا و asset؛ انتشار/هزینهٔ تبلیغ بدون approval ممنوع.
- **AI-04:** Export & Commercial Operations؛ تحلیل فرصت، costing/quote draft؛ quote/contract نهایی gated.
- **AI-05:** Sales & Business Development؛ prospect research، qualification، outreach draft؛ ارتباط بیرونی gated.
- **Worker Gateway:** HTTP/webhook، validation، preflight و queue consumer.
- **D1:** runtime state، event/idempotency، worker/task registry، usage guard، manifest و graph snapshot.
- **Queues/DLQ:** handoff پایدار و failure isolation.
- **Workers AI:** AI runtime ابری با free/cost guard.
- **VPS Master Memory:** operational continuity و task/evidence write-back canonical.
- **GitHub:** code, branches, commits, CI و review.
- **Notion:** معماری/policy/decision؛ **SharePoint/OneDrive:** اسناد و evidence؛ **Asana:** task/dependency؛ **HubSpot:** CRM.
- **ChatGPT memory:** context فقط؛ نه operational SOT.

## 3. Cloudflare runtime

- Worker: **simot-ai-os-gateway**
- Base URL: https://simot-ai-os-gateway.vahid-ahmadreza.workers.dev
- Account ID: **28c48936d40df4c64bffc755f6c0ee7f**
- D1: **simot-ai-os**
- D1 ID: **6bb8ae5c-df7d-4c4b-bf0d-bdd73857a480**
- Queue: **simot-events**
- DLQ: **simot-events-dlq**
- Bindings: **SIMOT_DB**, **SIMOT_QUEUE**, **AI**, **SIMOT_MASTER_MEMORY**
- VPC service ID در Wrangler: **01a11105-c59d-7721-889a-8b368ef8c57d**؛ target name در معماری **simot-master-memory**.

Runtime config ثبت‌شده: model **@cf/zai-org/glm-4.7-flash**، روزانه حداکثر 200 درخواست، ورودی 6000 کاراکتر، خروجی 350 token و حداقل فاصلهٔ 5 ثانیه. Gemini config: **gemini-2.5-flash**، **GEMINI_FREE_MODE=1**، **SIMOT_VOICE_TEST_MODE=1**. مقدار voice model در کد **gemini-3.8-live** است؛ voice در این بررسی live تست نشده است.

### Endpointهای مهم

| مسیر | کاربرد | auth/محدودیت مشاهده‌شده |
|---|---|---|
| GET /health | نسخه/state | auth صریح ندارد؛ پاسخ سلامت محدود |
| GET /control-plane/manifest | manifest/standard | preflight |
| GET /workers/status | worker registry | read-only |
| GET /tasks/status | task registry | read-only |
| GET /completion/status | completion evidence | read-only |
| GET /master-memory/test | VPS health از VPC | health probe |
| GET /master-memory/e2e-read?object_id=... | object آزمایشی | فقط ID با prefix E2E- |
| GET/POST /master-memory/continuity-state | state + task/evidence | bearer SIMOT_MAILBOX_TOKEN و upstream SIMOT_MASTER_MEMORY_TOKEN |
| GET /master-memory/object-read | read object | bearer SIMOT_MAILBOX_TOKEN |
| POST /master-memory/object-write | write object | bearer SIMOT_MAILBOX_TOKEN، bucket/id/content validation |
| POST /control-plane/graph-sync/run | graph sync | bearer SIMOT_MAILBOX_TOKEN، confirm=true، preflight |
| POST /mcp | MCP tools | bearer SIMOT_MAILBOX_TOKEN |
| GET /cloudflare/management/status | management probe | بازبینی response exposure لازم |
| GET /cloudflare/management/snapshot | inventory snapshot | security review لازم |
| POST /webhook | SIMOT-MSG intake | envelope validation، idempotency و queue handoff |
| POST /telegram/webhook | Telegram input | secret/config gate؛ live connection نامشخص |
| GET /voice و POST /voice/token | voice test | test mode/key لازم؛ auth/rate limit باید بازبینی شود |
| /providers/gemini/* و /providers/exa/search | provider routes | auth/rate-limit review لازم |

چند route در source احراز هویت صریح ندارند؛ این به‌تنهایی اثبات آسیب‌پذیری نیست، اما endpointهای diagnostic/management/provider/voice باید از نظر authorization، rate limit و response data بازبینی شوند.

### Cloudflare management evidence

در live smoke در **2026-10-17T11:39:21.785Z**، management status=VERIFIED و token_status=active گزارش شد. Probeهای token، Workers، D1، Queues، Workflows و Secrets هرکدام HTTP 200 و بدون error گزارش‌شده داشتند. مقادیر secret و scope کامل token درج نشده است.

### D1 tables در source/schema

events، idempotency، provider_health، controller_heartbeat، watchdog_state، jarvis_mailbox، worker_registry، autonomous_tasks، control_plane_manifest، control_plane_graph_snapshots، ai_daily_usage، cloudflare_management_probe. این فهرست از source/schema است؛ inventory زندهٔ همهٔ جدول‌ها در همین نشست مجدداً query نشده است.

## 4. VPS Master Memory

- Host ثبت‌شده: **srv7015981364**
- OS ثبت‌شده: Ubuntu 24.04.4 LTS
- Tailscale IP ثبت‌شده: **100.122.11.71**
- Service: **simot-memory.service**
- API محلی: **http://127.0.0.1:9100**
- Root: **/srv/simot-memory/**

فایل‌های canonical:
- /srv/simot-memory/CURRENT_STATE.json
- /srv/simot-memory/TASK_LOG.jsonl
- /srv/simot-memory/EVIDENCE_INDEX.json
- /srv/simot-memory/CONTINUITY_CONTRACT.md
- /srv/simot-memory/DECISIONS.json

APIهای شناخته‌شده: GET /health، GET /memory/{bucket}/{id}، POST /memory، GET /list/{bucket}، POST /archive، GET/POST /continuity/state. Bucketهای مجاز در Worker source: inputs، evidence، outputs، working، index، metadata، versions، quarantine.

~~~text
Worker -> VPC binding SIMOT_MASTER_MEMORY
       -> service simot-master-memory
       -> http://127.0.0.1:9100
       -> Bearer SIMOT_MASTER_MEMORY_TOKEN
~~~

در live smoke در 2026-10-17T11:39Z، health و خواندن object ثابت E2E موفق بود. shell مستقیم و غیرتعاملی برای خواندن فایل‌های فعلی VPS در این نشست در دسترس نبود؛ بنابراین وضعیت لحظه‌ای systemd و CURRENT_STATE/TASK_LOG/EVIDENCE_INDEX مستقیماً از shell بازخوانی نشده است.

## 5. React Flow VCP و Graph Sync

- URL خصوصی VCP: https://srv7015981364.tail11b490.ts.net:8443/
- VCP local port: **127.0.0.1:4173**
- systemd: **simot-visual-control-plane.service**
- پروژه: **/opt/simot-visual-control-plane/simot-visual-control-plane**
- proxy: **vite-graph-sync-proxy.js**
- env file: **/etc/simot-vcp-graph-sync.env**
- GitHub token path: **/root/.config/simot/github-token**؛ مقدار token نباید چاپ شود.

مسیرهای VCP:
- GET /api/memory/working/simot-core-overview — read canonical graph
- POST /api/memory/graph-save — ذخیرهٔ کنترل‌شده در Master Memory
- POST /api/control-plane/graph-sync/run — sync دستی

### آخرین graph تأییدشده

- graph ID: **simot-core-overview**
- Master Memory version: **8**
- revision: **48**
- nodes: **77**
- edges: **190**
- updatedAt: **2026-10-17T13:08:16.616Z**
- SHA-256: **f99e4a69e1c5f148fb20c88723d81c67cbdee7c1553f60b7ceacbe478875702f**
- D1 synced_at: **2026-10-17T13:08:25.733Z**
- GitHub sync commit: **249efd450e69b060320f53405bd254c9397047ad**

فایل گراف: https://github.com/651384/ahmadreza/blob/feat/simot-visual-control-plane-react-flow/simot-ai-os/data/control-plane-graphs/simot-core-overview.json

D1 و GitHub دو مقصد جدا هستند و تراکنش اتمیک مشترک ندارند. اگر timeout/partial sync رخ داد، ابتدا منبع و مقصدها را فقط‌خواندنی بررسی کنید؛ sync را کورکورانه تکرار نکنید.

## 6. خطای مهم Master Memory E2E

Live Smoke run **39029519703** در 2026-10-17T11:39Z:
- Worker health، manifest، worker registry، Cloudflare management، VPS health و خواندن object ثابت E2E موفق بودند.
- write به bucket working پاسخ **COMPLETED / MASTER_MEMORY_WRITE_ACCEPTED** داد.
- read-back object تازه HTTP 502 داد و workflow شکست خورد.
- object آزمایشی: **E2E-CF-VPS-39029519703-1**؛ این گزارش آن را حذف یا تغییر نداده است.

علت در کد: endpoint **/master-memory/e2e-read** موفقیت را به محتوای ثابت **SIMOT BRIDGE MEMORY PASS** وابسته می‌کند، در حالی که آزمون write محتوای متفاوت **SIMOT_CLOUDFLARE_VPS_E2E_PASS:<object_id>** می‌نویسد. در نتیجه object جدید ممکن است واقعاً نوشته شود ولی endpoint آن را رد کند و 502 بدهد.

**اصلاح پیشنهادی:** قرارداد read-back را به مقایسهٔ محتوای مورد انتظار یا مسیر آزمایشی با قرارداد روشن تغییر دهید؛ prefix E2E- حفظ شود؛ write/read-back/cleanup مجاز جداگانه تست شوند. تا اصلاح و آزمون مجدد، این مسیر **FAILED** باقی می‌ماند.

## 7. GitHub، CI و ریسک deploy

- Repository: https://github.com/651384/ahmadreza
- Default branch: **master**
- Metadata دسترسی connector: admin/maintain/push/pull/triage=true
- master در metadata بررسی‌شده protected=false.
- شاخهٔ VCP: **feat/simot-visual-control-plane-react-flow**؛ protected=false.
- مقایسهٔ branch: **diverged، 219 commit جلوتر و 15 commit عقب‌تر**؛ merge/reset کور ممنوع.

Workflowها:
- .github/workflows/simot-ai-os-validation.yml
- .github/workflows/simot-ai-os-worker-e2e.yml
- .github/workflows/simot-ai-os-live-smoke.yml
- .github/workflows/simot-graph-sync.yml

شواهد 2026-10-17:
- Validation run **39029519705**: success، **90/90 tests**، Wrangler dry-run موفق، deploy step موفق.
- Worker E2E run **39029519770**: success.
- Live Smoke run **39029519703**: failure در E2E write/readback.
- Graph Sync run **39031694160**: success، اما برای revision 46/memory version 6 در زمان اجرای خودش؛ قبل از چرخهٔ دستی r48.

**ریسک policy:** validation workflow با push به master، پس از tests/dry-run، deploy را اجرا می‌کند. master محافظت‌شده نبود؛ بنابراین push می‌تواند deploy ایجاد کند. این با قاعدهٔ «بدون تأیید صریح production deploy نشود» تعارض دارد. اقدام پیشنهادی: deployment approval/environment gate و branch protection را بررسی کنید؛ در این گزارش هیچ policy تغییر نکرده است.

## 8. OpenClaw/Jarvis

- Gateway loopback: **127.0.0.1:18789**
- Tailscale URL ثبت‌شده: https://srv7015981364.tail11b490.ts.net/
- WSS endpoint ثبت‌شده: wss://srv7015981364.tail11b490.ts.net
- plugin source: **simot-ai-os/openclaw-plugins/simot-bridge/**
- plugin id: **simot-bridge**
- package: **@simot/openclaw-simot-bridge 1.0.0**
- minimum gateway version: **>=2026.9.6**

OpenClaw رابط و bridge است؛ SIMOT-MASTER authority و orchestrator باقی می‌ماند. voice، camera، reconnect، meeting capture و کل Universal Interface در این بررسی زنده تست نشدند.

## 9. Runtime adapters در برابر ChatGPT connectors

Adapter registry در source به‌صورت READ/INFORMATIONAL برای ONEDRIVE، NOTION، EXA، HUBSPOT، ASANA، CANVA، DESCRIPT، HEYGEN و GITHUB تعریف شده است. **این entryها اثبات اتصال runtime کامل نیستند.** tool-execution-bridge به‌صورت پیش‌فرض READ است و mode غیر READ را با WRITE_EXECUTION_NOT_ENABLED_IN_RUNTIME_BRIDGE مسدود می‌کند؛ writeهای خاص مثل E2E Master Memory adapter جدا و approval gate دارند.

در این نشست 36 گروه ابزار/namespace موجود بود:
- مهندسی/infra: GitHub، Cloudflare، DigitalOcean، Railway، Neon، MongoDB Atlas، GitBook، Remote Desktop Commander، OpenAI Platform، Floot.
- حافظه/مدیریت: Notion، SharePoint/OneDrive، Asana، monday.com، Todoist، Granola، Files.
- تحقیق/فروش: Exa، Apollo، LinkedIn، LinkedIn Ads، HubSpot، G2، Windsor.ai، ChatGPT Ads Manager.
- محتوا/رسانه: Canva، Gamma، HeyGen، Descript، Miro، Prompt Perfect.
- اتوماسیون/مدیریت ابزار: Automations، Plugin Management، Plugin Creator، Skills، Snake Retro.

Cloudflare connector identity پاسخ داد، ولی فراخوانی inventory مستقیم در این نشست به‌دلیل safety check ابزار مسدود شد. این با live Worker management probe موفق در GitHub Actions متفاوت است. DigitalOcean connector فهرست droplet خالی داد؛ این اثبات نمی‌کند VPS در DigitalOcean نیست. Remote Desktop Commander دستگاه DESKTOP-771TT6B را online نشان داد؛ این ابزار PC bridge است، نه اثبات shell VPS.

## 10. Notion، SharePoint، Asana و SOT

- VPS Master Memory: operational continuity canonical
- Cloudflare D1: runtime state/control plane
- GitHub: code/version/CI
- Notion: architecture/policy/decisions
- SharePoint/OneDrive: documents/inputs/evidence
- Asana: tasks/dependencies
- HubSpot: commercial/CRM SOT
- ChatGPT memory: context فقط

صفحات Notion خوانده‌شده:
- Master Memory Index: https://app.notion.com/p/3e1f18cef97181888f05d8421ed5dc50
- Runtime Memory Snapshot: https://app.notion.com/p/3f1f18cef9718102a54af92a3baa21c5
- Master Machine-Readable Specification: https://app.notion.com/p/3e5f18cef97181928334d049efc8e997
- Universal Interface Control: https://app.notion.com/p/3f0f18cef971816d8befd64e2e43c0e8
- Tool Architecture: https://app.notion.com/p/3e1f18cef9718164961efd8d297f45a6
- Implementation Control: https://app.notion.com/p/3e2f18cef9718139ba46d610a3f685e5

بعضی صفحات Notion در 5 و 10 اکتبر ویرایش شده‌اند و وضعیت تاریخی متناقض دربارهٔ canonical memory/Cloudflare access دارند. وضعیت فعلی باید با source و live evidence جدید reconcile شود.

Asana project: https://app.asana.com/1/1218659416353897/project/1218743580169181  
Snapshot دارای 12 task بود و برخی از سپتامبر ویرایش نشده‌اند. متن status پروژه هنوز PR #26 را draft می‌گفت، ولی GitHub نشان می‌دهد PR #26 در 2026-09-29 merge شده است. این ناسازگاری باید اصلاح شود.

PR #26: https://github.com/651384/ahmadreza/pull/26  
Merge commit: **be4282feb804477511bbba46cc8fbbd5757e656a**  
این تغییر، cron/watchdog/heartbeat خودکار را برای BUILD متوقف کرد.

## 11. Secrets — فقط نام و نقش

| نام | نقش |
|---|---|
| SIMOT_MAILBOX_TOKEN | auth endpointهای gated Worker؛ Worker/VCP/GitHub Actions graph sync |
| SIMOT_MASTER_MEMORY_TOKEN | auth Worker → VPS API |
| CLOUDFLARE_MANAGEMENT_API_TOKEN | inventory read از Cloudflare API |
| CLOUDFLARE_API_TOKEN | deploy از GitHub Actions |
| CLOUDFLARE_ACCOUNT_ID | تعیین حساب Cloudflare |
| GEMINI_API_KEY | Gemini generation/voice test؛ validity در این بررسی تست نشده |
| EXA_API_KEY | Exa search adapter؛ validity در این بررسی تست نشده |
| GitHub token file | /root/.config/simot/github-token؛ scope/permission دقیق مستقل تأیید نشده |

مقادیر token نباید در سند، log یا source چاپ شوند. نام secret و وجود آن با صحت، اعتبار و scope دقیق متفاوت است.

## 12. Backlog اولویت‌دار

### P0
1. اصلاح /master-memory/e2e-read و آزمون write/read-back.
2. خواندن زندهٔ CURRENT_STATE.json، TASK_LOG.jsonl، EVIDENCE_INDEX.json و وضعیت سرویس VPS با دسترسی مجاز.
3. تطبیق source/runtime بعد از deploy.
4. deploy approval gate و branch protection.
5. security review endpointهای public/auth/rate-limit.
6. write-back canonical پس از هر تغییر مهم.

### P1
1. تکمیل memory-first execution/handoff.
2. تکمیل bounded business task execution.
3. آزمون retry/DLQ/idempotency/failure recovery.
4. completion gate با evidence قابل ممیزی.
5. تکمیل adapterهای خارجی فقط برای workflowهای مشخص.

### P2
1. بررسی handler دکمهٔ sync؛ success فقط از پاسخ درخواست جاری.
2. نمایش درست partial sync/timeout و جلوگیری از retry کور.
3. reconciliation امن VPS/D1/GitHub/VCP.
4. راهبرد branch divergence بدون merge/reset کور.
5. اصلاح اسناد قدیمی Notion/Asana.
6. audit log، validation، rollback و controlled editing در VCP.

### P3
1. Multi-AI Orchestrator با capability/session registry و handoff واقعی.
2. Universal Interface برای Android/iOS/Windows، voice/image/camera/files/meeting پس از آزمون.
3. next-action engine و recovery خودکار فقط پس از خروج از BUILD و تصویب.
4. live connectivity registry با VERIFIED/FAILED/BLOCKED/NOT TESTED.
5. اتصال CRM/ERP/finance/messaging فقط در صورت نیاز واقعی و با کمترین هزینه.

## 13. URLهای کلیدی

| مورد | آدرس |
|---|---|
| Worker base | https://simot-ai-os-gateway.vahid-ahmadreza.workers.dev |
| VPS Master Memory API | http://127.0.0.1:9100 |
| VPS memory root | /srv/simot-memory/ |
| VCP project | /opt/simot-visual-control-plane/simot-visual-control-plane |
| VCP UI | https://srv7015981364.tail11b490.ts.net:8443/ |
| OpenClaw Gateway | 127.0.0.1:18789 |
| OpenClaw Tailscale URL | https://srv7015981364.tail11b490.ts.net/ |
| GitHub repo | https://github.com/651384/ahmadreza |
| Graph file | simot-ai-os/data/control-plane-graphs/simot-core-overview.json |
| Asana project | https://app.asana.com/1/1218659416353897/project/1218743580169181 |

Loopback فقط روی همان host معنی دارد؛ URL عمومی نیست. Tailscale URL خصوصی است و به دسترسی مجاز Tailscale نیاز دارد.

## 14. شواهد و مرجع نشست بعدی

- Master commit بررسی‌شده در live CI: **32a48e263e3169fe15fc9c6501a01279132d6b14**
- VCP branch آخرین commit هنگام تهیهٔ سند: **55492d5230fc8f6306be373e3596fca8e100aa6b**
- Graph sync commit r48: **249efd450e69b060320f53405bd254c9397047ad**
- Validation run: https://github.com/651384/ahmadreza/actions/runs/39029519705
- Worker E2E run: https://github.com/651384/ahmadreza/actions/runs/39029519770
- Live Smoke failure: https://github.com/651384/ahmadreza/actions/runs/39029519703
- Graph Sync run: https://github.com/651384/ahmadreza/actions/runs/39031694160

**NEXT ACTION:** ابتدا قرارداد /master-memory/e2e-read را اصلاح و آزمون write/read-back را قابل‌تأیید کنید؛ deploy gate و branch divergence نیز به‌عنوان ریسک‌های مستقل باز بمانند. در این مرحله merge، deploy یا secret change انجام نشود.

**مرجع شروع نشست آینده:** SIMOT-OS-REFERENCE-001 v1.0 — SIMOT AI OS Full System Architecture, Runtime, Access & Capability Reference.
