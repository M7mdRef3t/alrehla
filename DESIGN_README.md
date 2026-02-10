# 🌌 الرحلة — النظام التصميمي

## 🚀 البدء السريع

### الألوان
```tsx
// الخلفية
style={{ background: "var(--space-void)" }}

// العناوين
style={{ color: "var(--text-primary)" }}

// النصوص
style={{ color: "var(--text-secondary)" }}

// الهامشي
style={{ color: "var(--text-muted)" }}

// CTA
className="cta-primary"

// الأزرار الثانوية
className="glass-button"
```

### البطاقات
```tsx
// بطاقة بسيطة
<div className="bento-block bento-sm">
  {/* محتوى */}
</div>

// بطاقة متوسطة
<div className="bento-block bento-md">
  {/* محتوى */}
</div>
```

### Bento Grid
```tsx
<div className="bento-grid">
  <div className="bento-block bento-sm">{/* 1 */}</div>
  <div className="bento-block bento-sm">{/* 2 */}</div>
  <div className="bento-block bento-md">{/* 3 — عمودين */}</div>
</div>
```

---

## 📚 التوثيق الكامل

- **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** — النظام الكامل مع جميع القواعد
- **[DESIGN_EXAMPLES.md](DESIGN_EXAMPLES.md)** — أمثلة عملية جاهزة للنسخ
- **[VISUAL_OVERHAUL_COMPLETE.md](VISUAL_OVERHAUL_COMPLETE.md)** — ملخص التنفيذ

---

## ✅ القواعد الذهبية

1. ❌ **لا تستخدم القوائم** — استخدم Bento Grid
2. ✅ **مضاعف المسافات** — `gap-6`, `p-6` على الأقل
3. ✅ **خلفية Deep Blue** — ليست سوداء
4. ✅ **CTA بلون Amber** — للأزرار الحيوية
5. ✅ **Big, Bold, Bright** — للعناوين

---

## 🎨 مثال سريع

```tsx
import { Target } from "lucide-react";

function ToolCard() {
  return (
    <div className="bento-block bento-sm">
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(45, 212, 191, 0.12)",
            border: "1px solid rgba(45, 212, 191, 0.25)"
          }}
        >
          <Target className="w-6 h-6" style={{ color: "var(--soft-teal)" }} />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold mb-1">خريطة الدوائر</h3>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            ارسم علاقاتك
          </p>
        </div>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        شوف كل الناس اللي حواليك — مين بيأثر عليك إيجابياً ومين بيستنزف طاقتك.
      </p>
    </div>
  );
}
```

---

**أي سؤال؟** افتح [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
