# نشر المنصة — دواير / مسافتي

## قبل النشر

1. **المتغيرات (اختياري)**  
   لو عايز تفعل الـ AI (Gemini): ضيف `GEMINI_API_KEY` في بيئة السيرفر (Vercel).  
   المنصة تشتغل بدون مفتاح بمنطق احتياطي.

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
