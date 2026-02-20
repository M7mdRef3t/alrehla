# Investor Readiness Pack

## الهدف
توحيد طريقة عرض المنصة لأي مستثمر بشكل مهني وقابل للقياس.

## مكونات الحزمة
1. `docs/investor-kpi-framework.md`
- تعريف المقاييس الأساسية (North Star + Funnel + Retention + Unit Economics).

2. `docs/investor-weekly-memo-template.md`
- تقرير أسبوعي ثابت للمستثمرين/الـ advisors.

3. `docs/investor-data-room-checklist.md`
- قائمة تجهيز Data Room قبل أي جولة تمويل.

## طريقة الاستخدام (عملي)
1. كل أسبوع:
- املأ `investor-weekly-memo-template.md`.
- اربط الأرقام من لوحة الأونر (`owner-ops`, `ops-insights`, `executive-report`).
- أو شغّل التوليد التلقائي:
  - `INVESTOR_MEMO_BASE_URL=https://your-domain.com`
  - `INVESTOR_MEMO_BEARER_TOKEN=<owner_bearer_token>`
  - `npm run investor:memo`
  - الناتج الافتراضي: `docs/investor-weekly-memo-latest.md`

2. كل شهر:
- راجع `investor-kpi-framework.md`.
- قارن trend 4 أسابيع للـ Activation, Retention, Conversion.

3. قبل أي Pitch/Journey:
- عدّي على `investor-data-room-checklist.md` عنصر عنصر.

## قاعدة تشغيل
- أي رقم بدون تعريف + مصدر + فترة زمنية = رقم غير صالح للعرض الاستثماري.
