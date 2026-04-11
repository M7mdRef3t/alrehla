# Feature Flag Matrix

Updated: 2026-04-10

## Purpose

هذا الملف يوضح:

- ما هي الـ feature flags الموجودة فعليًا في المنصة
- ما وضعها الافتراضي
- من أي مجموعة تنتمي
- أين يظهر أثرها غالبًا
- هل يمكن أن تكون `beta`
- وما الذي يُغلق تلقائيًا في `user / revenue mode`

المرجع البرمجي الأساسي:

- `src/config/features.ts`
- `src/utils/featureFlags.ts`
- `src/config/appEnv.ts`

## Runtime Rules

### 1. Effective Modes

المنصة تدعم ثلاثة أوضاع تشغيل من ناحية الوصول الفعلي:

- `on`
- `off`
- `beta`

### 2. Revenue Mode Rule

في `user mode`، وبحكم أن:

- `isRevenueMode = isUserMode`

فإن أي feature ليست ضمن `REVENUE_FIRST_FEATURES` قد تُغلق تلقائيًا للمستخدم العادي حتى لو كانت قيمتها الافتراضية `on`.

### 3. God Mode Rule

المستخدم المميز أو الأونر يحصل على وصول كامل إذا تحقق أحد الشرطين:

- دوره ضمن: `admin`, `owner`, `superadmin`, `developer`
- أو `isDev && adminAccess`

### 4. Beta Rule

إذا كانت الميزة `beta` فهي تظهر فقط عندما:

- `betaAccess = true`

إلا إذا كان المستخدم في `god mode`، ففي هذه الحالة تُعتبر متاحة أيضًا.

## Revenue-First Features

هذه هي الميزات التي تبقى متاحة للمستخدم العادي في `user / revenue mode`:

- `dawayir_map`
- `journey_tools`
- `basic_diagnosis`
- `mirror_tool`
- `pulse_check`
- `pulse_immediate_action`
- `golden_needle_enabled`

## Flag Matrix

| Key | Label | Group | Default | Beta Supported | Revenue-First | Typical Surface / Impact |
| --- | --- | --- | --- | --- | --- | --- |
| `dawayir_map` | أداة دواير (الخريطة) | Core | `on` | No | Yes | الخريطة الأساسية و`CoreMapScreen` |
| `journey_tools` | أدوات الرحلة | Core | `on` | No | Yes | `JourneyToolsScreen` داخل app shell |
| `basic_diagnosis` | التشخيص الأساسي | Core | `on` | No | Yes | التشخيصات السريعة وقراءة الحالة |
| `mirror_tool` | أداة المراية (أنا) | Core | `on` | No | Yes | بطاقة الذات/المرآة وربط مرايا |
| `family_tree` | شجرة العيلة | Core | `on` | No | No | العرض العائلي داخل الخريطة |
| `internal_boundaries` | الحدود الداخلية | Core | `on` | No | No | أدوات الحماية والسيطرة على الضجيج |
| `generative_ui_mode` | GenUI الميداني | AI | `on` | Yes | No | تغييرات الواجهة المدفوعة بالسياق |
| `global_atlas` | الواجهة الكونية | Insights | `on` | No | No | الرؤى والعرض الكوني على الواجهة |
| `ai_field` | الذكاء الاصطناعي الميداني | AI | `on` | Yes | No | المساعد الذكي أو الطبقات المدعومة بالذكاء |
| `pulse_check` | رحلة النبض اللحظي | AI | `on` | No | Yes | `pulseCheck` ومسار التهيئة |
| `pulse_weekly_recommendation` | اقتراح الطاقة الأسبوعي | AI | `on` | No | No | توصيات أسبوعية مرتبطة بالنبض |
| `pulse_immediate_action` | الخطوة الفورية للطاقة | AI | `on` | No | Yes | الإجراء الفوري بعد قراءة النبض |
| `dynamic_routing_v2` | Dynamic Routing V2 | AI | `on` | Yes | No | محرك التوجيه الديناميكي |
| `dynamic_routing_owner_observability` | Routing Owner Observability | Insights | `on` | No | No | مؤشرات ملاحظة المحرك للأونر |
| `golden_needle_enabled` | الإبرة الذهبية | Core | `on` | No | Yes | مظهر البوصلة الفخري أو قياس محدد |
| `language_switcher` | زر تبديل اللغة | Core | `on` | No | No | التبديل بين اللغات |
| `armory_section` | سكشن الترسانة | Core | `on` | No | No | جزء الترسانة في الصفحة أو الأدوات |
| `landing_live_metrics` | المؤشرات الحية للصفحة الرئيسية | Insights | `on` | No | No | hero metrics أو مؤشرات الصفحة الرئيسية |
| `landing_live_testimonials` | الشهادات الحية للصفحة الرئيسية | Insights | `on` | No | No | testimonials live blocks |
| `dawayir_live` | Dawayir Live | AI | `on` | Yes | No | `/dawayir-live` والـ live launch |
| `dawayir_live_couple` | Dawayir Live — Couple | AI | `beta` | Yes | No | فرع `couple` |
| `dawayir_live_coach` | Dawayir Live — Coach | AI | `beta` | Yes | No | فرع `coach` |
| `dawayir_live_camera` | Dawayir Live — Camera | AI | `beta` | Yes | No | الكاميرا أو التقاطات live |

## Group View

### Core

الميزات التي تبني العمود الأساسي للتجربة:

- `dawayir_map`
- `journey_tools`
- `basic_diagnosis`
- `mirror_tool`
- `family_tree`
- `internal_boundaries`
- `golden_needle_enabled`
- `language_switcher`
- `armory_section`

### AI

الميزات التي تعتمد على الذكاء أو تدفع التجربة ديناميكيًا:

- `generative_ui_mode`
- `ai_field`
- `pulse_check`
- `pulse_weekly_recommendation`
- `pulse_immediate_action`
- `dynamic_routing_v2`
- `dawayir_live`
- `dawayir_live_couple`
- `dawayir_live_coach`
- `dawayir_live_camera`

### Insights

الميزات التي تزيد الرؤية والقياس والمشاهدة:

- `global_atlas`
- `dynamic_routing_owner_observability`
- `landing_live_metrics`
- `landing_live_testimonials`

## Practical Interpretation

### What user mode effectively prioritizes

في `user mode` التجربة تميل إلى الإبقاء على:

- الخريطة
- أدوات الرحلة
- التشخيص الأساسي
- أداة المرآة
- رحلة النبض
- الإجراء الفوري
- الإبرة الذهبية

وهذا ينسجم مع قاعدة المنتج الحالية: تجربة منشورة أكثر تركيزًا وأقل تشتيتًا.

### What owner mode can still observe

الأونر أو الدور المميز يمكنه رؤية:

- كل الـ features تقريبًا
- حتى الـ `beta`
- وحتى ما قد يكون مغلقًا على المستخدم العادي بسبب `revenue mode`

### What is explicitly experimental

أكثر الميزات وضوحًا من ناحية التجريب:

- `generative_ui_mode`
- `ai_field`
- `dynamic_routing_v2`
- `dawayir_live`
- `dawayir_live_couple`
- `dawayir_live_coach`
- `dawayir_live_camera`

## Recommended Checks Before Editing

قبل تعديل أي شاشة، افحص:

1. هل تعتمد على flag؟
2. هل هذا flag من `Revenue-First` أم لا؟
3. هل المستخدم المقصود `user` أم `owner`؟
4. هل السلوك الحالي ناتج عن `beta` أم `on` فعلي؟

## Quick Debug Paths

### لو feature لا تظهر للمستخدم

ابدأ من:

- `src/config/features.ts`
- `src/utils/featureFlags.ts`
- ثم الشاشة التي تستهلك `availableFeatures`

### لو feature تظهر للأونر فقط

افحص:

- `role`
- `adminAccess`
- `isDev`
- وهل الميزة أصلاً خارج `REVENUE_FIRST_FEATURES`

### لو feature beta لا تظهر

افحص:

- هل القيمة `beta`
- هل `betaAccess = true`
- وهل المستخدم في `god mode` أم لا

## Suggested Next Documentation Layer

الطبقة التالية المنطقية بعد هذه المصفوفة:

1. `Critical Flows Checklist`
2. `Journey-by-Journey QA Checklist`
3. `Route Guard and Access Matrix`
