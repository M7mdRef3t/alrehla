# مرجع مفاتيح Supabase — دواير

كل القيم التالية **يجب أن تذهب في `.env.local`** (مش في هذا الملف). هذا الملف مرجع فقط: أسماء المتغيرات + منين تجيب كل قيمة.

**مهم:** `.env.local` موجود في `.gitignore` — لا ترفع عليه على GitHub ولا تضع مفاتيح حقيقية في أي ملف داخل الريبو.

---

## 1) أساسيات المشروع (للـ Frontend + للـ Agent لو استخدم Supabase CLI)

| المتغير | منين تجيبه |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase → **Project Settings** → **API** → Project URL |
| `VITE_SUPABASE_ANON_KEY` | نفس الصفحة → **Project API keys** → `anon` `public` |
| `SUPABASE_PROJECT_REF` | من الـ URL: `https://SUPABASE_PROJECT_REF.supabase.co` |

---

## 2) صلاحيات كاملة (سيرفر / API / تشغيل SQL من سكربت)

| المتغير | منين تجيبه |
|--------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → **Project Settings** → **API** → **Project API keys** → `service_role` (مخفي — اضغط Reveal) |

**تحذير:** الـ `service_role` يتجاوز RLS. استخدمه فقط في بيئة آمنة (سيرفر، سكربتات محلية). لا تضعه أبداً في كود فرونت اند يوصله للمتصفح.

---

## 3) لوحة التحكم والأدمن

| المتغير | منين تجيبه |
|--------|-------------|
| `ADMIN_API_SECRET` أو `VITE_ADMIN_CODE` | أنت اللي تحددها — كود سري لبوابة لوحة التحكم |
| `VITE_ADMIN_ALLOWED_ROLES` | اختياري. افتراضي: `admin,owner,superadmin,developer` |

---

## 4) Google OAuth (تسجيل الدخول بجوجل)

| المتغير | منين تجيبه |
|--------|-------------|
| `SUPABASE_GOOGLE_CLIENT_ID` | Google Cloud Console → **APIs & Services** → **Credentials** → OAuth 2.0 Client ID |
| `SUPABASE_GOOGLE_CLIENT_SECRET` | نفس الـ OAuth Client → **Client secret** |

ثم تدخلهم في Supabase: **Authentication** → **Providers** → **Google**.

---

## 5) Supabase Access Token (لو استخدمت Supabase CLI من التيرمنال)

| المتغير | منين تجيبه |
|--------|-------------|
| `SUPABASE_ACCESS_TOKEN` | [Supabase Account → Access Tokens](https://supabase.com/dashboard/account/tokens) — لربط المشروع وتشغيل migrations من الجهاز |

---

## 6) تشغيل الـ SQL من التيرمنال (صلاحية كاملة من جهازك)

| المتغير | منين تجيبه |
|--------|-------------|
| `SUPABASE_DB_URL` | Supabase → **Project Settings** → **Database** → **Connection string** → **URI** (استخدم كلمة مرور قاعدة البيانات، مش الـ anon key) |

لو حطيت `SUPABASE_DB_URL` في `.env.local`، تقدر تشغّل من المشروع:

```bash
npm run supabase:apply-setup
```

فينفّذ ملف `supabase/full-setup.sql` على قاعدة البيانات بدون ما تفتح الداشبورد.

---

## أين تضع القيم؟

1. انسخ `.env.local.example` إلى `.env.local`.
2. افتح `.env.local` وضع القيم الحقيقية مكان الـ placeholders.
3. لا ترفع `.env.local` على Git.

لو عندك بالفعل ملف فيه كل المفاتيح (مثلاً نسخة من `.env.local` أو ملف اسمه `supabase-keys.env`)، ابقاه **دائماً خارج الريبو** أو داخل `.gitignore` حتى لا ينسى أحد ويرفعه.

---

## صلاحية الـ Agent

أنا (الـ Agent) ما أقدرش أدخل على حسابك في Supabase من المتصفح ولا أضغط أزرار في الداشبورد. اللي أقدره:

- قراءة/كتابة ملفات المشروع (مثل `full-setup.sql`).
- تشغيل أوامر في التيرمنال على جهازك.

**عشان يكون عندي (الـ Agent) الصلاحيات الكاملة من جهازك:**

1. **في `.env.local`:**
   - `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` (عادي للفرونت)
   - `SUPABASE_SERVICE_ROLE_KEY` (للسكربتات/API)
   - **`SUPABASE_DB_URL`** (Connection string من Project Settings → Database → URI) — عشان السكربت يقدر يشغّل الـ SQL من التيرمنال

2. **تشغيل الإعداد مرة واحدة:** من جذر المشروع شغّل:
   ```bash
   npm run supabase:apply-setup
   ```
   ده ينفّذ `supabase/full-setup.sql` على قاعدة البيانات. بعدها فعّل Realtime لـ `app_content` من الداشبورد (مرة واحدة)، ولو حابب ارفع دورك لـ owner من SQL Editor أو من جدول profiles.

لو ثبّت **Supabase CLI** وربطت المشروع (`supabase link`) ووضعت في `.env.local` على الأقل: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (أو استخدمت `supabase login` + `supabase link`)، أقدر أوجهك لأوامر تشغّلها أنت (مثلاً `npx supabase db push` أو تشغيل `full-setup.sql`) — لكن التنفيذ الفعلي يبقى من جهازك أو من سيرفر عندك.
