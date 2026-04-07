# Referral Notification Logic Flow

## Goal
عندما يتم استخدام كود الإحالة (Referral Code) بنجاح من قبل مستخدم جديد، يتم إشعار المستخدم الأصلي الذي شارك الكود (المُحيل) عن طريق إرسال بريد إلكتروني، وإضافته في مكافآته.

## Mental Model
- المستخدم قام بدعوة صديقه باستخدام الكود الخاص به.
- صديقه استخدم الكود بنجاح.
- النظام يحتاج لإشعار المستخدم الأصلي بنجاح الإحالة.
- النظام يقوم باستدعاء Edge Function `send-email` لإرسال رسالة شكر وإعلام.

## Inputs / Outputs
- Inputs: `code` (كود الإحالة)، بريد المستخدم الجديد الذي استخدم الكود.
- Outputs: رسالة بريد إلكتروني للمُحيل الأصلي عبر `send-email` edge function.

## States
- `invoking_function`: عند البدء في الاتصال بـ Supabase Edge Function
- `success`: عند نجاح استدعاء الدالة.
- `error`: في حال فشل الاستدعاء.

## Transitions
1. `invoking_function -> success` عند رجوع رد نجاح من Edge Function.
2. `invoking_function -> error` في حال خطأ بالشبكة أو الرد من Edge Function.

## Edge Cases
- المُحيل ليس لديه بريد إلكتروني (تم حمايتها).
- دالة البريد الإلكتروني تفشل أو لم يتم إعداد المفاتيح الخاصة بها (الخطأ لا يوقف العملية الأساسية للتسجيل).

## Failure & Fallback
- لو API فشل: سيتم التقاط الخطأ بـ `catch` وعرضه في الشاشة `console.error`، بدون التأثير على صحة الإحالة نفسها (return true).
- لو data ناقصة: سيتم تجاوز الإرسال.

## Performance Constraints
- Target complexity: O(1) استعلام و O(1) طلب HTTP.
- Max latency: Asynchronous (غير محظور).

## Security Constraints
- Validation rules: التأكد من عدم استخدام نفس المستخدم لكود نفسه.
- Authorization boundary: Supabase Edge Functions.

## Acceptance Criteria
1. نجاح الإحالة ينفذ Edge function `send-email`.
2. فشل إرسال البريد الإلكتروني لا يمنع إكمال عملية الإحالة.
