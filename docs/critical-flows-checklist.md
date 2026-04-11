# Critical Flows Checklist

Updated: 2026-04-10

## Purpose

هذا الملف هو مرجع QA وتشغيل للمسارات الحرجة في المنصة.

لكل flow مهم نوثق:

- Preconditions
- Happy Path
- Edge Cases
- Failure Signals
- Regression Checks

هذا الملف مصمم ليُستخدم:

- بعد أي تعديل في المسارات
- قبل الإطلاق
- أثناء التحقيق في الأعطال

يرتبط هذا الملف مع:

- `docs/platform-functional-map.md`
- `docs/route-to-service-matrix.md`
- `docs/screen-ownership-map.md`
- `docs/feature-flag-matrix.md`

## Checklist Format

### Preconditions

ما الذي يجب أن يكون صحيحًا قبل الاختبار

### Happy Path

المسار الرئيسي الذي يجب أن يعمل بدون مفاجآت

### Edge Cases

حالات جانبية يجب ألا تكسر الرحلة

### Failure Signals

علامات واضحة أن flow مكسور

### Regression Checks

أمور يجب فحصها سريعًا بعد أي تعديل قريب من هذا المسار

## 1. App Shell Entry

### Scope

- `app/page.tsx`
- `app/app/page.tsx`
- `src/modules/meta/app-shell/AppExperienceShell.tsx`
- `src/modules/meta/app-shell/AppShellRouteGate.tsx`
- `src/modules/meta/app-shell/AppExperienceSurface.tsx`

### Preconditions

- التطبيق يبني ويعمل
- لا يوجد route guard يكسر الدخول
- حالة `authState` قابلة للقراءة

### Happy Path

- فتح `/` أو `/app`
- الوصول إلى app shell دون شاشة بيضاء
- تحميل الشاشة الافتراضية المناسبة
- استهلاك أي `boot action` صالح مرة واحدة فقط

### Edge Cases

- وجود `dawayir-app-boot-action`
- callback auth في الرابط
- الدخول مع `hash` مثل `#sanctuary`
- العودة من route مستقل إلى app shell

### Failure Signals

- المستخدم يرجع إلى `landing` رغم وجود boot action
- hash يتغير لكن الشاشة لا تتغير
- app shell يفتح route خاطئة أو loop
- overlays تفتح قبل اكتمال bootstrap

### Regression Checks

- الانتقال بين `landing`, `map`, `tools`, `sanctuary`
- فتح route مستقل ثم العودة
- login intent أو recovery intent لا يضيع

## 2. Sanctuary Journey

### Scope

- `src/modules/meta/app-shell/useAppPulseSanctuaryFlow.ts`
- `src/modules/meta/SanctuaryDashboard.tsx`
- `src/state/adminState.ts`
- `src/utils/journeyPaths.ts`

### Preconditions

- يوجد path فعال `sanctuary`
- `entryScreen`, `targetScreen`, والخطوات صالحة
- `pulseState` يعمل

### Happy Path

- المستخدم من `landing` أو `entryScreen`
- انخفاض الطاقة أو trigger مناسب
- فتح `pulseCheck`
- حسب المسار:
  - `cocoon`
  - `breathing`
  - `sanctuary`
- ثم الانتقال إلى `targetScreen` أو outcome

### Edge Cases

- تعطيل خطوة `decision`
- تعطيل خطوة `intervention`
- تغيير `targetScreen`
- تغيير ترتيب `screen` و`outcome`
- إيقاف path بالكامل

### Failure Signals

- hash `#sanctuary` يظهر بدون فتح الشاشة
- `breathing` لا تفتح رغم تفعيلها
- المستخدم يعود إلى `landing` بدل المسار التالي
- CTA داخل الملاذ لا تتبع تعريف المسار

### Regression Checks

- الدخول إلى الملاذ من السايدبار
- auto-trigger عند طاقة منخفضة
- إخفاء الأزرار المعطلة
- احترام `entryScreen` و`targetScreen`

## 3. Relationship Weather Journey

### Scope

- `app/weather/page.tsx`
- `app/weather/WeatherForecastClient.tsx`
- `src/utils/relationshipWeatherJourney.ts`
- `src/state/adminState.ts`

### Preconditions

- path `relationship-weather` موجود وفعال
- `/weather` يفتح بشكل صحيح
- `journeyPaths` محملة من الأدمن أو الافتراضي

### Happy Path

- دخول `/weather`
- الأسئلة تظهر
- التحليل يظهر
- النتيجة تظهر
- الضغط على CTA الرئيسي
- حفظ `weather_context`
- العبور إلى دواير أو `targetScreen`

### Edge Cases

- تعطيل `check`
- تعطيل `decision`
- تعطيل `screen`
- تغيير ترتيب `check`, `decision`, `screen`, `outcome`
- `targetScreen` يكون route مستقلًا

### Failure Signals

- الأسئلة تتكرر أو لا تتقدم
- النتيجة لا تحترم ترتيب المسار
- CTA يفتح route ثابتة بدل تعريف المسار
- `weather_context` لا يُحفظ قبل العبور

### Regression Checks

- البداية من `entryScreen`
- الانتقال حسب `getRelationshipWeatherInitialStage`
- الانتقال حسب `getRelationshipWeatherNextStage`
- التسمية والوصف الديناميكيان للوجهة التالية

## 4. Dawayir Live Journey

### Scope

- `app/dawayir-live/*`
- `src/modules/dawayir-live/DawayirLiveApp.tsx`
- `src/modules/dawayir-live/pages/LiveSessionCompletePage.tsx`
- `src/utils/dawayirLiveJourney.ts`
- `src/modules/exploration/CoreMapScreen.tsx`

### Preconditions

- path `dawayir-live` موجود وفعال
- flag `dawayir_live` مناسب للمستخدم الحالي
- launch من map أو surface صالح

### Happy Path

- إطلاق من الخريطة أو route
- welcome
- setup
- live session
- complete page
- العودة إلى outcome أو target

### Edge Cases

- launch مع `nodeId`, `nodeLabel`, `goalId`
- restart من شاشة الإكمال
- فتح `history`
- فتح `couple`
- فتح `coach`
- target يكون داخل app shell أو route مستقل

### Failure Signals

- setup لا تنتقل إلى live
- complete page لا تعود للوجهة الصحيحة
- restart لا يحافظ على launch surface
- `history` أو `couple` أو `coach` تخرج عن المسار المرجعي

### Regression Checks

- الزر من `CoreMapScreen`
- `getDawayirLiveLaunchHref`
- `getDawayirLiveReturnHref`
- `prepareDawayirLiveReturnNavigation`

## 5. Maraya Story Journey

### Scope

- `app/maraya/page.tsx`
- `src/modules/maraya/MarayaApp.jsx`
- `src/modules/action/JourneyToolsScreen.tsx`
- `src/utils/marayaStoryJourney.ts`

### Preconditions

- path `maraya-story` موجود وفعال
- أداة المرآة أو launch surface متاحة

### Happy Path

- فتح مرايا من الأدوات أو route
- دخول التجربة
- الوصول إلى ending state
- ظهور زر return الديناميكي
- العودة إلى `targetScreen` أو outcome

### Edge Cases

- `judgeMode`
- restart من النهاية
- target route مستقل
- target app-shell screen
- secondary label مخصص

### Failure Signals

- مرايا تفتح route ثابتة بدل path definition
- زر الإرجاع لا يحترم `targetScreen`
- restart لا يحترم launch helper
- النهاية تظهر بلا أزرار path-aware

### Regression Checks

- launch من `JourneyToolsScreen`
- `getMarayaStoryLaunchHref`
- `getMarayaStoryReturnHref`
- `launchMarayaStoryReturn`

## 6. Journey Paths Admin Flow

### Scope

- `app/admin/page.tsx`
- `src/components/admin/AdminDashboard.tsx`
- `src/components/admin/dashboard/Paths/JourneyPathsPanel.tsx`
- `src/services/adminApi.ts`
- `src/state/adminState.ts`

### Preconditions

- المستخدم owner أو admin
- الأدمن يفتح بدون gate broken
- `journeyPaths` قابلة للتحميل والحفظ

### Happy Path

- فتح تبويب `Journey Paths`
- رؤية كل المسارات الافتراضية والمحفوظة
- اختيار path
- تعديل الخطوات
- حفظ ناجح
- معاينة runtime
- `Apply / Run now`

### Edge Cases

- بيانات قديمة في `localStorage`
- import JSON
- diff preview
- backup restore
- سجل العمليات
- سجل التجارب وإعادة التشغيل

### Failure Signals

- path جديدة لا تظهر بسبب persist قديم
- duplicate keys في React
- حفظ path مكسورة رغم أخطاء حرجة
- import يحذف active path بدون تأكيد إضافي

### Regression Checks

- merge المسارات الافتراضية مع المحفوظة
- تعطيل زر الحفظ عند الأخطاء الحرجة
- التصفية والمسح في السجلات
- import/export/backup/restore

## 7. Admin Sidebar and Navigation

### Scope

- `src/components/admin/AdminDashboard.tsx`
- `src/components/admin/adminNavigation.tsx`

### Preconditions

- الأدمن يفتح
- state الخاصة بالسايدبار صالحة

### Happy Path

- السايدبار تظهر على الديسكتوب
- يمكن إخفاؤها وإظهارها
- الحالة تُحفظ
- handle جانبي يرجعها
- الاختصار `Ctrl+B` أو `[` يعمل

### Edge Cases

- الكتابة داخل input يجب ألا تفعّل الاختصار
- الانتقال بين التبويبات مع سايدبار مخفية
- reload مع حالة مخفية محفوظة

### Failure Signals

- السايدبار لا ترجع بعد الإخفاء
- الاختصار يعمل أثناء الكتابة
- الـ handle لا يظهر
- المحتوى لا يتمدد بعد الإخفاء

### Regression Checks

- mobile behavior لم يتكسر
- desktop collapse يعمل
- persistence تعمل عبر reload

## 8. Feature Flag Gating

### Scope

- `src/config/features.ts`
- `src/utils/featureFlags.ts`
- أي شاشة تعتمد على `availableFeatures`

### Preconditions

- feature flags قابلة للقراءة
- `role`, `adminAccess`, `isDev`, `betaAccess` واضحة

### Happy Path

- feature `on` تظهر
- feature `off` تختفي
- feature `beta` تظهر لمستخدم beta أو god mode
- `Revenue-First` فقط يبقى ظاهرًا للمستخدم العادي في user mode

### Edge Cases

- owner في user mode
- developer مع admin access
- feature `beta` في revenue mode
- feature `on` لكنها ليست ضمن `Revenue-First`

### Failure Signals

- feature تظهر لمستخدم عادي رغم وجوب إخفائها
- feature beta لا تظهر للأونر
- user mode يعرض أسطح dev أو owner بالخطأ

### Regression Checks

- `dawayir_live`
- `journey_tools`
- `mirror_tool`
- `pulse_check`
- أي feature تعتمد عليها شاشة حرجة

## 9. Authentication and Return Flow

### Scope

- `app/auth/callback/page.tsx`
- `src/modules/meta/app-shell/AppExperienceShell.tsx`
- `src/state/authState.ts`

### Preconditions

- auth provider يعمل
- callback route سليم

### Happy Path

- فتح login
- العودة من callback
- استهلاك intent المناسب
- الرجوع إلى الشاشة المرجوة

### Edge Cases

- login intent من الأدمن
- login intent من landing
- auth callback مع hash params

### Failure Signals

- المستخدم يرجع إلى landing بلا سبب
- intent يضيع
- callback يفتح shell في حالة غير صحيحة

### Regression Checks

- open login ثم العودة
- auth callback مع code
- auth callback مع hash token

## 10. Documentation Update Trigger

بعد أي تعديل في واحد من هذه المحاور، راجع هل نحتاج تحديث الملفات التالية:

- `platform-functional-map.md`
- `route-to-service-matrix.md`
- `screen-ownership-map.md`
- `feature-flag-matrix.md`
- `critical-flows-checklist.md`

## Recommended Use Order

عند فحص عطل أو قبل إطلاق:

1. ابدأ من `screen-ownership-map.md`
2. ثم `route-to-service-matrix.md`
3. ثم هذا الملف `critical-flows-checklist.md`
4. ثم افتح ملفات المسار نفسها

## Suggested Next Documentation Layer

الطبقة التالية المنطقية بعد هذا الملف:

1. `Journey-by-Journey QA Scripts`
2. `Route Guard and Access Matrix`
3. `Incident Triage Playbook`
