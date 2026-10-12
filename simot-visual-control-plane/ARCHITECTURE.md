# معماری SIMOT AI OS — مشخصات پیاده‌سازی VCP

> این سند مشخصات نسخه‌بندی‌شدهٔ رابط معماری است؛ منبع حقیقت وضعیت عملیاتی نیست. منبع حقیقت عملیاتی SIMOT، VPS Master Memory است. وجود هر جزء در این سند یا گراف، به‌تنهایی وجود سرویس، اتصال زنده یا سلامت آن را اثبات نمی‌کند.

## 1. مرزبندی مسئولیت‌ها

- **SIMOT AI OS**: هستهٔ منطقی هماهنگی، سیاست‌گذاری و گردش‌کار؛ تنها مغز ارکستراسیون.
- **VPS Master Memory**: منبع canonical تداوم، وضعیت جاری، تصمیم‌ها، شواهد و تاریخچهٔ وظایف.
- **Cloudflare Worker Gateway**: درگاه runtime و مسیرهای API موجود؛ هر endpoint و binding وضعیت مستقل دارد.
- **OpenClaw**: کلاینت/پل تعامل؛ نه مغز مستقل و نه منبع حقیقت.
- **React Flow VCP**: نمای بصری معماری و کنترل‌پنل؛ فعلاً گراف نسخه‌بندی‌شده و خواندن جزئیات محلی. اتصال زنده از رابط و عملیات نوشتن در این مرحله فعال فرض نمی‌شود.
- **GitHub**: کد و تاریخچهٔ نسخه.
- **Notion**: اسناد معماری/سیاست؛ نه مرجع موقعیت عملیاتی جاری.
- **SharePoint/OneDrive**: اسناد و شواهد.
- **Asana**: اجرای وظایف.
- **HubSpot**: سوابق تجاری/CRM.
- **Cloudflare D1/Queues**: اجزای runtime؛ جایگزین VPS Master Memory نیستند.

## 2. لایه‌های معماری

1. **Interface** — React Flow VCP و کلاینت‌های OpenClaw روی موبایل/دستگاه‌ها.
2. **Gateway & Network** — Worker Gateway، VPC binding/service و مسیرهای خصوصی موجود.
3. **Core orchestration** — موتور گردش‌کار، مدیریت چرخهٔ وظیفه، مسیریابی درخواست و انتقال وضعیت. گره‌های منطقی‌ای که در گراف با `PLANNED` مشخص شده‌اند، تا نگاشت به کد واقعی صرفاً طرح معماری‌اند.
4. **Tool integration** — رجیستری ابزار، قرارداد ورودی/خروجی و آداپتورهای GitHub، Cloudflare، Notion، SharePoint/OneDrive، Asana و HubSpot. نصب یا در دسترس بودن connector به معنی اتصال آن به SIMOT نیست.
5. **AI/model routing** — انتخاب مدل بر اساس وظیفه و سیاست هزینه؛ اولویت با مسیرهای رایگان/محلی. استفاده از API پولی یا ایجاد هزینه نیازمند تأیید صریح است.
6. **State & continuity** — VPS Master Memory و قرارداد پنج‌فایلی canonical: `CONTINUITY_CONTRACT.md`, `CURRENT_STATE.json`, `DECISIONS.json`, `EVIDENCE_INDEX.json`, `TASK_LOG.jsonl`.
7. **Runtime data & events** — D1 و Queue/DLQ برای کاربردهای runtime فقط طبق bindingها و مصرف‌کننده‌های واقعی؛ نه به‌عنوان حافظهٔ canonical.
8. **Security & governance** — حداقل دسترسی، جداسازی secretها، سیاست‌های دسترسی، قراردادهای پیام/API، تأیید انسانی و Audit/Evidence.
9. **Observability** — وضعیت فقط با شاهد مشخص، زمان بررسی و منبع؛ دادهٔ نامعلوم نباید سالم نمایش داده شود.

## Client channel architecture

لایهٔ `Client Channel Adapters` ورودی و خروجی کانال‌های دسکتاپ/وب، Android/OpenClaw، متن/صوت و فایل/تصویر/سند را در یک مسیر قراردادی یکپارچه می‌کند. مسیر هدف چنین است: کانال کاربر → Request Ingress → SIMOT Message Envelope → Orchestration؛ پاسخ از Response Delivery به همان لایهٔ کانال برمی‌گردد. این تعریف معماری هدف است و فعال بودن هر کانال را ثابت نمی‌کند.

## 3. قرارداد وضعیت

وضعیت گره و یال مستقل است و نباید از یکدیگر استنتاج شود:

- `VERIFIED`: شواهد مشخصی برای همان ادعا وجود دارد؛ دامنه و تاریخ شاهد باید در جزئیات ثبت شود.
- `FAILED`: آزمون تعریف‌شده شکست خورده است و باید شاهد شکست ثبت شود.
- `BLOCKED`: مانع مشخصی وجود دارد؛ علت در شواهد/جزئیات ثبت شود.
- `NOT TESTED`: نتیجه نامعلوم است؛ نه سالم است و نه خراب.
- `PLANNED`: جزء یا ارتباط در طرح معماری است و هنوز به implementation واقعی نگاشت نشده.
- `CONFIG_ONLY`: فقط تنظیمات/تعریف موجود است و اجرای واقعی ثابت نشده.
- `NOT_CONNECTED`: اتصال برقرار نیست، فقط در صورت وجود شاهد معتبر.

هیچ وضعیت زنده‌ای صرفاً از روی نام، binding، فایل گراف یا موفقیت build نتیجه‌گیری نمی‌شود.

## 4. امنیت و عملیات

- پیش‌فرض رابط read-only است.
- هر عملیات حساس باید پیش از اجرا تأیید انسانی داشته باشد.
- پیش از write باید هدف، payload، اثر جانبی، actor، evidence و مسیر rollback مشخص باشد.
- secret/token هرگز در گراف، گزارش یا log عادی نمایش داده نمی‌شود؛ فقط نام binding و مرز اعتماد قابل مستندسازی است.
- تغییر زیرساخت، deploy عمومی، merge به شاخهٔ اصلی، هزینه یا credential جدید بدون تأیید جداگانه ممنوع است.
- PC بخشی از معماری نهایی نیست؛ استفادهٔ موقت از آن پیش‌فرض نیست.
- از ایجاد حافظهٔ موازی یا تکراری خودداری می‌شود.

## 5. قرارداد گراف

فایل `src/graph-v1.json` منبع نسخه‌بندی‌شدهٔ گراف نمایشی است و دارای `schemaVersion`، `revision`، گره‌های دارای شناسهٔ پایدار و یال‌های دارای شناسهٔ پایدار است. هر گره حداقل باید `label`, `kind`, `status`, `role`, `capabilities`, `accessMethod`, `permissions`, `evidence`, `lastVerified`, `nextAction` داشته باشد.

- شناسه‌ها در هر نسخه یکتا هستند.
- مبدأ و مقصد هر یال باید به گره موجود اشاره کند.
- ارتباط طراحی‌شده باید `PLANNED` بماند تا شواهد implementation آن ثبت شود.
- تغییر گراف، وضعیت عملیاتی Master Memory را تغییر نمی‌دهد و خودکار در آن نوشته نمی‌شود.
- خروجی JSON محلی، ثبت canonical یا write-back محسوب نمی‌شود.

## 6. نقشهٔ معماری و مرز پیاده‌سازی

گراف revision 23 با 69 گره و 153 یال، معماری را در لایه‌های زیر مدل می‌کند:

1. **رابط‌ها:** React Flow VCP و OpenClaw روی کلاینت‌های موجود؛ رایانه بخشی از معماری نهایی نیست.
2. **شبکه و Gateway:** Cloudflare Worker Gateway، VPC binding/service، مسیر شبکه به VPS و Tailscale برای دسترسی خصوصی به VCP.
3. **هسته و گردش‌کار:** SIMOT Core، orchestration، business workflows و task lifecycle؛ هسته تنها مغز هماهنگی است.
4. **API و حافظه:** SIMOT Master Memory API به‌عنوان مرز API و VPS Master Memory به‌عنوان منبع canonical. قرارداد پنج‌فایلی حافظه شامل `CONTINUITY_CONTRACT.md`, `CURRENT_STATE.json`, `DECISIONS.json`, `EVIDENCE_INDEX.json`, `TASK_LOG.jsonl` است.
5. **ابزارها:** tool registry و integration adapters برای GitHub، Cloudflare، Notion، SharePoint/OneDrive، Asana و HubSpot. وجود connector به معنی اتصال خودکار آن به SIMOT نیست.
6. **مدل‌ها و AI:** model router، Ollama/local models و Cloudflare AI Workers. مسیر رایگان/محلی اولویت دارد؛ هر هزینه یا API پولی نیازمند اجازهٔ صریح است.
7. **رویدادها:** event bus، Queue، consumer/dispatcher و DLQ؛ تعریف این اجزا در گراف به‌تنهایی وجود مصرف‌کنندهٔ فعال را ثابت نمی‌کند.
8. **قرارداد پیام:** SIMOT-MSG با `MSG-ID`, `CORR-ID`, `REPLY-TO`, `FROM`, `TO` و `PART x/N` برای ردیابی پیام و هم‌بستگی درخواست/پاسخ.
9. **حاکمیت و امنیت:** policy engine، identity/access boundary، secrets boundary، human approval gate و audit/evidence ledger. secret value در گراف یا log قرار نمی‌گیرد.
10. **حاکمیت داده و مشاهده‌پذیری:** کاتالوگ فرایند/داده، API contracts و monitoring. مرجع عملیاتی همچنان VPS Master Memory است؛ D1 فقط برای داده‌های runtime طبق کاربرد واقعی است.

### چرخهٔ مرجع وظیفه

`UNDERSTAND → RECONCILE → PLAN → EXECUTE → TEST → VERIFY → RECORD → CONTINUE`

هر عملیات باید به هویت درخواست، سیاست مجاز، وضعیت وظیفه، نتیجه و شواهد مربوط باشد. عملیات حساس پشت human approval gate می‌ماند. در این مرحله فقط مدل معماری در گراف گسترش یافته است؛ این تغییر، سرویس جدید ایجاد یا runtime را فعال نمی‌کند.

### مرحله‌بندی کار

- **مرحلهٔ فعلی — تکمیل مدل معماری در React Flow:** لایه‌ها، اجزا، قراردادها و ارتباط‌های هدف را در گراف نسخه‌بندی‌شده کامل می‌کنیم؛ وارد تست عملیاتی یا وریفای اتصال‌ها نمی‌شویم.
- **مرحلهٔ بعد — بازبینی پوشش معماری:** بررسی می‌کنیم که هیچ جزء شناخته‌شده، مرز اعتماد یا جریان داده جا نمانده باشد.
- **مرحلهٔ پس از تکمیل معماری — تست و وریفای:** فقط بعد از اعلام تکمیل معماری، تست‌های schema/build و سپس بررسی اتصال‌های واقعی انجام می‌شوند.
- **مرحلهٔ یکپارچه‌سازی زنده:** فقط با مجوزهای موجود، read-only در ابتدا و بدون ساخت حافظهٔ موازی. هر write حساس به تأیید جداگانه نیاز دارد.

## 7. جریان مرجع اجرای وظیفه

جریان هدف از درخواست تا ثبت نتیجه به این شکل است:

`Request Ingress → SIMOT Message Envelope → Orchestration → Context Assembler → Planner → Task Lifecycle → Executor → Integration Adapters → Result & Evidence Assembler → Audit Ledger / Master Memory API`

- **Request Ingress** ورودی را از رابط مجاز می‌گیرد؛ OpenClaw صرفاً کلاینت/پل است.
- **Message Envelope** شناسهٔ پیام و هم‌بستگی را حمل می‌کند تا پاسخ، retry و رخدادهای مرتبط قابل ردیابی باشند.
- **Context Assembler** فقط context لازم را از VPS Master Memory و شواهد مرتبط می‌خواند؛ حافظهٔ موازی ایجاد نمی‌شود.
- **Planner** طرح، وابستگی‌ها و معیار پذیرش را مشخص می‌کند.
- **Executor** فقط از ابزارهای ثبت‌شده در Tool Registry و آداپتورهای مجاز استفاده می‌کند.
- **Policy Engine / Identity & Access / Connector Permission Map** پیش از هر فراخوانی، scope و مجوز را محدود می‌کنند.
- **Human Approval Gate** برای تغییرات حساس، هزینه، دسترسی‌های جدید و عملیات ممنوع تا زمان تأیید مالک مانع اجراست.
- **Retry / Idempotency Control** جلوی اثر جانبی تکراری را می‌گیرد و شکست نهایی را به مسیر خطا/DLQ می‌سپارد.
- **Result & Evidence Assembler** نتیجه، محدودیت، خطا و شواهد را جمع‌آوری می‌کند؛ سپس ثبت در Audit و Master Memory از مسیر API موجود و مطابق policy انجام می‌شود.

این جریان، مدل هدف است. گره‌ها و ارتباط‌های `PLANNED` به معنی وجود implementation یا اتصال زنده نیستند.

## 8. خروجی، خطا، هزینه و تغییرات

- **Response Delivery** پاسخ را به رابط درخواست‌کننده برمی‌گرداند و باید به نتیجهٔ ثبت‌شده و شواهد متکی باشد.
- **Failure Handler** خطا را طبقه‌بندی می‌کند؛ retry کنترل‌شده، DLQ یا ارجاع انسانی را انتخاب می‌کند و شکست را موفقیت نمایش نمی‌دهد.
- **Model & Cost Policy** انتخاب مدل را local/free-first نگه می‌دارد و جلوی هزینه یا API پولی بدون تأیید را می‌گیرد.
- **Human Escalation** هنگام ابهام، ریسک، نبود مجوز یا شکست تکرارشونده، اجرا را متوقف و تصمیم را از مالک درخواست می‌کند.
- **Change & Release Gate** تغییرات شاخه، merge و production deployment را از هم جدا می‌کند؛ انتشار یا عملیات حساس بدون تأیید مالک انجام نمی‌شود.

## 9. شواهد این revision

- گراف `src/graph-v1.json` در revision 23 شامل 69 گره و 153 یال است.
- پوشش گراف شامل هسته و گردش‌کار، قرارداد پیام/API، حافظهٔ canonical، Gateway/VPC/D1/Queue/DLQ/AI Workers، کلاینت‌ها، آداپتورهای ابزار، حاکمیت داده، مرزهای اعتماد، سیاست هزینه/حریم خصوصی، چرخهٔ تأیید و نگهبان نوشتن Master Memory است.
- اجزای معماری هدف و ارتباط‌های فاقد شواهد جاری باید `PLANNED` یا `NOT TESTED` بمانند؛ وجود در گراف ادعای پیاده‌سازی، اتصال یا سلامت زنده نیست.
- این مرحله فقط هم‌ترازی مستندات و مدل معماری است؛ build، تست و وریفای runtime اجرا نشده و هیچ تغییری در Master Memory، Cloudflare deployment یا شاخهٔ اصلی انجام نشده است.
