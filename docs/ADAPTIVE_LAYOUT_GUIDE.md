# Adaptive Layout Engine — دليل الاستخدام

## 🎯 المفهوم

**Adaptive Layout Engine** هو محرك ذكي يعيد ترتيب عناصر الصفحة الرئيسية ([CoreMapScreen](../src/components/CoreMapScreen.tsx)) بناءً على **حالة المستخدم النفسية** تلقائياً.

### المبدأ الأساسي:
- **في الأزمة (Crisis):** Status Card → Map → Widgets مطوية
- **في التدفق (Flow):** Daily Pulse → TEI → Map → Challenge
- **في الاستقرار (Stable):** الترتيب الافتراضي

---

## 📂 الملفات الأساسية

### 1. المحرك
**الموقع:** [`src/ai/adaptiveLayoutEngine.ts`](../src/ai/adaptiveLayoutEngine.ts)

**المسؤولية:**
- حساب الأولوية لكل section بناءً على:
  - **TEI** (Trauma Entropy Index) — 0-100
  - **Shadow Score** — 0-100
  - **Pulse Mode** — low / angry / high / normal
  - **Has Answered Today** — Boolean
  - **Session Duration** — Minutes

### 2. التطبيق
**الموقع:** [`src/components/CoreMapScreen.tsx`](../src/components/CoreMapScreen.tsx)

**التكامل:**
```typescript
import { adaptiveLayoutEngine } from "../ai/adaptiveLayoutEngine";

const adaptiveLayout = useMemo(
  () =>
    adaptiveLayoutEngine.calculateLayout({
      nodes,
      tei,
      shadowScore,
      pulseMode,
      hasAnsweredToday,
      sessionDuration,
      journeyMode,
    }),
  [nodes, tei, shadowScore, pulseMode, hasAnsweredToday, sessionDuration, journeyMode]
);

const sectionOrder = useMemo(
  () => adaptiveLayoutEngine.getSectionOrder(adaptiveLayout.sections),
  [adaptiveLayout.sections]
);
```

### 3. CSS Transitions
**الموقع:** [`src/styles/consciousness-theme.css`](../src/styles/consciousness-theme.css)

**الربط:**
كل section في CoreMapScreen بيستخدم CSS `order` property:

```tsx
<motion.div
  style={{
    order: sectionOrder["tei-widget"],
    transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
  }}
>
  <TEIWidget />
</motion.div>
```

---

## 🧠 الخوارزمية

### 1. تحديد الوضع (Layout Mode)

```typescript
function determineLayoutMode(params: {
  tei: number;
  shadowScore: number;
  pulseMode: string;
}): LayoutMode {
  // أزمة نشطة
  if (pulseMode === "low" || pulseMode === "angry") {
    return "crisis";
  }

  // TEI مرتفع + Shadow Score عالي
  if (tei > 60 && shadowScore > 50) {
    return "struggling";
  }

  // TEI منخفض + Pulse عالي
  if (tei < 20 && pulseMode === "high") {
    return "flow";
  }

  // TEI منخفض + Shadow Score منخفض
  if (tei < 35 && shadowScore < 30) {
    return "thriving";
  }

  return "stable";
}
```

### 2. حساب الأولوية (Priority Calculation)

كل **Layout Mode** عنده ترتيب مخصوص:

#### 🔴 **Crisis Mode** (أزمة)
```
1. Status Card (100) — الأولوية القصوى
2. Map Canvas (90) — الفوكس على العلاقة
3. Controls Bar (80)
4. TEI Widget (40) — مطوي + sticky
5. Daily Pulse (30) — مطوي
6. Dashboard Details (20) — مطوي
7. Ring Legend (10)
```

#### 🟡 **Struggling Mode** (يكافح)
```
1. TEI Widget (100) — الأولوية للوضوح
2. Status Card (90)
3. Map Canvas (80)
4. Controls Bar (70)
5. Daily Pulse (60)
6. Dashboard Details (40) — مطوي
7. Ring Legend (30)
```

#### 🟢 **Thriving Mode** (يزدهر)
```
1. Daily Pulse (100) — الأولوية للنمو
2. TEI Widget (90)
3. Status Card (85)
4. Map Canvas (80)
5. Controls Bar (70)
6. Dashboard Details (50) — مفتوح
7. Ring Legend (40)
```

#### 💎 **Flow Mode** (تدفق)
```
1. Daily Pulse (100) — الأولوية للتأمل
2. TEI Widget (95) — sticky
3. Status Card (90) — مناورة اليوم
4. Map Canvas (80)
5. Controls Bar (75) — expanded
6. Dashboard Details (60) — مفتوح
7. Ring Legend (50)
```

#### ⚪ **Stable Mode** (مستقر)
```
1. TEI Widget (100)
2. Daily Pulse (90)
3. Map Canvas (80)
4. Dashboard Details (70) — مطوي
5. Status Card (65)
6. Controls Bar (60)
7. Ring Legend (40)
```

---

## 🎨 الانتقالات السلسة (Smooth Transitions)

### المدة (Duration)
- **Crisis:** 2500ms (أبطأ، لتجنب الصدمة البصرية)
- **Flow:** 1500ms (أسرع، لمواكبة الطاقة)
- **Others:** 2000ms (متوازن)

### الـ Easing
```typescript
easing: "cubic-bezier(0.4, 0, 0.2, 1)"
```

### التطبيق
```typescript
<motion.div
  style={{
    order: sectionOrder["map-canvas"],
    transition: `order 2000ms cubic-bezier(0.4, 0, 0.2, 1)`,
  }}
>
  <MapCanvas />
</motion.div>
```

---

## 🔧 الاستخدام المتقدم

### 1. إضافة Section جديد

**الخطوة 1:** أضف الـ ID في الـ Type:
```typescript
// src/ai/adaptiveLayoutEngine.ts
export type LayoutSectionId =
  | "tei-widget"
  | "daily-pulse"
  | "status-card"
  | "map-canvas"
  | "controls-bar"
  | "ring-legend"
  | "dashboard-details"
  | "new-section"; // <-- إضافة جديدة
```

**الخطوة 2:** أضف الأولوية في كل Mode:
```typescript
private calculateSectionPriorities(params) {
  // في كل mode، أضف:
  {
    id: "new-section",
    priority: 75,
    size: "normal",
  }
}
```

**الخطوة 3:** طبق `order` في CoreMapScreen:
```tsx
<motion.div
  style={{
    order: sectionOrder["new-section"],
    transition: `order ${adaptiveLayout.transitions.duration}ms ${adaptiveLayout.transitions.easing}`,
  }}
>
  <NewSection />
</motion.div>
```

### 2. تخصيص الخوارزمية

**مثال:** زيادة أولوية Daily Pulse لو المستخدم مش بيجاوب لأكثر من 3 أيام:

```typescript
// في calculateSectionPriorities
if (mode === "stable" && !hasAnsweredToday && daysSinceLastAnswer > 3) {
  return [
    {
      id: "daily-pulse",
      priority: 100, // رفع الأولوية
      size: "expanded",
    },
    {
      id: "tei-widget",
      priority: 90,
      size: "normal",
    },
    // ...
  ];
}
```

---

## 📊 أمثلة السيناريوهات

### سيناريو 1: المستخدم في أزمة
**المدخلات:**
```
TEI: 85 (فوضى عالية)
Shadow Score: 70 (ضغط عالي)
Pulse Mode: "angry"
```

**الترتيب:**
```
1. Status Card ("إسكات الضجيج") → في الأعلى
2. Map Canvas → الفوكس على الخريطة
3. TEI Widget → مطوي + sticky في الزاوية
4. Daily Pulse → مطوي
```

### سيناريو 2: المستخدم في تدفق
**المدخلات:**
```
TEI: 15 (وضوح عالي)
Shadow Score: 20 (ضغط منخفض)
Pulse Mode: "high"
```

**الترتيب:**
```
1. Daily Pulse ("سؤال اليوم") → في الأعلى
2. TEI Widget (sticky) → ظاهر في الزاوية
3. Status Card ("مناورة اليوم") → تحدي
4. Map Canvas → الخريطة
5. Controls Bar → كل الأدوات متاحة
```

### سيناريو 3: المستخدم مستقر
**المدخلات:**
```
TEI: 45 (متوسط)
Shadow Score: 35 (متوسط)
Pulse Mode: "normal"
```

**الترتيب:**
```
1. TEI Widget → الترتيب الافتراضي
2. Daily Pulse → سؤال اليوم
3. Map Canvas → الخريطة
4. Dashboard Details → مطوي
```

---

## 🧪 الاختبار

### 1. اختبار Manual

**الطريقة:**
1. افتح DevTools → Console
2. غيّر الحالة من localStorage:
   ```javascript
   // محاكاة أزمة
   localStorage.setItem("dawayir-pulse-mode", JSON.stringify("angry"));
   localStorage.setItem("dawayir-tei-history", JSON.stringify([85, 90, 88]));

   // Reload
   location.reload();
   ```

### 2. اختبار بالكود

**ملف Test:** `src/ai/__tests__/adaptiveLayoutEngine.test.ts`

```typescript
import { adaptiveLayoutEngine } from "../adaptiveLayoutEngine";

test("Crisis mode: Status Card أولاً", () => {
  const layout = adaptiveLayoutEngine.calculateLayout({
    nodes: mockNodes,
    tei: 85,
    shadowScore: 70,
    pulseMode: "angry",
    hasAnsweredToday: false,
    sessionDuration: 10,
  });

  expect(layout.mode).toBe("crisis");
  expect(layout.sections[0].id).toBe("status-card");
  expect(layout.sections[0].priority).toBe(100);
});

test("Flow mode: Daily Pulse أولاً", () => {
  const layout = adaptiveLayoutEngine.calculateLayout({
    nodes: mockNodes,
    tei: 15,
    shadowScore: 20,
    pulseMode: "high",
    hasAnsweredToday: false,
    sessionDuration: 5,
  });

  expect(layout.mode).toBe("flow");
  expect(layout.sections[0].id).toBe("daily-pulse");
  expect(layout.sections[0].priority).toBe(100);
});
```

---

## 🔗 التكامل مع Consciousness Theme

الـ Adaptive Layout بيشتغل جنباً إلى جنب مع [Consciousness Theme Engine](./CONSCIOUSNESS_THEME_GUIDE.md):

### الفرق:
- **Consciousness Theme:** بيغير الـ **Colors + Spacing + Animations**
- **Adaptive Layout:** بيغير الـ **Order + Visibility + Priority**

### التزامن:
كلهم بيستخدموا نفس الـ **transition timing (2s)**:

```typescript
// Consciousness Theme
transition: "all 2s cubic-bezier(0.4, 0, 0.2, 1)"

// Adaptive Layout
transition: "order 2000ms cubic-bezier(0.4, 0, 0.2, 1)"
```

### النتيجة:
**الواجهة بتتغير بشكل متزامن ومتناسق:**
- الألوان بتتغير (Theme)
- الترتيب بيتغير (Layout)
- الانتقالات سلسة (2s cubic-bezier)

---

## 🎯 الملخص

**Adaptive Layout Engine** هو المحرك اللي بيخلي الصفحة الرئيسية **واعية** بحالة المستخدم:

✅ **في الأزمة:** الأولوية للتدخل الفوري (Status Card)
✅ **في التدفق:** الأولوية للنمو (Daily Pulse)
✅ **في الاستقرار:** الترتيب الافتراضي المتوازن
✅ **انتقالات سلسة:** 2s smooth transitions
✅ **متزامن مع Consciousness Theme:** تغيير شامل للواجهة

---

**المطور:** AI + محمد (System Architect)
**التاريخ:** 2026-02-21
**النسخة:** 1.0.0
