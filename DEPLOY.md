# نشر المنصة — الرحلة (أداة دواير)

## قبل النشر

1. **المتغيرات (اختياري)**  
   لو عايز تفعل الـ AI (Gemini): ضيف `GEMINI_API_KEY` في بيئة السيرفر (Vercel).  
   المنصة تشتغل بدون مفتاح بمنطق احتياطي.
   لو هتفعل لوحة التحكم والتتبع السحابي: ضيف `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`.
   ولو هتفعل لوحة التحكم الآمنة عبر API: ضيف `SUPABASE_SERVICE_ROLE_KEY` و `ADMIN_API_SECRET`.

2. **البناء المحلي**
   ```bash
   npm ci
   npm run build
   npm run preview
   ```
   افتح `http://localhost:4173` وتأكد إن كل حاجة شغالة.

---

## النشر على Vercel

1. اربط الريبو من https://vercel.com  
2. **Build Command:** `npm run build`  
   **Output Directory:** `dist`  
   **Install Command:** `npm ci`
3. (اختياري) في **Environment Variables** ضيف `GEMINI_API_KEY`.
4. Deploy.
5. لو عايز التقارير التلقائية: أضف
   - `ADMIN_API_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_ALLOWED_ROLES` و `VITE_ADMIN_ALLOWED_ROLES`
   - `CRON_SECRET`
   - `PUBLIC_APP_URL`
   - `SLACK_WEBHOOK_URL` (اختياري)
   - `RESEND_API_KEY` + `REPORT_EMAIL_TO` + `REPORT_EMAIL_FROM` (اختياري)
6. فعّل Vercel Cron على المسارات:
   - لو استخدمت `vercel.json` المرفق: سيُفعل مسارات الكرون تلقائياً.
   - لو ضبطت `CRON_SECRET` يجب تحديث المسارات إلى:
     - `/api/admin/cron-report?period=daily&secret=YOUR_CRON_SECRET`
     - `/api/admin/cron-report?period=weekly&secret=YOUR_CRON_SECRET`

---

## النشر على Netlify

> ملاحظة: الـ AI Proxy مبني على Vercel Functions.  
لو هتنشر على Netlify بدون Functions بديلة، خصائص الـ AI لن تعمل.

1. اربط الريبو من https://netlify.com  
2. **Build command:** `npm run build`  
   **Publish directory:** `dist`
3. Deploy.

---

## النشر كملف ثابت (أي استضافة)

1. نفّذ:
   ```bash
   npm run build
   ```
2. ارفع محتويات مجلد `dist/` على السيرفر (GitHub Pages, S3, إلخ).
3. لو الموقع تحت مسار فرعي (مثلاً `example.com/dawayir/`) غيّر في `vite.config.ts`:
   ```ts
   base: "/dawayir/"
   ```
   ثم أعد البناء.

---

## ملاحظات

- البيانات (الخريطة، الرحلة، القياس) محفوظة في **localStorage** محليًا داخل المتصفح فقط.
- الـ AI اختياري؛ بدون مفتاح Gemini النظام يعمل بمنطق احتياطي.
