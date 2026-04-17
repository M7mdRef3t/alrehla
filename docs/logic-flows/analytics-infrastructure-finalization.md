# Analytics & Infrastructure Hardening Logic Flow

## Goal
ضمان دقة بيانات التحليلات (Analytics) بنسبة 100% ومنع فقدانها في البيئات السحابية (Serverless)، مع تأمين عمليات تحديث قاعدة البيانات ضد تضارب البيانات (Race Conditions).

## Mental Model
- التحليلات ليست مجرد "أرقام"، بل هي البوصلة التي توجه الحملات الإعلانية.
- نموذج "Dual Tracking": دمج Meta Pixel (Client) مع Meta CAPI (Server) لضمان تسجيل التحويلات حتى لو تم حظر الـ Script في المتصفح.
- نموذج "Atomic Increments": استخدام الدوال السحابية مباشرة في قاعدة البيانات (RPC) لضمان أن كل "نور" (Lantern) يحصل على حقه في العدّ بدقة.

## Inputs / Outputs
- **Inputs**: 
  - Analytics Events (Interaction, PageView, Conversion).
  - Lantern IDs for resonance.
- **Outputs**:
  - Validated GA4 events.
  - Deduplicated Meta Events (Browser + Server).
  - Atomic resonance count updates in Supabase.

## Edge Cases
- **Serverless Cold Start**: تم حلها بانتظار (await) الدالة قبل إنهاء الـ Context.
- **Concurrent Updates**: تم حلها باستخدام Postgres RPC (Atomic increment).
- **Build-time Static Analysis**: تم حلها بتأخير إنشاء الـ Supabase Client لوقت التشغيل (Runtime).

## Performance Constraints
- **Debounced Flush**: الأحداث تُرسل في دفعات (Batch) كل ثانية لتوفير موارد الشبكة ومنع أخطاء 429.
- **Minimal Server Overhead**: استخدام الـ keepalive في الـ fetch لضمان وصول البيانات حتى بعد إغلاق الصفحة.

## Security Constraints
- **service_role**: استخدام مفاتيح الخدمة فقط في الـ backend للعمليات الحساسة (مثل الـ resonance) لمنع التلاعب من جهة العميل.
- **Anonymization**: تحويل الـ IPs لـ Anonymous في GA4.

## Acceptance Criteria
1. الأحداث تظهر في Meta Events Manager مع `Match Quality` عالية.
2. لا يوجد تكرار في الأحداث بفضل الـ `client_event_id`.
3. الـ Build يمر بسلام على Netlify/Vercel بدون أخطاء في الـ Key Validation.
