<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>الرحلة — Brand Identity Book 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box }
:root {
    --void:#0a0e1f; --deep:#131a35; --mid:#1a2242; --nebula:#212b4f; --aurora:#2a3560;
    --teal:#2dd4bf; --teal-d:#0d9488; --amber:#f5a623; --amber-d:#d97706;
    --emerald:#10b981; --rose:#f87171; --violet:#a78bfa; --sky:#38bdf8;
    --text:#f1f5f9; --muted:#94a3b8; --dim:rgba(148, 163, 184, .45);
    --border:rgba(255, 255, 255, .07); --border2:rgba(255, 255, 255, .13);
    --glass:rgba(15, 23, 42, .6);
    --ease:cubic-bezier(.22, 1, .36, 1);
    --font:'Almarai', 'IBM Plex Sans Arabic', system-ui;
}
html { scroll-behavior:smooth }
body { background:var(--void); color:var(--text); font-family:var(--font); line-height:1.75; -webkit-font-smoothing:antialiased }

/* NAV */
.nav { position:fixed; top:0; right:0; width:240px; height:100vh; background:var(--deep); border-left:1px solid var(--border); overflow-y:auto; padding:20px; z-index:100 }
.nav-logo { font-size:1.2rem; font-weight:800; background:linear-gradient(135deg, var(--teal), var(--amber)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:4px }
.nav-sub { font-size:.65rem; color:var(--dim); letter-spacing:.1em; text-transform:uppercase; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--border) }
.nav h3 { font-size:.6rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--dim); margin:16px 0 6px }
.nav ul { list-style:none }
.nav li a { display:block; padding:4px 10px; border-radius:6px; font-size:.75rem; color:var(--muted); text-decoration:none; transition:all .2s }
.nav li a:hover { background:var(--border); color:var(--text) }

/* MAIN */
.main { margin-right:240px; max-width:960px }

/* PAGE */
.page { min-height:100vh; padding:80px 60px; border-bottom:1px solid var(--border); position:relative }
.page-num { position:absolute; top:32px; left:60px; font-size:.65rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--dim) }
.page-label { position:absolute; top:32px; right:60px; font-size:.65rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--dim) }

/* COVER */
.cover { display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end; background:radial-gradient(ellipse at 70% 30%, rgba(45, 212, 191, .12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(245, 166, 35, .08) 0%, transparent 50%), var(--void) }
.cover-eyebrow { font-size:.7rem; font-weight:700; letter-spacing:.15em; text-transform:uppercase; color:var(--teal); margin-bottom:16px }
.cover-title { font-size:clamp(3rem, 7vw, 5.5rem); font-weight:800; letter-spacing:-.04em; line-height:1; margin-bottom:8px; background:linear-gradient(135deg, var(--text) 40%, var(--teal)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text }
.cover-sub { font-size:1.1rem; color:var(--muted); margin-bottom:40px; max-width:400px; line-height:1.6 }
.cover-meta { font-size:.75rem; color:var(--dim); border-top:1px solid var(--border); padding-top:20px; display:flex; gap:40px; width:100% }
.cover-circle { position:absolute; top:60px; left:60px; width:280px; height:280px; border-radius:50%; border:1px solid rgba(45, 212, 191, .15); display:flex; align-items:center; justify-content:center }
.cover-circle::before { content:''; position:absolute; width:200px; height:200px; border-radius:50%; border:1px solid rgba(45, 212, 191, .1) }
.cover-circle::after { content:''; position:absolute; width:120px; height:120px; border-radius:50%; border:1px solid rgba(45, 212, 191, .2) }
.cover-dot { width:16px; height:16px; border-radius:50%; background:var(--teal); box-shadow:0 0 24px rgba(45, 212, 191, .6) }

/* SECTION TITLES */
.sec-title { font-size:2rem; font-weight:800; letter-spacing:-.03em; margin-bottom:8px }
.sec-desc { color:var(--muted); margin-bottom:40px; max-width:560px; font-size:.9rem }
.sec-eyebrow { font-size:.65rem; font-weight:700; letter-spacing:.15em; text-transform:uppercase; color:var(--teal); margin-bottom:12px }

/* CARDS */
.card { background:var(--glass); backdrop-filter:blur(20px); border:1px solid var(--border); border-radius:16px; padding:28px }
.grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:20px }
.grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px }
.gap-sm { gap:12px }

/* ARCHETYPE */
.arch-card { border-radius:16px; padding:28px; border:1px solid var(--border2); position:relative; overflow:hidden }
.arch-icon { font-size:3rem; margin-bottom:12px }
.arch-name { font-size:1.3rem; font-weight:800; margin-bottom:6px }
.arch-desc { font-size:.83rem; color:var(--muted); line-height:1.65 }
.arch-traits { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px }
.trait { padding:3px 10px; border-radius:99px; font-size:.7rem; font-weight:700; border:1px solid }

/* VOICE */
.voice-row { display:grid; grid-template-columns:120px 1fr 1fr; gap:16px; padding:16px 0; border-bottom:1px solid var(--border); align-items:start }
.voice-dim { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--dim) }
.voice-col { font-size:.83rem; color:var(--muted); line-height:1.6 }
.voice-col strong { display:block; color:var(--text); font-weight:700; margin-bottom:4px }

/* MESSAGE ARCH */
.msg-level { padding:20px; border-radius:12px; margin-bottom:12px; border:1px solid }
.lvl-tag { font-size:.6rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; margin-bottom:6px }
.lvl-text { font-size:1rem; font-weight:700; line-height:1.4 }
.lvl-desc { font-size:.78rem; color:var(--muted); margin-top:6px }

/* LOGO */
.logo-svg-wrap { padding:40px; border-radius:16px; display:flex; align-items:center; justify-content:center; min-height:200px; border:1px solid var(--border) }
.logo-dir-num { font-size:.65rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--dim); margin-bottom:8px }
.logo-dir-name { font-size:1rem; font-weight:800; margin-bottom:4px }
.logo-dir-rationale { font-size:.78rem; color:var(--muted); line-height:1.55 }

/* COLOR SWATCHES */
.swatch-lg { height:120px; border-radius:12px 12px 0 0 }
.swatch-info { padding:16px; background:var(--mid); border-radius:0 0 12px 12px; border:1px solid var(--border); border-top:none }
.swatch-name { font-size:.85rem; font-weight:800; margin-bottom:4px }
.swatch-vals { font-size:.68rem; font-family:monospace; color:var(--muted); line-height:1.7 }
.swatch-role { font-size:.7rem; color:var(--dim); margin-top:6px; font-style:italic }

.palette-row { display:flex; gap:4px; border-radius:12px; overflow:hidden; height:48px; margin-bottom:8px }
.palette-chip { flex:1 }

/* TYPOGRAPHY SPECIMEN */
.type-specimen { padding:32px; border-radius:16px; background:var(--mid); border:1px solid var(--border); margin-bottom:16px }
.spec-meta { font-size:.68rem; font-family:monospace; color:var(--dim); border-top:1px solid var(--border); padding-top:12px; margin-top:16px }

/* IMAGE STYLE */
.img-principle { padding:20px; border-radius:12px; border:1px solid var(--border) }
.img-icon { font-size:2rem; margin-bottom:10px }
.img-name { font-weight:800; margin-bottom:6px }
.img-desc { font-size:.8rem; color:var(--muted); line-height:1.6 }

/* MOCKUP */
.mockup-phone { width:180px; height:360px; border-radius:28px; border:2px solid var(--border2); background:var(--deep); margin:0 auto; overflow:hidden; position:relative }
.mockup-screen { padding:20px 14px; height:100% }
.mockup-status { display:flex; justify-content:space-between; font-size:.55rem; color:var(--dim); margin-bottom:16px }

/* APPLICATION CARDS */
.app-card { border-radius:16px; overflow:hidden; border:1px solid var(--border) }
.app-card-header { padding:20px; font-size:.72rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--dim); background:var(--mid); border-bottom:1px solid var(--border) }
.app-card-body { padding:24px }

/* TABLE */
.brand-table { width:100%; border-collapse:collapse; font-size:.8rem }
.brand-table th { text-align:right; padding:10px 12px; font-size:.65rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--dim); border-bottom:1px solid var(--border) }
.brand-table td { padding:10px 12px; border-bottom:1px solid var(--border); color:var(--muted) }
.brand-table tr:last-child td { border:none }

/* DIVIDER */
.rule { height:1px; background:var(--border); margin:32px 0 }

/* PILL */
.pill { display:inline-flex; align-items:center; padding:3px 12px; border-radius:99px; font-size:.7rem; font-weight:700; border:1px solid }
.pill-teal { color:var(--teal); border-color:rgba(45, 212, 191, .3); background:rgba(45, 212, 191, .08) }
.pill-amber { color:var(--amber); border-color:rgba(245, 166, 35, .3); background:rgba(245, 166, 35, .08) }
.pill-violet { color:var(--violet); border-color:rgba(167, 139, 250, .3); background:rgba(167, 139, 250, .08) }

/* SCROLLBAR */
::-webkit-scrollbar { width:5px }
::-webkit-scrollbar-track { background:var(--deep) }
::-webkit-scrollbar-thumb { background:var(--aurora); border-radius:3px }

@media(max-width:900px) { .main { margin-right:0 }.nav{ position:static; width:100%; height:auto; border:none; border-bottom:1px solid var(--border) }.page { padding:48px 24px }.grid-2, .grid-3 { grid-template-columns:1fr }.cover-circle { display:none }.voice-row { grid-template-columns:1fr } }
</style>
</head>
<body>

<!-- NAV -->
<nav class="nav">
<div class="nav-logo">الرحلة</div>
<div class="nav-sub">Brand Identity Book · 2026</div>
<h3>الاستراتيجية</h3>
<ul>
<li><a href="#cover">الغلاف</a></li>
<li><a href="#story">قصة العلامة</a></li>
<li><a href="#archetype">النموذج الأصلي</a></li>
<li><a href="#voice">مصفوفة الصوت</a></li>
<li><a href="#messages">هيكل الرسائل</a></li>
</ul>
<h3>الهوية البصرية</h3>
<ul>
<li><a href="#logo">الشعار — 3 اتجاهات</a></li>
<li><a href="#logo-usage">قواعد الشعار</a></li>
<li><a href="#colors">نظام الألوان</a></li>
<li><a href="#typography">الطباعة</a></li>
<li><a href="#imagery">أسلوب الصور</a></li>
</ul>
<h3>التطبيقات</h3>
<ul>
<li><a href="#digital">رقمي</a></li>
<li><a href="#print">مطبوع</a></li>
<li><a href="#motion">حركة</a></li>
<li><a href="#index">فهرس المحتوى</a></li>
</ul>
</nav>

<main class="main">
<!-- P1: COVER -->
<section class="page cover" id="cover" style="min-height:100vh">
<div class="cover-circle">
<div class="cover-dot"></div>
</div>
<div class="page-num">01 / 20</div>
<div style="position:relative;z-index:2">
<div class="cover-eyebrow">Brand Identity Book</div>
<div class="cover-title">الرحلة</div>
<div class="cover-sub">هوية بصرية كاملة لمنصة هندسة الوعي والنمو الشخصي</div>
<div class="cover-meta">
<div><div style="font-weight:700;color:var(--text);margin-bottom:2px">الإصدار</div>v1.0.0 — 2026</div>
<div><div style="font-weight:700;color:var(--text);margin-bottom:2px">المجال</div>Consciousness Architecture</div>
<div><div style="font-weight:700;color:var(--text);margin-bottom:2px">المديرية الإبداعية</div>Pentagram-Standard</div>
</div>
</div>
</section>

<!-- P2: BRAND STORY -->
<section class="page" id="story">
<div class="page-num">02 / 20</div>
<div class="page-label">Brand Strategy</div>
<div class="sec-eyebrow">قصة العلامة — Brand Story</div>
<div class="sec-title">من الكلام إلى المكان</div>
<p class="sec-desc">كل إنسان يحمل داخله خريطة غير مرئية لعلاقاته — الرحلة تجعلها مرئية.</p>

<div class="grid-2" style="margin-bottom:24px">
<div class="card">
<div style="font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-bottom:12px">المشكلة — The Problem</div>
<p style="font-size:.9rem;line-height:1.75;color:var(--muted)">الإنسان المعاصر يفهم نفسياً أكثر من أي وقت مضى — لكنه يطبّق أقل. تخمة المعلومات، ثقل التحليل، وإرهاق العلاقات يسرق منه الحضور ويشلّ قدرته على القرار.</p>
</div>
<div class="card">
<div style="font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-bottom:12px">الحل — The Solution</div>
<p style="font-size:.9rem;line-height:1.75;color:var(--muted)">الرحلة لا تشرح ولا تشخّص — تُجسّد. تحوّل العلاقات من مفاهيم نظرية إلى نقاط على خريطة شخصية. "شوف نفسك" ليست استعارة، بل ميكانيزم.</p>
</div>
</div>

<div class="card" style="background:linear-gradient(135deg,rgba(45,212,191,.06),rgba(245,166,35,.06));border-color:rgba(45,212,191,.2)">
<div style="font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--teal);margin-bottom:16px">الجوهر — Brand Essence</div>
<div style="font-size:1.5rem;font-weight:800;letter-spacing:-.02em;line-height:1.3;margin-bottom:12px">"أنت المركز.<br>كل حد تضعه هو فعل وعي."</div>
<p style="font-size:.85rem;color:var(--muted);max-width:500px;line-height:1.7">الرحلة ليست وجهة — هي طريقة رؤية. علامة تجارية تؤمن أن الوضوح البصري هو أقصر مسار بين الفهم والتغيير.</p>
</div>

<div class="rule"></div>

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
<div>
<div style="font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--amber);margin-bottom:8px">الرؤية — Vision</div>
<p style="font-size:.82rem;color:var(--muted);line-height:1.65">عالم يستعيد فيه كل إنسان سيادته على مساحته الداخلية.</p>
</div>
<div>
<div style="font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--teal);margin-bottom:8px">الرسالة — Mission</div>
<p style="font-size:.82rem;color:var(--muted);line-height:1.65">تحويل الوعي النفسي من تحليل مُرهِق إلى أداة قرار فعّالة.</p>
</div>
<div>
<div style="font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--violet);margin-bottom:8px">القيم — Values</div>
<p style="font-size:.82rem;color:var(--muted);line-height:1.65">الوضوح · الهدوء · السيادة الشخصية · اللا-حكم · الفعل</p>
</div>
</div>
</section>

<!-- P3: ARCHETYPE -->
<section class="page" id="archetype">
<div class="page-num">03 / 20</div>
<div class="page-label">Brand Strategy</div>
<div class="sec-eyebrow">النموذج الأصلي — Brand Archetype</div>
<div class="sec-title">الحكيم + المصلح</div>
<p class="sec-desc">الرحلة تجمع بين إنارة العقل (الحكيم) ودفع التغيير الفعلي (المصلح) — مزيج نادر في فضاء الصحة النفسية الرقمي.</p>

<div class="grid-2" style="margin-bottom:24px">
<div class="arch-card" style="background:linear-gradient(135deg,rgba(45,212,191,.08),rgba(45,212,191,.03))">
<div class="arch-icon">🦉</div>
<div class="arch-name">الحكيم — The Sage</div>
<div class="arch-desc">يؤمن أن الفهم الحقيقي يحرر. لا يبسّط، لا يبالغ، لا يعد بالسحر. يمنح الأدوات ويثق بعقل المستخدم.</div>
<div class="arch-traits">
<span class="trait" style="color:var(--teal);border-color:rgba(45,212,191,.3);background:rgba(45,212,191,.08)">وضوح</span>
<span class="trait" style="color:var(--teal);border-color:rgba(45,212,191,.3);background:rgba(45,212,191,.08)">أمانة</span>
<span class="trait" style="color:var(--teal);border-color:rgba(45,212,191,.3);background:rgba(45,212,191,.08)">عمق</span>
<span class="trait" style="color:var(--teal);border-color:rgba(45,212,191,.3);background:rgba(45,212,191,.08)">هدوء</span>
</div>
</div>
<div class="arch-card" style="background:linear-gradient(135deg,rgba(245,166,35,.08),rgba(245,166,35,.03))">
<div class="arch-icon">⚡</div>
<div class="arch-name">المصلح — The Ruler</div>
<div class="arch-desc">يحوّل الفهم إلى فعل. يعطي المستخدم أدوات عملية وبروتوكولات جاهزة. لا يتوقف عند التحليل — يدفع للقرار.</div>
<div class="arch-traits">
<span class="trait" style="color:var(--amber);border-color:rgba(245,166,35,.3);background:rgba(245,166,35,.08)">فعل</span>
<span class="trait" style="color:var(--amber);border-color:rgba(245,166,35,.3);background:rgba(245,166,35,.08)">سيادة</span>
<span class="trait" style="color:var(--amber);border-color:rgba(245,166,35,.3);background:rgba(245,166,35,.08)">ثقة</span>
<span class="trait" style="color:var(--amber);border-color:rgba(245,166,35,.3);background:rgba(245,166,35,.08)">حزم</span>
</div>
</div>
</div>

<div class="card">
<div style="font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-bottom:20px">مقارنة تشخيصية — Archetype Matrix</div>
<table class="brand-table">
<thead><tr><th>البُعد</th><th>الحكيم (60 % )</th><th>المصلح (40 % )</th><th>ليس الرحلة</th></tr></thead>
<tbody>
<tr><td>الرسالة الجوهرية</td><td>افهم نفسك بعمق</td><td>غيّر الآن فعلياً</td><td>ستكون بخير قريباً</td></tr>
<tr><td>ردّ الفعل على الأزمة</td><td>رؤية واضحة للواقع</td><td>بروتوكول فوري</td><td>واجه مشاعرك</td></tr>
<tr><td>العلاقة بالمستخدم</td><td>يثق بعقله</td><td>يدعم قراره</td><td>يوجّهه من فوق</td></tr>
<tr><td>نبرة الطوارئ</td><td>وضوح هادئ</td><td>أوامر قصيرة</td><td>تعاطف مطوّل</td></tr>
</tbody>
</table>
</div>
</section>

<!-- P4: VOICE -->
<section class="page" id="voice">
<div class="page-num">04 / 20</div>
<div class="page-label">Brand Strategy</div>
<div class="sec-eyebrow">مصفوفة الصوت — Voice & Tone Matrix</div>
<div class="sec-title">الصوت ثابت، النبرة تتكيّف</div>
<p class="sec-desc">الرحلة دائماً هادئة وواضحة ومباشرة — لكن مستوى الإلحاح يتغير حسب السياق.</p>

<div class="card" style="margin-bottom:20px">
<div class="voice-row" style="border-top:1px solid var(--border)">
<div class="voice-dim">السياق</div>
<div class="voice-dim">مثال ✅ نعم</div>
<div class="voice-dim">مثال ❌ اجتنب</div>
</div>
<div class="voice-row">
<div><div style="font-weight:800;font-size:.85rem;margin-bottom:2px">🌱 Onboarding</div><div class="voice-dim">هادئ · مرحّب · واضح</div></div>
<div class="voice-col"><strong>خذ وقتك. مفيش إجابة غلط.</strong>"إيه أكتر حاجة مرهقاك دلوقتي؟"</div>
<div class="voice-col"><strong style="color:var(--rose)">لا.</strong>"أهلاً وسهلاً! ابدأ رحلتك الشخصية نحو الصحة النفسية!"</div>
</div>
<div class="voice-row">
<div><div style="font-weight:800;font-size:.85rem;margin-bottom:2px">💫 Daily check</div><div class="voice-dim">فضولي · بلا حكم</div></div>
<div class="voice-col"><strong>جسمك عارف قبلك.</strong>"بعد التعامل مع ده… بتتقل؟"</div>
<div class="voice-col"><strong style="color:var(--rose)">لا.</strong>"هل تشعر أن هذه العلاقة غير صحية وتؤثر سلباً على صحتك؟"</div>
</div>
<div class="voice-row">
<div><div style="font-weight:800;font-size:.85rem;margin-bottom:2px">⚡ Insight</div><div class="voice-dim">ملاحظة · لا حكم</div></div>
<div class="voice-col"><strong>ده توصيف… مش حكم.</strong>"في شخص قريب منك… بس جسمك مش مرتاح."</div>
<div class="voice-col"><strong style="color:var(--rose)">لا.</strong>"يبدو أن هذه علاقة سامة ويجب عليك إنهاؤها."</div>
</div>
<div class="voice-row">
<div><div style="font-weight:800;font-size:.85rem;margin-bottom:2px">🚨 Emergency</div><div class="voice-dim">حازم · فوري · قصير</div></div>
<div class="voice-col"><strong>وقف. اخرج. ده مش دورك.</strong>"حركة جسدية → خروج هادي"</div>
<div class="voice-col"><strong style="color:var(--rose)">لا.</strong>"نفهم أنك تمر بوقت صعب. حاول أن تتنفس وتسترخي وتتذكر أن هذا أيضاً سيمر."</div>
</div>
<div class="voice-row">
<div><div style="font-weight:800;font-size:.85rem;margin-bottom:2px">🏆 Success</div><div class="voice-dim">احتفاء هادئ</div></div>
<div class="voice-col"><strong>خطوة حقيقية.</strong>"18 يوم. مش رقم — نمط جديد."</div>
<div class="voice-col"><strong style="color:var(--rose)">لا.</strong>"رائع جداً! أنت بطل! استمر في هذا الإنجاز المذهل! 🎉🎉🎉"</div>
</div>
</div>

<div class="grid-3">
<div style="padding:16px;border-radius:12px;border:1px solid var(--border)">
<div style="font-weight:800;margin-bottom:8px;color:var(--teal)">الكلمات المحظورة</div>
<div style="font-size:.78rem;color:var(--muted);line-height:2">لازم/المفروض<br>صح وغلط<br>سام / اضطراب<br>شفاء / استحقاق<br>طفولة / صدمة<br>يجب عليك</div>
</div>
<div style="padding:16px;border-radius:12px;border:1px solid var(--border)">
<div style="font-weight:800;margin-bottom:8px;color:var(--amber)">الكلمات المفضّلة</div>
<div style="font-size:.78rem;color:var(--muted);line-height:2">توصيف / مش حكم<br>جسمك عارف<br>مساحتك / حدّك<br>خيار / قرار<br>هادي / واضح<br>وقف / اخرج</div>
</div>
<div style="padding:16px;border-radius:12px;border:1px solid var(--border)">
<div style="font-weight:800;margin-bottom:8px;color:var(--violet)">قواعد الجملة</div>
<div style="font-size:.78rem;color:var(--muted);line-height:2">سطر أو سطرين فقط<br>لا نصايح مباشرة<br>لا شرح نظري<br>فعل الطوارئ = أوامر<br>اللغة العامية المصرية<br>بلا علامات تعجب زائدة</div>
</div>
</div>
</section>

<!-- P5: MESSAGES -->
<section class="page" id="messages">
<div class="page-num">05 / 20</div>
<div class="page-label">Brand Strategy</div>
<div class="sec-eyebrow">هيكل الرسائل — Message Architecture</div>
<div class="sec-title">من الجوهر إلى السطح</div>
<p class="sec-desc">ثلاثة مستويات من الرسائل — كل مستوى يندمج في التالي. الطبقة الأعمق تحرك الطبقات الأعلى.</p>

<div class="msg-level" style="background:linear-gradient(135deg,rgba(45,212,191,.1),rgba(45,212,191,.04));border-color:rgba(45,212,191,.3)">
<div class="lvl-tag" style="color:var(--teal)">المستوى 1 — الجوهر (Core Truth)</div>
<div class="lvl-text">"أنت المركز. ليس الآخرون."</div>
<div class="lvl-desc">رسالة لا تُقال مباشرة — لكنها خلف كل تصميم وكل تفاعل. التصرّف من هذا الجوهر يُشعل باقي الرسائل.</div>
</div>

<div class="msg-level" style="background:rgba(167,139,250,.06);border-color:rgba(167,139,250,.2)">
<div class="lvl-tag" style="color:var(--violet)">المستوى 2 — وعد العلامة (Brand Promise)</div>
<div class="lvl-text">"مش محتاج تفهم أكتر — محتاج تشوف نفسك."</div>
<div class="lvl-desc">رسالة للجمهور المباشر. تُحدّد التمايز وتكسر توقع التحليل التقليدي. تُستخدم في Landing، Onboarding، وال pitch.</div>
</div>

<div class="msg-level" style="background:rgba(245,166,35,.06);border-color:rgba(245,166,35,.2)">
<div class="lvl-tag" style="color:var(--amber)">المستوى 3 — رسائل المنتج (Product Messages)</div>
<div class="lvl-text">"كل علاقة ليها مكان. شوف مين قريب فعلاً."</div>
<div class="lvl-desc">رسائل محددة لكل ميزة — تُترجم الوعد الأكبر إلى أفعال صغيرة داخل التطبيق.</div>
</div>

<div class="msg-level" style="background:rgba(248,113,113,.06);border-color:rgba(248,113,113,.2)">
<div class="lvl-tag" style="color:var(--rose)">المستوى 4 — رسائل الطوارئ (Crisis Messages)</div>
<div class="lvl-text">"وقف. مش دورك دلوقتي. اخرج هادي."</div>
<div class="lvl-desc">رسائل ذات نبرة مختلفة — قصيرة، حازمة، محبة. تُستخدم حصراً في بروتوكول الطوارئ. لا تشبه باقي النبرات.</div>
</div>

<div class="rule"></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
<div style="padding:16px;border-radius:12px;border:1px solid var(--border);text-align:center">
<div style="font-size:1.8rem;font-weight:800;color:var(--teal);letter-spacing:-.03em">7</div>
<div style="font-size:.72rem;color:var(--muted)">كلمات في الـ tagline الأساسي</div>
</div>
<div style="padding:16px;border-radius:12px;border:1px solid var(--border);text-align:center">
<div style="font-size:1.8rem;font-weight:800;color:var(--amber);letter-spacing:-.03em">3</div>
<div style="font-size:.72rem;color:var(--muted)">كلمات في رسالة الطوارئ كحد أقصى</div>
</div>
<div style="padding:16px;border-radius:12px;border:1px solid var(--border);text-align:center">
<div style="font-size:1.8rem;font-weight:800;color:var(--violet);letter-spacing:-.03em">0</div>
<div style="font-size:.72rem;color:var(--muted)">مرات استخدام كلمة "علاج" أو "تشخيص"</div>
</div>
</div>
</section>
