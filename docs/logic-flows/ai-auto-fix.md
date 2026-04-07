# AI AST Auto-Fix Logic Flow

## Goal
تطبيق اقتراحات تصحيح الأخطاء (Suggested Fixes) تلقائياً على الكود المصدري باستخدام التلاعب بـ Abstract Syntax Tree (AST) عبر API محلي أثناء التطوير.

## Mental Model
- المستخدم (أو الـ AI) بيرصد خطأ (Error) في التطبيق، وبيحلله وبيقترح حل مباشر.
- النظام عايز يسهل عملية التصحيح بتطبيق الحل ده مباشرة في الكود عن طريق API بيعدل الـ AST بدقة، بدلاً من مجرد حفظه كمقترح.
- ليه التدفق ده هو الأنسب؟ لأنه بيقلل الاحتكاك (friction) في إصلاح الأخطاء المكررة أو المعروفة وبيدمج الـ AI بشكل أعمق في عملية التطوير.

## Inputs / Outputs
- Inputs: `filePath`, `originalCode`, `code` (التعديل), `action` (replace/append).
- Outputs: حالة نجاح (Success) أو فشل مع رسالة الخطأ عبر الـ API. وتعديل فعلي لملف الـ TypeScript.

## States
- `idle`: النظام جاهز لاستقبال اقتراحات تصحيح.
- `analyzing`: النظام بيحلل الخطأ عبر Gemini.
- `applying_fix`: إرسال الـ payload إلى `POST /api/auto-fix` لتعديل الكود.
- `success`: تم تعديل الكود بنجاح والاحتفاظ بنسخة في `localStorage`.
- `error`: فشل في تحليل أو تعديل الكود (مثل مسار غير صالح أو الكود غير موجود).

## Transitions
1. `idle -> analyzing` عند رصد خطأ.
2. `analyzing -> applying_fix` عند الحصول على مقترح تصحيح قابل للتطبيق تلقائياً.
3. `applying_fix -> success` عند نجاح الـ API في تعديل الـ AST والكود.
4. `applying_fix -> error` عند فشل الـ API.

## Edge Cases
- حالة 1: الخطأ الأصلي (originalCode) لم يتم العثور عليه بدقة في ملف المصدر.
- حالة 2: مسار الملف المُرسل يقع خارج النطاق المسموح (`src/` أو `app/`).

## Failure & Fallback
- لو API فشل: الـ AI Error Analyzer بيكمل شغله بشكل طبيعي وبيقوم بحفظ التصحيح المُقترح في `localStorage` للمراجعة اليدوية (Fallback الأساسي).
- لو data ناقصة: يتم رفض الـ request بـ 400 Bad Request.
- لو البيئة ليست Development: يتم الرفض بـ 403 Forbidden.

## Performance Constraints
- Target complexity: عملية البحث في الـ AST يجب أن تكون في حدود بضعة ملي ثانية للملف الواحد.
- Max latency: أقل من 500ms لتطبيق التصحيح (بما يشمل قراءة/كتابة الملف).
- Memory constraints: لا توجد قيود استثنائية، الـ TS Compiler API يتعامل مع ملف واحد فقط في الذاكرة.

## Security Constraints
- Validation rules: يجب أن يكون `filePath` و `code` موجودين ضمن الـ payload.
- Authorization boundary: مقيد ببيئة التطوير المحلية فقط `NODE_ENV === "development"`.
- Sensitive data handling: المسار المسموح بالكتابة فيه محصور فقط في `src/` و `app/` لضمان عدم حدوث Path Traversal Attack أو Arbitrary File Write خارج المسموح.

## Acceptance Criteria
1. الكود يتم تعديله بشكل صحيح باستخدام AST بدلاً من string replacement البسيط قدر الإمكان.
2. مسارات الملفات المُستهدفة محمية من الـ Path Traversal.
3. التعديلات تعمل فقط وحصرياً في بيئة الـ development للحماية من Remote Code Execution (RCE) في الإنتاج.
