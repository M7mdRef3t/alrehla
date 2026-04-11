# Platform Functional Map

Updated: 2026-04-10

## Purpose

هذا الملف لا يكتفي بحصر الملفات، بل يشرح المنصة كمساحات وظيفية:

- كل منطقة في المنتج ماذا تفعل
- ما هي أهم الشاشات أو التطبيقات التابعة لها
- ما هي الـ stores والـ services الأقرب لها
- أين تبدأ المسارات الأساسية وأين تنتهي

يرتبط هذا الملف مع:

- `docs/platform-inventory.md` للحصر الكامل الخام
- `src/state/adminState.ts` لتعريفات `journeyPaths`

## Platform Spine

### 1. App Shell and Route Gating

هذه هي الطبقة التي تمسك تجربة التطبيق العامة: الدخول، التنقل، الأسطح، الأوفرليز، والتحويل بين صفحات Next وتجربة التطبيق الداخلية.

الملفات الأهم:

- `app/page.tsx`
- `app/app/page.tsx`
- `src/modules/meta/app-shell/AppExperienceShell.tsx`
- `src/modules/meta/app-shell/AppExperienceSurface.tsx`
- `src/modules/meta/app-shell/AppShellRouteGate.tsx`
- `src/modules/meta/app-shell/AppOverlayHost.tsx`
- `src/modules/meta/app-shell/AppRuntimeControllers.tsx`
- `src/modules/meta/app-shell/useAppJourneyEntryActions.ts`
- `src/modules/meta/app-shell/useAppRouteSync.ts`

المسؤولية:

- تحديد هل المستخدم داخل تجربة التطبيق أو داخل route مستقل
- مزامنة الشاشة الحالية مع الرابط
- استضافة الأوفرليز والتنقلات العابرة
- تنفيذ boot actions مثل `navigate:*`

أقرب stores:

- `src/state/appOverlayState.ts`
- `src/state/appShellNavigationState.ts`
- `src/state/authState.ts`
- `src/state/journeyState.ts`

أقرب services/utils:

- `src/services/navigation.ts`
- `src/utils/journeyPaths.ts`
- `src/utils/overlayPriorities.ts`

### 2. Meta Layer: Landing, Pulse, Sanctuary Entry

هذه المنطقة هي بوابة الوعي الأساسية للمنتج: الصفحة الرئيسية، نبض المستخدم، نقطة الالتقاط الأولى، ومدخل الملاذ.

الملفات الأهم:

- `src/modules/meta/Landing.tsx`
- `src/modules/meta/PlatformHeader.tsx`
- `src/modules/meta/AppSidebar.tsx`
- `src/modules/meta/SanctuaryDashboard.tsx`
- `src/modules/meta/gate/LayerOneForm.tsx`
- `src/modules/meta/app-shell/useAppPulseSanctuaryFlow.ts`

المسؤولية:

- تقديم قيمة أولية سريعة
- التقاط حالة المستخدم
- دفع المستخدم إلى المسار المناسب
- استدعاء الملاذ عند الانخفاض أو الاحتياج

أقرب stores:

- `src/state/pulseState.ts`
- `src/state/lockdownState.ts`
- `src/state/journeyState.ts`

أقرب services/utils:

- `src/utils/journeyPaths.ts`
- `src/services/consciousnessService.ts`

## Managed Journey Paths

### 1. Safe Sanctuary Journey

الاسم الإداري:

- `sanctuary`

تعريف المسار:

- `src/state/adminState.ts`
- `src/utils/journeyPaths.ts`

التشغيل الفعلي:

- `src/modules/meta/app-shell/useAppPulseSanctuaryFlow.ts`
- `src/modules/meta/SanctuaryDashboard.tsx`
- `src/modules/meta/AppSidebar.tsx`

المسار الحالي منطقيًا:

- `landing`
- `pulseCheck`
- `cocoon`
- `breathing`
- `sanctuary`
- `map` أو الوجهة المستهدفة من `targetScreen`

المسؤولية:

- إنقاذ الحالة العاطفية أو المعرفية عند الانخفاض
- تقديم تهدئة قصيرة قبل إعادة التوجيه
- إعادة المستخدم لمسار واعٍ بدل الخروج القسري

### 2. Relationship Weather Journey

الاسم الإداري:

- `relationship-weather`

تعريف المسار:

- `src/state/adminState.ts`
- `src/utils/relationshipWeatherJourney.ts`

نقاط الدخول والتشغيل:

- `app/weather/page.tsx`
- `app/weather/WeatherForecastClient.tsx`
- `src/modules/meta/Landing.tsx`
- `src/modules/meta/gate/LayerOneForm.tsx`

الوجهة التالية:

- `map` أو ما يحدده `targetScreen`

المراحل التشغيلية:

- `questions`
- `analyzing`
- `result`
- `complete`

المسؤولية:

- تشخيص نمط الاستنزاف أو الطقس العاطفي في العلاقات
- توليد قراءة مفهومة
- تمرير `weather_context` إلى دواير

### 3. Dawayir Live Journey

الاسم الإداري:

- `dawayir-live`

تعريف المسار:

- `src/state/adminState.ts`
- `src/utils/dawayirLiveJourney.ts`

نقاط الدخول والتشغيل:

- `app/dawayir-live/page.tsx`
- `src/modules/dawayir-live/DawayirLiveApp.tsx`
- `src/modules/exploration/CoreMapScreen.tsx`

الفروع المرتبطة:

- `app/dawayir-live/history/page.tsx`
- `app/dawayir-live/couple/page.tsx`
- `app/coach/page.tsx`
- `app/dawayir-live/complete/[sessionId]/page.tsx`

المراحل التشغيلية:

- `setup`
- `live`
- `complete`
- `return`

المسؤولية:

- نقل المستخدم من الخريطة أو عقدة محددة إلى جلسة حية
- إنهاء الجلسة بملخص أو عودة واعية
- توفير امتدادات مثل `history`, `couple`, `coach`

### 4. Maraya Story Journey

الاسم الإداري:

- `maraya-story`

تعريف المسار:

- `src/state/adminState.ts`
- `src/utils/marayaStoryJourney.ts`

نقاط الدخول والتشغيل:

- `app/maraya/page.tsx`
- `src/modules/maraya/MarayaApp.jsx`
- `src/modules/action/JourneyToolsScreen.tsx`

المراحل التشغيلية:

- `landing`
- `story`
- `ending`
- `return`

المسؤولية:

- تحويل تجربة المرآة من أداة منفصلة إلى رحلة مدارة
- فتح التجربة من الأدوات
- إعادة المستخدم إلى `tools` أو أي `targetScreen` إداري بعد النهاية

## Core Product Areas

### 1. Exploration and Map Layer

هذه هي طبقة الاستكشاف والعقد والسطوح التي يتمحور حولها المنتج.

الملفات الأهم:

- `app/dawayir/page.tsx`
- `src/modules/exploration/CoreMapScreen.tsx`
- `src/state/mapState.ts`

المسؤولية:

- عرض الخريطة
- فتح النقاط أو العقد
- إطلاق مسارات مثل `Dawayir Live`

### 2. Journey Tools and Action Layer

هذه المساحة هي صندوق الأدوات التنفيذي للمستخدم بعد الفهم أو التشخيص.

الملفات الأهم:

- `src/modules/action/JourneyToolsScreen.tsx`
- `src/modules/action/*`

المسؤولية:

- إعطاء المستخدم أدوات مباشرة للعمل
- فتح تجارب مثل `Maraya`
- توفير مساحة انتقال من الفهم إلى الفعل

### 3. Dawayir Live Surface

هذه المساحة تمثل التطبيق الفرعي للجلسات الحية.

الملفات الأهم:

- `src/modules/dawayir-live/DawayirLiveApp.tsx`
- `src/modules/dawayir-live/pages/LiveSessionCompletePage.tsx`
- `src/modules/dawayir-live/pages/LiveHistoryPage.tsx`
- `src/modules/dawayir-live/pages/LiveCoachPanel.tsx`
- `src/modules/dawayir-live/pages/LiveCouplePage.tsx`

المسؤولية:

- إدارة الجلسة الحية
- التاريخ والإعادات
- الأسطح المساندة للجلسة

### 4. Maraya Surface

هذه المساحة تمثل تجربة السرد/الانعكاس الخاصة بمرايا.

الملفات الأهم:

- `app/maraya/page.tsx`
- `src/modules/maraya/MarayaApp.jsx`
- `src/lib/maraya/*`
- `app/api/maraya/*`

المسؤولية:

- إدارة سرد التجربة
- حفظ أو استحضار حالة المرآة
- تمرير المستخدم إلى الوجهة التالية بعد النهاية

### 5. Weather Funnel

هذه مساحة تشخيصية مستقلة لكنها مرتبطة إداريًا بدواير.

الملفات الأهم:

- `app/weather/page.tsx`
- `app/weather/WeatherForecastClient.tsx`
- `src/utils/relationshipWeatherJourney.ts`

المسؤولية:

- funnel تشخيصي
- إنتاج تقرير
- bridge إلى الخريطة أو السطح التالي

### 6. Admin and Owner Surface

هذه هي الطبقة التي يدير منها المالك المنصة نفسها.

الملفات الأهم:

- `app/admin/page.tsx`
- `src/components/admin/AdminDashboard.tsx`
- `src/components/admin/dashboard/Paths/JourneyPathsPanel.tsx`
- `src/components/admin/dashboard/Paths/components/PathArchitect.tsx`
- `src/components/admin/dashboard/Paths/components/TelemetryPulse.tsx`
- `src/components/admin/dashboard/Paths/components/FrictionHealer.tsx`
- `src/components/admin/dashboard/Paths/GhostMirror.tsx`
- `app/api/admin/*`

المسؤولية:

- إدارة المسارات
- مراقبة telemetry
- تعديل إعدادات التشغيل
- تنفيذ العمليات الإدارية والذكاء التشغيلي

أقرب store محوري:

- `src/state/adminState.ts`

أقرب API service:

- `src/services/adminApi.ts`

### 7. LifeOS and Daily Intelligence

هذه منطقة التشغيل اليومي والقراءة المستمرة لحياة المستخدم.

الملفات الأهم:

- `src/modules/lifeOS/TodayView.tsx`
- `src/modules/lifeOS/MorningBrief.tsx`
- `src/modules/lifeOS/CommandCenter.tsx`

المسؤولية:

- تقديم يومية ذكية
- اقتراحات ونبض يومي
- توجيه المستخدم إلى الخطوة التالية

### 8. Gamification and Evolution

هذه المنطقة تعطي طبقة تقدم ونمو وتكافؤ نفسي/سلوكي.

الملفات الأهم:

- `src/modules/gamification/EvolutionHub.tsx`
- `src/state/gamificationState.ts`

المسؤولية:

- تتبع التقدم
- عرض التطور
- ربط الإنجاز بالسياق العام للرحلة

## State Map

### Foundational Stores

- `src/state/authState.ts`: هوية المستخدم، الدور، وصلاحيات المالك
- `src/state/adminState.ts`: إعدادات الأدمن وتعريفات `journeyPaths`
- `src/state/journeyState.ts`: حالة الرحلات العامة والتنقل بينها
- `src/state/mapState.ts`: حالة الخريطة والعقد
- `src/state/pulseState.ts`: نبض المستخدم والطاقة/التركيز/المزاج
- `src/state/appOverlayState.ts`: الأوفرليز والسياقات العائمة

### Operational Stores

- `src/state/lockdownState.ts`
- `src/state/lifeState.ts`
- `src/state/growthState.ts`
- `src/state/recoveryState.ts`
- `src/state/ritualState.ts`
- `src/state/themeState.ts`
- `src/state/toastState.ts`

### Specialized or Experimental Stores

- `src/state/digitalTwinState.ts`
- `src/state/shadowPulseState.ts`
- `src/state/swarmState.ts`
- `src/state/synthesisState.ts`
- `src/state/fleetState.ts`

## Service Map

### Core Application Services

- `src/services/navigation.ts`: التنقلات والروابط والسياقات
- `src/services/adminApi.ts`: استدعاءات الأدمن والإعدادات
- `src/services/consciousnessService.ts`: منطق الوعي أو الإشارات الأعلى
- `src/services/subscriptionManager.ts`: الاشتراك والحالة التجارية
- `src/services/broadcasts.ts`: الإرسال والبث
- `src/services/journeyTracking.ts`: تتبع الرحلات والأحداث

### Data, Sync, and Runtime Support

- `src/services/ritualsSync.ts`
- `src/services/supabase/*`
- `src/services/*Sync*.ts`
- `src/services/*Engine*.ts`

## Entry Points by Surface

### Main Public Entry

- `app/page.tsx`

### App Experience Entry

- `app/app/page.tsx`

### Owner/Admin Entry

- `app/admin/page.tsx`

### Specialized Standalone Entries

- `app/weather/page.tsx`
- `app/dawayir/page.tsx`
- `app/dawayir-live/page.tsx`
- `app/maraya/page.tsx`
- `app/coach/page.tsx`
- `app/stories/page.tsx`

## Functional Dependencies Worth Knowing

### 1. JourneyPaths is now a control plane

`journeyPaths` لم تعد مجرد بيانات عرض. أصبحت طبقة تحكم فعلية في:

- `sanctuary`
- `relationship-weather`
- `dawayir-live`
- `maraya-story`

الملفات المحورية:

- `src/state/adminState.ts`
- `src/utils/journeyPaths.ts`
- `src/components/admin/dashboard/Paths/JourneyPathsPanel.tsx`

### 2. Runtime paths depend on admin definitions

كل مسار من المسارات السابقة صار يقرأ:

- `entryScreen`
- `targetScreen`
- `steps`
- `primaryActionLabel`
- أحيانًا `secondaryActionLabel`

من تعريفه الإداري، وليس من ثوابت hardcoded فقط.

### 3. Session storage is used as a route bridge

المفاتيح الأهم:

- `dawayir-app-boot-action`
- `weather_context`

هذا مهم لأن بعض المسارات تبدأ في route مستقل ثم تعود إلى app shell.

## Suggested Next Documentation Layers

إذا أردنا تحويل هذا الحصر إلى مرجع تشغيل كامل، فالطبقات التالية هي الأكثر قيمة:

1. Route-to-Service Matrix
2. Screen Ownership Map
3. Feature Flag Matrix
4. State-to-UI Dependency Map
5. Journey-by-Journey QA Checklist

## Practical Reading Order

لأي شخص جديد يدخل المشروع:

1. اقرأ `docs/platform-inventory.md`
2. اقرأ هذا الملف `docs/platform-functional-map.md`
3. ابدأ من `src/modules/meta/app-shell/*`
4. ثم `src/state/adminState.ts`
5. ثم ملفات المسارات:
   - `src/utils/relationshipWeatherJourney.ts`
   - `src/utils/dawayirLiveJourney.ts`
   - `src/utils/marayaStoryJourney.ts`
   - `src/utils/journeyPaths.ts`
6. ثم لوحة الأدمن:
   - `src/components/admin/dashboard/Paths/JourneyPathsPanel.tsx`
