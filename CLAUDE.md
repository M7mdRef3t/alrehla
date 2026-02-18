# دواير (Dawayir) — Project Context for Claude Code

## صاحب المشروع
محمد — System Architect | مصمم جرافيك | لايف كوتش | يتأهل للعمل كمعالج نفسي
المهمة: نشر الوعي والعلم. تعامل معه كـ System Architect يفكر من المبادئ الأولى.
**اللغة: العامية المصرية دايماً في كل الردود.**

---

## المشروع
منصة ويب علاجية تفاعلية للنمو الشخصي وفهم العلاقات النفسية.
المستخدم يرسم "خريطة دواير" للأشخاص في حياته ويتابع رحلته العاطفية.

---

## Tech Stack
| Layer | Tech |
|-------|------|
| Framework | React 18 + TypeScript (strict) |
| Styling | Tailwind CSS v4 + CSS Custom Properties |
| Animation | Framer Motion |
| State | Zustand + localStorage persistence |
| Backend | Supabase (auth + database) |
| Icons | Lucide React |
| Build | Vite |

---

## هيكل المجلدات الأساسي
```
src/
├── components/       # UI components
│   ├── CoreMapScreen.tsx     # الشاشة الرئيسية للخريطة
│   ├── ViewPersonModal.tsx   # modal عرض الشخص
│   ├── TEIWidget.tsx         # مؤشر الوضوح (Trauma Entropy Index)
│   ├── DailyPulseWidget.tsx  # سؤال اليوم
│   ├── DailyJournalArchive.tsx
│   ├── ShadowPulseAlert.tsx  # تنبيه نبضات الظل
│   └── Landing.tsx
├── state/
│   ├── mapState.ts           # Zustand store للخريطة
│   ├── dailyJournalState.ts  # store الأسئلة اليومية
│   └── shadowPulseState.ts   # store تتبع السلوك الخفي
├── utils/
│   ├── traumaEntropyIndex.ts # خوارزمية TEI
│   └── shadowPulseEngine.ts  # حساب Shadow Score
├── hooks/
│   └── useDailyQuestion.ts
├── data/
│   └── dailyQuestions.ts     # 30 سؤال في 4 محاور
├── styles.css                # Design system + Organic Unity
└── App.tsx                   # Router + screens
```

---

## Design System — Organic Unity

### CSS Variables (في :root)
```css
--radius-pill: 9999px      /* أزرار، بادجات */
--radius-card: 1.25rem     /* كروت، بلوكات */
--radius-modal: 1.5rem     /* نوافذ كبيرة */
--radius-sm: 0.75rem       /* عناصر صغيرة */

--ease-spring: cubic-bezier(0.22, 1, 0.36, 1)
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)
--duration-fast: 180ms
--duration-base: 300ms
--duration-slow: 500ms
```

### CSS Classes المهمة
- `.living-element` — نبضة حياة للعناصر التي تحمل بيانات حية (يقبل --organic-pulse-color)
- `.flow-appear` — دخول عضوي من الأسفل مع blur dissolution
- `.organic-tap` — استجابة فورية عند الضغط (scale 0.96)
- `.organic-input` — input/textarea موحد
- `.primary-block` — الكتلة الأم 60% (gradient border glow)
- `.support-block` — الكتلة الداعمة 30% (أخف)
- `.cosmic-shimmer` — ضوء يمر بهدوء

### هيكل 60/30/10
- **60% primary block**: TEIWidget + DailyPulseWidget (دايماً ظاهرين)
- **30% support block**: تفاصيل الدواير (collapsible)
- **10% breathing space**: مسافات تنفس

---

## الفيتشرز الجديدة (مطبّقة)

### 1. Daily Pulse — سؤال اليوم
- 30 سؤال في 4 محاور أسبوعية (وعي ذات / قرب / حدود / مستقبل)
- إجابات محفوظة في localStorage
- أرشيف "كتاب رحلتي"

### 2. Shadow Pulse — نبضات الظل
- تتبع السلوك الضمني (فتح cards بدون تعديل، زيارات ليلية)
- Shadow Score = visitCount×0.4 + timeMs×0.3 + cancelledEdits×0.2 + lateNight×0.1
- تنبيه عائم عند score ≥ 35

### 3. TEI — Trauma Entropy Index
- رقم 0-100 يقيس الوضوح العاطفي (100 = فوضى كاملة)
- SVG arc متحرك مع رقم الوضوح في المنتصف
- مقارنة تاريخية يومية

---

## قواعد الكود
1. TypeScript strict — zero errors دايماً (`npx tsc --noEmit`)
2. لا `any` إلا لو ضروري جداً مع تعليق
3. RTL-first: `text-right`, `dir="rtl"`
4. كل animation بـ Framer Motion أو CSS vars — مش inline transitions عشوائية
5. localStorage keys تبدأ بـ `"dawayir-"`
6. Zustand stores فيها `hydrate()` method للـ localStorage

---

## ملاحظات مهمة
- الـ scroll كان locked في landing page (user mode) — اتحل بإزالة useEffect في App.tsx
- لا يوجد scroll lock في أي screen دلوقتي
- Admin dashboard في `/admin` route — light theme منفصل
