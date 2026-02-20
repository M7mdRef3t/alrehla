# Logic Flow First Policy

## القاعدة
أي Feature جديدة لازم تتوثق الأول كـ Logic Flow قبل أي تعديل كود.

## المبدأ
- ممنوع لمس الكود قبل بناء الـ Mental Model.
- الـ Mental Model يتم تثبيته في ملف Flow مستقل داخل `docs/logic-flows/`.

## المطلوب قبل الكود
1. إنشاء/تحديث ملف Flow تحت `docs/logic-flows/`.
2. الملف لازم يوضح:
- الهدف (Goal)
- المدخلات/المخرجات
- الحالات (States)
- الانتقالات (Transitions)
- الحالات الفاشلة وFallback
- قيود الأداء والأمان
- معايير القبول
3. بعد اعتماد الـ Flow، يبدأ التنفيذ البرمجي.

## صيغة التسمية
- `docs/logic-flows/<feature-name>.md`
- مثال: `docs/logic-flows/mission-launch-flow.md`

## بوابة CI
عند وجود تغييرات برمجية في PR (مثل `src/`, `app/`, `server/`, `api/`) لازم يوجد معها تغيير واحد على الأقل في:
- `docs/logic-flows/*.md`

غير كده الـ CI يفشل تلقائياً.

