# Release Readiness Checklist

Updated: 2026-04-10

## Purpose

هذا الملف هو قائمة المراجعة قبل أي release أو نشر مهم.

الهدف:

- منع إطلاق build مكسور
- التأكد أن المسارات الحرجة قابلة للإكمال
- التأكد أن الفرق بين `user`, `dev`, `owner` واضح
- تقليل المفاجآت بعد النشر

يرتبط هذا الملف مع:

- `docs/critical-flows-checklist.md`
- `docs/incident-triage-playbook.md`
- `docs/feature-flag-matrix.md`
- `docs/screen-ownership-map.md`

## Release Gate

لا نعتبر النسخة جاهزة للنشر إلا إذا:

- الشاشات الحرجة تعمل
- المسارات الأساسية قابلة للإكمال
- لا توجد كسور route أو auth واضحة
- الأدمن يفتح للأونر
- feature flags مضبوطة بالشكل المقصود للمستخدم النهائي

## 1. Build and Static Safety

- `typecheck` يمر بدون أخطاء
- لا توجد أخطاء syntax أو JSX مفتوحة
- routes الأساسية تبني
- لا توجد imports مكسورة في الشاشات الحرجة

## 2. Mode Separation

- التحقق أن واجهات `debug-*` ليست جزءًا من تجربة `user`
- التأكد أن التعديلات المقصودة للمستخدم موجودة في `user mode`
- التأكد أن شاشات `owner` لا تظهر للمستخدم العادي
- مراجعة أي سلوك يعتمد على `isUserMode` أو `isDevMode`

## 3. Authentication and Access

- تسجيل الدخول يعمل
- `auth callback` يعيد المستخدم للمكان المتوقع
- الأونر يدخل الأدمن بدون كسر
- المستخدم العادي لا يرى أسطح `owner`
- أي `boot action` خاص بالمصادقة يستهلك مرة واحدة فقط

## 4. Critical User Journeys

### Sanctuary

- الدخول من `landing` أو `entryScreen`
- `pulseCheck` تعمل
- `sanctuary` path تحترم الخطوات المفعلة
- `targetScreen` النهائية صحيحة

### Relationship Weather

- `/weather` تفتح
- الأسئلة تعمل
- التحليل والنتيجة يعملان
- CTA تعبر إلى الوجهة الصحيحة
- `weather_context` يُحفظ

### Dawayir Live

- الإطلاق من الخريطة يعمل
- setup ثم live ثم complete يعملون
- restart من complete يعمل
- return flow صحيح

### Maraya Story

- launch من الأدوات يعمل
- التجربة تصل إلى النهاية
- return button يحترم المسار
- restart لا يكسر الحالة

## 5. Admin Readiness

- `app/admin/page.tsx` يفتح
- `Journey Paths` tab تفتح
- المسارات الافتراضية تظهر
- save يعمل
- import/export يعملان
- backup/restore يعملان
- لا توجد duplicate key warnings في القوائم الأساسية

## 6. Feature Flags Readiness

- مراجعة flags المهمة قبل النشر:
  - `dawayir_map`
  - `journey_tools`
  - `mirror_tool`
  - `pulse_check`
  - `dawayir_live`
- التأكد أن أي feature `beta` لا تظهر للمستخدم الخطأ
- التأكد أن `Revenue-First` behavior هو المقصود

## 7. Route and Navigation Readiness

- `/`
- `/app`
- `/weather`
- `/dawayir`
- `/dawayir-live`
- `/maraya`
- `/admin`

كلها تفتح بدون redirect غير متوقع أو شاشة فارغة.

## 8. State and Persistence

- لا توجد بيانات persist قديمة تخفي مسارات جديدة
- `journeyPaths` تندمج مع الافتراضي كما هو متوقع
- `sessionStorage` لا تحتوي boot actions قديمة تكسر الرحلة
- local storage الخاصة بالأدمن لا تسبب انحرافًا واضحًا

## 9. Performance Sanity Check

- لا توجد شاشات حرجة تعاني render loops واضحة
- لا توجد warnings React خطيرة في الرحلات الأساسية
- لا توجد reflows مبالغ فيها تمنع الاستخدام
- الأدمن يظل قابلًا للاستخدام عند فتح `Journey Paths`

## 10. Analytics and Tracking

- الرحلات الحرجة تسجل أحداثًا معقولة
- لا توجد أخطاء واضحة من `journeyTracking`
- لا توجد أخطاء تنقل تمنع تسجيل الأحداث

## 11. Owner Verification Pass

قبل النشر، يفضل المرور السريع من منظور الأونر على:

- لوحة الأدمن
- Journey Paths
- Sanctuary
- Weather
- Dawayir Live
- Maraya

والتأكد أن:

- كل شيء يفتح
- لا توجد تبويبات مكسورة
- لا توجد surfaces ناقصة أو links خاطئة

## 12. Go / No-Go Questions

قبل اعتماد النسخة، أجب:

1. هل يستطيع المستخدم الدخول والبدء؟
2. هل يستطيع إكمال مسار حرج واحد على الأقل دون كسر؟
3. هل يستطيع الأونر فتح الأدمن والتحكم؟
4. هل تظهر فقط الميزات المقصودة للمستخدم النهائي؟
5. هل لو وقع incident نعرف أين نبدأ فورًا؟

إذا كانت أي إجابة `لا`، فالنسخة ليست جاهزة.

## Minimal Release Pass

إذا كان الوقت ضيقًا جدًا، فهذه أقل مراجعة لا يجب تجاوزها:

1. افتح `/`
2. افتح `/weather`
3. افتح `/dawayir-live`
4. افتح `/maraya`
5. افتح `/admin`
6. جرّب `sanctuary`
7. جرّب حفظ path من الأدمن

## Suggested Next Documentation Layer

الطبقة التالية المنطقية بعد هذا الملف:

1. `Owner Ops Manual`
2. `Journey-by-Journey QA Scripts`
3. `Post-Release Verification Checklist`
