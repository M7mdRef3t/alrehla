# Screen Ownership Map

Updated: 2026-04-10

## Purpose

هذا الملف يحدد لكل شاشة أو route رئيسية:

- المالك الوظيفي داخل المنصة
- هل هي جزء من `user` أو `dev` أو `owner`
- هل هي route مستقلة أم شاشة داخل `app shell`
- لأي مسار أو flow تنتمي

هذا المرجع يساعد في:

- معرفة أين يجب أن نعدّل
- منع الخلط بين واجهات المستخدم وواجهات التطوير
- فهم الشاشات التي يعيشها المستخدم فعليًا مقابل الشاشات الداخلية

يرتبط هذا الملف مع:

- `docs/platform-inventory.md`
- `docs/platform-functional-map.md`
- `docs/route-to-service-matrix.md`
- `src/config/appEnv.ts`

## Modes

### `user`

الواجهات التي تمثل التجربة المنشورة أو التي ينبغي اعتبارها افتراضيًا تجربة المستخدم النهائي.

### `dev`

واجهات وتجارب ومختبرات داخلية أو debug surfaces أو شاشات فحص.

### `owner`

واجهات الأدمن والتحكم والتشغيل والصلاحيات العليا. هذا وضع صلاحية، وليس بيئة نشر منفصلة.

## Legend

| Field | Meaning |
| --- | --- |
| `Ownership` | منطق الشاشة أو المنطقة التي تتبعها |
| `Mode` | `user`, `dev`, `owner` |
| `Surface` | `route` أو `app-shell` |
| `Journey / Flow` | المسار أو التدفق الأقرب |

## Public and Core User Routes

| Screen / Route | Ownership | Mode | Surface | Journey / Flow | Notes |
| --- | --- | --- | --- | --- | --- |
| `app/page.tsx` | Platform Entry | `user` | `route` | Core app entry | المدخل العام للمنصة |
| `app/app/page.tsx` | App Shell | `user` | `route` | Core app shell | الدخول الصريح لتجربة التطبيق |
| `app/onboarding/page.tsx` | Onboarding | `user` | `route` | onboarding | رحلة التهيئة الأولى |
| `app/weather/page.tsx` | Relationship Weather | `user` | `route` | `relationship-weather` | funnel تشخيصي مستقل |
| `app/dawayir/page.tsx` | Exploration / Map | `user` | `route` | map / exploration | مدخل الخريطة المستقل |
| `app/dawayir-live/page.tsx` | Dawayir Live | `user` | `route` | `dawayir-live` | launch للجلسة الحية |
| `app/dawayir-live/complete/[sessionId]/page.tsx` | Dawayir Live | `user` | `route` | `dawayir-live` | شاشة الإكمال |
| `app/dawayir-live/history/page.tsx` | Dawayir Live | `user` | `route` | `dawayir-live` | سجل الجلسات |
| `app/dawayir-live/couple/page.tsx` | Dawayir Live | `user` | `route` | `dawayir-live` | فرع couple |
| `app/dawayir-live/replay/[sessionId]/page.tsx` | Dawayir Live | `user` | `route` | `dawayir-live` | إعادة تشغيل أو replay |
| `app/maraya/page.tsx` | Maraya | `user` | `route` | `maraya-story` | route مستقل لتجربة مرايا |
| `app/coach/page.tsx` | Coaching / Extension | `user` | `route` | coach support | جزء داعم، ويرتبط أيضًا بـ Dawayir Live |
| `app/coach/landing/page.tsx` | Coaching | `user` | `route` | coach landing | مدخل تسويقي/تعريفي للكوچ |
| `app/stories/page.tsx` | Story Surface | `user` | `route` | stories | عرض القصص أو السرد |
| `app/sessions/intake/page.tsx` | Session Intake | `user` | `route` | session prep | جمع بيانات أولية للجلسات |
| `app/sessions/prep/[requestId]/page.tsx` | Session Prep | `user` | `route` | session prep | التحضير قبل الجلسة |
| `app/activation/page.tsx` | Activation | `user` | `route` | activation | تفعيل أو إثبات الدخول |
| `app/checkout/page.tsx` | Billing / Conversion | `user` | `route` | checkout | مسار تجاري |
| `app/pricing/page.tsx` | Marketing / Pricing | `user` | `route` | acquisition | صفحة الأسعار |
| `app/privacy/page.tsx` | Legal | `user` | `route` | legal | صفحة الخصوصية |
| `app/terms/page.tsx` | Legal | `user` | `route` | legal | صفحة الشروط |
| `app/about/page.tsx` | Marketing / Brand | `user` | `route` | brand | صفحة تعريفية |
| `app/(marketing)/gate/page.tsx` | Marketing Gate | `user` | `route` | gate / acquisition | بوابة تسويقية أو تمهيدية |
| `app/auth/callback/page.tsx` | Auth | `user` | `route` | auth | callback للمصادقة |

## App Shell Screens

هذه ليست routes مستقلة بالضرورة، لكنها شاشات أساسية تعيش داخل `AppExperienceShell`.

| Screen | Ownership | Mode | Surface | Journey / Flow | Notes |
| --- | --- | --- | --- | --- | --- |
| `landing` | Meta / Entry | `user` | `app-shell` | core entry / sanctuary entry | الشاشة المرجعية للهبوط داخل التطبيق |
| `map` | Exploration | `user` | `app-shell` | map / exploration | الخريطة الأساسية |
| `tools` | Journey Tools | `user` | `app-shell` | tools / maraya entry | صندوق الأدوات |
| `settings` | User Settings | `user` | `app-shell` | settings | إعدادات المستخدم |
| `guided` | Guided Journey | `user` | `app-shell` | guided journey | تدفق موجه |
| `mission` | Mission Flow | `user` | `app-shell` | mission | شاشة مهمة مرتبطة بعقدة |
| `exit-scripts` | Growth / Recovery Tools | `user` | `app-shell` | action support | مكتبة مخارج أو scripts |
| `grounding` | Grounding Tools | `user` | `app-shell` | action support | أدوات التثبيت |
| `sanctuary` | Sanctuary | `user` | `app-shell` | `sanctuary` | الوجهة الآمنة الأساسية |
| `pulseCheck` | Pulse Layer | `user` | `app-shell` | `sanctuary` or entry triage | فحص نبض المستخدم |
| `cocoon` | Sanctuary Decision Layer | `user` | `app-shell` | `sanctuary` | تدخل تمهيدي قبل الملاذ |
| `breathing` | Recovery Layer | `user` | `app-shell` | `sanctuary` | تمرين تهدئة أو تنفس |
| `insights` | Insight Surface | `user` | `app-shell` | insight / radar | سطح الرؤى |
| `armory` | Action Arsenal | `user` | `app-shell` | action support | ترسانة المواجهة والتنفيذ |

## Admin and Owner Screens

| Screen / Route | Ownership | Mode | Surface | Journey / Flow | Notes |
| --- | --- | --- | --- | --- | --- |
| `app/admin/page.tsx` | Admin Control Plane | `owner` | `route` | admin | المدخل الرئيسي للأدمن |
| `app/admin/radar/page.tsx` | Admin Radar | `owner` | `route` | admin intelligence | رادار أو قراءة تشغيلية |
| `app/admin/repo-intel/page.tsx` | Repo Intelligence | `owner` | `route` | engineering intelligence | ذكاء الكود أو المستودع |
| `app/admin/sessions/page.tsx` | Sessions Admin | `owner` | `route` | ops / sessions | إدارة الجلسات |
| `src/components/admin/AdminDashboard.tsx` | Admin Control Plane | `owner` | `route-host` | admin | الحاوية الأساسية لكل لوحات الأدمن |
| `src/components/admin/dashboard/Paths/JourneyPathsPanel.tsx` | Journey Governance | `owner` | `route-host` | managed journeys | لوحة إدارة المسارات |
| `src/components/admin/dashboard/Flow/FlowMapPanel.tsx` | Flow Governance | `owner` | `route-host` | flow mapping | خريطة التدفقات |
| `src/components/admin/dashboard/Executive/*` | Executive Layer | `owner` | `route-host` | executive analytics | لوحات تشغيل عليا |
| `src/components/admin/dashboard/Intelligence/*` | Intelligence Layer | `owner` | `route-host` | admin intelligence | استوديوهات ولوحات ذكاء |
| `src/components/admin/dashboard/Content/*` | Content Governance | `owner` | `route-host` | content ops | إدارة المحتوى |

## Dev and Debug Routes

هذه أسطح داخلية لا ينبغي اعتبارها جزءًا من التجربة المنشورة للمستخدم ما لم يُطلب ذلك صراحة.

| Screen / Route | Ownership | Mode | Surface | Journey / Flow | Notes |
| --- | --- | --- | --- | --- | --- |
| `app/debug-baseline/page.tsx` | Internal Debug | `dev` | `route` | baseline debug | فحص baseline |
| `app/debug-logo-lab/page.tsx` | Internal Debug | `dev` | `route` | visual lab | مختبر لوجو/هوية |
| `app/debug-pulse/page.tsx` | Internal Debug | `dev` | `route` | pulse debug | اختبار النبض |
| `app/debug-sanctuary/page.tsx` | Internal Debug | `dev` | `route` | sanctuary debug | اختبار الملاذ |
| `app/debug-telegram/page.tsx` | Internal Debug | `dev` | `route` | integration debug | اختبار تيليجرام أو تكاملات |

## Route Ownership by Journey

### Sanctuary Journey

| Screen / Route | Mode | Surface | Role |
| --- | --- | --- | --- |
| `landing` | `user` | `app-shell` | entry |
| `pulseCheck` | `user` | `app-shell` | check |
| `cocoon` | `user` | `app-shell` | decision |
| `breathing` | `user` | `app-shell` | intervention |
| `sanctuary` | `user` | `app-shell` | screen |
| `map` or configured target | `user` | `app-shell` | outcome |

### Relationship Weather Journey

| Screen / Route | Mode | Surface | Role |
| --- | --- | --- | --- |
| `/weather` | `user` | `route` | entry |
| `weather-questions` | `user` | `route-host` | check |
| `weather-analyzing` | `user` | `route-host` | decision |
| `weather-result` | `user` | `route-host` | screen |
| `map` or configured target | `user` | `app-shell` or `route` bridge | outcome |

### Dawayir Live Journey

| Screen / Route | Mode | Surface | Role |
| --- | --- | --- | --- |
| `map` or launch surface | `user` | `app-shell` | entry context |
| `/dawayir-live` | `user` | `route` | check / setup |
| live session canvas | `user` | `route-host` | intervention |
| `/dawayir-live/complete/[sessionId]` | `user` | `route` | screen |
| configured target or `/dawayir` | `user` | `route` or `app-shell` | outcome |

### Maraya Story Journey

| Screen / Route | Mode | Surface | Role |
| --- | --- | --- | --- |
| tools / explicit maraya entry | `user` | `app-shell` or `route` | entry context |
| `/maraya` | `user` | `route` | entry |
| maraya story runtime | `user` | `route-host` | intervention |
| maraya ending state | `user` | `route-host` | screen |
| configured target or `/` | `user` | `route` or `app-shell` bridge | outcome |

## Ownership Rules Worth Preserving

1. أي تعديل في واجهات المستخدم النهائي يجب أن يُقرأ أولًا باعتباره `user mode`.
2. أي شاشة `debug-*` أو مختبرات داخلية لا تُعتبر جزءًا من المنتج المنشور.
3. لو كانت الشاشة داخل `AdminDashboard` فهي `owner` حتى لو كانت تستخدم أجزاء من التجربة العامة.
4. `journeyPaths` الآن تتحكم في أكثر من رحلة منشورة، لذلك أي شاشة مرتبطة بها يجب اعتبارها screen managed by control plane وليس مجرد UI ثابت.

## Fast Use Cases

### لو المستخدم قال "عدل الشاشة الرئيسية"

ابدأ من:

- `app/page.tsx`
- `src/modules/meta/Landing.tsx`

ولا تبدأ من شاشات `debug-*`.

### لو المستخدم قال "عدل لوحة التحكم"

ابدأ من:

- `app/admin/page.tsx`
- `src/components/admin/AdminDashboard.tsx`

### لو المستخدم قال "عدل مسار طقس العلاقات"

ابدأ من:

- `app/weather/page.tsx`
- `app/weather/WeatherForecastClient.tsx`
- `src/utils/relationshipWeatherJourney.ts`
- `src/state/adminState.ts`

### لو المستخدم قال "عدل دواير لايف"

ابدأ من:

- `app/dawayir-live/page.tsx`
- `src/modules/dawayir-live/DawayirLiveApp.tsx`
- `src/utils/dawayirLiveJourney.ts`

### لو المستخدم قال "عدل مرايا"

ابدأ من:

- `app/maraya/page.tsx`
- `src/modules/maraya/MarayaApp.jsx`
- `src/utils/marayaStoryJourney.ts`

## Suggested Next Documentation Layer

الطبقة التالية الأقوى بعد هذا الملف هي:

1. `Feature Flag Matrix`
2. `Critical Flows Checklist`
3. `Screen-by-Screen QA Ownership`
