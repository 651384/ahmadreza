# SIMOT VCP Graph Sync — مرجع فنی همگام‌سازی گراف

**شناسهٔ سند:** SIMOT-VCP-GRAPH-SYNC-REF-001  
**نسخهٔ سند:** 1.0  
**تاریخ تهیه:** 2026-10-17  
**وضعیت:** مستند مبتنی بر شواهد اجرای واقعی و بررسی خواندنی  
**دامنه:** VPS Master Memory → Cloudflare Worker Gateway → Cloudflare D1 و GitHub  
**شاخهٔ GitHub:** `feat/simot-visual-control-plane-react-flow`

---

## 1. هدف و قاعدهٔ معماری

این سند مرجع فنی مسیر همگام‌سازی گراف معماری SIMOT AI OS در رابط React Flow است. برای ادامهٔ توسعه، عیب‌یابی، بررسی دسترسی‌ها و بازیابی روند کار در نشست‌های بعدی استفاده شود.

**VPS Master Memory منبع اصلی حقیقت عملیاتی است.** Cloudflare D1 و GitHub مقصدهای همگام‌شده هستند و جایگزین Master Memory نیستند.

- Master Memory: وضعیت و تداوم عملیاتی canonical
- Cloudflare D1: snapshot گراف برای runtime
- GitHub: فایل نسخه‌بندی‌شدهٔ گراف و تاریخچهٔ commit
- React Flow VCP: رابط کنترل و نمایش؛ نه منبع حقیقت مستقل

این سند در شاخهٔ توسعه ذخیره شده است؛ ثبت آن به معنی merge به `main` یا انتشار production نیست.

## 2. خلاصهٔ چرخهٔ تأییدشده

چرخهٔ اخیر به این ترتیب انجام شد:

1. React Flow گراف را از VPS Master Memory بازخوانی کرد.
2. کاربر ذخیرهٔ گراف را اجرا کرد.
3. رابط، ذخیره و read-back را تأیید کرد.
4. کاربر همگام‌سازی دستی را اجرا کرد.
5. Worker گراف را در Cloudflare D1 ثبت و نتیجه را بررسی کرد.
6. پراکسی VCP فایل گراف را در شاخهٔ مشخص GitHub نوشت و read-back/verification انجام داد.
7. بررسی مستقل فقط‌خواندنی، رکورد D1 و فایل GitHub را بررسی کرد.

### آخرین وضعیت تأییدشده

- Graph ID: `simot-core-overview`
- Master Memory version: `8`
- Graph revision: `48`
- Updated at: `2026-10-17T13:08:16.616Z`
- SHA-256 گراف: `f99e4a69e1c5f148fb20c88723d81c67cbdee7c1553f60b7ceacbe478875702f`
- تعداد گره‌های خوانده‌شده از GitHub: `77`
- تعداد یال‌های خوانده‌شده از GitHub: `190`

پاسخ رابط برای چرخهٔ آخر این وضعیت‌ها را گزارش کرد: `ok=true`، `partial=false)، `d1.verified=true)، `github.ok=true)، `github.verified=true)، و HTTP 200.

## 3. معماری و جریان داده

```text
کاربر
  |
  v
React Flow VCP
  | GET: خواندن گراف canonical
  | POST: ذخیرهٔ کنترل‌شدهٔ گراف
  | POST: اجرای همگام‌سازی دستی
  v
VCP local proxy / Vite
  | درخواست احراز هویت‌شده
  v
Cloudflare Worker Gateway
  | اعتبارسنجی و همگام‌سازی
  v
Cloudflare D1
  | نتیجه و تأیید
  v
VCP proxy
  | در صورت تأیید D1
  v
GitHub Contents API
  |
  v
فایل گراف در شاخهٔ توسعه
```

این نمودار جریان همگام‌سازی را نشان می‌دهد؛ سلامت همهٔ اجزای SIMOT را اثبات نمی‌کند.

## 4. VPS و React Flow VCP

### میزبان و دسترسی

- نام میزبان: `srv7015981364`
- سیستم‌عامل ثبت‌شده: Ubuntu 24.04.4 LTS
- IP خصوصی Tailscale ثبت‌شده: `100.122.11.71`
- URL خصوصی رابط: https://srv7015981364.tail11b490.ts.net:8443/
- مسیر ثبت‌شدهٔ Tailscale Serve: پورت 8443 به سرویس محلی VCP روی `127.0.0.1:4173)
- سرویس systemd: `simot-visual-control-plane.service`

### مسیر پروژه و پراکسی

ریشهٔ پروژه:

`/opt/simot-visual-control-plane/simot-visual-control-plane`

فایل پراکسی همگام‌سازی:

`/opt/simot-visual-control-plane/simot-visual-control-plane/vite-graph-sync-proxy.js`

تنظیمات systemd:

`/etc/systemd/system/simot-visual-control-plane.service.d/graph-sync.conf`

فایل متغیرهای محیطی:

`/etc/simot-vcp-graph-sync.env`

در بررسی قبلی فایل محیطی دارای مالکیت `root:root` و مجوز `600) بود.

نام متغیرهایی که حضورشان در محیط پردازش بررسی شد:

- `SIMOT_WORKER_URL`
- `SIMOT_MAILBOX_TOKEN`

### توکن GitHub

مسیر ثبت‌شده:

`/root/.config/simot/github-token`

این فایل برای دسترسی پراکسی به GitHub استفاده می‌شود. مقدار توکن نباید در خروجی ترمینال، لاگ، commit یا این سند چاپ شود. مجوز فایل توکن GitHub در شواهد این گزارش مستقلاً تأیید نشده است.

## 5. VPS Master Memory — منبع canonical

### سرویس و مسیرها

- سرویس: `simot-memory.service`
- API محلی: `http://127.0.0.1:9100`
- ریشهٔ داده: `/srv/simot-memory/`

فایل‌های اصلی ثبت‌شده:

- `CURRENT_STATE.json`
- `TASK_LOG.jsonl`
- `EVIDENCE_INDEX.json`
- `CONTINUITY_CONTRACT.md`
- `DECISIONS.json`

گراف مورد بحث رکورد `working/simot-core-overview` است؛ آن را با فایل‌های تداوم عملیاتی اشتباه نگیرید.

### endpointهای حافظهٔ ثبت‌شده

- `GET /health): سلامت پایه؛ در سابقه بدون احراز هویت
- `POST /memory): نوشتن رکورد حافظه
- `GET /memory/{bucket}/{id}`: خواندن رکورد
- `GET /list/{bucket}`: فهرست رکوردهای یک bucket
- `POST /archive`: آرشیو
- `GET/POST /continuity/state`: وضعیت تداوم؛ نوشتن با expected version و backup

برای endpointهای نیازمند احراز هویت از bearer token استفاده می‌شود. جزئیات دقیق قرارداد API را پیش از تغییرات با کد/مستندات زنده تطبیق دهید.

### مسیرهای VCP برای خواندن و ذخیره

خواندن گراف از پراکسی محلی:

`GET http://127.0.0.1:4173/api/memory/working/simot-core-overview`

ذخیرهٔ کنترل‌شده:

`POST /api/memory/graph-save`

پراکسی VCP برای این مسیرها محدودسازی دارد؛ این به معنی مجاز بودن endpointهای عمومی دلخواه نیست. ذخیرهٔ گراف باید expected version/hash و نتیجهٔ read-back را بررسی کند.

در چرخهٔ اخیر:

- قبل از ذخیره: Memory version 7، graph revision 47
- پس از ذخیره و read-back: Memory version 8، graph revision 48

## 6. endpoint همگام‌سازی VCP

مسیر محلی:

`POST http://127.0.0.1:4173/api/control-plane/graph-sync/run`

قرارداد درخواست ثبت‌شده:

- HTTP POST روی loopback
- `Content-Type: application/json`
- body باید شامل `{"confirm":true}` باشد

نمونهٔ اجرای دستی زیر **نوشتن واقعی و همگام‌سازی را اجرا می‌کند**؛ صرفاً برای خواندن وضعیت نیست:

```text
curl -sS --max-time 120 -X POST 'http://127.0.0.1:4173/api/control-plane/graph-sync/run' -H 'Content-Type: application/json' --data '{"confirm":true}' -w '\nHTTP_STATUS=%{http_code}\n'
```

پیش از اجرای دوباره، ابتدا وضعیت منبع و مقصدها را فقط‌خواندنی بررسی کنید.

### رفتار پراکسی ثبت‌شده

1. می‌پذیرد فقط درخواست POST با تأیید صریح `confirm: true` اجرا شود.
2. URL Worker را از `SIMOT_WORKER_URL` می‌گیرد.
3. درخواست را با `SIMOT_MAILBOX_TOKEN` احراز هویت می‌کند.
4. مسیر Worker را با انتهای `/control-plane/graph-sync/run` فراخوانی می‌کند.
5. پس از تأیید D1، گراف را به GitHub می‌نویسد.
6. فایل GitHub را دوباره می‌خواند و نتیجه را بررسی می‌کند.
7. وضعیت مقصدها را به رابط بازمی‌گرداند.

در پاسخ معمولی، محتوای کامل گراف به مرورگر برگردانده نمی‌شود.

### قرارداد گراف

اعتبارسنجی ثبت‌شده شامل مواردی از این دست است:

- `schema = simot.visual-control-plane.graph`
- `schemaVersion = 1`
- `graphId = simot-core-overview`
- revision عدد صحیح
- محاسبه و تطبیق SHA-256
- آرایه‌های `nodes` و `edges`

## 7. Cloudflare Worker Gateway

- نام Worker: `simot-ai-os-gateway`
- مسیر همگام‌سازی: `/control-plane/graph-sync/run`
- متغیر URL: `SIMOT_WORKER_URL`
- نام binding ثبت‌شده: `SIMOT_MASTER_MEMORY`
- سرویس مقصد binding: `simot-master-memory`

URL کامل Worker در شواهد این گزارش موجود نیست؛ بنابراین عمداً حدس زده نشده است. مقدار را از تنظیمات موجود، بدون چاپ متغیرهای محرمانه، بررسی کنید.

### مرزهای احراز هویت

- `SIMOT_MAILBOX_TOKEN): احراز هویت درخواست ورودی پراکسی VCP به Worker
- `SIMOT_MASTER_MEMORY_TOKEN): احراز هویت مسیرهای Worker به API مربوط به Master Memory، در مسیرهای مربوطه

این دو توکن نقش‌های متفاوت دارند و نباید با هم جایگزین شوند. مقادیر آن‌ها محرمانه‌اند.

Worker در این جریان درخواست مجاز را دریافت می‌کند، گراف را اعتبارسنجی می‌کند، snapshot را در D1 ثبت می‌کند و نتیجهٔ بررسی را به پراکسی برمی‌گرداند.

## 8. Cloudflare D1

### مشخصات

- نام دیتابیس: `simot-ai-os`
- شناسه: `6bb8ae5c-df7d-4c4b-bf0d-bdd73857a480`
- جدول snapshot: `control_plane_graph_snapshots`

D1 مقصد همگام‌سازی است، نه منبع اصلی ویرایش گراف.

### query فقط‌خواندنی برای بررسی snapshot

```sql
SELECT graph_id, revision, source_memory_version, sha256, synced_at
FROM control_plane_graph_snapshots
WHERE graph_id = 'simot-core-overview'
ORDER BY synced_at DESC
LIMIT 1;
```

### نتیجهٔ مستقل آخرین بررسی

- `graph_id`: `simot-core-overview`
- `revision`: `48`
- `source_memory_version`: `8`
- `sha256`: `f99e4a69e1c5f148fb20c88723d81c67cbdee7c1553f60b7ceacbe478875702f`
- `synced_at`: `2026-10-17T13:08:25.733Z`

query با موفقیت یک ردیف خواند؛ این بررسی مستقل فقط‌خواندنی بود و چیزی روی D1 ننوشته است.

## 9. GitHub

- مخزن: `651384/ahmadreza`
- شاخهٔ هدف: `feat/simot-visual-control-plane-react-flow`
- فایل: `simot-ai-os/data/control-plane-graphs/simot-core-overview.json`

URL فایل:

https://github.com/651384/ahmadreza/blob/feat/simot-visual-control-plane-react-flow/simot-ai-os/data/control-plane-graphs/simot-core-overview.json

### commit آخرین همگام‌سازی

`249efd450e69b060320f53405bd254c9397047ad`

پیام commit:

`sync: update canonical SIMOT graph from VPS Master Memory`

URL:

https://github.com/651384/ahmadreza/commit/249efd450e69b060320f53405bd254c9397047ad

فایل GitHub مستقلاً خوانده شد؛ metadata نشان داد revision 48، 77 گره و 190 یال دارد. پراکسی در پاسخ همگام‌سازی، read-back و verification را موفق گزارش کرده بود. هش خام فایل GitHub در بررسی مستقل این گزارش مجدداً محاسبه نشد؛ بنابراین نباید آن را «هش مستقل محاسبه‌شده» توصیف کرد.

این commit روی شاخهٔ توسعه است. merge به `main) یا انتشار production بخشی از این چرخه نبود.

## 10. آدرس‌ها و پروتکل‌ها در یک نگاه

| کاربرد | پروتکل/روش | آدرس یا مسیر |
|---|---|---|
| رابط خصوصی VCP | HTTPS / Tailscale | `https://srv7015981364.tail11b490.ts.net:8443/` |
| VCP محلی | HTTP loopback | `127.0.0.1:4173` |
| خواندن گراف | GET | `/api/memory/working/simot-core-overview` |
| ذخیره گراف | POST | `/api/memory/graph-save` |
| اجرای sync | POST | `/api/control-plane/graph-sync/run` |
| API حافظه | HTTP loopback | `http://127.0.0.1:9100` |
| Worker sync | URL پیکربندی‌شده | `SIMOT_WORKER_URL` + `/control-plane/graph-sync/run` |
| snapshot | Worker → D1 | دیتابیس `simot-ai-os` |
| نسخه‌بندی گراف | پراکسی → GitHub Contents API | فایل گراف در شاخهٔ توسعه |

## 11. ترتیب عملیاتی پیشنهادی

### A. خواندن

1. VCP را باز کنید.
2. «بازخوانی از مستر مموری» را اجرا کنید.
3. Memory version، graph revision و SHA-256 را ثبت کنید.
4. اگر داده با منبع مورد انتظار متفاوت است، متوقف شوید.

### B. ذخیره در Master Memory

1. تغییرات گراف را اعمال کنید.
2. ذخیره را اجرا کنید.
3. پیام ذخیره و read-back را بررسی کنید.
4. نسخه، revision و hash جدید را ثبت کنید.

### C. همگام‌سازی مقصدها

1. همگام‌سازی دستی را اجرا کنید.
2. `ok=true` و `partial=false) را بررسی کنید.
3. `d1.verified=true) و `github.verified=true) را بررسی کنید.
4. revision، hash و commit را ثبت کنید.

### D. بررسی مستقل

1. snapshot آخر D1 را فقط‌خواندنی بخوانید.
2. فایل GitHub را از شاخهٔ هدف بخوانید.
3. revision و نسخهٔ منبع را مقایسه کنید.
4. در صورت ناسازگاری، قبل از هر نوشتن مجدد، علت را مشخص کنید.

## 12. خطا و همگام‌سازی ناقص

نوشتن D1 و GitHub یک تراکنش اتمیک واحد نیست. ممکن است D1 موفق شود ولی GitHub شکست بخورد.

اگر پاسخ timeout شد، ناقص بود یا خطای GitHub نشان داد:

- دکمهٔ sync را فوراً دوباره نزنید.
- Master Memory را بخوانید.
- snapshot آخر D1 را بخوانید.
- فایل GitHub و commitهای شاخهٔ هدف را بررسی کنید.
- تعیین کنید کدام مقصد عقب مانده است.
- پس از روشن شدن وضعیت، دربارهٔ تکرار عملیات تصمیم بگیرید.

timeout به‌تنهایی اثبات نمی‌کند که هیچ مرحله‌ای انجام نشده است. idempotency نیز نباید صرفاً از یک اجرای موفق نتیجه‌گیری شود.

## 13. امنیت و مجوزها

- رابط از مسیر خصوصی Tailscale در دسترس است.
- مسیرهای داخلی VCP از loopback استفاده می‌کنند.
- sync نیازمند تأیید صریح `confirm: true` است.
- tokenها باید در محل محرمانه باقی بمانند.
- مقادیر secret نباید در خروجی، گزارش یا commit ثبت شوند.
- نوشتن GitHub به شاخهٔ هدف محدود شده است.
- merge، انتشار production و تغییر زیرساخت جزو این چرخه نیستند.
- D1 و GitHub جایگزین Master Memory نیستند.
- هیچ سرویس یا هزینهٔ جدیدی برای این چرخه ایجاد نشده است.

## 14. وضعیت شواهد و محدودیت‌ها

### VERIFIED در چرخهٔ 2026-10-17

- خواندن گراف از Master Memory
- ذخیره و read-back با ارتقا به memory version 8 و revision 48
- پاسخ موفق endpoint همگام‌سازی
- تأیید D1 در پاسخ sync و بررسی مستقل snapshot
- تأیید GitHub در پاسخ sync و خواندن مستقل فایل/commit
- تطبیق revision 48 و source memory version 8 در D1
- تطبیق revision 48 در GitHub

### NOT TESTED یا مستقلاً تأییدنشده در این گزارش

- محاسبهٔ مجدد SHA-256 از بایت‌های خام فایل GitHub
- رفتار تمام حالت‌های خطا و timeout رابط
- صحت همهٔ پیام‌های UI هنگام partial sync
- سلامت لحظه‌ای همهٔ سرویس‌ها، Queueها و مصرف‌کننده‌ها
- سلامت تمام اجزای SIMOT خارج از محدودهٔ گراف
- URL کامل Worker و تمام تنظیمات محرمانهٔ محیط
- مجوز فایل توکن GitHub

مقادیر status داخل گراف به‌تنهایی سلامت زندهٔ همهٔ سرویس‌های نمایش‌داده‌شده را اثبات نمی‌کنند.

## 15. تاریخچهٔ چرخه‌های اخیر

### چرخهٔ r47

- Memory version: 7
- Graph revision: 47
- SHA-256: `97b7da4e33ffdde815be9fc45170a76abc3fc450dd6c2aca97a2c5dd047289b1`
- commit: `356ab03abc4e1acd540e4aeab0f322eea003cb83`
- D1 و GitHub: موفق گزارش شده‌اند

### چرخهٔ r48

- Memory version: 8
- Graph revision: 48
- SHA-256: `f99e4a69e1c5f148fb20c88723d81c67cbdee7c1553f60b7ceacbe478875702f`
- D1 synced at: `2026-10-17T13:08:25.733Z`
- GitHub timestamp: `2026-10-17T13:08:26Z`
- commit: `249efd450e69b060320f53405bd254c9397047ad`

## 16. گام بعدی توسعه

پس از ثبت این مرجع، گام بعدی مناسب بررسی خواندنی handler دکمهٔ sync و مدیریت پاسخ در React Flow است:

1. نتیجهٔ موفق فقط از پاسخ درخواست جاری گرفته شود.
2. وضعیت موفق قبلی به‌عنوان نتیجهٔ درخواست جدید نمایش داده نشود.
3. خطا و timeout واضح نمایش داده شوند.
4. partial sync از موفقیت کامل قابل تفکیک باشد.
5. پیش از تکرار، وضعیت مقصدها قابل بررسی باشد.

این بررسی ابتدا باید فقط‌خواندنی باشد. تغییر کد، merge و انتشار production نیازمند تصمیم جداگانه است.

---

**مرجع کوتاه برای نشست بعدی:**  
`SIMOT-VCP-GRAPH-SYNC-REF-001 v1.0 — VPS Master Memory → Cloudflare D1 → GitHub`
