# خطة دمج API للبقاء تحت حد 12 دالة (Vercel Hobby)

## العدد الحالي (21 دالة)

| المسار | الملف | الملاحظة |
|--------|--------|----------|
| admin | overview.ts | يدعم بالفعل عدة `kind` (overview, feedback, reports, user-state...) |
| admin | content.ts | محتوى التطبيق |
| admin | config.ts | إعدادات النظام |
| admin | users.ts | قائمة المستخدمين |
| admin | roles.ts | تحديث الأدوار |
| admin | missions.ts | إدارة المهام |
| admin | broadcasts.ts | البث |
| admin | ai-logs.ts | سجلات AI |
| admin | journey-map.ts | خريطة الرحلة |
| admin | user-state.ts | حالة المستخدم |
| admin | user-state-export.ts | تصدير حالة |
| admin | user-state-import.ts | استيراد حالة |
| admin | full-export.ts | تصدير كامل |
| admin | daily-report.ts | تقرير يومي |
| admin | weekly-report.ts | تقرير أسبوعي |
| admin | cron-report.ts | تقرير كرون |
| user | state.ts | حالة المستخدم (واجهة) |
| user | broadcasts.ts | بث للمستخدم |
| gemini | generate.ts | توليد |
| gemini | stream.ts | ستريم |
| gemini | tool.ts | أداة |

## الهدف: ≤ 12 دالة

### الخيار 1 (مُطبَّق): دمج كل Admin في دالة واحدة

- **ملف واحد في api/:** `api/admin/index.ts` فقط — يستقبل الطلبات على `/api/admin?path=config` أو `path=overview&kind=...` ويستدعي الـ handler المناسب.
- **الـ handlers خارج api/:** في `server/admin/` (overview، config، users، …، _shared) حتى **لا يحسبهم Vercel كدوال**؛ أي ملف .ts داخل api/ قد يُحسب دالة.
- **النتيجة:** 1 دالة admin → الإجمالي في api/: **6 دوال** (1 admin + 2 user + 3 gemini).

### ما يُبقى كملفات مسار منفصلة (بدون دمج)

- `api/user/state.ts`
- `api/user/broadcasts.ts`
- `api/gemini/generate.ts`
- `api/gemini/stream.ts`
- `api/gemini/tool.ts`

لا داعي لدمجها للوصول لـ 12؛ بعد دمج admin يصبح العدد 6.

### تعديل الفرونت

- لا تغيير: الفرونت يطلب `/api/admin/config`، `/api/admin/overview?kind=...` إلخ.
- الـ router يحدد الـ path من `req.url` (مثلاً من pathname) ويوجّه للـ handler المناسب.

### الكرون (vercel.json)

- المسار الحالي: `/api/admin/overview?kind=cron-report&period=...` يبقى كما هو ويُخدم من نفس دالة admin بعد الدمج.
