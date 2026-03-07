# إعدادات Environment Variables في Vercel

## 📋 الخطوات

1. روح على [Vercel Dashboard](https://vercel.com/dashboard)
2. اختار المشروع `alrehla`
3. روح على **Settings** → **Environment Variables**
4. أضف الـ variables دي حسب الأولوية

---

## ✅ المتغيرات المطلوبة (Critical)

يجب إضافتها **لكل البيئات**: Production, Preview, Development

### Supabase (Database & Auth)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://acvcnktpsbayowhurcmn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdmNua3Rwc2JheW93aHVyY21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTQwOTksImV4cCI6MjA4NTk5MDA5OX0.ZlfaA7HA-09OhnUGeUieqbKcCnL9KKLQaT5C-I-tuXA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdmNua3Rwc2JheW93aHVyY21uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQxNDA5OSwiZXhwIjoyMDg1OTkwMDk5fQ.EU428drssoyAgitVE9AIgZZ5xC-2mb5uOs2cqnv1GI0
SUPABASE_PROJECT_REF=acvcnktpsbayowhurcmn
```

### Admin & Security
```bash
ADMIN_API_SECRET=<YOUR_ADMIN_API_SECRET>
NEXT_PUBLIC_ADMIN_CODE=5nVXpSLiGoNXHXJ6rLrZBseSD5qfDDFcNAtCLYJ7yvopJZl7ICnDSxb0i0tFyL
CRON_SECRET=<YOUR_CRON_SECRET>
```

### Site URL
```bash
PUBLIC_APP_URL=https://www.alrehla.app
NEXT_PUBLIC_SITE_URL=https://www.alrehla.app
```

---

## 🎯 المتغيرات الاختيارية (للفيتشرز الكاملة)

### Gemini AI (للذكاء الاصطناعي)
```bash
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
NEXT_PUBLIC_GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
```

### Stripe Payments
**Test Mode:**
```bash
STRIPE_MODE=test
STRIPE_SECRET_KEY=<YOUR_STRIPE_SECRET_KEY>
STRIPE_WEBHOOK_SECRET=<YOUR_STRIPE_WEBHOOK_SECRET>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<YOUR_STRIPE_PUBLISHABLE_KEY>
NEXT_PUBLIC_STRIPE_PRICE_PREMIUM=<YOUR_PRICE_ID_PREMIUM>
NEXT_PUBLIC_STRIPE_PRICE_COACH=<YOUR_PRICE_ID_COACH>
```

### Payment Settings
```bash
NEXT_PUBLIC_PUBLIC_PAYMENTS_ENABLED=true
NEXT_PUBLIC_AUTOMATED_CARD_CHECKOUT_ENABLED=false
NEXT_PUBLIC_PAYMENT_BANK_IBAN=EG480037015608181130803073364
NEXT_PUBLIC_PAYMENT_BANK_BENEFICIARY=Mohamed Refaat
NEXT_PUBLIC_PAYMENT_BANK_NAME=QNB
NEXT_PUBLIC_PAYMENT_BANK_SWIFT=QNBAEGCXXXX
NEXT_PUBLIC_PAYMENT_BANK_ACCOUNT_NUMBER=1130803073364
NEXT_PUBLIC_PAYMENT_ETISALAT_CASH_NUMBER=01110795932
NEXT_PUBLIC_PAYMENT_VODAFONE_CASH_NUMBER=01023050092
NEXT_PUBLIC_PAYMENT_INSTAPAY_ALIAS=m7mdref3t@instapay
NEXT_PUBLIC_PAYMENT_INSTAPAY_NUMBER=01023050092
NEXT_PUBLIC_PAYMENT_PAYPAL_EMAIL=mohamedrefatmohamed@gmail.com
NEXT_PUBLIC_PAYMENT_PAYPAL_URL=https://paypal.me/M7mdRef3t
NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER=201023050092
```

### Pricing Labels
```bash
NEXT_PUBLIC_FOUNDING_COHORT_PRICE_LABEL=12-15 USD
NEXT_PUBLIC_LOCAL_PREMIUM_PRICE_LABEL=150 EGP / month
NEXT_PUBLIC_GLOBAL_PREMIUM_PRICE_LABEL=9.99 USD / month
```

### Engine Mode (للتطوير)
```bash
ENGINE_MODE=mock
```

### Sentry (Error Monitoring) - اختياري
```bash
NEXT_PUBLIC_SENTRY_DSN=https://<key>@sentry.io/<project>
SENTRY_DSN=https://<key>@sentry.io/<project>
SENTRY_AUTH_TOKEN=<token>
SENTRY_ORG=alrehla
SENTRY_PROJECT=javascript-react
```

---

## 📝 ملاحظات مهمة

### 1. الفرق بين VITE_ و NEXT_PUBLIC_
- ❌ **لا تستخدم** `VITE_` في Next.js
- ✅ **استخدم** `NEXT_PUBLIC_` للمتغيرات اللي تحتاجها في الـ client-side
- ✅ المتغيرات **بدون prefix** متاحة بس في server-side (API routes)

### 2. البيئات (Environments)
عند إضافة أي متغير، اختار البيئات المناسبة:
- ✅ **Production**: للموقع الحي
- ✅ **Preview**: لكل pull request
- ✅ **Development**: للتطوير المحلي

### 3. الأمان
- 🔒 **ADMIN_API_SECRET** و **SUPABASE_SERVICE_ROLE_KEY** حساسة جداً
- 🔒 لا تشاركها أبداً
- 🔒 Vercel بتشفّرها تلقائياً

### 4. Cron Jobs
الـ cron jobs محددة في `vercel.json` وهتشتغل تلقائياً:
- Daily report: 8 PM كل يوم
- Weekly report: 8 AM كل إثنين

### 5. Stripe Test vs Live
- حالياً الـ mode على **test**
- لما تجهز للإنتاج، حط الـ Live keys وغيّر `STRIPE_MODE=live`

---

## 🚀 بعد إضافة الـ Variables

1. اعمل **Redeploy** للمشروع عشان التغييرات تشتغل
2. أو استنى الـ push الجاي وهيعمل deploy تلقائياً

---

## ✨ Quick Copy للـ Critical Variables

للسرعة، انسخ الـ block ده كامل:

```
NEXT_PUBLIC_SUPABASE_URL=https://acvcnktpsbayowhurcmn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdmNua3Rwc2JheW93aHVyY21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTQwOTksImV4cCI6MjA4NTk5MDA5OX0.ZlfaA7HA-09OhnUGeUieqbKcCnL9KKLQaT5C-I-tuXA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdmNua3Rwc2JheW93aHVyY21uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQxNDA5OSwiZXhwIjoyMDg1OTkwMDk5fQ.EU428drssoyAgitVE9AIgZZ5xC-2mb5uOs2cqnv1GI0
SUPABASE_PROJECT_REF=acvcnktpsbayowhurcmn
ADMIN_API_SECRET=<YOUR_ADMIN_API_SECRET>
NEXT_PUBLIC_ADMIN_CODE=5nVXpSLiGoNXHXJ6rLrZBseSD5qfDDFcNAtCLYJ7yvopJZl7ICnDSxb0i0tFyL
CRON_SECRET=<YOUR_CRON_SECRET>
PUBLIC_APP_URL=https://www.alrehla.app
NEXT_PUBLIC_SITE_URL=https://www.alrehla.app
```

وبعدين أضف الاختيارية على حسب احتياجك! 🎯

