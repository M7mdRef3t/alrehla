# DynamicRecoveryPlan - Component Structure

## ✅ مكونات تم استخراجها:

### 1. **helpers.ts**
- `getPlanTitle()`: عنوان الخطة حسب الدائرة
- `buildInsightFromSymptoms()`: بناء رؤية من الأعراض المحددة

---

## 📋 مكونات موجودة في الملف الرئيسي:

### 2. **PlanHeader** (السطور 146-177)
- عرض عنوان الخطة
- AI badge
- عداد الأسابيع المكتملة
- النمط الرئيسي

### 3. **InsightsSection** (السطور 179-216)
- قابل للطي/الفتح
- رؤى من التحليل
- رؤى من الأعراض المحددة

### 4. **WeekCard** (السطور 242-427)
- بطاقة الأسبوع الواحد
- قابلة للطي/الفتح
- عرض المهام
- إحصائيات الإكمال

### 5. **ActionItem** (السطور 430-563)
- عنصر المهمة الواحدة
- checkbox للإكمال
- حقل إدخال للملاحظات
- feedback buttons (سهل/صعب/مش واقعي)
- "Why Box" التوضيحي

---

## 🎯 البنية الحالية:

```
DynamicRecoveryPlan.tsx (587 سطر)
├── State Management
├── AI Generation Logic
├── PlanHeader Component
├── InsightsSection Component
├── WeekCard Component (مع ActionItem)
└── Utility Functions
```

---

## 🚀 الخطوات التالية (اختياري):

1. استخراج PlanHeader كمكون منفصل
2. استخراج InsightsSection كمكون منفصل
3. استخراج WeekCard كمكون منفصل
4. استخراج ActionItem كمكون منفصل
5. نقل pattern utilities إلى ملف منفصل
