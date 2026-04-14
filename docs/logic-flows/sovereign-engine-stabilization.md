# Sovereign Engine Final Stabilization (PR #135)

## Goal
الهدف هو التأكد من إن الـ Sovereign Engine شغال باستقرار تام، وربط الجلسات (Sessions) بالـ Profiles الصح باستخدام رقم التليفون، وتأمين الـ WhatsApp Webhook.

## Mental Model
- العميل بيبدأ جلسة (Session) برقم تليفونه.
- الـ Admin عايز يشوف الـ Sovereign Journey Map بتاع العميل ده في الـ Session OS.
- النظام لازم يدور على الـ Profile الصح برقم التليفون لو الـ `user_id` مش موجود، عشان يسحب الـ AI Interpretations والـ Transformation Diagnosis.

## Key Changes & Logic Flows

### 1) Identity Resolution (Phone mapping)
**Files:** `app/api/admin/sovereign/masarat/route.ts`, `src/components/admin/dashboard/Sovereign/SessionOSPanel.tsx`

#### Behavior
1. لو الـ Session ليها `user_id` (UUID)، بنستخدمه مباشرة.
2. لو مفيش، بناخد الـ `client_phone` وندور بيه في جدول الـ `profiles` على عمود الـ `phone`.
3. **التعديل الجوهري**: تم تصحيح الـ Query لتستخدم عمود الـ `phone` بدلاً من محاولة مقارنة التليفون بعمود الـ `user_id` الـ UUID.

### 2) WhatsApp Webhook Security Hardening
**File:** `app/api/webhooks/whatsapp/inbound/route.ts`

#### Security Logic
- الـ Webhook كان بيستخدم Token افتراضي (`alrehla_sovereign_token`) كـ fallback.
- **التعديل**: تم مسح الـ Hardcoded Token. دلوقتي الـ Webhook هيفشل (Fail Secure) لو الـ `META_WA_WEBHOOK_VERIFY_TOKEN` مش متعرف في الـ Environment Variables.

### 3) Redundancy Cleanup
**File:** `app/api/admin/sovereign/masarat/route.ts`

#### Optimization
- تم إزالة الـ Re-initialization المتكرر للـ `supabaseAdmin`. بقينا بنستخدم نسخة واحدة بس في الـ Scope بتاع الـ Request.

## Security Constraints
- **Validation**: أي طلب خارجي لازم يعدي على الـ WhatsApp Token Verification.
- **Authorization**: الـ `supabaseAdmin` بيستخدم فقط في ملفات الـ API المحمية بالـ Admin Auth.

## Acceptance Criteria
1. الربط بين الـ Session والـ Profile برقم التليفون شغال صح.
2. الـ Webhook مبيقبلش أي Token إلا اللي متعرف في الـ `.env`.
3. الـ CI بيمر (Logic Flow Gate Satisfied).
