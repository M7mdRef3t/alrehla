# Route To Service Matrix

Updated: 2026-04-10

## Purpose

هذا الملف يربط بين:

- الـ route أو الشاشة الرئيسية
- المكوّن/التطبيق الذي يستضيفها
- الـ stores الأقرب لها
- الـ services والـ utils المحركة لها

الهدف هو تسريع:

- الصيانة
- تتبع الأعطال
- فهم أثر أي تعديل
- معرفة نقطة البداية الصحيحة قبل التطوير

يرتبط هذا الملف مع:

- `docs/platform-inventory.md`
- `docs/platform-functional-map.md`

## Reading Guide

كل صف يجيب على أربعة أسئلة:

1. أين تدخل؟
2. ما الذي يرسم الشاشة؟
3. من أين تأتي الحالة؟
4. ما الذي يسيّر السلوك والتنقل؟

## Core Experience Routes

| Route / Surface | Primary Host | Key Stores | Key Services / Utils | Main Responsibility |
| --- | --- | --- | --- | --- |
| `app/page.tsx` | public entry into app shell | `authState`, `journeyState` | `navigation`, app shell bootstrap | المدخل العام للمنصة |
| `app/app/page.tsx` | app experience handoff | `appShellNavigationState`, `appOverlayState`, `journeyState` | `navigation`, `journeyTracking` | الدخول الصريح لتجربة التطبيق |
| internal app shell | `src/modules/meta/app-shell/AppExperienceShell.tsx` | `authState`, `journeyState`, `pulseState`, `appOverlayState`, `appShellNavigationState` | `navigation`, `journeyTracking`, `subscriptionManager`, `userMemory`, `i18n`, `browserStorage` | العمود الفقري للتجربة الداخلية |
| route gate | `src/modules/meta/app-shell/AppShellRouteGate.tsx` | `authState`, shell state | app-shell routing logic | فصل routes المستقلة عن app shell |
| surface renderer | `src/modules/meta/app-shell/AppExperienceSurface.tsx` | shell + journey stores | app-shell composition | رسم الشاشة الحالية والأوفرليز |

## Meta, Landing, and Sanctuary

| Route / Surface | Primary Host | Key Stores | Key Services / Utils | Main Responsibility |
| --- | --- | --- | --- | --- |
| landing | `src/modules/meta/Landing.tsx` | `pulseState`, `journeyState`, `authState` | `navigation`, journey utilities | البوابة الأولى والتوجيه نحو المسار التالي |
| header / shell navigation | `src/modules/meta/PlatformHeader.tsx`, `src/modules/meta/AppSidebar.tsx` | `authState`, `journeyState`, `adminState` | `navigation`, `journeyPaths` | التنقل العام واستدعاء الأسطح الرئيسية |
| sanctuary dashboard | `src/modules/meta/SanctuaryDashboard.tsx` | `adminState`, `pulseState`, `journeyState` | `journeyPaths`, sanctuary helpers | شاشة الاستقبال الآمن بعد التدخل |
| sanctuary runtime flow | `src/modules/meta/app-shell/useAppPulseSanctuaryFlow.ts` | `pulseState`, `adminState`, `journeyState` | `journeyPaths` | تشغيل مسار الملاذ ديناميكيًا |
| sanctuary overlay / cocoon | `src/modules/action/SanctuaryLockdownExperience.tsx` | `lockdownState`, shell state | breathing / recovery actions | طبقة التهدئة والحماية |

## Relationship Weather Funnel

| Route / Surface | Primary Host | Key Stores | Key Services / Utils | Main Responsibility |
| --- | --- | --- | --- | --- |
| `app/weather/page.tsx` | weather route wrapper | `adminState` | `adminApi.fetchJourneyPaths` | تحميل funnel طقس العلاقات |
| `app/weather/WeatherForecastClient.tsx` | weather diagnostic client | `adminState` | `analytics`, `marketingAttribution`, `adminApi`, `relationshipWeatherJourney` | الأسئلة، التحليل، التقرير، والـ bridge |
| weather journey control | `src/utils/relationshipWeatherJourney.ts` | journey path input from `adminState` | `journeyPaths` | تعريف البداية، المراحل، النهاية، ونقل `weather_context` |
| weather bridge in app shell | `src/hooks/useWeatherFunnelBridge.ts` and app shell usage | shell + navigation state | bridge logic + boot action | تمرير السياق من `/weather` إلى دواير |

## Exploration and Map

| Route / Surface | Primary Host | Key Stores | Key Services / Utils | Main Responsibility |
| --- | --- | --- | --- | --- |
| `app/dawayir/page.tsx` | route wrapper for map experience | `mapState`, `journeyState` | app shell / navigation bridge | مدخل الخريطة المستقل |
| core map | `src/modules/exploration/CoreMapScreen.tsx` | `mapState`, `pulseState`, `journeyState`, `layoutState`, `adminState`, `authState` | `navigation`, `subscriptionManager`, `analytics`, `globalPulse`, `relationshipWeather`, `contextAtlas`, `dawayirLiveJourney` | عرض الخريطة، العقد، الـ overlays، وإطلاق التجارب |
| map canvas | `src/modules/map/MapCanvas.tsx` and related exploration views | `mapState` | graph/layout hooks | الرسم الأساسي للشبكة أو الخريطة |
| next step layer | `src/modules/exploration/NextStepCard.tsx` | `journeyState` | recommendation data/types | توجيه الخطوة التالية داخل الاستكشاف |

## Journey Tools

| Route / Surface | Primary Host | Key Stores | Key Services / Utils | Main Responsibility |
| --- | --- | --- | --- | --- |
| tools screen inside app shell | `src/modules/action/JourneyToolsScreen.tsx` | `journeyState`, `mapState`, `achievementState`, `adminState` | `journeyTools`, `goalLabel`, `goalMeta`, `marayaStoryJourney` | صندوق الأدوات التنفيذي وفتح مرايا/دواير |
| action overlays | `src/modules/action/*` | varies by tool | journey-specific helpers | أدوات العمل الفوري بعد الفهم أو التشخيص |

## Dawayir Live

| Route / Surface | Primary Host | Key Stores | Key Services / Utils | Main Responsibility |
| --- | --- | --- | --- | --- |
| `app/dawayir-live/page.tsx` | route wrapper | `adminState` | `adminApi.fetchJourneyPaths` | تحميل تعريف المسار قبل الجلسة |
| live app | `src/modules/dawayir-live/DawayirLiveApp.tsx` | `adminState` + internal hook state | `navigation`, `adminApi`, `dawayirLiveJourney`, `useDawayirLiveSession` | welcome, setup, live session, branching |
| live completion | `src/modules/dawayir-live/pages/LiveSessionCompletePage.tsx` | `adminState` | `dawayirLiveJourney` | إنهاء الجلسة والعودة الواعية |
| live history | `src/modules/dawayir-live/pages/LiveHistoryPage.tsx` | session history state | live history utils/services | استعراض الجلسات السابقة |
| live couple | `src/modules/dawayir-live/pages/LiveCouplePage.tsx` | journey/admin state | `dawayirLiveJourney` | فرع الجلسات الثنائية |
| live coach | `src/modules/dawayir-live/pages/LiveCoachPanel.tsx` | journey/admin state | `dawayirLiveJourney` | فرع الموجه أو المعلم |
| session history sync | `src/modules/dawayir-live/utils/sessionHistory.ts` | session data | Supabase/session sync | مزامنة سجل الجلسات |
| journey control | `src/utils/dawayirLiveJourney.ts` | journey path input from `adminState` | `journeyPaths` | launch, stage order, complete, return |

## Maraya Story

| Route / Surface | Primary Host | Key Stores | Key Services / Utils | Main Responsibility |
| --- | --- | --- | --- | --- |
| `app/maraya/page.tsx` | route wrapper | `adminState` | route handoff | مدخل مرايا |
| maraya app | `src/modules/maraya/MarayaApp.jsx` | `adminState` + maraya runtime hook state | `useMarayaRuntime`, `marayaStoryJourney`, transformation utils | تجربة السرد والانعكاس والنهاية |
| maraya internal runtime | `src/modules/maraya/hooks/useMarayaRuntime.js` | local runtime state | maraya lib and generation pipeline | منطق التشغيل الداخلي لتجربة مرايا |
| maraya libs | `src/lib/maraya/*` | internal lib state | story/transformation helpers | محرك القصة أو التحويل |
| maraya APIs | `app/api/maraya/*` | request/response layer | backend maraya processing | الخدمات الخلفية المساندة |
| journey control | `src/utils/marayaStoryJourney.ts` | journey path input from `adminState` | `journeyPaths` | launch, ending, restart, return |

## Admin and Owner Control

| Route / Surface | Primary Host | Key Stores | Key Services / Utils | Main Responsibility |
| --- | --- | --- | --- | --- |
| `app/admin/page.tsx` | admin route | `authState`, `adminState` | route gating | مدخل لوحة التحكم |
| admin dashboard | `src/components/admin/AdminDashboard.tsx` | `adminState`, `authState` | `adminApi`, `navigation`, `supabaseClient` | الحاوية الكبرى لكل تبويبات الأدمن |
| journey paths panel | `src/components/admin/dashboard/Paths/JourneyPathsPanel.tsx` | `adminState` | `adminApi`, `journeyPaths`, journey-specific helpers | إدارة وتعريف وتشغيل المسارات |
| path architect | `src/components/admin/dashboard/Paths/components/PathArchitect.tsx` | `adminState` | path editing helpers | تعديل الخطوات والبنية |
| telemetry pulse | `src/components/admin/dashboard/Paths/components/TelemetryPulse.tsx` | `adminState` | derived local metrics | عرض نبض المسار أو مؤشرات سريعة |
| ghost mirror | `src/components/admin/dashboard/Paths/GhostMirror.tsx` | `adminState` | live or derived telemetry helpers | عرض المرآة التشغيلية أو الأحداث |
| friction healer | `src/components/admin/dashboard/Paths/components/FrictionHealer.tsx` | `adminState` | local heuristics | رصد الاحتكاك والتحسينات |
| admin API layer | `src/services/adminApi.ts` | `adminState` consumer | `resilientHttp`, backend admin routes | كل استدعاءات الإعدادات والبيانات الإدارية |

## LifeOS and Daily Intelligence

| Route / Surface | Primary Host | Key Stores | Key Services / Utils | Main Responsibility |
| --- | --- | --- | --- | --- |
| life overview | `src/modules/lifeOS/TodayView.tsx` | `lifeState`, `journeyState`, `pulseState` | recommendation and life services | يومية المستخدم وخطوته التالية |
| morning brief | `src/modules/lifeOS/MorningBrief.tsx` | `lifeState` | brief generation helpers | ملخص البداية اليومية |
| command center | `src/modules/lifeOS/CommandCenter.tsx` | `lifeState`, `journeyState` | orchestration helpers | مركز إدارة اليوم أو الأولويات |

## Gamification and Growth

| Route / Surface | Primary Host | Key Stores | Key Services / Utils | Main Responsibility |
| --- | --- | --- | --- | --- |
| evolution hub | `src/modules/gamification/EvolutionHub.tsx` | `gamificationState` | gamification helpers | عرض التقدم والمراحل |
| growth overlays / nudges | `src/modules/growth/*` | `growthState` | growth engines | التحفيز، الإحالة، والاحتفاظ |
| referrals and loops | relevant growth services | `growthState` | `referralEngine`, analytics | تدوير النمو والإحالات |

## Shared State Control Plane

| Store | Main Consumers | Responsibility |
| --- | --- | --- |
| `src/state/adminState.ts` | admin dashboard, managed journeys, weather/live/maraya | تعريفات المسارات، إعدادات الأدمن، والتحكم المركزي |
| `src/state/authState.ts` | app shell, admin, gated routes | الهوية، الدور، ومستوى الوصول |
| `src/state/journeyState.ts` | app shell, tools, map, landing | حالة الرحلة الحالية والانتقال بين الشاشات |
| `src/state/mapState.ts` | map, tools, recommendation surfaces | العقد، العلاقات، وحالة الخريطة |
| `src/state/pulseState.ts` | landing, sanctuary, map, overlays | نبض المستخدم ومؤشر حالته |
| `src/state/appOverlayState.ts` | app shell and overlays | الأوفرليز العابرة للتجربة |
| `src/state/appShellNavigationState.ts` | app shell | الشاشة الحالية ومزامنة shell navigation |
| `src/state/lockdownState.ts` | sanctuary/lockdown layers | حالة التدخل العالي أو الحماية |

## Shared Service Control Plane

| Service / Utility | Main Consumers | Responsibility |
| --- | --- | --- |
| `src/services/navigation.ts` | app shell, admin, map, live | التوجيه والروابط وتحديثات الـ URL |
| `src/services/adminApi.ts` | admin dashboard, weather/live loaders | جلب وحفظ إعدادات الأدمن والبيانات الإدارية |
| `src/services/journeyTracking.ts` | app shell and journey events | تسجيل الأحداث والتدفقات |
| `src/services/subscriptionManager.ts` | map and access layers | الاشتراك وحقوق الاستخدام |
| `src/services/consciousnessService.ts` | meta/life layers | المنطق الأعلى للوعي أو القراءة |
| `src/services/broadcasts.ts` | owner/admin flows | البثوص والرسائل التشغيلية |
| `src/utils/journeyPaths.ts` | all managed journey helpers | توحيد قراءة المسارات والخطوات |
| `src/utils/relationshipWeatherJourney.ts` | weather funnel | تحكم funnel طقس العلاقات |
| `src/utils/dawayirLiveJourney.ts` | Dawayir Live | تحكم launch/return للمسار الحي |
| `src/utils/marayaStoryJourney.ts` | Maraya Story | تحكم launch/ending/return لمرايا |

## Fast Debug Guide

### If the issue is route entry

ابدأ من:

- `app/.../page.tsx`
- ثم المكوّن المضيف المباشر
- ثم `navigation.ts`

### If the issue is managed journey behavior

ابدأ من:

- `src/state/adminState.ts`
- `src/utils/journeyPaths.ts`
- helper الخاص بالمسار:
  - `relationshipWeatherJourney.ts`
  - `dawayirLiveJourney.ts`
  - `marayaStoryJourney.ts`
  - sanctuary flow داخل app shell

### If the issue is app-shell-only

ابدأ من:

- `AppExperienceShell.tsx`
- `AppShellRouteGate.tsx`
- `AppExperienceSurface.tsx`
- `useAppJourneyEntryActions.ts`
- `useAppRouteSync.ts`

### If the issue is owner/admin-only

ابدأ من:

- `AdminDashboard.tsx`
- `JourneyPathsPanel.tsx`
- `adminApi.ts`
- `adminState.ts`

## Suggested Next Layer

لو أردنا رفع التوثيق لمستوى أعلى، فالطبقة التالية الأفضل هي:

1. `Screen Ownership Map`
2. `Feature Flag Matrix`
3. `Critical User Flows Checklist`
