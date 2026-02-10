# 🌌 الرحلة — Therapeutic Spaceship Dashboard Design System

## الفلسفة البصرية (Visual Philosophy)

هذا النظام التصميمي يحول منصة "الرحلة" من MVP إلى **منتج عالمي مصقول** (World-Class Polished Product) من خلال:

1. **Deep Cosmic Blue** — خلفية علاجية (ليست سوداء)
2. **Warm Amber** — لون الروح الدافئ للأزرار الحيوية
3. **Emerald Green** — للطمأنينة والنجاح
4. **Bento Grid Layout** — بدلاً من القوائم التقليدية
5. **Glassmorphism Cards** — شفافية زجاجية قوية
6. **Breathing Space** — مساحات تنفس واسعة
7. **Visual Hierarchy** — Big, Bold, Bright

---

## 🎨 نظام الألوان (Color Palette)

### 🌌 Deep Cosmic Blue — الخلفية العلاجية
```css
--space-void: #0a0e1f      /* أعمق من الأسود */
--space-950: #0f1629       /* slate-950 محسّن */
--space-deep: #131a35      /* أزرق كوني عميق */
--space-mid: #1a2242       /* أزرق متوسط */
--space-nebula: #212b4f    /* سديم */
--space-aurora: #2a3560    /* شفق */
```

### 🔥 Warm Amber — لون الروح
```css
--warm-amber: #f5a623
--warm-amber-soft: rgba(245, 166, 35, 0.12)
--warm-amber-glow: rgba(245, 166, 35, 0.25)
```
**الاستخدام**: الأزرار الحيوية (مثل "سجل الشعور")، CTA الرئيسي

### 🌿 Emerald Green — الطمأنينة
```css
--soft-emerald: #10b981
--soft-emerald-dim: rgba(16, 185, 129, 0.12)
```
**الاستخدام**: رسائل النجاح، الطمأنينة

### 🌊 Soft Teal — اللون الأساسي
```css
--soft-teal: #2dd4bf
--soft-teal-dim: rgba(45, 212, 191, 0.12)
```
**الاستخدام**: العلامة التجارية، الروابط، العناصر الثانوية

---

## 🔮 Glassmorphism — الشفافية الزجاجية

### البطاقة الأساسية (Bento Block)
```css
.bento-block {
  background: rgba(15, 23, 42, 0.6);      /* slate-900 مع 60% شفافية */
  backdrop-filter: blur(24px);             /* تمويه قوي */
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.25rem;
  padding: 1.5rem;                         /* p-6 — مساحة تنفس */
}
```

### الزر الشفاف
```css
.glass-button {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
}
```

---

## 🧱 Bento Grid Layout

### القاعدة الأساسية
❌ **لا تستخدم القوائم التقليدية (Lists)**
✅ **استخدم Bento Grid**: كتل معلوماتية متراصة بذكاء

### الأحجام
```css
.bento-sm  /* كتلة صغيرة — 1 عمود */
.bento-md  /* كتلة متوسطة — 2 أعمدة على الشاشات الكبيرة */
.bento-lg  /* كتلة كبيرة — 3 أعمدة على الشاشات الكبيرة */
```

### المسافات
```
gap-6  (1.5rem)  — على الموبايل
gap-8  (2rem)    — على الشاشات الكبيرة
```

---

## ✍️ التسلسل البصري (Visual Hierarchy)

### القاعدة: Big, Bold, Bright

#### العناوين الرئيسية
```css
font-size: 2.25rem - 3rem (36px - 48px)
font-weight: 800 (extrabold)
color: var(--text-primary)
letter-spacing: -0.02em (tracking-tight)
```

#### النصوص الثانوية
```css
font-size: 0.875rem - 1rem (14px - 16px)
font-weight: 600 (semibold)
color: rgba(148, 163, 184, 0.85) /* slate-400 */
```

#### المعلومات الهامشية
```css
font-size: 0.75rem (12px)
font-weight: 500 (medium)
color: rgba(148, 163, 184, 0.45) /* slate-500 */
```

---

## 🫁 مساحات التنفس (Breathing Space)

### القاعدة: ضاعف المسافات الحالية

❌ **لا تستخدم**: `gap-2`, `p-4`
✅ **استخدم**: `gap-6`, `p-6`, `gap-8`, `p-8`

### داخل البطاقات
```css
padding: 1.5rem (p-6)   /* داخل الكروت */
gap: 1.5rem (gap-6)     /* بين العناصر */
```

### بين الأقسام
```css
margin-top: 4rem (mt-16)    /* بين الأقسام على الموبايل */
margin-top: 5rem (mt-20)    /* بين الأقسام على الشاشات الكبيرة */
```

---

## 🎯 الأزرار (Buttons)

### CTA Primary — Warm Amber
```css
.cta-primary {
  background: linear-gradient(135deg, #f5a623 0%, #d97706 100%);
  padding: 1rem 2rem;
  border-radius: 1rem;
  font-weight: 700;
  font-size: 1rem;
}
```
**الاستخدام**: الأزرار الحيوية الرئيسية فقط

### CTA Success — Emerald Green
```css
.cta-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
```
**الاستخدام**: رسائل النجاح، الإنجازات

### Glass Button — شفاف
```css
.glass-button {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
}
```
**الاستخدام**: الأزرار الثانوية

---

## 📐 Typography — الخطوط

### العائلة
```css
font-family: "IBM Plex Sans Arabic", "IBM Plex Sans", system-ui
```

### العناوين
```css
font-family: "Readex Pro", "IBM Plex Sans Arabic", system-ui
```

### ارتفاع السطر
```css
line-height: 1.75 (leading-relaxed)  /* للنصوص */
line-height: 1.3                      /* للعناوين */
```

---

## 🚀 التطبيق العملي

### مثال: بطاقة أداة
```tsx
<div className="bento-block bento-sm">
  <div className="flex items-start gap-4 mb-4">
    <div className="w-14 h-14 rounded-xl flex items-center justify-center"
      style={{
        background: "rgba(45, 212, 191, 0.12)",
        border: "1px solid rgba(45, 212, 191, 0.25)"
      }}
    >
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="text-base font-bold mb-1">{title}</h3>
      <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
        {tagline}
      </p>
    </div>
  </div>
  <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
    {description}
  </p>
</div>
```

---

## 🎨 قواعد التباين (Contrast Rules)

### AA Standard
- العناوين: نسبة تباين 7:1 على الأقل
- النصوص: نسبة تباين 4.5:1 على الأقل

### تقليل الضوضاء البصرية
- العناصر غير النشطة: `rgba(148, 163, 184, 0.45)`
- الحدود: `rgba(255, 255, 255, 0.05)`

---

## 📱 الاستجابة (Responsive)

### نقاط الانقطاع (Breakpoints)
```css
sm: 640px   /* موبايل كبير */
md: 768px   /* تابلت */
lg: 1024px  /* ديسكتوب */
```

### قاعدة Bento Grid
```css
/* موبايل: عمود واحد */
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));

/* تابلت وأكبر: أعمدة متعددة */
@media (min-width: 768px) {
  .bento-md { grid-column: span 2; }
}
```

---

## ✨ الحركات (Animations)

### Cosmic Ease
```css
transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
```

### Hover Effect للبطاقات
```css
transform: translateY(-2px);
box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
```

---

## 🧪 قائمة التحقق (Checklist)

قبل تطبيق التصميم على أي مكون جديد، تأكد من:

- [ ] الخلفية Deep Cosmic Blue (ليست سوداء)
- [ ] استخدام Bento Grid (بدلاً من القوائم)
- [ ] Glassmorphism مع `backdrop-blur-xl`
- [ ] مساحات التنفس: `p-6`, `gap-6` على الأقل
- [ ] التسلسل البصري: Big, Bold, Bright
- [ ] CTA باللون Amber الدافئ
- [ ] التباين AA Standard
- [ ] الخط العربي: IBM Plex Sans Arabic

---

**آخر تحديث**: 2026-02-10
**الحالة**: ✅ تم تطبيقه على Landing Page و App.tsx
