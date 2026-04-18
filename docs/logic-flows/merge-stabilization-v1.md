# Logic Flow: Merge Stabilization V1 (PR #142)

## Goal
توحيد الأنظمة البصرية وتأمين استمرارية تجربة المستخدم (UX Continuity) عند الانتقال من موديول "طقس العلاقات" (Weather Funnel) إلى المنصة الأساسية.

## Context
كان هناك انفصال بين نتائج موديول الطقس وبين حالة التشخيص (Diagnosis State) في المنصة، مما كان يجبر المستخدم على إعادة الخطوات. كما كان هناك تكرار في مكونات الخلفيات المتحركة.

## Flows

### 1. Weather Funnel Bridge Flow
- **Input:** نتائج موديول الطقس (Context + Mapping).
- **Process:** 
    1. استقبال بيانات المستخدم من `useWeatherFunnelBridge`.
    2. تحويل النتائج إلى `UserStateObject` متوافق مع نظام التشخيص.
    3. استدعاء `saveDiagnosisState` لتسجيل الحالة محلياً.
- **Output:** المستخدم يتم اعتباره "Diagnosed" ويتم توجيهه مباشرة للخريطة.

### 2. Unified Atmosphere Flow
- **Input:** نمط العرض (default | radar | minimal) والشدة (Intensity).
- **Process:** 
    1. دمج منطق `AmbientBackground` و `RadarBackground` في مكون واحد `AppAtmosphere`.
    2. التحكم في الطبقات (Particles, Nebula, Radar Scan) بناءً على الـ Props.
- **Output:** تجربة بصرية متسقة وأداء أفضل (Performance Optimization).

## Performance & Security Constraints
- الحد من استهلاك المعالج (CPU) عبر التحكم في عدد الـ Particles.
- استغلال `framer-motion` للـ GPU acceleration.

## Acceptance Criteria
- [x] تخطي بوابة التشخيص للمستخدمين القادمين من الفانل.
- [x] عمل الخلفية الموحدة في كافة الشاشات (Landing, Gate).
- [x] نجاح الـ Build محلياً واجتياز الـ Logic Flow Gate.
