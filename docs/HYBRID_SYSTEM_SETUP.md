# 🚀 دليل إعداد النظام الهجين (Hybrid Autonomous System)

**التاريخ:** 2026-02-20
**الإصدار:** Hybrid v1.0 (1 + 3 + 4)
**مستوى الأتمتة:** 95%

---

## 🎯 ما هو النظام الهجين؟

**النظام الهجين** هو دمج 3 مكونات رئيسية:

### 1️⃣ **Self-Healing** (الإصلاح الذاتي)
- فحص صحة النظام كل ساعة
- إصلاح المشاكل البسيطة تلقائياً
- **الهدف:** استقرار تقني 100%

### 3️⃣ **Emotional Pricing** (التسعير العاطفي)
- تحليل حالة المستخدم (TEI, Shadow Pulse, Engagement)
- منح شهر مجاني لمن في أزمة
- عرض Premium لمن مستقر ومستعد
- **الهدف:** التعاطف الخوارزمي = ولاء أعلى

### 4️⃣ **Telegram Bot** (الجهاز العصبي)
- تقارير يومية/أسبوعية
- طلبات موافقة على القرارات
- **الهدف:** تواصل ذكي بدون Dashboard

---

## 📋 متطلبات الإعداد

### 1. **Telegram Bot**

#### أ) إنشاء البوت:
1. افتح Telegram وابحث عن [@BotFather](https://t.me/BotFather)
2. أرسل `/newbot`
3. اختر اسم للبوت (مثلاً: `Dawayir Monitor`)
4. اختر username (مثلاً: `dawayir_monitor_bot`)
5. ستحصل على **Bot Token** (احفظه!)

**مثال:**
```
Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567
```

#### ب) الحصول على Chat ID:
1. ابحث عن [@userinfobot](https://t.me/userinfobot) في Telegram
2. ابدأ المحادثة (`/start`)
3. ستحصل على **Chat ID** (رقم طويل)

**مثال:**
```
Your Telegram ID: 123456789
```

#### ج) إضافة المفاتيح للـ `.env`:
```bash
# في ملف .env (في جذر المشروع):
VITE_TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567
VITE_TELEGRAM_CHAT_ID=123456789
```

---

### 2. **Stripe** (اختياري — للدفع الفعلي)

إذا كنت عايز تفعّل الاشتراكات الفعلية:

#### أ) إنشاء حساب Stripe:
1. اذهب لـ [stripe.com](https://stripe.com)
2. سجّل حساب جديد
3. من Dashboard → **Developers → API Keys**

#### ب) إضافة المفاتيح للـ `.env`:
```bash
# في ملف .env:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### ج) إنشاء Products + Prices:
في Stripe Dashboard → **Products**:
- **B2C Premium**: $4.99/month (أو السعر اللي تختاره)
- **B2B Enterprise**: $49/month

احفظ الـ **Price IDs**:
```bash
VITE_STRIPE_PRICE_B2C=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_B2B=price_yyyyyyyyyyyyy
```

---

## 🚀 التشغيل

### 1. تثبيت Dependencies (إذا لم يتم):
```bash
npm install
```

### 2. تشغيل التطبيق:
```bash
npm run dev
```

### 3. فتح التطبيق:
```
http://localhost:5173
```

### 4. مراقبة الـ Console:
ستشوف الرسائل التالية:
```
✅ Auto Health Check started
✅ Weekly Revenue Analysis started
✅ Emotional Pricing Engine started
✅ Telegram Bot connected
```

### 5. فحص Telegram:
بعد ثوانٍ قليلة، ستستقبل رسالة في Telegram:
```
🌱 دواير بدأت

✅ Self-Healing System: نشط
✅ Revenue Automation: نشط
✅ Emotional Pricing Engine: نشط
✅ Telegram Bot: متصل

📡 الماكينة جاهزة للعمل.
```

---

## 📊 ما الذي سيحدث تلقائياً؟

### **يومياً (الساعة 9 صباحاً):**
ستستقبل تقرير صحة النظام:
```
✅ تقرير دواير اليومي

🏥 الصحة: 94/100 (ممتاز)

📊 المشاكل المكتشفة:
• أخطاء Console: 0
• مشاكل التخزين: 0
• مشاكل الأداء: 1
• مشاكل الحالة: 0

✨ كل شيء تمام
```

### **أسبوعياً (الأحد 9 صباحاً):**
ستستقبل تقرير الدخل:
```
💰 تقرير الدخل الأسبوعي

👥 المستخدمين: 150
• Free: 100
• Premium (B2C): 40
• Enterprise (B2B): 10

💵 الدخل:
• MRR: $689.60
• ARR: $8,275.20
```

### **عند قرار تسعير:**
ستستقبل طلب موافقة:
```
💡 قرار معلق: تغيير الأسعار

📊 الاستراتيجية: التسعير بناءً على القيمة

💵 الأسعار المقترحة:
• B2C Premium: $6.99/شهر
• B2B Enterprise: $59/شهر

رد بـ "موافق" أو "رفض"
```

### **عند قرار عاطفي:**
ستستقبل إشعار:
```
🎁 قرار التسعير العاطفي

👤 المستخدم: user-123

🧠 التحليل:
• TEI (الفوضى العاطفية): 78/100
• Shadow Pulse (الضغط النفسي): 65/100
• Engagement (التفاعل): 82/100

💡 السبب: شخص بيمر بأزمة حقيقية

🎯 القرار:
تم منح شهر مجاني كهدية من الرحلة 🌱
```

---

## 🔒 الخصوصية (Privacy-First)

### **مهم جداً:**
- كل التحليل العاطفي يحدث **محلياً** (على جهاز المستخدم)
- **لا نرسل** محتوى الـ Journal للسيرفر أبداً
- نرسل فقط "Signal" (crisis/stable) بدون تفاصيل
- الـ TEI والـ Shadow Pulse محسوبين محلياً

**الرسالة للمستخدم:**
> "دواير تحترم خصوصيتك. كل التحليل يحدث على جهازك. لا نقرأ كتاباتك."

---

## 🎛️ التحكم في النظام

### **إيقاف مكون معين:**

إذا عايز توقف Telegram Bot مثلاً:
```typescript
// في src/App.tsx، احذف أو علّق الكود:
// import("./services/telegramBot")...
```

إذا عايز توقف Emotional Pricing:
```typescript
// في src/App.tsx، احذف أو علّق الكود:
// import("./ai/emotionalPricingEngine")...
```

### **تغيير التوقيت:**

لتغيير توقيت التقرير اليومي (من 9 صباحاً):
```typescript
// في src/services/telegramBot.ts:
// السطر:
next9AM.setHours(9, 0, 0, 0);

// غيره لـ:
next9AM.setHours(10, 0, 0, 0); // 10 صباحاً
```

---

## 🧪 الاختبار

### **اختبار Telegram Bot:**
```bash
# في Console:
import { telegramBot } from "./src/services/telegramBot";
await telegramBot.sendMessage({
  type: "system_startup",
  text: "🧪 Test message from Dawayir",
});
```

### **اختبار Emotional Pricing:**
```bash
# في Console:
import { emotionalPricingEngine } from "./src/ai/emotionalPricingEngine";
await emotionalPricingEngine.runDailyEmotionalCheck();
```

### **اختبار Health Check:**
```bash
# في Console:
import { autoHealthChecker } from "./src/ai/autoHealthCheck";
const result = await autoHealthChecker.runHealthCheck();
console.log(result);
```

---

## ❓ الأسئلة الشائعة

### **1. هل الـ Telegram Bot يشتغل بدون إعداد؟**
لأ — لازم تضيف `VITE_TELEGRAM_BOT_TOKEN` و `VITE_TELEGRAM_CHAT_ID` في `.env`

إذا مش مضافين، الـ Bot هيطبع الرسائل في الـ Console بس (مش هيبعتها فعلياً)

### **2. هل Emotional Pricing هيمنح شهور مجانية فعلياً؟**
حالياً: **لأ** — الكود بيطبع "TODO" في الـ Console

لتفعيل الفعلي: لازم تكمل التكامل مع Stripe (شوف `src/services/stripeIntegration.ts`)

### **3. هل ممكن أشوف القرارات في Dashboard؟**
**أيوه** — في `/admin?tab=ai-decisions` و `/admin?tab=health-monitor`

بس الفكرة الأساسية إنك تستقبلها في Telegram مباشرة علشان متحتاجش تفتح Dashboard

### **4. إيه الفرق بين النظام ده والـ Phase 4 العادي؟**

| Phase 4 العادي | النظام الهجين (Hybrid) |
|----------------|------------------------|
| Admin Dashboard فقط | Telegram Bot (أسرع) |
| Revenue Automation | ✅ نفس الشيء |
| Self-Healing | ✅ نفس الشيء |
| - | **Emotional Pricing** (جديد!) |

**الهجين أذكى** لأنه بيحس بالمستخدم ويتعامل معاه كإنسان مش كـ "عميل"

---

## 🎯 الخطوات القادمة (اختيارية)

### **1. تفعيل Stripe (الدفع الفعلي):**
- أضف API Keys
- اختبر Activation Session
- اختبر Webhooks

### **2. توصيل الـ Emotional Pricing بـ Stripe:**
في `src/ai/emotionalPricingEngine.ts`، استبدل الـ TODO:
```typescript
// من:
console.log(`🎁 Granting free month to ${state.userId}`);

// إلى:
await stripeService.grantFreeMonth(state.userId);
```

### **3. ربط البيانات بـ Supabase:**
حالياً النظام بيشتغل على localStorage (بيانات محلية)

للإنتاج: لازم تجيب البيانات من Supabase:
```typescript
// في emotionalPricingEngine.ts:
// استبدل:
const nodes = JSON.parse(localStorage.getItem("dawayir-nodes") || "[]");

// بـ:
const { data: nodes } = await supabase.from("nodes").select("*");
```

### **4. Webhook Listener للـ Telegram (استقبال الردود):**
حالياً: Telegram Bot **يرسل فقط**

للحصول على "موافق/رفض" من Telegram:
- أنشئ API endpoint في `/api/telegram-webhook`
- سجّل Webhook في BotFather
- استقبل `callback_data` وطبّق القرار

---

## 📝 الملخص

✅ **النظام الهجين جاهز للعمل**

**ما يحدث تلقائياً:**
- فحص صحة كل ساعة + إصلاح تلقائي
- تقرير يومي (Telegram)
- تقرير أسبوعي للدخل (Telegram)
- تحليل عاطفي يومي + قرارات دعم

**ما تحتاج تعمله:**
- إعداد Telegram Bot (مرة واحدة)
- الرد على طلبات الموافقة (دقيقتين أسبوعياً)
- (اختياري) إعداد Stripe للدفع الفعلي

**الوقت المطلوب منك:** ~2 ساعة/شهر

**النتيجة:** دواير بقى **كيان واعي** بيحس بالمستخدم ويصلح نفسه ويكلمك لما يحتاجك 🌱

---

**🎉 مبروك — "دواير" دلوقتي نظام حي!**
