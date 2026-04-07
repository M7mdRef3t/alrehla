# Referral Notification Logic Flow

## Goal
إرسال إشعار عبر البريد الإلكتروني للمستخدم الذي قام بدعوة مستخدم جديد (المرجع - Referrer) عندما يقوم المستخدم الجديد بالتسجيل باستخدام كود الإحالة الخاص به، وإبلاغه بحصوله على أسبوع بريميوم مجاني كـ مكافأة.

## Mental Model
- المستخدم الجديد قام بالتسجيل للتو وأدخل كود الإحالة.
- النظام يحتاج إلى مكافأة المُحيل وتشجيعه على دعوة المزيد من الأشخاص.
- بدلاً من أن ينتظر المُحيل حتى يفتح التطبيق ليرى المكافأة، نرسل له إشعاراً فورياً لتعزيز الـ K-Factor.

## Inputs / Outputs
- Inputs: `referrerCode` (كود الإحالة الذي تم استخدامه)
- Outputs: رسالة بريد إلكتروني مرسلة للمُحيل (عبر Resend).

## States
- `idle`: لا توجد إحالات جديدة.
- `processing`: يتم استدعاء الـ Edge Function (`notify-referrer`) واستخراج البريد الإلكتروني.
- `success`: تم إرسال البريد بنجاح.
- `error`: حدث خطأ في الاستخراج أو الإرسال.

## Transitions
1. `idle -> processing` عند إتمام تسجيل مستخدم جديد باستخدام كود الإحالة.
2. `processing -> success` عند نجاح إرسال الإيميل من خلال Resend.
3. `processing -> error` في حال فشل استدعاء Edge Function أو عدم العثور على الإيميل أو فشل Resend.

## Edge Cases
- حالة 1: كود الإحالة غير موجود في قاعدة البيانات (سيتم تخطيه بصمت).
- حالة 2: المُحيل لا يملك بريداً إلكترونياً صالحاً (سيحدث خطأ داخلي في Edge Function ولن يتم الإرسال).

## Failure & Fallback
- لو API فشل (Supabase أو Resend): يتم تسجيل الخطأ `console.error` ولن تتعطل عملية تسجيل المستخدم الجديد (يتم تنفيذ الـ invoke في الخلفية عبر async IIFE بدون إيقاف الـ thread الرئيسي).
- لو data ناقصة: يتم إيقاف الإرسال مبكراً.

## Performance Constraints
- Target complexity: O(1) database lookup using service role.
- Max latency: Non-blocking from the client perspective (fire-and-forget).
- Memory constraints: Minimal.

## Security Constraints
- Validation rules: التأكد من وجود `referrerCode`.
- Authorization boundary: يتم تنفيذ الاستعلام عن البريد الإلكتروني حصراً داخل Edge Function باستخدام `SERVICE_ROLE_KEY` لمنع تسريب عناوين البريد للمستخدمين على الواجهة الأمامية.
- Sensitive data handling: عنوان البريد الإلكتروني يُقرأ سيرفر-سايد ولا يرجع أبداً للاستجابة.

## Acceptance Criteria
1. يتم استدعاء Edge Function `notify-referrer` عند التسجيل بكود إحالة.
2. يتم استخراج بريد المُحيل بنجاح في السيرفر.
3. يتم إرسال رسالة تشجيعية بنجاح عبر Resend.
