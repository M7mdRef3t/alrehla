# Graph Projection Engine Logic Flow

## Goal
يحول العقد (Nodes) في خريطة المستخدم إلى حالة شبكية (Knowledge Graph) تمثل الوعي وحالته النفسية.

## Mental Model
- المستخدم داخل مسار رحلته.
- النظام يحتاج لعكس هذه الرحلة في Graph للبحث الدلالي.
- هذا الإسقاط ضروري لتحليل وتتبع حالة الوعي بمرور الوقت.

## Inputs / Outputs
- Inputs: `userId`, `nodes: MapNode[]`
- Outputs: `void` (Upserts Graph Nodes / Vectors to Database)

## States
- `idle`
- `projecting`
- `success`
- `error`

## Transitions
1. `idle -> projecting` عند استدعاء `projectMapToGraph`
2. `projecting -> success` عند إتمام كل عمليات الـ `upsertVectorNode` و `upsertEdge`
3. `projecting -> error` عند حدوث أي خطأ في قاعدة البيانات

## Edge Cases
- حالة 1: الـ `supabase` غير متوفر أو العميل يعمل في `runtimeEnv.isDev`.
- حالة 2: الخريطة لا تحتوي على عقد.

## Failure & Fallback
- لو API فشل: يتم تسجيل الخطأ `console.error` بدون إيقاف بقية النظام.
- لو data ناقصة: يتخطى العمليات الفرعية للبيانات المفقودة.

## Performance Constraints
- Target complexity: $O(N)$ حيث $N$ هي عدد العقد.

## Security Constraints
- Validation rules: يعتمد على مصداقية البيانات القادمة من الـ `MapNode`.

## Acceptance Criteria
1. يتم حفظ حالة المستخدم `Seeker`.
2. يتم حفظ كل عقدة كـ Vector في قاعدة البيانات.
3. لا توجد `console.log` غير ضرورية تملأ مساحة الـ logs.
