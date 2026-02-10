# 🎨 أمثلة التطبيق العملي للنظام التصميمي

## 1. بطاقة أداة (Tool Card) — Bento Block

```tsx
<div className="bento-block bento-sm">
  {/* Icon + Title */}
  <div className="flex items-start gap-4 mb-4">
    <div
      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
      style={{
        background: "rgba(45, 212, 191, 0.12)",
        border: "1px solid rgba(45, 212, 191, 0.25)",
        color: "var(--soft-teal)"
      }}
    >
      🎯
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        خريطة الدوائر
      </h3>
      <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
        ارسم علاقاتك
      </p>
    </div>
  </div>

  {/* Description */}
  <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
    شوف كل الناس اللي حواليك — مين بيأثر عليك إيجابياً ومين بيستنزف طاقتك.
  </p>

  {/* Status Badge */}
  <div className="flex items-center gap-2">
    <span
      className="text-xs font-bold rounded-full px-3 py-1"
      style={{
        background: "rgba(45, 212, 191, 0.12)",
        color: "var(--soft-teal)",
        border: "1px solid rgba(45, 212, 191, 0.25)"
      }}
    >
      متاح
    </span>
  </div>
</div>
```

---

## 2. CTA Button — Warm Amber

```tsx
<button
  type="button"
  className="cta-primary px-8 py-4 text-base font-bold"
>
  <span className="flex items-center gap-3">
    ابدأ الرحلة
    <ArrowRight className="w-5 h-5" />
  </span>
</button>
```

**CSS:**
```css
.cta-primary {
  background: linear-gradient(135deg, #f5a623 0%, #d97706 100%);
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(245, 166, 35, 0.3);
}

.cta-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(245, 166, 35, 0.4);
}
```

---

## 3. Glass Button — شفاف

```tsx
<button className="glass-button text-sm font-bold px-6 py-3">
  افتح الأدوات ←
</button>
```

---

## 4. بطاقة شهادة (Testimonial) — Bento Medium

```tsx
<blockquote
  className="bento-block bento-md text-right"
  style={{ borderRight: "3px solid rgba(45, 212, 191, 0.25)" }}
>
  <p className="text-sm leading-relaxed italic mb-4" style={{ color: "var(--text-secondary)" }}>
    "المنصة ساعدتني أفهم نفسي وعلاقاتي بشكل أعمق."
  </p>
  <cite className="flex items-center gap-2 not-italic">
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center"
      style={{
        background: "rgba(45, 212, 191, 0.15)",
        border: "1px solid rgba(45, 212, 191, 0.3)"
      }}
    >
      <Star className="w-4 h-4" style={{ color: "var(--soft-teal)" }} />
    </div>
    <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
      أحمد — مستخدم منذ 3 أشهر
    </span>
  </cite>
</blockquote>
```

---

## 5. بطاقة إشعار (Notification Card)

```tsx
<div
  className="bento-block"
  style={{ borderColor: "rgba(245, 166, 35, 0.25)", padding: "1.5rem" }}
>
  <div className="flex items-start gap-4">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
      style={{
        background: "rgba(245, 166, 35, 0.12)",
        border: "1px solid rgba(245, 166, 35, 0.25)",
        color: "var(--warm-amber)"
      }}
    >
      ✨
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-bold mb-2" style={{ color: "var(--warm-amber)" }}>
        ومضة من الذاكرة
      </h3>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        شعورك دلوقتي بيشبه موقف حصل يوم 15 يناير: كنت مستريح ومركز في شغلك.
      </p>
    </div>
  </div>
</div>
```

---

## 6. Hero Section — Big, Bold, Bright

```tsx
<div className="text-center">
  {/* العنوان الرئيسي */}
  <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-8 tracking-tight"
    style={{ color: "var(--text-primary)" }}
  >
    <span className="block">منصة الرحلة</span>
    <span className="block mt-6 text-base sm:text-lg md:text-xl font-semibold"
      style={{ color: "var(--soft-teal)" }}
    >
      عشان تفهم نفسك وعلاقاتك من جديد
    </span>
  </h1>

  {/* CTA */}
  <button className="cta-primary px-8 py-4 text-base font-bold">
    ابدأ الرحلة الآن
  </button>
</div>
```

---

## 7. Bento Grid Layout — 3 أعمدة

```tsx
<div className="bento-grid">
  {/* كتلة صغيرة 1 */}
  <div className="bento-block bento-sm">
    {/* محتوى */}
  </div>

  {/* كتلة صغيرة 2 */}
  <div className="bento-block bento-sm">
    {/* محتوى */}
  </div>

  {/* كتلة صغيرة 3 */}
  <div className="bento-block bento-sm">
    {/* محتوى */}
  </div>

  {/* كتلة متوسطة — تأخذ عمودين */}
  <div className="bento-block bento-md">
    {/* محتوى */}
  </div>
</div>
```

**CSS:**
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem; /* gap-6 */
}

@media (min-width: 640px) {
  .bento-grid {
    gap: 2rem; /* gap-8 */
  }
}
```

---

## 8. Badge — Success

```tsx
<span
  className="px-3 py-1.5 text-xs font-bold rounded-full"
  style={{
    background: "rgba(16, 185, 129, 0.12)",
    color: "var(--soft-emerald)",
    border: "1px solid rgba(16, 185, 129, 0.25)"
  }}
>
  ✓ تم الإنجاز
</span>
```

---

## 9. Icon Container — Teal

```tsx
<div
  className="w-12 h-12 rounded-xl flex items-center justify-center"
  style={{
    background: "rgba(45, 212, 191, 0.12)",
    border: "1px solid rgba(45, 212, 191, 0.25)"
  }}
>
  <Target className="w-6 h-6" style={{ color: "var(--soft-teal)" }} />
</div>
```

---

## 10. Modal Header — مع إغلاق

```tsx
<div className="bento-block" style={{ padding: "2rem" }}>
  <div className="flex items-start justify-between mb-6">
    <div className="flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{
          background: "rgba(45, 212, 191, 0.12)",
          border: "1px solid rgba(45, 212, 191, 0.25)"
        }}
      >
        🎯
      </div>
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          عنوان المودال
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          وصف قصير للمحتوى
        </p>
      </div>
    </div>
    <button
      className="glass-button w-10 h-10 rounded-full p-0 flex items-center justify-center"
      aria-label="إغلاق"
    >
      <X className="w-5 h-5" />
    </button>
  </div>

  {/* محتوى المودال */}
</div>
```

---

## 11. قائمة نقاط (Feature List) — بدون قائمة تقليدية

❌ **لا تستخدم:**
```tsx
<ul>
  <li>النقطة 1</li>
  <li>النقطة 2</li>
</ul>
```

✅ **استخدم Bento Grid:**
```tsx
<div className="bento-grid">
  <div className="bento-block bento-sm">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm leading-relaxed">النقطة 1</p>
      </div>
    </div>
  </div>

  <div className="bento-block bento-sm">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm leading-relaxed">النقطة 2</p>
      </div>
    </div>
  </div>
</div>
```

---

## 12. Cosmic Glow Effect — خلفية متحركة

```tsx
<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
  <motion.div
    className="w-[600px] h-[600px] rounded-full"
    style={{
      background: "radial-gradient(circle at center, rgba(45, 212, 191, 0.15), rgba(139, 92, 246, 0.1) 45%, transparent 70%)",
      filter: "blur(80px)"
    }}
    animate={{
      scale: [1, 1.1, 1],
      opacity: [0.7, 0.9, 0.7]
    }}
    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
  />
</div>
```

---

## 📝 ملاحظات التطبيق

### 1. المسافات
دائماً استخدم:
- `gap-6` أو `gap-8` بين العناصر
- `p-6` أو `p-8` داخل البطاقات
- `mb-4` أو `mb-6` بين الفقرات

### 2. الألوان
- **العناوين**: `var(--text-primary)`
- **النصوص**: `var(--text-secondary)`
- **الهامشي**: `var(--text-muted)`
- **الروابط**: `var(--soft-teal)`
- **CTA**: `var(--warm-amber)`

### 3. الحدود
- حد رفيع: `1px solid rgba(255, 255, 255, 0.05)`
- حد واضح: `1px solid rgba(45, 212, 191, 0.25)`
- حد دافئ: `1px solid rgba(245, 166, 35, 0.25)`

### 4. Hover States
```css
transform: translateY(-2px);
box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
border-color: rgba(255, 255, 255, 0.1);
```

---

**آخر تحديث**: 2026-02-10
