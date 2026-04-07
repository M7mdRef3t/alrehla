# AI Question Generator Logic Flow

## Goal
إدارة توفر واستخدام الذكاء الاصطناعي (Gemini) لتوليد الأسئلة الديناميكية بناءً على حالة المستخدم.

## Mental Model
- المستخدم بيشوف الواجهة بتاعت DailyPulseWidget.
- النظام بيحاول يتأكد إن الذكاء الاصطناعي متاح فعليًا قبل محاولة توليد سؤال.
- ده بيمنع حدوث أخطاء لو السيرفر مش متاح.

## Inputs / Outputs
- Inputs: `geminiClient.isAvailable()` state.
- Outputs: `isAIAvailable` boolean.

## States
- `checking` (initially checking availability on mount)
- `available`
- `unavailable`

## Transitions
1. `mount -> checking`
2. `checking -> available` (if geminiClient.isAvailable() is true)
3. `checking -> unavailable` (if geminiClient.isAvailable() is false)

## Edge Cases
- حالة 1: الـ AI متاح بس بيفشل في التوليد.
- حالة 2: الـ AI غير متاح من البداية.

## Failure & Fallback
- لو API فشل: استخدام الأسئلة الافتراضية.
- لو feature flag مقفول: الاعتماد على الأسئلة المحلية.

## Performance Constraints
- Target complexity: O(1) for availability check.
- Max latency: Instant (local variable check).
- Memory constraints: Minimal.

## Security Constraints
- Validation rules: Verify client state.
- Authorization boundary: None required for availability check.
- Sensitive data handling: None.

## Acceptance Criteria
1. يتم فحص توفر الـ AI فعليًا عند تحميل الهوك.
2. لا يتم محاولة توليد سؤال إذا كان الـ AI غير متاح.
3. التحديث بينعكس على واجهة المستخدم بشكل صحيح.
