# نشر المنصة — دواير / مسافتي

## قبل النشر

1. **المتغيرات (اختياري)**  
   لو عايز تفعّل الـ AI (Gemini): انسخ `.env.local.example` إلى `.env.local` وضيف مفتاحك.  
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

1. اربط الريبو من [vercel.com](https://vercel.com).
2. **Build Command:** `npm run build`  
   **Output Directory:** `dist`  
   **Install Command:** `npm ci`
3. (اختياري) في **Environment Variables** ضيف `VITE_GEMINI_API_KEY`.
4. Deploy.

---

## النشر على Netlify

1. اربط الريبو من [netlify.com](https://netlify.com).
2. **Build command:** `npm run build`  
   **Publish directory:** `dist`
3. (اختياري) في **Site settings → Environment variables** ضيف `VITE_GEMINI_API_KEY`.
4. Deploy.

---

## النشر كملف ثابت (أي استضافة)

1. نفّذ:
   ```bash
   npm run build
   ```
2. ارفع محتويات مجلد `dist/` على السيرفر (أي استضافة static: GitHub Pages، S3، etc.).
3. لو الموقع تحت مسار فرعي (مثلاً `example.com/dawayir/`) غيّر في `vite.config.ts`:
   ```ts
   base: "/dawayir/"
   ```
   ثم أعد البناء.

---

## ملاحظات

- البيانات (الخريطة، الرحلة، القياس) محفوظة في **localStorage** في المتصفح فقط — مفيش سيرفر قاعدة بيانات.
- الـ AI اختياري؛ بدون مفتاح Gemini الخطة والتحليل يشتغلوا بمنطق احتياطي.
