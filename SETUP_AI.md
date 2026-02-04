# 🤖 Setup AI Integration (Gemini via Proxy)

## ✅ الفكرة الأساسية
التكامل مع Gemini أصبح عبر Proxy على السيرفر (Vercel Functions) لحماية المفتاح.  
واجهة المستخدم تتواصل مع:
- `POST /api/gemini/generate`
- `POST /api/gemini/tool`
- `POST /api/gemini/stream`

---

## 1) الحصول على المفتاح
1. ادخل: https://makersuite.google.com/app/apikey  
2. سجل الدخول بحساب Google  
3. أنشئ API Key  

---

## 2) إعداد البيئة على Vercel
أضف المتغير التالي في **Vercel Project Settings → Environment Variables**:

```
GEMINI_API_KEY=your_actual_api_key_here
```

> مهم: **لا** تستخدم `VITE_GEMINI_API_KEY` بعد الآن.

---

## 3) إعداد محلي (اختياري)
لتجربة الـ Proxy محليًا استخدم:

```
vercel dev
```

> تشغيل `npm run dev` لوحده لن يوفّر `/api` Functions.

---

## 4) التحكم بتفعيل الـ AI على الواجهة
داخل `.env.local`:

```
VITE_GEMINI_AI_ENABLED=false
```

عند تعيينها لـ `false`، الواجهة لن تحاول الاتصال بالـ AI.

---

## Troubleshooting
**❌ "AI غير متاح حاليا"**
- تأكد من وجود `GEMINI_API_KEY` في إعدادات Vercel.
- أعد نشر المشروع بعد إضافة المتغير.

**❌ "404 /api/gemini/..."**
- أنت على `npm run dev` بدون `vercel dev`.

---

تمّ التحديث على تكامل الـ AI ليكون أكثر أمانًا ✅
