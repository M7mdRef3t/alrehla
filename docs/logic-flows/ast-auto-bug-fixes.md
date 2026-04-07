# Automated AST Bug Fixes Logic Flow

## Goal
الهدف هو تحليل الأخطاء وتطبيق الإصلاحات البرمجية المقترحة تلقائياً باستخدام jscodeshift.

## Mental Model
- المطور داخل بيئة التطوير المحلية يواجه خطأ.
- النظام يحلل الخطأ عبر `aiErrorAnalyzer.ts` ويرسل مقترح إصلاح.
- الـ API نقطة النهاية `app/api/dev/apply-fix/route.ts` تقوم بقراءة الملف المستهدف، وتطبيق الإصلاح البرمجي، وحفظ التعديلات.

## Inputs / Outputs
- Inputs:
  - `filePath`: مسار الملف المستهدف للتعديل.
  - `replaceTarget`: الكود القديم المراد استبداله.
  - `code`: الكود المقترح للإصلاح.
- Outputs:
  - تأكيد نجاح العملية برسالة Success.
  - أو رسالة خطأ Error إذا فشل التحديث.

## States
- `idle`: النظام في انتظار الأخطاء.
- `analyzing`: النظام يحلل الخطأ ويطلب مقترح الإصلاح.
- `applying`: النظام يرسل مقترح الإصلاح لـ API ليتم تطبيقه.
- `success`: تم تطبيق الإصلاح بنجاح.
- `error`: فشل تحليل أو تطبيق الإصلاح.

## Transitions
1. `idle -> analyzing` عند رصد خطأ.
2. `analyzing -> applying` عند استلام مقترح إصلاح من المساعد الذكي.
3. `applying -> success` عند إتمام تحديث الملف بنجاح.
4. `applying -> error` عند فشل الوصول للملف أو عدم تطابق الكود المستهدف.

## Edge Cases
- الملف المستهدف غير موجود أو خارج النطاق המسموح.
- الكود القديم غير موجود بالملف مما يمنع عملية الاستبدال.
- الكود الجديد يحمل أخطاء في الـ Syntax.

## Failure & Fallback
- لو API فشل: يعود بـ Error response ويتم طباعة المشكلة في console.error.
- لو data ناقصة: يتم إرجاع Error من الـ API (Missing Fields).
- لو البيئة الإنتاجية (Production): Endpoint معطل تلقائياً كإجراء أمني.

## Performance Constraints
- Target complexity: O(N) للبحث والاستبدال في الملف المستهدف.
- Max latency: أقل من 1 ثانية.
- Memory constraints: يتطلب تحميل حجم الملف في الذاكرة.

## Security Constraints
- Validation rules: التأكد من أن الملف المستهدف ضمن مجلدات `src` أو `app`.
- Authorization boundary: العملية متاحة حصراً في بيئة التطوير (NODE_ENV !== 'production').
- Sensitive data handling: لا يوجد.

## Acceptance Criteria
1. توفير نقطة نهاية API تستقبل `filePath` و `replaceTarget` و `code`.
2. حماية الـ Endpoint بعدم العمل في الـ Production.
3. إتمام عملية الاستبدال بنجاح بعد التأكد من صحة الكود المُقترح برمجياً.
