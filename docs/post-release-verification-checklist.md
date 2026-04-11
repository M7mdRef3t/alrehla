# Post-Release Verification Checklist

Updated: 2026-04-10

## Purpose

هذا الملف يُستخدم مباشرة بعد أي release.

الهدف:

- التأكد أن النسخة المنشورة تعمل كما هو متوقع
- اكتشاف الانحرافات السريعة بعد النشر
- التفريق بين "النسخة بَنَت" و"النسخة تعمل فعليًا"

هذا الملف مكمل لـ:

- `docs/release-readiness-checklist.md`
- `docs/critical-flows-checklist.md`
- `docs/incident-triage-playbook.md`

## Verification Windows

### أول 10 دقائق

تحقق سريع من:

- فتح المنصة
- فتح الأدمن
- الرحلات الأساسية
- أي كسر route واضح

### أول ساعة

تحقق أعمق من:

- feature flags
- journey behavior
- السلوك الحقيقي بعد الحفظ من الأدمن

### أول 24 ساعة

راقب:

- incidents
- سلوك المسارات الأساسية
- أي أخطاء متكررة أو انحرافات تشغيلية

## Immediate Pass

نفّذ هذه الخطوات مباشرة بعد النشر:

1. افتح `/`
2. افتح `/app`
3. افتح `/weather`
4. افتح `/dawayir`
5. افتح `/dawayir-live`
6. افتح `/maraya`
7. افتح `/admin`

إذا فشل أي واحد منها، اعتبر ذلك incident حتى لو بقية المنصة تعمل.

## Core Functional Verification

## 1. App Shell

- الدخول إلى app shell يعمل
- لا توجد شاشة بيضاء
- التنقل بين `landing`, `map`, `tools` يعمل
- `boot actions` لا تسبب loops أو redirects غريبة

## 2. Sanctuary

- يمكن الوصول إلى `sanctuary`
- `pulseCheck` لا تكسر الرحلة
- `breathing` تظهر عند الحاجة إذا كانت مفعلة
- العودة إلى `targetScreen` تعمل

## 3. Relationship Weather

- `/weather` تفتح
- الأسئلة والتقدم يعملان
- النتيجة تظهر
- CTA تنقل المستخدم إلى الوجهة المتوقعة

## 4. Dawayir Live

- route تفتح
- setup تعمل
- session path لا تنكسر
- complete screen تفتح
- restart وreturn يعملان

## 5. Maraya Story

- `/maraya` تفتح
- launch من الأدوات يعمل
- النهاية تظهر
- return target صحيح

## 6. Admin

- الأدمن تفتح
- `Journey Paths` tab تعمل
- save لا يفشل
- تشغيل path من الأدمن يعمل

## Config Verification

## Journey Paths

- المسارات الأساسية موجودة:
  - `sanctuary`
  - `relationship-weather`
  - `dawayir-live`
  - `maraya-story`
- لا توجد path مفقودة بسبب persist قديم
- path المفعلة هي المقصودة فقط

## Feature Flags

تحقق سريع من:

- `journey_tools`
- `mirror_tool`
- `pulse_check`
- `dawayir_live`

وسؤال التحقق هو:

- هل تظهر فقط للمستخدم الذي ينبغي أن يراها؟

## Owner Verification Pass

بعد النشر مباشرة، يفضّل أن يمر الأونر على:

1. `Journey Paths`
2. معاينة runtime لمسار واحد على الأقل
3. تشغيل مباشر لمسار واحد
4. فتح `Sanctuary`
5. فتح `Weather`

## Warning Signs

إذا رأيت أيًا من الآتي، افتح incident فورًا:

- route أساسية لا تفتح
- الأدمن لا تفتح
- path مفقودة
- journey helper لا يحترم `targetScreen`
- CTA تذهب لوجهة قديمة أو ثابتة
- شاشة داخل app shell تفتح لكن ترندر `null`

## Quick Rollback Heuristics

فكر في rollback إذا:

- عطل يمس أكثر من رحلة أساسية
- الأدمن غير قابلة للاستخدام
- app shell نفسها غير مستقرة
- auth callback تكسر العودة

لا تتسرع في rollback إذا:

- المشكلة فقط في شاشة `debug`
- المشكلة فقط في panel غير حرجة داخل الأدمن
- المشكلة نصية أو بصرية ولا تمنع المسار

## Documentation Sync Check

بعد أي release مهم، اسأل:

- هل تغيّر تعريف journey فعلًا؟
- هل أضفنا شاشة جديدة؟
- هل أضفنا flag جديدة؟
- هل نحتاج تحديث ملفات `docs`؟

إذا كانت الإجابة نعم، حدّث:

- `platform-functional-map.md`
- `route-to-service-matrix.md`
- `screen-ownership-map.md`
- `feature-flag-matrix.md`

## Minimal Post-Release Pass

إذا كان الوقت ضيقًا جدًا، هذا أقل حد:

1. افتح `/`
2. افتح `/weather`
3. افتح `/dawayir-live`
4. افتح `/maraya`
5. افتح `/admin`
6. احفظ تعديلًا صغيرًا أو راجع `Journey Paths`

## Suggested Next Documentation Layer

الطبقة التالية الأخيرة لو أردنا إكمال الحلقة:

1. `Weekly Owner Review Template`
2. `Journey-by-Journey QA Scripts`
