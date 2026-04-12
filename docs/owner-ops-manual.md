# Owner Ops Manual

Updated: 2026-04-10

## Purpose

هذا الملف هو دليل التشغيل اليومي للأونر داخل المنصة.

الهدف منه:

- توحيد طريقة متابعة المنصة
- تسهيل اتخاذ القرار اليومي
- تقليل الاعتماد على الذاكرة الشخصية
- جعل إدارة المسارات والـ flags والأدمن عملية وواضحة

هذا الملف لا يشرح الكود، بل يشرح التشغيل.

يرتبط هذا الملف مع:

- `docs/platform-functional-map.md`
- `docs/route-to-service-matrix.md`
- `docs/feature-flag-matrix.md`
- `docs/critical-flows-checklist.md`
- `docs/incident-triage-playbook.md`
- `docs/release-readiness-checklist.md`

## Owner Role in This Platform

الأونر هنا ليس فقط مشرفًا تقنيًا، بل:

- مدير التجربة العامة
- منسق المسارات الأساسية
- صاحب قرار ما يُنشر للمستخدم النهائي
- المراقب الأول لأي انحراف في الرحلات الأساسية

## Daily Operating Loop

## 1. Start of Day

ابدأ من:

- `app/admin/page.tsx`

ثم راجع بالتسلسل:

1. هل لوحة الأدمن تفتح طبيعي
2. هل تبويب `Journey Paths` يفتح
3. هل المسارات الأساسية موجودة
4. هل هناك شيء واضح مكسور أو ناقص

## 2. Core Daily Checks

راجع يوميًا على الأقل:

- `sanctuary`
- `relationship-weather`
- `dawayir-live`
- `maraya-story`

السؤال اليومي ليس "هل الكود جميل؟" بل:

- هل الرحلة ما زالت منطقية؟
- هل البداية صحيحة؟
- هل النهاية صحيحة؟
- هل المستخدم سيشعر أن الخطوة التالية واضحة؟

## 3. End of Day

قبل إنهاء اليوم:

- تأكد أن آخر تعديل في `Journey Paths` محفوظ
- راجع إن كان هناك import أو restore أو تشغيل مباشر تم في الأدمن
- إذا تم تعديل سلوك مسار، راجع المعاينة مرة واحدة على الأقل

## Core Operating Areas

## 1. Journey Paths

هذه أهم منطقة تشغيلية للأونر الآن.

منها يمكن:

- تعديل اسم المسار
- تعديل `entryScreen`
- تعديل `targetScreen`
- تفعيل أو تعطيل path
- إعادة ترتيب الخطوات
- إخفاء أو إظهار خطوات
- تشغيل path مباشرة
- مراجعة runtime preview
- مراجعة سجل التجارب
- import / export / backup / restore

### Owner Rule

لا تغيّر أكثر من متغير محوري واحد في نفس المرة إذا كنت تريد تتبع الأثر بوضوح.

أفضل ترتيب:

1. غيّر خطوة واحدة
2. احفظ
3. راجع المعاينة
4. شغّل المسار
5. ثم انتقل للتعديل التالي

## 2. Feature Flags

قبل تفعيل أي ميزة، اسأل:

- هل هذه للمستخدم النهائي أم للأونر فقط؟
- هل يجب أن تكون `Revenue-First`؟
- هل هي `beta` أم `on`؟
- هل المسار الذي تعتمد عليه جاهز أصلًا؟

### Owner Rule

لا تفتح feature لمجرد أنها تعمل تقنيًا. افتحها فقط إذا:

- الرحلة التي تحتويها مفهومة
- لها قيمة حقيقية للمستخدم
- لا تضيف تشتيتًا على التجربة المنشورة

## 3. Admin as Control Plane

الأدمن ليس لوحة مراقبة فقط، بل هو مركز تحكم.

الأونر يستخدمه لـ:

- إدارة المسارات
- التأكد من شكل التجربة
- مراجعة السجلات
- تشغيل التجارب
- اتخاذ قرار النشر أو الإيقاف

### Owner Rule

إذا كان القرار يمس رحلة مستخدم كاملة، فمر أولًا على:

1. `Journey Paths`
2. `Feature Flag Matrix`
3. `Critical Flows Checklist`

## Operating by Journey

## 1. Sanctuary

### متى يتدخل الأونر؟

- إذا الملاذ لا يفتح
- إذا يفتح لكن ينتهي في شاشة خاطئة
- إذا الـ CTA داخله لا تعكس الهدف
- إذا التدخل أكثر أو أقل من اللازم

### ما الذي يراجعه؟

- `entryScreen`
- `targetScreen`
- `decision`
- `intervention`
- الأزرار الثلاثة

### قرار تشغيلي شائع

إذا صار flow ثقيلًا جدًا:

- عطّل `decision` أو `intervention`
- أو غيّر `targetScreen`

بدل إنشاء تجربة جديدة موازية.

## 2. Relationship Weather

### متى يتدخل الأونر؟

- إذا funnel طويلة جدًا
- إذا النتيجة لا تدفع إلى الخطوة التالية بوضوح
- إذا CTA لا تنقل المستخدم فعليًا إلى المسار المقصود

### ما الذي يراجعه؟

- هل الأسئلة ما زالت ضرورية
- هل `decision` ضرورية أم لا
- هل `screen` لازمة أم يمكن العبور مباشرة
- هل `targetScreen` صحيحة

### قرار تشغيلي شائع

إذا أردت funnel أسرع:

- عطّل `decision`
- أو عطّل `screen`

لكن اختبر الناتج مباشرة من اللوحة.

## 3. Dawayir Live

### متى يتدخل الأونر؟

- إذا الإطلاق من الخريطة لا يعمل
- إذا complete screen تعيد المستخدم غلط
- إذا الفروع `history / couple / coach` خرجت عن المنطق

### ما الذي يراجعه؟

- launch path
- return path
- complete path
- flags الخاصة بـ `dawayir_live`

### قرار تشغيلي شائع

إذا الفرع التجريبي يسبب تشويشًا:

- لا تحذف flow كلها
- فقط أعدها إلى `beta` أو أخفها عن المستخدم العادي

## 4. Maraya Story

### متى يتدخل الأونر؟

- إذا مرايا تبدو معزولة عن المنتج
- إذا النهاية لا تقود لشيء واضح
- إذا launch لا تأتي من الأدوات كما يجب

### ما الذي يراجعه؟

- launch من `Journey Tools`
- labels
- return target
- restart behavior

### قرار تشغيلي شائع

إذا كانت مرايا قوية كقيمة لكن معزولة:

- لا تغيّر التجربة نفسها أولًا
- أصلح الـ entry والـ return وربطها بالمسار

## Owner Decision Framework

قبل أي تغيير مهم، اسأل:

1. هل هذا يحسن التجربة للمستخدم النهائي فعلًا؟
2. هل المشكلة في المسار أم في الـ UI فقط؟
3. هل أحتاج feature جديدة أم إعادة ترتيب الموجود؟
4. هل يمكن حل المشكلة من `Journey Paths` بدل الكود؟

## Incident Handling for Owner

إذا ظهر عطل:

1. حدّد هل هو `user`, `dev`, أم `owner`
2. حدّد أي رحلة أو شاشة مكسورة
3. افتح `incident-triage-playbook.md`
4. راجع:
   - `screen-ownership-map.md`
   - `route-to-service-matrix.md`
   - `critical-flows-checklist.md`

### Owner Rule

لا تبدأ بالحل من الأدمن دائمًا.

ابدأ أولًا بفهم:

- هل المشكلة route؟
- state؟
- feature flag؟
- journey definition؟

## Release Decision for Owner

قبل أي release:

راجع `release-readiness-checklist.md`.

أسئلة الأونر النهائية:

1. هل المستخدم يستطيع أن يبدأ؟
2. هل يستطيع أن يكمل مسارًا أساسيًا؟
3. هل الأدمن لا تزال تسيطر على التجربة؟
4. هل ما نعرضه أقل تشتيتًا وأكثر وضوحًا؟

إذا لم تكن الإجابة نعم بوضوح، فالأفضل عدم الإطلاق بعد.

## Recommended Owner Routine

## يوميًا

- افتح الأدمن
- راجع `Journey Paths`
- راجع مسارًا واحدًا على الأقل تشغيلًا مباشرًا

## أسبوعيًا

- راجع feature flags
- راجع رحلة واحدة بعمق
- راجع إن كانت بعض الخطوات يمكن تبسيطها

## قبل أي release

- راجع checklist الخاصة بالإطلاق
- شغّل المسارات الأربع الأساسية
- تأكد أن تجربة `user mode` هي المقصودة فعلًا

## What the Owner Should Avoid

- عدم تغيير أكثر من عنصر جوهري في أكثر من مسار دفعة واحدة
- عدم فتح features تجريبية فقط لأنها متاحة تقنيًا
- عدم استخدام الأدمن كبديل عن فهم الرحلة نفسها
- عدم الحكم على المسار من screenshot فقط بدون تشغيل

## Highest-Leverage Owner Surfaces

إذا كان وقت الأونر محدودًا، فهذه أعلى 5 أسطح تأثيرًا:

1. `Journey Paths`
2. `Sanctuary`
3. `Relationship Weather`
4. `Dawayir Live Complete`
5. `Journey Tools`

## Owner Success Definition

يعتبر تشغيل الأونر ناجحًا عندما:

- يعرف بسرعة أين المشكلة
- يستطيع تعديل المسارات بدون كسر بقية التجربة
- يفرّق بين ما يخص `user` وما يخص `owner`
- يطلق النسخة وهو يعرف بوضوح ما الذي سيتغير على المستخدم

## Suggested Next Documentation Layer

إذا أردنا طبقة أخيرة بعد هذا الملف، فالأكثر قيمة:

1. `Post-Release Verification Checklist`
2. `Weekly Owner Review Template`
3. `Journey-by-Journey QA Scripts`
