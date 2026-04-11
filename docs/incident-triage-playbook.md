# Incident Triage Playbook

Updated: 2026-04-10

## Purpose

هذا الملف هو دليل الاستجابة السريعة عند حدوث عطل في المنصة.

بدل أن نبدأ كل مرة من الصفر، يوضح هذا الـ playbook:

- كيف نصنف العطل
- أين نبدأ التحقيق
- ما هي أول الملفات والـ stores والـ services التي يجب فتحها
- ما هي العلامات التي ترجح أن المشكلة في route أو state أو journey definition أو feature flag

يرتبط هذا الملف مع:

- `docs/route-to-service-matrix.md`
- `docs/screen-ownership-map.md`
- `docs/critical-flows-checklist.md`
- `src/services/navigation.ts`
- `src/services/journeyTracking.ts`

## Triage Priorities

### P0

عطل يمنع المستخدم من الدخول أو يكسر رحلة أساسية بالكامل:

- app shell لا يفتح
- الشاشة بيضاء
- رحلة `sanctuary`, `weather`, `dawayir-live`, أو `maraya` لا يمكن إكمالها
- الأدمن لا يفتح للأونر

### P1

عطل لا يمنع الدخول لكنه يكسر مرحلة مهمة:

- زر رئيسي لا يعمل
- targetScreen خاطئة
- خطوة معطلة لا تُحترم
- import / save في لوحة المسارات مكسور

### P2

عطل بصري أو انحراف سلوكي جزئي:

- عنصر لا يظهر
- CTA نصها خاطئ
- feature flag لا يطبق بدقة
- سجل أو معاينة في الأدمن غير دقيقة

## First 5 Minutes

### 1. Classify the incident

اسأل:

- هل المشكلة في `user`, `dev`, أم `owner`؟
- هل هي `route` مستقلة أم شاشة داخل `app shell`؟
- هل ترتبط بـ journey معينة؟
- هل هي bug ثابت أم intermittent؟

### 2. Identify the exact surface

حدد واحدًا من:

- `landing`
- `app shell`
- `weather`
- `dawayir`
- `dawayir-live`
- `maraya`
- `admin`
- `feature flags`
- `auth callback`

### 3. Check if this is config-driven

هل الشاشة أو السلوك يعتمد على:

- `journeyPaths`
- `feature flags`
- `boot action`
- `localStorage/sessionStorage`

إذا كانت الإجابة نعم، افتح تعريفات config أولًا قبل تعديل الـ UI.

## Symptom-Based Triage

## 1. User lands on wrong screen

### Likely Area

- navigation or boot intent

### Open First

- `src/services/navigation.ts`
- `src/modules/meta/app-shell/AppExperienceShell.tsx`
- `src/modules/meta/app-shell/useAppRouteSync.ts`
- `src/modules/meta/app-shell/useAppJourneyEntryActions.ts`

### Check

- هل يوجد `dawayir-app-boot-action`
- هل `setScreen(...)` تُنفذ ثم تُكتب فوقها لاحقًا
- هل route/hash ينعكس على الشاشة الحقيقية أم لا

### Common Root Causes

- boot action تُستهلك مرتين
- hash يتغير بدون تغيير `screen state`
- route مستقلة ترجع إلى `landing` fallback

## 2. Journey path ignores admin settings

### Likely Area

- `journeyPaths` definition or helper mismatch

### Open First

- `src/state/adminState.ts`
- `src/utils/journeyPaths.ts`
- helper الخاص بالرحلة:
  - `src/utils/relationshipWeatherJourney.ts`
  - `src/utils/dawayirLiveJourney.ts`
  - `src/utils/marayaStoryJourney.ts`
  - sanctuary flow داخل `useAppPulseSanctuaryFlow.ts`

### Check

- هل path `isActive`
- هل الخطوة `enabled`
- هل `entryScreen` و`targetScreen` صالحتان
- هل helper يقرأ `getFirstJourneyStepByKind` أو `getEnabledJourneySteps` بشكل صحيح

### Common Root Causes

- path غير مفعلة
- outcome أو screen ثابتة hardcoded في مكان آخر
- persist قديم يغطي المسارات الافتراضية الجديدة

## 3. CTA opens wrong route

### Likely Area

- navigation helper or target resolution

### Open First

- الملف المضيف للزر
- helper الخاص بالرحلة
- `src/services/navigation.ts`

### Check

- هل CTA تعتمد على `targetScreen` أم route ثابتة
- هل target route تبدأ بـ `/` أم app-shell screen
- هل `prepare...ReturnNavigation()` أو boot action مطلوبة قبل `assignUrl`

### Common Root Causes

- نسيان كتابة boot action قبل الانتقال
- target screen داخل shell لكن يُتعامل معها كرابط route
- helper قديم ما زال مستخدمًا

## 4. App shell opens but specific screen is blank

### Likely Area

- `AppExperienceSurface` composition or lazy import branch

### Open First

- `src/modules/meta/app-shell/AppExperienceSurface.tsx`
- `src/modules/meta/AppJourneyScreens.tsx`
- المكوّن الخاص بالشاشة نفسها

### Check

- هل branch `screen === ...` موجودة فعلًا
- هل props الأساسية تمر
- هل lazy-loaded component يرندر `null` بسبب شرط

### Common Root Causes

- screen enum غير متطابق
- شرط مبكر يرجع `null`
- مكوّن route فقط وليس app-shell-aware

## 5. Sanctuary does not open or ends incorrectly

### Likely Area

- pulse flow / sanctuary path config

### Open First

- `src/modules/meta/app-shell/useAppPulseSanctuaryFlow.ts`
- `src/modules/meta/SanctuaryDashboard.tsx`
- `src/state/pulseState.ts`
- `src/state/adminState.ts`

### Check

- الطاقة الحالية
- `entryScreen`
- وجود `decision` و`intervention`
- configured next screen after breathing

### Common Root Causes

- decision/intervention disabled but code still assumes them
- low pulse suppression timer active
- target screen falls back unexpectedly

## 6. Weather funnel breaks mid-way

### Likely Area

- runtime stage sequencing

### Open First

- `app/weather/WeatherForecastClient.tsx`
- `src/utils/relationshipWeatherJourney.ts`
- `src/state/adminState.ts`

### Check

- `getRelationshipWeatherInitialStage`
- `getRelationshipWeatherNextStage`
- هل `weather_context` يُكتب قبل الانتقال
- هل `screen` أو `outcome` معطلة

### Common Root Causes

- مرحلة مفعلة في الكود لكنها معطلة إداريًا
- ترتيب الخطوات تغيّر والكود لم يواكبه
- CTA تعتمد على target ثابت

## 7. Dawayir Live completes but return flow is wrong

### Likely Area

- live complete page and journey helper

### Open First

- `src/modules/dawayir-live/pages/LiveSessionCompletePage.tsx`
- `src/utils/dawayirLiveJourney.ts`

### Check

- `getDawayirLiveReturnHref`
- `prepareDawayirLiveReturnNavigation`
- هل outcome route أم app-shell screen

### Common Root Causes

- assignUrl بدون prepare navigation
- targetScreen قديمة
- complete page لم تحمل أحدث `journeyPaths`

## 8. Maraya ends but does not return correctly

### Likely Area

- maraya return helpers

### Open First

- `src/modules/maraya/MarayaApp.jsx`
- `src/utils/marayaStoryJourney.ts`
- `src/modules/action/JourneyToolsScreen.tsx`

### Check

- `getMarayaStoryReturnHref`
- `launchMarayaStoryReturn`
- هل المسار الحالي `maraya-story` أم launch route مباشر قديم

### Common Root Causes

- زر return غير مربوط بالhelper
- target screen shell داخلي لكن treated as `/`
- restart label أو return label غير متوافقة مع path الحالية

## 9. Admin path editor behaves strangely

### Likely Area

- persisted state, list keys, import/export logic

### Open First

- `src/components/admin/dashboard/Paths/JourneyPathsPanel.tsx`
- `src/components/admin/dashboard/Paths/components/PathArchitect.tsx`
- `src/state/adminState.ts`
- `src/services/adminApi.ts`

### Check

- هل البيانات normalized
- هل keys stable
- هل backup/import/restore شغالة
- هل selected path id صالح

### Common Root Causes

- localStorage قديم
- path أو step بدون `id`
- list key duplicates
- import diff preview لم يصفّ الحالة بشكل صحيح

## 10. Feature is visible to wrong user

### Likely Area

- feature access calculation

### Open First

- `src/config/features.ts`
- `src/utils/featureFlags.ts`
- الشاشة المستهلكة لـ `availableFeatures`

### Check

- هل flag ضمن `REVENUE_FIRST_FEATURES`
- هل المستخدم في `god mode`
- هل flag `beta`
- هل `betaAccess` مفعلة

### Common Root Causes

- owner logic overrides expected user behavior
- revenue mode يغلق feature لم تكن محسوبة
- الشاشة لا تحترم `availableFeatures`

## 11. Admin route returns 404 from API

### Likely Area

- `adminApi` fallback and backend endpoint availability

### Open First

- `src/services/adminApi.ts`
- route backend المقابل في `app/api/admin/*`

### Check

- هل endpoint موجودة فعلًا
- هل في dev هناك fallback محلي
- هل الاستدعاء يعتمد على path غير مدعوم

### Common Root Causes

- panel يطلب endpoint غير موجودة
- تم نقل البيانات إلى fallback محلي لكن call ما زال حيًا
- path query string غير صحيحة

## State-First Triage Table

| Symptom | Open State First |
| --- | --- |
| wrong current screen | `appShellNavigationState.ts` |
| journey path mismatch | `adminState.ts` |
| map behavior mismatch | `mapState.ts` |
| pulse/sanctuary issue | `pulseState.ts` |
| auth / access issue | `authState.ts` |
| overlay stuck / missing | `appOverlayState.ts` |

## Storage-First Triage Table

| Symptom | Check Storage |
| --- | --- |
| route handoff wrong | `sessionStorage` for `dawayir-app-boot-action` |
| weather bridge wrong | `sessionStorage` for `weather_context` |
| admin paths missing/new paths hidden | persisted `adminState` / local storage backup |
| admin sidebar visibility issue | sidebar visibility key |

## What To Capture During Incident

عند فتح incident، سجّل بسرعة:

1. الرابط الحالي
2. هل المشكلة على `user` أم `owner`
3. الشاشة أو path الحالية
4. آخر خطوة صحيحة قبل الكسر
5. هل المشكلة قابلة للتكرار دائمًا
6. هل توجد boot actions أو params في الرابط

## Escalation Thresholds

### Escalate immediately if

- route أو app shell لا تفتح
- الأدمن لا يفتح للأونر
- رحلة حرجة لا يمكن إكمالها
- auth callback تكسر العودة

### Safe to local-fix first if

- CTA نصها خاطئ
- عنصر بصري مفقود
- سجل أو telemetry panel غير دقيق
- debug route مكسورة لكن user flow سليم

## Recommended Investigation Order

1. حدّد mode والsurface من `screen-ownership-map.md`
2. حدّد route/store/service من `route-to-service-matrix.md`
3. راجع flow checklist من `critical-flows-checklist.md`
4. افتح helper أو store الأقرب
5. أصلح السبب لا العرض فقط

## Suggested Next Documentation Layer

الطبقة التالية الأكثر فائدة بعد هذا:

1. `Journey-by-Journey QA Scripts`
2. `Release Readiness Checklist`
3. `Owner Ops Manual`
