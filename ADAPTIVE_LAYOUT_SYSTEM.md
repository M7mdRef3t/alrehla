# 🎨 Adaptive Layout System — نظام التخطيط التكيفي الموحد

## نظرة عامة

نظام **التخطيط التكيفي الموحد** يجمع بين **4 أنماط مختلفة** من واجهات المستخدم في نظام واحد ذكي يتكيف مع سلوك المستخدم واحتياجاته.

---

## 🏗️ الهندسة الكاملة

### **المبدأ الأساسي:**

```
النظام يوفر 4 "أوضاع تخطيط" (Layout Modes):

1. FOCUS MODE      → الخريطة فقط (Progressive Disclosure)
2. INSIGHTS MODE   → Sidebar مع الإحصائيات
3. CONVERSATION MODE → Tabs للحوار مع Gemini
4. ADAPTIVE MODE   → النظام يختار تلقائياً

المستخدم يقدر:
- يختار الوضع يدوياً
- النظام يقترح عليه الوضع الأنسب
- يحفظ تفضيلاته
```

---

## 📂 الملفات الأساسية

### **1. State Management**
```
src/state/layoutState.ts
```
- إدارة الحالة الكاملة للتخطيط
- حفظ تفضيلات المستخدم في localStorage
- قواعد التكيف الذكي

### **2. Components**
```
src/components/
├── FloatingActionMenu.tsx    # القائمة العائمة (Focus Mode)
├── InsightsSidebar.tsx        # الشريط الجانبي (Insights Mode)
├── TabNavigation.tsx          # التبويبات (Conversation Mode)
└── LayoutModeSwitcher.tsx     # مبدل الأوضاع
```

### **3. Hooks**
```
src/hooks/
└── useAdaptiveLayout.ts       # محرك التكيف الذكي
```

---

## 🎯 الأوضاع الأربعة

### **1️⃣ Focus Mode (وضع التركيز)**

**الفكرة:**
- الخريطة تاخد **كل المساحة**
- لا توجد عناصر مشتتة
- **Floating Action Button** في الزاوية للوصول السريع

**المميزات:**
- ✅ مثالي للمبتدئين
- ✅ واجهة بسيطة وواضحة
- ✅ تركيز كامل على رسم الدوائر

**متى يُستخدم:**
- المستخدم الجديد (أول مرة)
- ساعات التركيز (8-10 صباحاً، 6-8 مساءً)
- عدد الدوائر قليل (أقل من 3)

**الـ UI:**
```
┌────────────────────────────────────────┐
│  [Layers Icon]                         │  ← Layout Switcher
│                                        │
│         MAP CANVAS (Full Screen)       │
│                                        │
│         [الدوائر هنا]                  │
│                                        │
│                                        │
│                          [✨ FAB]      │  ← Floating Menu
└────────────────────────────────────────┘
```

---

### **2️⃣ Insights Mode (وضع التحليل)**

**الفكرة:**
- **Sidebar** قابل للطي على اليمين/اليسار
- فيه كل الإحصائيات والتحليلات
- الخريطة في المنتصف

**المميزات:**
- ✅ رؤية شاملة للبيانات
- ✅ مقارنة سريعة بين الدوائر
- ✅ TEI + Daily Pulse + Dashboard في مكان واحد

**متى يُستخدم:**
- Shadow Score عالي (> 35)
- عدد الدوائر كبير (≥ 3)
- المستخدم محتاج يحلل بياناته

**الـ UI:**
```
┌────────┬───────────────────────────────┐
│  📊    │                               │
│  TEI   │     MAP CANVAS                │
│        │                               │
│  📝    │     [الدوائر هنا]             │
│ Daily  │                               │
│ Pulse  │                               │
│        │                               │
│  📈    │                               │
│ Stats  │                               │
└────────┴───────────────────────────────┘
```

---

### **3️⃣ Conversation Mode (وضع الحوار)**

**الفكرة:**
- **Tabs** في الأعلى للتنقل السريع
- Tab 1: الخريطة
- Tab 2: التحليل
- Tab 3: الحوار مع Gemini

**المميزات:**
- ✅ Separation of Concerns واضح
- ✅ كل tab ليها هدف محدد
- ✅ سهل التنقل

**متى يُستخدم:**
- TEI Score عالي (> 60)
- المستخدم مجاوبش Daily Pulse
- محتاج يتكلم مع الذكاء الاصطناعي

**الـ UI:**
```
┌─────────────────────────────────────────┐
│  [🗺️ الخريطة] [📊 التحليل] [💬 الحوار] │  ← Tabs
├─────────────────────────────────────────┤
│                                         │
│  Tab Content (يتغير حسب الاختيار)       │
│                                         │
└─────────────────────────────────────────┘
```

---

### **4️⃣ Adaptive Mode (الوضع الذكي)**

**الفكرة:**
- النظام **يختار تلقائياً** الوضع الأنسب
- بناءً على **قواعد ذكية**

**القواعد (Adaptive Rules):**

```typescript
// 1. ساعات التركيز → Focus Mode
if (currentHour in [8,9,10,18,19,20]) {
  return "focus";
}

// 2. TEI عالي جداً → Conversation Mode
if (teiScore >= 60) {
  return "conversation";
}

// 3. Shadow Score عالي → Insights Mode
if (shadowScore >= 35) {
  return "insights";
}

// 4. مجاوبش سؤال اليوم → Conversation Mode
if (!hasAnsweredPulse) {
  return "conversation";
}

// 5. عنده دوائر كتير → Insights Mode
if (nodesCount >= 3) {
  return "insights";
}

// 6. Default: Focus Mode
return "focus";
```

**المميزات:**
- ✅ **Zero Decision Fatigue** - المستخدم مش محتاج يفكر
- ✅ يتأقلم مع سلوك المستخدم
- ✅ يتعلم من التفضيلات

---

## 🎛️ التحكم في الأوضاع

### **Layout Mode Switcher**

زر في الزاوية العليا اليسرى (🔲 Layers Icon) يفتح قائمة:

```
┌─────────────────────────────────────┐
│  اختر وضع العرض                    │
├─────────────────────────────────────┤
│  🎯  وضع التركيز                   │
│     الخريطة فقط + قائمة عائمة      │
├─────────────────────────────────────┤
│  📊  وضع التحليل                   │
│     شريط جانبي للإحصائيات         │
├─────────────────────────────────────┤
│  💬  وضع الحوار                    │
│     تبويبات للحوار مع AI           │
├─────────────────────────────────────┤
│  ✨  وضع ذكي ✓                     │
│     النظام يختار الأنسب تلقائياً   │
│     [✓ تفضيلك المحفوظ]             │
└─────────────────────────────────────┘
```

---

## 🧠 الذكاء الاصطناعي في التخطيط

### **useAdaptiveLayout Hook**

```typescript
const {
  currentMode,      // الوضع الحالي
  suggestedMode,    // الوضع المقترح من النظام
  isAdaptive,       // هل في adaptive mode؟
  context           // البيانات اللي اتبنى عليها القرار
} = useAdaptiveLayout();
```

### **مثال:**

```
وقت التشغيل: 8:30 صباحاً
عدد الدوائر: 2
TEI Score: 45
Shadow Score: 20
أجاب على سؤال اليوم: نعم

→ النظام يقترح: Focus Mode
→ السبب: ساعة التركيز + عدد قليل من الدوائر
```

---

## 📊 حفظ التفضيلات

### **localStorage Keys:**

```
dawayir-layout-state
├── userPreferredMode: "focus" | "insights" | "conversation" | "adaptive"
├── hasSeenLayoutOnboarding: boolean
├── sidebarPosition: "right" | "left" | "hidden"
├── fabState: { isOpen, position }
└── adaptiveRules: { ... }
```

### **Override Mechanism:**

```
إذا اختار المستخدم وضع معين:
  → userPreferredMode = "focus"
  → النظام يحترم اختياره ولا يغيره تلقائياً

إذا رجع للـ Adaptive:
  → userPreferredMode = null
  → النظام يبدأ يختار تلقائياً تاني
```

---

## 🎨 الـ UI Components

### **1. Floating Action Menu (FAB)**

**الموقع:** زاوية سفلية (يسار/يمين حسب التفضيل)

**المحتويات:**
- ➕ إضافة شخص
- 🎙️ مهندس الوعي (Gemini Live)
- 📊 الإحصائيات
- ⚙️ الإعدادات

**الـ Animations:**
- Main button: rotate 45° عند الفتح
- Menu items: stagger animation من الأسفل
- Backdrop blur عند الفتح

---

### **2. Insights Sidebar**

**الموقع:** يمين/يسار الشاشة

**المحتويات:**
```
┌────────────────────┐
│ 📊 التحليل والإحصائيات
├────────────────────┤
│ مؤشر الوضوح العاطفي│
│  [TEI Widget]      │
├────────────────────┤
│ سؤال اليوم         │
│  [Daily Pulse]     │
├────────────────────┤
│ توازن الدواير      │
│  ████ 40% آمن     │
│  ████ 30% تعب     │
│  ████ 30% ضاغط    │
├────────────────────┤
│ إجمالي: 10 دوائر  │
│ آمنة: 4           │
│ أرشيف: 2          │
└────────────────────┘
```

**Features:**
- Collapsible/Expandable
- Responsive (يختفي على الموبايل ويظهر كـ modal)
- Toggle button عند الإخفاء

---

### **3. Tab Navigation**

**الموقع:** أعلى الشاشة

**Tabs:**
```
[🗺️ الخريطة] [📊 التحليل] [💬 الحوار]
     ▔▔▔▔▔▔  ← Active indicator (animated)
```

**Features:**
- Smooth transition بين الـ tabs
- Layout ID animation (Framer Motion)
- Icon + Label (اللابل يختفي على الموبايل)

---

## 🔧 التطبيق في CoreMapScreen

### **Integration:**

```typescript
// في CoreMapScreen.tsx

// 1. استيراد الـ hooks والـ components
import { useAdaptiveLayout } from "../hooks/useAdaptiveLayout";
import { useLayoutState } from "../state/layoutState";
import { FloatingActionMenu } from "./FloatingActionMenu";
import { InsightsSidebar } from "./InsightsSidebar";
import { TabNavigation } from "./TabNavigation";
import { LayoutModeSwitcher } from "./LayoutModeSwitcher";

// 2. تفعيل النظام
useAdaptiveLayout();
const mode = useLayoutState((s) => s.mode);
const activeTab = useLayoutState((s) => s.activeTab);

// 3. عرض الـ components حسب الوضع
{mode === "focus" && <FloatingActionMenu {...props} />}
{mode === "insights" && <InsightsSidebar {...props} />}
{activeTab === "conversation" && <TabNavigation />}
<LayoutModeSwitcher />
```

---

## 📱 Responsive Design

### **Mobile (< 768px):**
- Sidebar → يظهر كـ **full-screen modal** مع backdrop
- Tabs → تظهر **icons فقط** (بدون labels)
- FAB → يبقى في نفس المكان

### **Tablet (768px - 1024px):**
- Sidebar → **عرض 320px** قابل للطي
- Tabs → **icons + labels**
- FAB → يظهر عادي

### **Desktop (> 1024px):**
- Sidebar → **عرض 380px** ثابت
- Tabs → **icons + labels** مع spacing أكبر
- FAB → optional (ممكن يختفي في Insights Mode)

---

## 🎯 Best Practices

### **1. Progressive Enhancement**
```
المستخدم الجديد → Focus Mode (بسيط)
      ↓
بعد 3 دوائر → Insights Mode (تحليل)
      ↓
TEI عالي → Conversation Mode (حوار)
```

### **2. Zero Decision Fatigue**
- الوضع الذكي **مفعّل افتراضياً**
- المستخدم **مش مطالب** يختار
- النظام يقترح بس، **مش يفرض**

### **3. User Preference Memory**
- لو اختار وضع معين → النظام **يحترمه**
- لو رجع للذكي → النظام **يساعده تاني**

---

## 🚀 الاستخدام السريع

### **للمستخدم:**

1. **افتح التطبيق** → الوضع الذكي مفعّل تلقائياً
2. **لو عايز تغير** → اضغط زر Layers (🔲) في الزاوية
3. **اختار الوضع** → النظام يحفظ اختيارك
4. **لو عايز ترجع للذكي** → اختار "وضع ذكي"

### **للمطور:**

```typescript
// استخدام الـ state
const mode = useLayoutState((s) => s.mode);
const setMode = useLayoutState((s) => s.setMode);

// تغيير الوضع برمجياً
setMode("focus");

// حفظ تفضيل المستخدم
setUserPreference("insights");

// الحصول على الوضع المقترح
const suggested = getSuggestedMode({ ... });
```

---

## 🎨 الخلاصة

النظام ده **يجمع أفضل 4 أنماط** من واجهات المستخدم:

1. **Progressive Disclosure** → Focus Mode
2. **Contextual Sidebar** → Insights Mode
3. **Tab Navigation** → Conversation Mode
4. **Adaptive AI** → Intelligent Mode Selection

النتيجة: **واجهة مستخدم ذكية** تتأقلم مع كل مستخدم حسب احتياجه وسلوكه.

---

🎯 **Built for:** Dawayir — الرحلة
🧠 **Architect:** محمد
📅 **Date:** 22 فبراير 2026
