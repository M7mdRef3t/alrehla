
</div>
</section>
<div class="ds-divider"></div>

<!-- INPUTS -->
<section class="ds-section" id="inputs">
  <div class="ds-section-title">📝 المدخلات — Form Inputs</div>
  <p class="ds-section-sub">حقول نصية، قوائم منسدلة، خانات اختيار، مفاتيح تبديل — كل عنصر بأربع حالات.</p>
  <div class="ds-grid ds-grid-2">
    <div class="ds-card">
      <div class="state-label">النص العادي</div>
      <label class="ds-label">كيف تشعر الآن؟</label>
      <input class="ds-input" type="text" placeholder="اكتب شعورك...">
      <div class="ds-hint">يتم الحفظ تلقائياً</div>
      <div class="state-label" style="margin-top:var(--sp-2)">حالة النجاح</div>
      <input class="ds-input success" type="text" value="رائع — شعور إيجابي">
      <div class="state-label" style="margin-top:var(--sp-2)">حالة الخطأ</div>
      <input class="ds-input error" type="text" value="...">
      <div class="ds-field-error">⚠ هذا الحقل مطلوب</div>
    </div>
    <div class="ds-card">
      <div class="state-label">نص طويل</div>
      <label class="ds-label">ملاحظات الجلسة</label>
      <textarea class="ds-input ds-textarea" placeholder="اكتب ما تريد مشاركته..."></textarea>
      <div class="state-label" style="margin-top:var(--sp-2)">قائمة منسدلة</div>
      <label class="ds-label">مستوى التعافي</label>
      <select class="ds-input ds-select"><option>اليوم الأول</option><option>الأسبوع الأول</option><option>الشهر الأول</option></select>
    </div>
    <div class="ds-card">
      <div class="state-label">بحث</div>
      <div class="ds-search"><span class="ds-search-icon">🔍</span><input class="ds-input" type="text" placeholder="ابحث عن محتوى..."></div>
      <div class="state-label" style="margin-top:var(--sp-2)">خيارات متعددة</div>
      <label class="ds-check"><input type="checkbox" checked> أريد تلقي تذكيرات</label>
      <label class="ds-check" style="margin-top:8px"><input type="checkbox"> الوضع المستمر</label>
      <label class="ds-check" style="margin-top:8px"><input type="radio" name="r" checked> يومي</label>
      <label class="ds-check" style="margin-top:8px"><input type="radio" name="r"> أسبوعي</label>
    </div>
    <div class="ds-card">
      <div class="state-label">مفتاح التبديل</div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <label class="ds-label" style="margin:0">الإشعارات</label>
          <label class="ds-toggle"><input type="checkbox" checked><div class="ds-toggle-track"></div></label>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <label class="ds-label" style="margin:0">الوضع الصامت</label>
          <label class="ds-toggle"><input type="checkbox"><div class="ds-toggle-track"></div></label>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <label class="ds-label" style="margin:0">المشاركة التلقائية</label>
          <label class="ds-toggle"><input type="checkbox" checked><div class="ds-toggle-track"></div></label>
        </div>
      </div>
      <div class="state-label" style="margin-top:var(--sp-2)">شريط التمرير</div>
      <label class="ds-label">مستوى الطاقة</label>
      <input class="ds-slider" type="range" min="0" max="100" value="65">
    </div>
  </div>
</section>
<div class="ds-divider"></div>

<!-- BADGES & CHIPS -->
<section class="ds-section" id="badges">
  <div class="ds-section-title">🏷️ الشارات والعلامات</div>
  <p class="ds-section-sub">شارات الحالة، شرائح التصنيف، نقاط الإشعار — معيار التواصل البصري السريع.</p>
  <div class="ds-card">
    <div class="state-label">شارات الحالة — Status Badges</div>
    <div class="comp-states">
      <span class="ds-badge-sm bs-teal">نشط</span>
      <span class="ds-badge-sm bs-amber">قيد المعالجة</span>
      <span class="ds-badge-sm bs-rose">تحذير</span>
      <span class="ds-badge-sm bs-emerald">مكتمل</span>
      <span class="ds-badge-sm bs-violet">مميز</span>
      <span class="ds-badge-sm bs-neutral">غير نشط</span>
    </div>
    <div class="state-label">شرائح التصنيف — Chips</div>
    <div class="comp-states">
      <span class="chip chip-teal">🌊 تعافي</span>
      <span class="chip chip-amber">⚡ طارئ</span>
      <span class="chip chip-rose">🔴 خطر</span>
      <span class="chip chip-violet">✨ مميز</span>
      <span class="chip chip-emerald">✅ مكتمل</span>
    </div>
    <div class="state-label">شارة الإشعار — Notification</div>
    <div class="comp-states" style="align-items:center">
      <div class="notif-wrap">
        <button class="btn btn-md btn-glass">🔔 الإشعارات</button>
        <div class="notif-dot">3</div>
      </div>
      <div class="notif-wrap" style="margin-right:8px">
        <button class="btn btn-md btn-ghost">✉ الرسائل</button>
        <div class="notif-dot">!</div>
      </div>
    </div>
  </div>
</section>
<div class="ds-divider"></div>

<!-- AVATARS -->
<section class="ds-section" id="avatars">
  <div class="ds-section-title">👤 الصور الرمزية — Avatars</div>
  <p class="ds-section-sub">5 أحجام، مجموعات متداخلة، مؤشر حالة — لتمثيل المستخدمين.</p>
  <div class="ds-card">
    <div class="state-label">الأحجام الخمسة</div>
    <div class="comp-states" style="align-items:center">
      <div class="ds-av av-xl" style="background:linear-gradient(135deg,var(--c-teal-400),var(--c-teal-600));color:#0a0e1f">أح</div>
      <div class="ds-av av-lg" style="background:var(--c-amber-soft);border-color:rgba(245,166,35,.3);color:var(--c-amber-500)">م</div>
      <div class="ds-av av-md" style="background:var(--c-violet-soft);border-color:rgba(167,139,250,.3);color:var(--c-violet-400)">س</div>
      <div class="ds-av av-sm" style="background:var(--c-emerald-soft);border-color:rgba(16,185,129,.3);color:var(--c-emerald-500)">ع</div>
      <div class="ds-av av-xs" style="background:var(--c-rose-soft);border-color:rgba(248,113,113,.3);color:var(--c-rose-400)">ف</div>
    </div>
    <div class="state-label">مع مؤشر الاتصال</div>
    <div class="comp-states" style="align-items:center">
      <div class="ds-av av-md av-online" style="background:linear-gradient(135deg,var(--c-teal-400),var(--c-teal-600));color:#0a0e1f">أح</div>
      <div class="ds-av av-md av-online" style="background:var(--c-violet-soft);color:var(--c-violet-400)">م</div>
    </div>
    <div class="state-label">مجموعة متداخلة</div>
    <div style="display:flex;direction:ltr">
      <div class="ds-av av-md" style="background:linear-gradient(135deg,var(--c-teal-400),var(--c-teal-600));color:#0a0e1f;margin-left:-8px;border-color:var(--c-void)">أ</div>
      <div class="ds-av av-md" style="background:var(--c-amber-soft);color:var(--c-amber-500);margin-left:-8px;border-color:var(--c-void)">م</div>
      <div class="ds-av av-md" style="background:var(--c-violet-soft);color:var(--c-violet-400);margin-left:-8px;border-color:var(--c-void)">س</div>
      <div class="ds-av av-md" style="background:var(--c-mid);color:var(--text-secondary);border-color:var(--c-void)">+5</div>
    </div>
  </div>
</section>
<div class="ds-divider"></div>

<!-- CARDS -->
<section class="ds-section" id="cards">
  <div class="ds-section-title">🃏 البطاقات — Cards</div>
  <p class="ds-section-sub">بطاقة الإحصاء، بطاقة المحتوى، Bento Block — قوالب جاهزة للاستخدام.</p>
  <div class="ds-grid ds-grid-3">
    <div class="stat-card">
      <div style="font-size:1.5rem;margin-bottom:4px">🧠</div>
      <div class="stat-value" style="color:var(--c-teal-400)">94</div>
      <div class="stat-label">نقاط التعافي</div>
      <div class="stat-trend trend-up">↑ +12 هذا الأسبوع</div>
    </div>
    <div class="stat-card">
      <div style="font-size:1.5rem;margin-bottom:4px">🔥</div>
      <div class="stat-value" style="color:var(--c-amber-500)">18</div>
      <div class="stat-label">أيام متتالية</div>
      <div class="stat-trend trend-up">↑ رقم قياسي شخصي!</div>
    </div>
    <div class="stat-card">
      <div style="font-size:1.5rem;margin-bottom:4px">💧</div>
      <div class="stat-value" style="color:var(--c-rose-400)">2</div>
      <div class="stat-label">لحظات صعبة</div>
      <div class="stat-trend trend-down">↓ أقل من الأسبوع الماضي</div>
    </div>
  </div>
  <div style="margin-top:var(--sp-3)">
    <div class="ds-card" style="display:flex;gap:var(--sp-3);align-items:flex-start">
      <div style="width:56px;height:56px;border-radius:var(--radius);background:rgba(45,212,191,.12);border:1px solid rgba(45,212,191,.25);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0">🧘</div>
      <div>
        <div style="font-size:1rem;font-weight:800;margin-bottom:4px">تمرين التنفس العميق</div>
        <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:8px">تقنية علاجية · 5 دقائق</div>
        <p style="font-size:.83rem;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">تمرين مُثبَت علمياً لتهدئة الجهاز العصبي وتقليل الرغبة الآنية. مثالي في لحظات الضغط.</p>
        <div class="comp-states">
          <button class="btn btn-sm btn-primary">ابدأ الآن</button>
          <button class="btn btn-sm btn-glass">خزّن للاحقاً</button>
        </div>
      </div>
    </div>
  </div>
</section>
<div class="ds-divider"></div>

<!-- ALERTS -->
<section class="ds-section" id="alerts">
  <div class="ds-section-title">📢 التنبيهات — Alerts</div>
  <p class="ds-section-sub">4 مستويات تنبيه — معلوماتي، نجاح، تحذير، خطر.</p>
  <div style="display:flex;flex-direction:column;gap:12px">
    <div class="ds-alert alert-info">ℹ <div><strong>معلومة مفيدة</strong> — نقاطك على وشك الانتهاء، جدّد اشتراكك.</div></div>
    <div class="ds-alert alert-success">✅ <div><strong>أحسنت!</strong> — أتممت 7 أيام متتالية في منطقة الأمان.</div></div>
    <div class="ds-alert alert-warning">⚠️ <div><strong>تنبيه</strong> — لاحظنا انخفاض في نشاطك خلال الـ 48 ساعة الماضية.</div></div>
    <div class="ds-alert alert-danger">🚨 <div><strong>لحظة صعبة</strong> — إذا شعرت بخطر حقيقي، اتصل بالدعم الفوري الآن.</div></div>
  </div>
</section>
<div class="ds-divider"></div>

<!-- PROGRESS -->
<section class="ds-section" id="progress">
  <div class="ds-section-title">📊 التقدم — Progress</div>
  <p class="ds-section-sub">أشرطة تقدم متدرجة بحجمين ومع تسميات.</p>
  <div class="ds-card" style="display:flex;flex-direction:column;gap:var(--sp-2)">
    <div><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:.8rem;font-weight:700">نقاط التعافي</span><span style="font-size:.8rem;color:var(--c-teal-400)">94%</span></div><div class="ds-prog-wrap"><div class="ds-prog prog-teal" style="width:94%"></div></div></div>
    <div><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:.8rem;font-weight:700">الأيام المتتالية</span><span style="font-size:.8rem;color:var(--c-amber-500)">60%</span></div><div class="ds-prog-wrap"><div class="ds-prog prog-amber" style="width:60%"></div></div></div>
    <div><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:.8rem;font-weight:700">مستوى الخطر</span><span style="font-size:.8rem;color:var(--c-rose-400)">25%</span></div><div class="ds-prog-wrap"><div class="ds-prog prog-rose" style="width:25%"></div></div></div>
    <div style="margin-top:var(--sp-1)"><div class="ds-prog-wrap" style="height:4px"><div class="ds-prog prog-teal" style="width:78%"></div></div><div style="font-size:.72rem;color:var(--text-muted);margin-top:4px">شريط رفيع — للاستخدام داخل البطاقات</div></div>
  </div>
</section>
<div class="ds-divider"></div>

<!-- TABS -->
<section class="ds-section" id="tabs">
  <div class="ds-section-title">📌 التبويبات — Tabs</div>
  <div class="ds-card">
    <div class="ds-tabs" style="margin-bottom:var(--sp-3)">
      <button class="ds-tab active">اليوم</button>
      <button class="ds-tab">الأسبوع</button>
      <button class="ds-tab">الشهر</button>
      <button class="ds-tab">الكل</button>
    </div>
    <div style="padding:var(--sp-2);background:var(--c-mid);border-radius:var(--radius);font-size:.85rem;color:var(--text-secondary)">محتوى التبويب النشط يظهر هنا — اليوم</div>
    <div class="ds-code" style="margin-top:var(--sp-2)">&lt;<span class="k">div</span> class=<span class="s">"ds-tabs"</span>&gt;
  &lt;<span class="k">button</span> class=<span class="s">"ds-tab active"</span>&gt;اليوم&lt;/button&gt;
  &lt;<span class="k">button</span> class=<span class="s">"ds-tab"</span>&gt;الأسبوع&lt;/button&gt;
&lt;/div&gt;
