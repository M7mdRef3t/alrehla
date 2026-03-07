
</div>
</section>
<div class="ds-divider"></div>

<!-- SPACING -->
<section class="ds-section" id="spacing">
  <div class="ds-section-title">📐 نظام التباعد — 8px Grid</div>
  <p class="ds-section-sub">كل قيمة تباعد مضاعف للـ 8px. لا استثناءات خارج المقياس.</p>
  <div class="ds-card">
    <div class="sp-row"><div class="sp-label">sp-1 · 8px</div><div class="sp-bar" style="width:8px"></div><span class="type-meta" style="font-size:.7rem">margin صغير، gap ضيق</span></div>
    <div class="sp-row"><div class="sp-label">sp-2 · 16px</div><div class="sp-bar" style="width:16px"></div><span class="type-meta" style="font-size:.7rem">padding داخلي خفيف</span></div>
    <div class="sp-row"><div class="sp-label">sp-3 · 24px</div><div class="sp-bar" style="width:24px"></div><span class="type-meta" style="font-size:.7rem">padding البطاقات الأساسية</span></div>
    <div class="sp-row"><div class="sp-label">sp-4 · 32px</div><div class="sp-bar" style="width:32px"></div><span class="type-meta" style="font-size:.7rem">gap بين المكوّنات</span></div>
    <div class="sp-row"><div class="sp-label">sp-5 · 40px</div><div class="sp-bar" style="width:40px"></div><span class="type-meta" style="font-size:.7rem">sections داخلية</span></div>
    <div class="sp-row"><div class="sp-label">sp-6 · 48px</div><div class="sp-bar" style="width:48px"></div><span class="type-meta" style="font-size:.7rem">section headers</span></div>
    <div class="sp-row"><div class="sp-label">sp-8 · 64px</div><div class="sp-bar" style="width:64px"></div><span class="type-meta" style="font-size:.7rem">padding الصفحات</span></div>
    <div class="sp-row"><div class="sp-label">sp-10 · 80px</div><div class="sp-bar" style="width:80px"></div><span class="type-meta" style="font-size:.7rem">بين أقسام كبيرة</span></div>
    <div class="sp-row"><div class="sp-label">sp-12 · 96px</div><div class="sp-bar" style="width:96px"></div><span class="type-meta" style="font-size:.7rem">hero sections</span></div>
  </div>
</section>
<div class="ds-divider"></div>

<!-- GRID -->
<section class="ds-section" id="grid">
  <div class="ds-section-title">🧱 شبكة 12 عموداً</div>
  <p class="ds-section-sub">شبكة مرنة من 12 عموداً، gap ثابت 8px، max-width 1280px، padding جانبي 24px.</p>
  <div class="grid-demo">
    <div class="grid-col">1</div><div class="grid-col">2</div><div class="grid-col">3</div><div class="grid-col">4</div>
    <div class="grid-col">5</div><div class="grid-col">6</div><div class="grid-col">7</div><div class="grid-col">8</div>
    <div class="grid-col">9</div><div class="grid-col">10</div><div class="grid-col">11</div><div class="grid-col">12</div>
  </div>
  <div style="margin-top:var(--sp-2);display:grid;grid-template-columns:repeat(12,1fr);gap:8px;padding:var(--sp-2);background:var(--c-mid);border-radius:var(--radius)">
    <div style="grid-column:span 4;height:48px;background:rgba(245,166,35,.2);border:1px solid rgba(245,166,35,.4);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.7rem;color:var(--c-amber-500)">span 4</div>
    <div style="grid-column:span 8;height:48px;background:rgba(45,212,191,.1);border:1px solid rgba(45,212,191,.3);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.7rem;color:var(--c-teal-400)">span 8</div>
    <div style="grid-column:span 3;height:48px;background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.3);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.7rem;color:var(--c-violet-400)">span 3</div>
    <div style="grid-column:span 3;height:48px;background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.3);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.7rem;color:var(--c-violet-400)">span 3</div>
    <div style="grid-column:span 6;height:48px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.7rem;color:var(--c-emerald-500)">span 6</div>
  </div>
  <div class="ds-code"><span class="c">/* حاوية الشبكة */</span>
<span class="k">.container</span> {
  max-width: 1280px; margin: 0 auto; padding: 0 24px;
  display: grid; grid-template-columns: repeat(12, 1fr); gap: 8px;
}
<span class="k">@media</span>(max-width: 768px) {
  .container { grid-template-columns: repeat(4, 1fr); padding: 0 16px; }
}
