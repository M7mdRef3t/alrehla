$out = "c:\Users\moham\Downloads\alrehla\design\design-system.html"
$html = @'
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>الرحلة — Design System v1.0</title>
<link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{
--c-void:#0a0e1f;--c-950:#0f1629;--c-deep:#131a35;--c-mid:#1a2242;--c-nebula:#212b4f;--c-aurora:#2a3560;
--c-teal-400:#2dd4bf;--c-teal-500:#14b8a6;--c-teal-600:#0d9488;
--c-amber-500:#f5a623;--c-amber-600:#d97706;--c-amber-soft:rgba(245,166,35,.12);--c-amber-glow:rgba(245,166,35,.25);
--c-emerald-500:#10b981;--c-emerald-600:#059669;--c-emerald-soft:rgba(16,185,129,.12);
--c-rose-400:#f87171;--c-rose-soft:rgba(248,113,113,.12);
--c-violet-400:#a78bfa;--c-violet-soft:rgba(167,139,250,.12);
--c-sky-400:#38bdf8;--c-sky-soft:rgba(56,189,248,.12);
--text-primary:#f1f5f9;--text-secondary:#94a3b8;--text-muted:rgba(148,163,184,.5);
--border:rgba(255,255,255,.07);--border-hover:rgba(255,255,255,.14);
--glass:rgba(15,23,42,.6);--glass-hover:rgba(15,23,42,.8);
--radius-sm:.5rem;--radius:.75rem;--radius-lg:1.25rem;--radius-xl:1.75rem;--radius-full:9999px;
--shadow-sm:0 2px 8px rgba(0,0,0,.3);--shadow:0 4px 24px rgba(0,0,0,.4);--shadow-lg:0 12px 48px rgba(0,0,0,.5);
--ease:cubic-bezier(.22,1,.36,1);--dur:.25s;
--sp-1:8px;--sp-2:16px;--sp-3:24px;--sp-4:32px;--sp-5:40px;--sp-6:48px;--sp-8:64px;--sp-10:80px;--sp-12:96px;
--font-sans:'Almarai','IBM Plex Sans Arabic',system-ui,sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--c-void);color:var(--text-primary);font-family:var(--font-sans);font-size:16px;line-height:1.75;-webkit-font-smoothing:antialiased}
a{color:var(--c-teal-400);text-decoration:none}
/* NAV */
.ds-nav{position:fixed;top:0;right:0;width:260px;height:100vh;background:var(--c-deep);border-left:1px solid var(--border);overflow-y:auto;padding:var(--sp-3);z-index:100}
.ds-nav h2{font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted);margin-bottom:var(--sp-2);padding-bottom:var(--sp-1);border-bottom:1px solid var(--border)}
.ds-nav ul{list-style:none;margin-bottom:var(--sp-3)}
.ds-nav li a{display:block;padding:5px 10px;border-radius:var(--radius-sm);font-size:.8rem;color:var(--text-secondary);transition:all var(--dur) var(--ease)}
.ds-nav li a:hover{background:var(--border);color:var(--text-primary)}
/* MAIN */
.ds-main{margin-right:260px;padding:var(--sp-8) var(--sp-6)}
/* HERO */
.ds-hero{text-align:center;padding:var(--sp-12) 0 var(--sp-8);border-bottom:1px solid var(--border);margin-bottom:var(--sp-8)}
.ds-hero h1{font-size:clamp(2.5rem,6vw,4.5rem);font-weight:800;letter-spacing:-.04em;background:linear-gradient(135deg,var(--c-teal-400),var(--c-amber-500));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.ds-hero p{color:var(--text-secondary);font-size:1.1rem;margin-top:var(--sp-2)}
.ds-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:var(--c-teal-soft,rgba(45,212,191,.1));border:1px solid rgba(45,212,191,.3);border-radius:var(--radius-full);font-size:.75rem;font-weight:700;color:var(--c-teal-400);margin-bottom:var(--sp-3)}
/* SECTION */
.ds-section{margin-bottom:var(--sp-12)}
.ds-section-title{font-size:1.75rem;font-weight:800;letter-spacing:-.03em;margin-bottom:.5rem;display:flex;align-items:center;gap:.5rem}
.ds-section-sub{color:var(--text-secondary);font-size:.9rem;margin-bottom:var(--sp-4)}
.ds-divider{height:1px;background:var(--border);margin:var(--sp-6) 0}
/* CARDS / GLASS */
.ds-card{background:var(--glass);backdrop-filter:blur(24px);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--sp-3);transition:all var(--dur) var(--ease)}
.ds-card:hover{background:var(--glass-hover);border-color:var(--border-hover);transform:translateY(-2px);box-shadow:var(--shadow-lg)}
.ds-grid{display:grid;gap:var(--sp-3)}
.ds-grid-2{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
.ds-grid-3{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.ds-grid-4{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
/* COLOR SWATCH */
.swatch{border-radius:var(--radius);overflow:hidden;border:1px solid var(--border)}
.swatch-color{height:80px}
.swatch-info{padding:10px 12px;background:var(--c-mid)}
.swatch-name{font-size:.75rem;font-weight:700}
.swatch-hex{font-size:.7rem;color:var(--text-muted);font-family:monospace}
/* TYPOGRAPHY SCALE */
.type-row{padding:var(--sp-2) 0;border-bottom:1px solid var(--border);display:grid;grid-template-columns:100px 1fr 80px 80px;align-items:center;gap:var(--sp-2)}
.type-label{font-size:.7rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em}
.type-meta{font-size:.72rem;color:var(--text-muted);font-family:monospace}
/* SPACING TOKENS */
.sp-row{display:flex;align-items:center;gap:var(--sp-2);padding:8px 0;border-bottom:1px solid var(--border)}
.sp-bar{height:20px;background:linear-gradient(90deg,var(--c-teal-400),var(--c-amber-500));border-radius:3px;min-width:4px}
.sp-label{font-size:.72rem;font-family:monospace;color:var(--text-secondary);min-width:60px}
/* COMPONENT STATES */
.comp-states{display:flex;flex-wrap:wrap;gap:var(--sp-2);margin-top:var(--sp-2)}
.state-label{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-top:var(--sp-2);margin-bottom:6px}
/* CODE BLOCK */
.ds-code{background:var(--c-mid);border:1px solid var(--border);border-radius:var(--radius);padding:var(--sp-2) var(--sp-3);font-family:monospace;font-size:.78rem;color:#e2e8f0;overflow-x:auto;margin-top:var(--sp-2);line-height:1.6;white-space:pre}
.ds-code .k{color:var(--c-violet-400)}.ds-code .s{color:var(--c-amber-500)}.ds-code .c{color:var(--text-muted)}
/* TAG CHIP */
.chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:var(--radius-full);font-size:.72rem;font-weight:600;border:1px solid}
.chip-teal{color:var(--c-teal-400);border-color:rgba(45,212,191,.3);background:rgba(45,212,191,.1)}
.chip-amber{color:var(--c-amber-500);border-color:rgba(245,166,35,.3);background:var(--c-amber-soft)}
.chip-rose{color:var(--c-rose-400);border-color:rgba(248,113,113,.3);background:var(--c-rose-soft)}
.chip-violet{color:var(--c-violet-400);border-color:rgba(167,139,250,.3);background:var(--c-violet-soft)}
.chip-emerald{color:var(--c-emerald-500);border-color:rgba(16,185,129,.3);background:var(--c-emerald-soft)}
/* BUTTONS */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;font-family:var(--font-sans);font-weight:700;cursor:pointer;border:none;transition:all var(--dur) var(--ease);position:relative}
.btn-lg{padding:.875rem 2rem;font-size:1rem;border-radius:var(--radius)}
.btn-md{padding:.625rem 1.5rem;font-size:.875rem;border-radius:var(--radius-sm)}
.btn-sm{padding:.375rem 1rem;font-size:.75rem;border-radius:var(--radius-sm)}
.btn-primary{background:linear-gradient(135deg,var(--c-amber-500),var(--c-amber-600));color:#0a0e1f}
.btn-primary:hover{box-shadow:0 0 24px var(--c-amber-glow);transform:translateY(-1px)}
.btn-success{background:linear-gradient(135deg,var(--c-emerald-500),var(--c-emerald-600));color:#fff}
.btn-success:hover{box-shadow:0 0 24px rgba(16,185,129,.35);transform:translateY(-1px)}
.btn-teal{background:linear-gradient(135deg,var(--c-teal-400),var(--c-teal-600));color:#0a0e1f}
.btn-teal:hover{box-shadow:0 0 24px rgba(45,212,191,.3);transform:translateY(-1px)}
.btn-glass{background:rgba(255,255,255,.08);backdrop-filter:blur(12px);border:1px solid var(--border-hover);color:var(--text-primary)}
.btn-glass:hover{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.2)}
.btn-ghost{background:transparent;border:1px solid var(--border-hover);color:var(--text-secondary)}
.btn-ghost:hover{border-color:var(--c-teal-400);color:var(--c-teal-400)}
.btn-danger{background:linear-gradient(135deg,var(--c-rose-400),#ef4444);color:#fff}
.btn-danger:hover{box-shadow:0 0 24px rgba(248,113,113,.3)}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important;box-shadow:none!important}
.btn-loading::after{content:'';width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}
/* INPUT */
.ds-input{width:100%;padding:.625rem 1rem;background:var(--c-mid);border:1px solid var(--border-hover);border-radius:var(--radius-sm);color:var(--text-primary);font-family:var(--font-sans);font-size:.875rem;transition:all var(--dur) var(--ease);outline:none}
.ds-input:focus{border-color:var(--c-teal-400);box-shadow:0 0 0 3px rgba(45,212,191,.15)}
.ds-input::placeholder{color:var(--text-muted)}
.ds-input.error{border-color:var(--c-rose-400)}
.ds-input.success{border-color:var(--c-emerald-500)}
.ds-label{display:block;font-size:.8rem;font-weight:700;color:var(--text-secondary);margin-bottom:6px}
.ds-hint{font-size:.72rem;color:var(--text-muted);margin-top:4px}
.ds-field-error{font-size:.72rem;color:var(--c-rose-400);margin-top:4px}
/* TEXTAREA */
.ds-textarea{min-height:100px;resize:vertical}
/* SELECT / PILL SELECT */
.ds-select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:left .75rem center}
/* CHECKBOX & RADIO */
.ds-check{display:flex;align-items:center;gap:.5rem;cursor:pointer}
.ds-check input{width:18px;height:18px;accent-color:var(--c-teal-400);cursor:pointer}
/* TOGGLE */
.ds-toggle{position:relative;display:inline-block;width:44px;height:24px}
.ds-toggle input{opacity:0;width:0;height:0}
.ds-toggle-track{position:absolute;inset:0;background:var(--c-mid);border:1px solid var(--border-hover);border-radius:var(--radius-full);transition:all var(--dur) var(--ease);cursor:pointer}
.ds-toggle input:checked+.ds-toggle-track{background:var(--c-teal-400);border-color:var(--c-teal-400)}
.ds-toggle-track::before{content:'';position:absolute;width:18px;height:18px;background:#fff;border-radius:50%;top:2px;right:2px;transition:transform var(--dur) var(--ease)}
.ds-toggle input:checked+.ds-toggle-track::before{transform:translateX(-20px)}
/* BADGE */
.ds-badge-sm{display:inline-flex;align-items:center;padding:2px 8px;border-radius:var(--radius-full);font-size:.65rem;font-weight:700}
.bs-teal{background:rgba(45,212,191,.15);color:var(--c-teal-400)}
.bs-amber{background:var(--c-amber-soft);color:var(--c-amber-500)}
.bs-rose{background:var(--c-rose-soft);color:var(--c-rose-400)}
.bs-emerald{background:var(--c-emerald-soft);color:var(--c-emerald-500)}
.bs-violet{background:var(--c-violet-soft);color:var(--c-violet-400)}
.bs-neutral{background:rgba(148,163,184,.1);color:var(--text-secondary)}
/* AVATAR */
.ds-av{border-radius:50%;background:var(--c-mid);display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid var(--border-hover);overflow:hidden;flex-shrink:0}
.av-xs{width:28px;height:28px;font-size:.65rem}
.av-sm{width:36px;height:36px;font-size:.8rem}
.av-md{width:48px;height:48px;font-size:1rem}
.av-lg{width:64px;height:64px;font-size:1.25rem}
.av-xl{width:80px;height:80px;font-size:1.5rem}
.av-online{position:relative}.av-online::after{content:'';position:absolute;bottom:1px;left:1px;width:10px;height:10px;background:var(--c-emerald-500);border-radius:50%;border:2px solid var(--c-void)}
/* PROGRESS */
.ds-prog-wrap{width:100%;background:var(--c-mid);border-radius:var(--radius-full);overflow:hidden;height:8px}
.ds-prog{height:100%;border-radius:var(--radius-full);transition:width .6s var(--ease)}
.prog-teal{background:linear-gradient(90deg,var(--c-teal-400),var(--c-teal-500))}
.prog-amber{background:linear-gradient(90deg,var(--c-amber-500),var(--c-amber-600))}
.prog-rose{background:linear-gradient(90deg,var(--c-rose-400),#ef4444)}
/* ALERT BANNER */
.ds-alert{display:flex;gap:.75rem;padding:.875rem 1.25rem;border-radius:var(--radius);border:1px solid;font-size:.875rem;align-items:flex-start}
.alert-info{background:rgba(45,212,191,.08);border-color:rgba(45,212,191,.25);color:var(--c-teal-400)}
.alert-success{background:var(--c-emerald-soft);border-color:rgba(16,185,129,.3);color:var(--c-emerald-500)}
.alert-warning{background:var(--c-amber-soft);border-color:rgba(245,166,35,.3);color:var(--c-amber-500)}
.alert-danger{background:var(--c-rose-soft);border-color:rgba(248,113,113,.3);color:var(--c-rose-400)}
/* TOOLTIP */
.ds-tip{position:relative;display:inline-block}
.ds-tip::after,.ds-tip::before{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);opacity:0;transition:opacity .2s;pointer-events:none}
.ds-tip::after{content:attr(data-tip);background:var(--c-aurora);color:var(--text-primary);padding:4px 10px;border-radius:var(--radius-sm);font-size:.72rem;white-space:nowrap;border:1px solid var(--border-hover)}
.ds-tip::before{content:'';border:5px solid transparent;border-top-color:var(--c-aurora);bottom:calc(100% + 2px)}
.ds-tip:hover::after,.ds-tip:hover::before{opacity:1}
/* MODAL OVERLAY */
.ds-modal-demo{position:relative;min-height:200px;background:var(--c-mid);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;overflow:hidden}
.ds-modal{background:var(--c-deep);border:1px solid var(--border-hover);border-radius:var(--radius-lg);padding:var(--sp-4);max-width:420px;width:90%;box-shadow:var(--shadow-lg)}
.ds-modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-2)}
.ds-modal-title{font-size:1.1rem;font-weight:800}
.ds-modal-close{width:32px;height:32px;background:var(--c-mid);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-secondary);font-size:1rem}
.ds-modal-close:hover{color:var(--text-primary);border-color:var(--border-hover)}
/* TABS */
.ds-tabs{display:flex;gap:4px;background:var(--c-mid);padding:4px;border-radius:var(--radius);border:1px solid var(--border)}
.ds-tab{padding:.5rem 1.25rem;border-radius:calc(var(--radius) - 2px);font-size:.8rem;font-weight:700;cursor:pointer;transition:all var(--dur) var(--ease);color:var(--text-secondary);border:none;background:transparent;font-family:var(--font-sans)}
.ds-tab:hover{color:var(--text-primary)}
.ds-tab.active{background:var(--c-aurora);color:var(--text-primary);box-shadow:var(--shadow-sm)}
/* TABLE */
.ds-table{width:100%;border-collapse:collapse;font-size:.82rem}
.ds-table th{text-align:right;padding:.625rem .875rem;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);border-bottom:1px solid var(--border)}
.ds-table td{padding:.625rem .875rem;border-bottom:1px solid var(--border);color:var(--text-secondary)}
.ds-table tr:last-child td{border-bottom:none}
.ds-table tr:hover td{background:rgba(255,255,255,.02)}
/* CARD VARIANTS */
.stat-card{padding:var(--sp-3);border-radius:var(--radius-lg);border:1px solid var(--border);background:var(--glass);backdrop-filter:blur(20px)}
.stat-value{font-size:2rem;font-weight:800;letter-spacing:-.04em;line-height:1}
.stat-label{font-size:.75rem;color:var(--text-muted);margin-top:4px;font-weight:600}
.stat-trend{font-size:.72rem;font-weight:700;margin-top:.5rem}
.trend-up{color:var(--c-emerald-500)}.trend-down{color:var(--c-rose-400)}
/* RING / ORBIT */
.ring-indicator{width:12px;height:12px;border-radius:50%;display:inline-block}
.ring-safe{background:var(--c-teal-400);box-shadow:0 0 8px rgba(45,212,191,.6)}
.ring-caution{background:var(--c-amber-500);box-shadow:0 0 8px var(--c-amber-glow)}
.ring-danger{background:var(--c-rose-400);box-shadow:0 0 8px rgba(248,113,113,.5)}
.ring-detached{background:var(--text-muted)}
/* SKELETON */
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.ds-skeleton{background:linear-gradient(90deg,var(--c-mid) 25%,var(--c-nebula) 50%,var(--c-mid) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:var(--radius-sm)}
/* BREADCRUMB */
.ds-breadcrumb{display:flex;align-items:center;gap:.5rem;font-size:.8rem;flex-wrap:wrap}
.ds-breadcrumb a{color:var(--text-secondary)}.ds-breadcrumb a:hover{color:var(--c-teal-400)}
.ds-breadcrumb-sep{color:var(--text-muted);font-size:.6rem}
/* PAGINATION */
.ds-page{display:flex;gap:4px;align-items:center}
.ds-page-btn{width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-sm);font-size:.8rem;font-weight:700;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--text-secondary);transition:all var(--dur) var(--ease)}
.ds-page-btn:hover{border-color:var(--c-teal-400);color:var(--c-teal-400)}
.ds-page-btn.active{background:var(--c-teal-400);color:#0a0e1f;border-color:var(--c-teal-400)}
/* NOTIFICATION DOT */
.notif-wrap{position:relative;display:inline-block}
.notif-dot{position:absolute;top:-4px;left:-4px;width:16px;height:16px;background:var(--c-rose-400);border-radius:50%;border:2px solid var(--c-void);font-size:.6rem;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center}
/* DIVIDER */
.ds-sep{display:flex;align-items:center;gap:var(--sp-2);margin:var(--sp-3) 0}
.ds-sep::before,.ds-sep::after{content:'';flex:1;height:1px;background:var(--border)}
.ds-sep span{font-size:.7rem;color:var(--text-muted);white-space:nowrap}
/* TIMELINE */
.ds-timeline{position:relative;padding-right:24px}
.ds-timeline::before{content:'';position:absolute;right:7px;top:0;bottom:0;width:2px;background:var(--border)}
.ds-tl-item{position:relative;margin-bottom:var(--sp-3)}
.ds-tl-dot{position:absolute;right:-24px;width:16px;height:16px;border-radius:50%;background:var(--c-teal-400);border:2px solid var(--c-void);box-shadow:0 0 8px rgba(45,212,191,.5)}
.ds-tl-content{background:var(--glass);border:1px solid var(--border);border-radius:var(--radius);padding:.875rem 1rem}
/* SEARCH */
.ds-search{position:relative}
.ds-search-icon{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);pointer-events:none;font-size:1rem}
.ds-search input{padding-right:2.5rem}
/* SLIDER */
.ds-slider{-webkit-appearance:none;width:100%;height:6px;border-radius:3px;background:var(--c-mid);outline:none;cursor:pointer}
.ds-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--c-teal-400);cursor:pointer;border:2px solid var(--c-void);box-shadow:0 0 8px rgba(45,212,191,.5)}
/* TOKENS TABLE */
.token-row{display:grid;grid-template-columns:180px 120px 1fr;align-items:center;gap:var(--sp-2);padding:8px 0;border-bottom:1px solid var(--border);font-size:.78rem}
.token-name{font-family:monospace;color:var(--c-violet-400)}
.token-val{font-family:monospace;color:var(--c-amber-500)}
/* PRINCIPLE CARD */
.principle-card{padding:var(--sp-3);border-radius:var(--radius-lg);border:1px solid var(--border);background:var(--glass)}
.principle-icon{font-size:2rem;margin-bottom:.5rem}
.principle-title{font-size:1rem;font-weight:800;margin-bottom:.25rem}
.principle-desc{font-size:.82rem;color:var(--text-secondary)}
/* DO DONT */
.do-dont{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2)}
.do-box,.dont-box{border-radius:var(--radius);padding:var(--sp-2);border:1px solid}
.do-box{border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.05)}
.dont-box{border-color:rgba(248,113,113,.3);background:rgba(248,113,113,.05)}
.do-label{font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--c-emerald-500);margin-bottom:.5rem}
.dont-label{font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--c-rose-400);margin-bottom:.5rem}
.do-dont-item{font-size:.8rem;color:var(--text-secondary);margin:.25rem 0;padding-right:1rem;position:relative}
.do-dont-item::before{position:absolute;right:0}
.do-box .do-dont-item::before{content:'✓';color:var(--c-emerald-500)}
.dont-box .do-dont-item::before{content:'✕';color:var(--c-rose-400)}
/* GRID VISUAL */
.grid-demo{display:grid;grid-template-columns:repeat(12,1fr);gap:8px;padding:var(--sp-2);background:var(--c-mid);border-radius:var(--radius)}
.grid-col{height:40px;background:rgba(45,212,191,.15);border:1px solid rgba(45,212,191,.3);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.6rem;color:var(--c-teal-400);font-weight:700}
/* SCROLLBAR */
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:var(--c-deep)}
::-webkit-scrollbar-thumb{background:var(--c-aurora);border-radius:3px}
/* MOBILE NAV */
@media(max-width:900px){.ds-nav{position:static;width:100%;height:auto;border-left:none;border-bottom:1px solid var(--border)}.ds-main{margin-right:0;padding:var(--sp-4) var(--sp-3)}.do-dont{grid-template-columns:1fr}.token-row{grid-template-columns:1fr 1fr}.type-row{grid-template-columns:80px 1fr}}
</style>
</head>
<body>
<!-- NAV -->
<nav class="ds-nav">
  <div style="margin-bottom:var(--sp-3);padding-bottom:var(--sp-2);border-bottom:1px solid var(--border)">
    <div class="ds-badge">v1.0.0</div>
    <div style="font-size:.9rem;font-weight:800;margin-top:.25rem">الرحلة DS</div>
    <div style="font-size:.7rem;color:var(--text-muted)">Design System</div>
  </div>
  <h2>المبادئ</h2>
  <ul><li><a href="#foundations">الأسس</a></li><li><a href="#principles">المبادئ</a></li></ul>
  <h2>الرموز</h2>
  <ul><li><a href="#colors">الألوان</a></li><li><a href="#typography">الطباعة</a></li><li><a href="#spacing">التباعد</a></li><li><a href="#grid">الشبكة</a></li></ul>
  <h2>المكوّنات</h2>
  <ul>
    <li><a href="#buttons">الأزرار</a></li><li><a href="#inputs">المدخلات</a></li><li><a href="#badges">الشارات</a></li>
    <li><a href="#avatars">الصور الرمزية</a></li><li><a href="#cards">البطاقات</a></li><li><a href="#alerts">التنبيهات</a></li>
    <li><a href="#progress">التقدم</a></li><li><a href="#tabs">التبويبات</a></li><li><a href="#tables">الجداول</a></li>
    <li><a href="#modal">المودال</a></li><li><a href="#tooltips">التلميحات</a></li><li><a href="#timeline">الجدول الزمني</a></li>
    <li><a href="#breadcrumb">التنقل</a></li><li><a href="#pagination">الترقيم</a></li><li><a href="#skeleton">الهيكل</a></li>
    <li><a href="#ring">خاتم الرحلة</a></li><li><a href="#misc">عناصر متنوعة</a></li>
  </ul>
  <h2>الأنماط</h2>
  <ul><li><a href="#patterns">أنماط التصميم</a></li><li><a href="#dodont">يجب / لا يجب</a></li></ul>
  <h2>للمطورين</h2>
  <ul><li><a href="#tokens">Design Tokens</a></li><li><a href="#devguide">دليل المطور</a></li></ul>
</nav>

<main class="ds-main">
<!-- HERO -->
<section class="ds-hero" id="foundations">
  <div class="ds-badge">🌌 Design System</div>
  <h1>الرحلة</h1>
  <p>نظام تصميم متكامل — مبني على مستوى Apple Human Interface Guidelines</p>
  <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;margin-top:var(--sp-3)">
    <span class="chip chip-teal">30+ مكوّن</span>
    <span class="chip chip-amber">Design Tokens</span>
    <span class="chip chip-violet">WCAG AA</span>
    <span class="chip chip-emerald">RTL-First</span>
    <span class="chip chip-teal">Dark Mode</span>
  </div>
</section>

<!-- PRINCIPLES -->
<section class="ds-section" id="principles">
  <div class="ds-section-title">🧭 المبادئ التصميمية</div>
  <p class="ds-section-sub">سبعة مبادئ تُشكّل كل قرار تصميمي في منصة الرحلة.</p>
  <div class="ds-grid ds-grid-3">
    <div class="principle-card"><div class="principle-icon">🌌</div><div class="principle-title">الفضاء العلاجي</div><div class="principle-desc">كل شاشة مساحة هدوء — لا ضوضاء بصرية، بل توجيه لطيف</div></div>
    <div class="principle-card"><div class="principle-icon">💛</div><div class="principle-title">الدفء الأول</div><div class="principle-desc">اللون الأصفر الدافئ يُجذب الانتباه فقط للأهم — CTA واحد بارز</div></div>
    <div class="principle-card"><div class="principle-icon">🔮</div><div class="principle-title">الزجاجية المتعمدة</div><div class="principle-desc">Glassmorphism لخلق عمق بصري مع الحفاظ على الوضوح</div></div>
    <div class="principle-card"><div class="principle-icon">📐</div><div class="principle-title">الشبكة أولاً</div><div class="principle-desc">12 عموداً، 8px system — لا قيمة خارج المقياس</div></div>
    <div class="principle-card"><div class="principle-icon">♿</div><div class="principle-title">للجميع</div><div class="principle-desc">WCAG AA كحد أدنى — تباين، قيادة لوحية، قارئات الشاشة</div></div>
    <div class="principle-card"><div class="principle-icon">🌙</div><div class="principle-title">الليل افتراضي</div><div class="principle-desc">Dark mode هو الوضع الأساسي — الضوء اختياري</div></div>
    <div class="principle-card"><div class="principle-icon">✨</div><div class="principle-title">الحركة هادفة</div><div class="principle-desc">كل animation مقصودة — لا حركة للحركة، بل للإرشاد</div></div>
  </div>
</section>
<div class="ds-divider"></div>

<!-- COLORS -->
<section class="ds-section" id="colors">
  <div class="ds-section-title">🎨 نظام الألوان</div>
  <p class="ds-section-sub">خمس مجموعات ألوان أساسية — كل لون بمعنى ودور محدد.</p>
  <div style="margin-bottom:var(--sp-3)"><span class="ds-badge-sm bs-amber" style="font-size:.75rem;padding:4px 12px">الألوان الأساسية — Primary</span></div>
  <div class="ds-grid ds-grid-4">
    <div class="swatch"><div class="swatch-color" style="background:#0a0e1f"></div><div class="swatch-info"><div class="swatch-name">Space Void</div><div class="swatch-hex">--c-void · #0a0e1f</div></div></div>
    <div class="swatch"><div class="swatch-color" style="background:#131a35"></div><div class="swatch-info"><div class="swatch-name">Space Deep</div><div class="swatch-hex">--c-deep · #131a35</div></div></div>
    <div class="swatch"><div class="swatch-color" style="background:#1a2242"></div><div class="swatch-info"><div class="swatch-name">Space Mid</div><div class="swatch-hex">--c-mid · #1a2242</div></div></div>
    <div class="swatch"><div class="swatch-color" style="background:#212b4f"></div><div class="swatch-info"><div class="swatch-name">Space Nebula</div><div class="swatch-hex">--c-nebula · #212b4f</div></div></div>
    <div class="swatch"><div class="swatch-color" style="background:#2a3560"></div><div class="swatch-info"><div class="swatch-name">Space Aurora</div><div class="swatch-hex">--c-aurora · #2a3560</div></div></div>
    <div class="swatch"><div class="swatch-color" style="background:#2dd4bf"></div><div class="swatch-info"><div class="swatch-name">Teal 400 — Brand</div><div class="swatch-hex">--c-teal-400 · #2dd4bf</div></div></div>
    <div class="swatch"><div class="swatch-color" style="background:#f5a623"></div><div class="swatch-info"><div class="swatch-name">Amber 500 — CTA</div><div class="swatch-hex">--c-amber-500 · #f5a623</div></div></div>
    <div class="swatch"><div class="swatch-color" style="background:#10b981"></div><div class="swatch-info"><div class="swatch-name">Emerald 500 — Success</div><div class="swatch-hex">--c-emerald-500 · #10b981</div></div></div>
    <div class="swatch"><div class="swatch-color" style="background:#f87171"></div><div class="swatch-info"><div class="swatch-name">Rose 400 — Danger</div><div class="swatch-hex">--c-rose-400 · #f87171</div></div></div>
    <div class="swatch"><div class="swatch-color" style="background:#a78bfa"></div><div class="swatch-info"><div class="swatch-name">Violet 400 — Accent</div><div class="swatch-hex">--c-violet-400 · #a78bfa</div></div></div>
    <div class="swatch"><div class="swatch-color" style="background:#38bdf8"></div><div class="swatch-info"><div class="swatch-name">Sky 400 — Info</div><div class="swatch-hex">--c-sky-400 · #38bdf8</div></div></div>
    <div class="swatch"><div class="swatch-color" style="background:linear-gradient(135deg,#2dd4bf,#f5a623)"></div><div class="swatch-info"><div class="swatch-name">Brand Gradient</div><div class="swatch-hex">teal-400 → amber-500</div></div></div>
  </div>
  <div style="margin-top:var(--sp-4)">
    <div style="margin-bottom:var(--sp-2)"><span class="ds-badge-sm bs-teal" style="font-size:.75rem;padding:4px 12px">قواعد التباين — Contrast</span></div>
    <div class="ds-card">
      <table class="ds-table">
        <thead><tr><th>العنصر</th><th>الخلفية</th><th>النص</th><th>نسبة التباين</th><th>المستوى</th></tr></thead>
        <tbody>
          <tr><td>العناوين الرئيسية</td><td>#0a0e1f</td><td>#f1f5f9</td><td>16.4:1</td><td><span class="ds-badge-sm bs-emerald">AAA</span></td></tr>
          <tr><td>النص الثانوي</td><td>#0a0e1f</td><td>#94a3b8</td><td>6.2:1</td><td><span class="ds-badge-sm bs-emerald">AA</span></td></tr>
          <tr><td>Amber CTA على dark</td><td>#0a0e1f</td><td>#f5a623</td><td>7.8:1</td><td><span class="ds-badge-sm bs-emerald">AAA</span></td></tr>
          <tr><td>Teal على dark</td><td>#0a0e1f</td><td>#2dd4bf</td><td>8.1:1</td><td><span class="ds-badge-sm bs-emerald">AAA</span></td></tr>
          <tr><td>Muted text</td><td>#0a0e1f</td><td>rgba(148,163,184,.5)</td><td>3.1:1</td><td><span class="ds-badge-sm bs-amber">UI Only</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>
<div class="ds-divider"></div>

<!-- TYPOGRAPHY -->
<section class="ds-section" id="typography">
  <div class="ds-section-title">✍️ الطباعة — Typography</div>
  <p class="ds-section-sub">9 مستويات طباعية — Almarai للعناوين، IBM Plex للنصوص. مقياس متجاوب بالكامل.</p>
  <div class="ds-card" style="margin-bottom:var(--sp-3)">
    <div class="type-row"><div class="type-label">Level</div><div>نموذج</div><div class="type-meta">Size</div><div class="type-meta">Weight</div></div>
    <div class="type-row"><div class="type-label">Display</div><div style="font-size:clamp(2.5rem,5vw,4rem);font-weight:800;letter-spacing:-.04em;line-height:1.1">الرحلة</div><div class="type-meta">4rem / clamp</div><div class="type-meta">800</div></div>
    <div class="type-row"><div class="type-label">H1</div><div style="font-size:2.25rem;font-weight:800;letter-spacing:-.03em">عنوان رئيسي</div><div class="type-meta">2.25rem</div><div class="type-meta">800</div></div>
    <div class="type-row"><div class="type-label">H2</div><div style="font-size:1.75rem;font-weight:800;letter-spacing:-.02em">عنوان ثانوي</div><div class="type-meta">1.75rem</div><div class="type-meta">800</div></div>
    <div class="type-row"><div class="type-label">H3</div><div style="font-size:1.375rem;font-weight:700">عنوان ثالث</div><div class="type-meta">1.375rem</div><div class="type-meta">700</div></div>
    <div class="type-row"><div class="type-label">H4</div><div style="font-size:1.125rem;font-weight:700">عنوان رابع</div><div class="type-meta">1.125rem</div><div class="type-meta">700</div></div>
    <div class="type-row"><div class="type-label">Body LG</div><div style="font-size:1rem;font-weight:400;color:var(--text-secondary)">نص أساسي كبير — يُستخدم في الفقرات الرئيسية والشرح</div><div class="type-meta">1rem</div><div class="type-meta">400</div></div>
    <div class="type-row"><div class="type-label">Body</div><div style="font-size:.875rem;color:var(--text-secondary)">نص أساسي — الاستخدام العام داخل البطاقات والمكوّنات</div><div class="type-meta">.875rem</div><div class="type-meta">400</div></div>
    <div class="type-row"><div class="type-label">Caption</div><div style="font-size:.75rem;color:var(--text-muted)">نص توضيحي — تواريخ، وصف مختصر، بيانات ثانوية</div><div class="type-meta">.75rem</div><div class="type-meta">500</div></div>
    <div class="type-row"><div class="type-label">Label</div><div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted)">SECTION LABEL</div><div class="type-meta">.65rem</div><div class="type-meta">700 + UC</div></div>
  </div>
  <div class="ds-code"><span class="c">/* خطوط المشروع */</span>
<span class="k">@import</span> <span class="s">'https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap'</span>;

<span class="k">--font-display</span>: 'Almarai', system-ui;
<span class="k">--font-sans</span>:    'Almarai', 'IBM Plex Sans Arabic', system-ui;
