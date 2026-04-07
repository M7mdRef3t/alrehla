# AddPersonModal - Component Structure

## ✅ مكونات تم استخراجها:

### 1. **constants.tsx**
- `SUGGESTIONS`: اقتراحات الألقاب حسب الهدف
- `PLACEHOLDERS`: placeholder texts
- `SuggestionCard` type

### 2. **DraggablePersonChip.tsx**
- مكون الدائرة القابلة للسحب
- يستخدم `@dnd-kit/core`

### 3. **DroppableZone.tsx**
- المناطق القابلة لإسقاط الدائرة
- 3 مناطق: green, yellow, red
- `RingId` type exported

### 4. **PlacementStep.tsx**
- خطوة وضع الشخص على الخريطة
- يدمج DND sensors (Mouse + Touch)
- يستخدم DroppableZone و DraggablePersonChip

### 5. **SelectPersonStep.tsx**
- خطوة اختيار اللقب والاسم
- شبكة الأيقونات التفاعلية
- حقل اسم اختياري

## 📋 مكونات تحتاج استخراج (للمستقبل):

### 6. **ResultScreen.tsx** (~135 سطر)
- عرض النتيجة الأولية
- Symptoms checklist
- Suggested placement
- أزرار CTA

### 7. **FirstStepScreen.tsx** (~105 سطر)
- عرض الخطوة الأولى
- ResultActionToolkit integration
- Personalized training CTA

### 8. **RecoveryPlanScreen.tsx** (~86 سطر)
- عرض خطة التعافي
- DynamicRecoveryPlan integration

---

## 📦 الاستخدام:

```typescript
// بدلاً من import من AddPersonModal.tsx
import { PlacementStep } from "./AddPersonModal/PlacementStep";
import { SelectPersonStep } from "./AddPersonModal/SelectPersonStep";
import { SUGGESTIONS, PLACEHOLDERS } from "./AddPersonModal/constants";
```

---

## 🎯 الفوائد:

1. ✅ **قابلية إعادة الاستخدام**: كل مكون مستقل
2. ✅ **سهولة الصيانة**: ملفات أصغر (<100 سطر)
3. ✅ **الاختبار**: إمكانية اختبار كل مكون منفصل
4. ✅ **الأداء**: React.memo أسهل للمكونات الصغيرة

---

## 🚀 الخطوات التالية (اختياري):

1. استخراج ResultScreen كمكون منفصل
2. استخراج FirstStepScreen كمكون منفصل
3. استخراج RecoveryPlanScreen كمكون منفصل
4. تحديث AddPersonModal.tsx ليستخدم المكونات الجديدة
5. إضافة React.memo للتحسين
