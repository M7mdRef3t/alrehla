# AutoHealthChecker Sentry Integration Logic Flow

## Goal
دمج Sentry مع AutoHealthChecker لالتقاط أخطاء الـ Console تلقائياً في بيئة الإنتاج (Production) بدلاً من الاعتماد الكلي على localStorage.

## Mental Model
- النظام يقوم بفحص صحة التطبيق (Health Check) كل فترة.
- في الإنتاج، يجب استخدام أدوات احترافية لتتبع الأخطاء (Sentry) لضمان عدم ضياعها وسهولة الوصول إليها.
- يتم إرسال أي أخطاء موجودة في السجل المحلي إلى Sentry مع رسالة تنبيه تحتوي على عدد الأخطاء ومستوى الخطورة.

## Inputs / Outputs
- Inputs: `localStorage` key (`dawayir-error-log`), `runtimeEnv.isProd`, `runtimeEnv.sentryDsn`
- Outputs: إرسال الـ Event إلى Sentry (`Sentry.captureMessage`) وإضافة `HealthIssue` مخصص.

## States
- `idle`: انتظار الفحص الدوري.
- `checking`: قراءة `localStorage` والتحقق من Sentry.
- `reporting`: إرسال البيانات إلى Sentry إذا كان مفعلًا، وإرجاع قائمة المشاكل.

## Transitions
1. `idle -> checking` عند استدعاء `runHealthCheck`.
2. `checking -> reporting` عند اكتشاف أخطاء جديدة (أحدث من ساعة).
3. `reporting -> idle` عند انتهاء دالة `checkConsoleErrors`.

## Edge Cases
- حالة 1: Sentry غير مفعل أو المتغيرات البيئية مفقودة -> يستمر الفحص المحلي دون استدعاء Sentry.
- حالة 2: سجل الأخطاء المحلي فارغ -> يعود النظام بـ 0 issues دون استدعاء Sentry.

## Failure & Fallback
- لو Sentry فشل في الإرسال: لا يتم إيقاف الفحص الصحي، يستمر إرجاع المشاكل محليًا.

## Performance Constraints
- Target complexity: O(N) لمعالجة سجل الأخطاء.
- Max latency: سريع جداً، مجرد قراءة من LocalStorage واستدعاء Async Sentry.

## Security Constraints
- Sensitive data handling: يجب التأكد من عدم إرسال بيانات حساسة (مثل PII) داخل الأخطاء المسجلة في `localStorage` قدر الإمكان (رغم أنها أخطاء Console).

## Acceptance Criteria
1. النظام يقرأ الأخطاء من localStorage.
2. النظام يستدعي `Sentry.captureMessage` إذا كنا في بيئة الإنتاج و Sentry مفعل.
3. النظام يرجع الحل المناسب (فحص Sentry Dashboard أو Admin Dashboard).
