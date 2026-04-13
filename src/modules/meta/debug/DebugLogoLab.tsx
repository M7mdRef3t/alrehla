'use client';

/**
 * DebugLogoLab — معمل شعارات الرحلة
 * صفحة عرض كل مقترحات الشعارات للمنصة
 */
import { useState } from "react";

/* ── Logo Concepts Data ── */
interface LogoConcept {
  id: string;
  name: string;
  nameEn: string;
  tagline: string;
  description: string;
  type: "svg" | "png";
  src: string;
  category: "geometric" | "figurative" | "abstract" | "composite";
  strengths: string[];
  bestFor: string;
}

const LOGO_CONCEPTS: LogoConcept[] = [
  // ── SVG Concepts (Vector) ──
  {
    id: "compass-core",
    name: "نواة البوصلة",
    nameEn: "Compass Core",
    tagline: "بوصلة وعيك الداخلي",
    description: "بوصلة كلاسيكية بنجمة رباعية ومركز منير. بتوصّل فكرة إن الوعي الداخلي هو البوصلة اللي بتوجهك.",
    type: "svg",
    src: "/brand-concepts/alrehla-option-compass-core.svg",
    category: "geometric",
    strengths: ["واضح ومباشر", "يتعرف عليه بسرعة", "يشتغل كـ favicon"],
    bestFor: "لو عايز شعار كلاسيكي ومحترف يشتغل في كل الأحجام",
  },
  {
    id: "compass-nucleus",
    name: "نواة الوعي",
    nameEn: "Compass Nucleus",
    tagline: "نواة وعيك.. قبل أي خطوة",
    description: "نفس فكرة البوصلة بس بتأثير glow أعمق — كأن النواة هي نقطة البداية لكل رحلة وعي.",
    type: "svg",
    src: "/brand-concepts/alrehla-option-compass-nucleus.svg",
    category: "geometric",
    strengths: ["عمق بصري أكبر", "إحساس بالطاقة", "premium feel"],
    bestFor: "لو عايز نسخة أعمق وأكثر روحانية من البوصلة",
  },
  {
    id: "compass-axis",
    name: "محور الرحلة",
    nameEn: "Journey Axis",
    tagline: "محور ثابت.. لرحلة أوضح",
    description: "محور عمودي قوي مع سهم اتجاه — بيمثل الثبات الداخلي وسط التقلبات. بيديك إحساس إن فيه عمود فقري نفسي.",
    type: "svg",
    src: "/brand-concepts/alrehla-option-compass-axis.svg",
    category: "geometric",
    strengths: ["بسيط وقوي", "رمزية الثبات", "يتقرأ في أي حجم"],
    bestFor: "لو عايز شعار مؤسسي ثابت بيبعث على الطمأنينة",
  },
  {
    id: "compass-path",
    name: "بوصلة المسار",
    nameEn: "Path Compass",
    tagline: "اتجاه واضح.. وحركة محسوبة",
    description: "بوصلة مع مسار منحني وعقد مضيئة — بتبيّن إن الرحلة مش خط مستقيم، بس فيها اتجاه واضح.",
    type: "svg",
    src: "/brand-concepts/alrehla-option-compass-path.svg",
    category: "geometric",
    strengths: ["يوصّل فكرة الرحلة", "ديناميكي", "عقد المسار كـ milestones"],
    bestFor: "لو عايز توصّل فكرة إن الرحلة فيها محطات ومعالم",
  },
  {
    id: "halo-walker",
    name: "هالة الوعي",
    nameEn: "Halo Walker",
    tagline: "وعي يتحرك معاك",
    description: "الشعار الأصلي — شخص ماشي بهالات وعي حواليه. بيوصّل فكرة إن الوعي مش ثابت، بيتحرك معاك.",
    type: "svg",
    src: "/brand-concepts/alrehla-option-halo-walker.svg",
    category: "figurative",
    strengths: ["إنساني ومباشر", "بيحكي قصة", "الناس بتتعرف عليه"],
    bestFor: "لو عايز شعار فيه عنصر إنساني واضح",
  },
  {
    id: "twin-thread",
    name: "خيوط الوصل",
    nameEn: "Twin Thread",
    tagline: "وعي فردي.. وصلات صحية",
    description: "خيطين متقاطعين حوالين شخص — يمثلوا العلاقة بين الوعي الفردي والعلاقات الصحية.",
    type: "svg",
    src: "/brand-concepts/alrehla-option-twin-thread.svg",
    category: "figurative",
    strengths: ["يمثل 'الدوائر'", "بيربط الفرد بالعلاقات", "تصميم فريد"],
    bestFor: "لو عايز تبرز فكرة العلاقات والروابط مع الوعي الذاتي",
  },
  {
    id: "portal-path",
    name: "رحلة العبور",
    nameEn: "Portal Path",
    tagline: "رحلة من الضباب للوضوح",
    description: "رحلة مقوسة مع شعلة صاعدة — بتمثل العبور من حالة الضبابية للوضوح والفهم.",
    type: "svg",
    src: "/brand-concepts/alrehla-option-portal-path.svg",
    category: "abstract",
    strengths: ["رمزية قوية", "إحساس بالتحول", "أنيق ومختلف"],
    bestFor: "لو عايز شعار بيوصّل فكرة التحول والعبور لحالة أفضل",
  },
  {
    id: "pulse-orbit",
    name: "المدار النابض",
    nameEn: "Pulse Orbit",
    tagline: "نبضك مفهوم.. ومسارك أوضح",
    description: "دوائر مدارية مع خط نبض ECG في النص — بيربط بين قياس الحالة النفسية والمسار الشخصي.",
    type: "svg",
    src: "/brand-concepts/alrehla-option-pulse-orbit.svg",
    category: "abstract",
    strengths: ["علمي وتقني", "يربط بالـ diagnostics", "عصري"],
    bestFor: "لو عايز تبرز الجانب العلمي والتشخيصي للمنصة",
  },

  // ── PNG Concepts (Generated) ──
  {
    id: "inner-eye",
    name: "عين البصيرة",
    nameEn: "Inner Eye",
    tagline: "شوف جواك.. قبل ما تبص برا",
    description: "عين مدمجة مع بوصلة — الحدقة فيها لولب نسبة ذهبية. بتمثل الرؤية الداخلية اللي بتوجه الإنسان.",
    type: "png",
    src: "/brand-concepts/logo-inner-eye.png",
    category: "composite",
    strengths: ["رمزية عميقة", "مبتكر ومختلف", "بيلفت الانتباه"],
    bestFor: "لو عايز شعار فيه عمق فلسفي ورمزية غنية",
  },
  {
    id: "rising-phoenix",
    name: "طائر النهوض",
    nameEn: "Rising Phoenix",
    tagline: "من الرماد.. لأعلى نسخة منك",
    description: "طائر فينيكس صاعد بخطوط هندسية — أجنحته بتشكّل هالات وعي. بيمثل النهوض والتحول.",
    type: "png",
    src: "/brand-concepts/logo-rising-phoenix.png",
    category: "figurative",
    strengths: ["رمزية قوية جداً", "يوصّل فكرة التحول", "ديناميكي"],
    bestFor: "لو عايز شعار بيحكي قصة قوة ونهوض",
  },
  {
    id: "tree-of-mind",
    name: "شجرة العقل",
    nameEn: "Tree of Mind",
    tagline: "جذور في العلم.. وفروع في الوعي",
    description: "شجرة الحياة — جذعها حلزون DNA والتاج بيشكّل دماغ. بتربط بين العلم والوعي.",
    type: "png",
    src: "/brand-concepts/logo-tree-of-mind.png",
    category: "composite",
    strengths: ["يربط العلم بالروحانية", "تصميم غني", "يشتغل كأيقونة"],
    bestFor: "لو عايز توصّل فكرة 'قتل الدجال بالعلم' بصرياً",
  },
  {
    id: "line-compass-man",
    name: "إنسان البوصلة",
    nameEn: "Compass Man",
    tagline: "أنت البوصلة.. وأنت المسار",
    description: "رسم بخط واحد متصل بيشكّل إنسان وبوصلة — الجسم هو الإبرة والأذرع هي نقاط البوصلة.",
    type: "png",
    src: "/brand-concepts/logo-line-compass-man.png",
    category: "figurative",
    strengths: ["أنيق وبسيط", "خط واحد = وحدة", "فني جداً"],
    bestFor: "لو عايز شعار فني وأنيق بيوصّل فكرة إن الإنسان هو البوصلة",
  },
  {
    id: "infinite-ra",
    name: "رحلة بلا نهاية",
    nameEn: "Infinite Journey",
    tagline: "كل نهاية.. بداية جديدة",
    description: "شريط موبيوس لا نهائي بيلمّح لحرف 'ر' — بيوصّل فكرة إن رحلة الوعي مالهاش نهاية.",
    type: "png",
    src: "/brand-concepts/logo-infinite-ra.png",
    category: "abstract",
    strengths: ["رمزية اللانهاية", "ربط بالاسم العربي", "عصري وأنيق"],
    bestFor: "لو عايز شعار عصري بيربط بين الهوية العربية والتصميم الحديث",
  },
  {
    id: "ripple-mandala",
    name: "تموجات الوعي",
    nameEn: "Consciousness Ripples",
    tagline: "تأثيرك.. أبعد مما تتخيل",
    description: "تموجات دائرية منبعثة من نقطة مركزية مضيئة — زي حجر سقط في مية ساكنة. بتمثل تأثير الوعي.",
    type: "png",
    src: "/brand-concepts/logo-ripple-mandala.png",
    category: "abstract",
    strengths: ["تأملي وعميق", "sacred geometry", "حضور بصري قوي"],
    bestFor: "لو عايز شعار فيه طاقة تأملية وروحانية",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  geometric: "🔷 هندسي",
  figurative: "🧍 تشكيلي",
  abstract: "✨ تجريدي",
  composite: "🎨 مركّب",
};

const DEBUG_LOGO_LAB_STYLES = `
  .debug-logo-lab-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #050A14 0%, #0A1628 40%, #0F172A 100%);
    color: #E2E8F0;
    font-family: Cairo, 'Segoe UI', Arial, sans-serif;
    padding: 0 0 60px 0;
  }

  .debug-logo-lab-header {
    position: relative;
    text-align: center;
    padding: 48px 24px 32px;
    overflow: hidden;
  }

  .debug-logo-lab-header-glow {
    position: absolute;
    top: -50%;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(ellipse, rgba(20,184,166,0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  .debug-logo-lab-title {
    font-size: 36px;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #67E8F9 0%, #14B8A6 50%, #A78BFA 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    position: relative;
  }

  .debug-logo-lab-title-icon {
    -webkit-text-fill-color: initial;
    margin-left: 8px;
  }

  .debug-logo-lab-subtitle {
    font-size: 16px;
    color: #94A3B8;
    margin-top: 8px;
  }

  .debug-logo-lab-filter-bar {
    display: flex;
    justify-content: center;
    gap: 10px;
    padding: 0 24px 32px;
    flex-wrap: wrap;
  }

  .debug-logo-lab-filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 24px;
    border: 1px solid rgba(100,116,139,0.3);
    background: rgba(15,23,42,0.6);
    color: #94A3B8;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .debug-logo-lab-filter-btn--active {
    border-color: #14B8A6;
    background: rgba(20,184,166,0.15);
    color: #5EEAD4;
    box-shadow: 0 0 20px rgba(20,184,166,0.2);
  }

  .debug-logo-lab-filter-count {
    font-size: 11px;
    font-weight: 700;
    background: rgba(100,116,139,0.2);
    padding: 2px 7px;
    border-radius: 10px;
  }

  .debug-logo-lab-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 20px;
    padding: 0 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .debug-logo-lab-card {
    background: rgba(15,23,42,0.7);
    border: 1px solid rgba(100,116,139,0.2);
    border-radius: 16px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(12px);
  }

  .debug-logo-lab-card--hovered {
    border-color: rgba(103,232,249,0.4);
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(20,184,166,0.15);
  }

  .debug-logo-lab-card--selected {
    border-color: #14B8A6;
    box-shadow: 0 0 30px rgba(20,184,166,0.25), inset 0 0 30px rgba(20,184,166,0.05);
  }

  .debug-logo-lab-category-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 10px;
    background: rgba(30,41,59,0.8);
    border: 1px solid rgba(100,116,139,0.25);
    color: #94A3B8;
  }

  .debug-logo-lab-logo-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    padding: 16px 8px;
    border-radius: 12px;
    background: radial-gradient(ellipse at center, rgba(8,13,24,0.9) 0%, rgba(15,23,42,0.6) 100%);
    margin-bottom: 16px;
    border: 1px solid rgba(51,65,85,0.3);
  }

  .debug-logo-lab-svg-logo {
    max-width: 100%;
    max-height: 80px;
    filter: drop-shadow(0 0 8px rgba(20,184,166,0.3));
  }

  .debug-logo-lab-png-logo {
    max-width: 85%;
    max-height: 100px;
    object-fit: contain;
    border-radius: 8px;
    filter: drop-shadow(0 4px 16px rgba(0,0,0,0.4));
  }

  .debug-logo-lab-card-info {
    text-align: center;
  }

  .debug-logo-lab-card-name {
    font-size: 20px;
    font-weight: 800;
    margin: 0 0 2px;
    color: #F1F5F9;
  }

  .debug-logo-lab-card-name-en {
    font-size: 12px;
    font-weight: 500;
    color: #64748B;
    letter-spacing: 0.5px;
    display: block;
    margin-bottom: 8px;
  }

  .debug-logo-lab-card-tagline {
    font-size: 14px;
    color: #5EEAD4;
    font-weight: 600;
    margin: 0;
    font-style: italic;
  }

  .debug-logo-lab-expanded-details {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(100,116,139,0.2);
    animation: fadeIn 0.3s ease;
  }

  .debug-logo-lab-description {
    font-size: 14px;
    line-height: 1.7;
    color: #CBD5E1;
    margin: 0 0 14px;
  }

  .debug-logo-lab-strengths-section {
    margin-bottom: 12px;
  }

  .debug-logo-lab-strengths-label {
    font-size: 13px;
    font-weight: 700;
    color: #94A3B8;
    display: block;
    margin-bottom: 6px;
  }

  .debug-logo-lab-strengths-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .debug-logo-lab-strength-tag {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 14px;
    background: rgba(20,184,166,0.12);
    border: 1px solid rgba(20,184,166,0.25);
    color: #5EEAD4;
  }

  .debug-logo-lab-best-for-section {
    padding: 10px 14px;
    border-radius: 10px;
    background: rgba(59,130,246,0.08);
    border: 1px solid rgba(59,130,246,0.15);
  }

  .debug-logo-lab-best-for-label {
    font-size: 13px;
    font-weight: 700;
    color: #93C5FD;
  }

  .debug-logo-lab-best-for-text {
    font-size: 13px;
    color: #CBD5E1;
  }

  .debug-logo-lab-comparison-panel {
    max-width: 1000px;
    margin: 40px auto 0;
    padding: 0 24px;
  }

  .debug-logo-lab-comparison-title {
    font-size: 22px;
    font-weight: 800;
    color: #F1F5F9;
    text-align: center;
    margin-bottom: 20px;
  }

  .debug-logo-lab-comparison-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }

  .debug-logo-lab-preview-box {
    text-align: center;
  }

  .debug-logo-lab-preview-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #64748B;
    margin-bottom: 8px;
  }

  .debug-logo-lab-preview-area {
    border-radius: 12px;
    border: 1px solid rgba(100,116,139,0.25);
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
  }

  .debug-logo-lab-preview-area--dark {
    background: #080D18;
  }

  .debug-logo-lab-preview-area--light {
    background: #F1F5F9;
  }

  .debug-logo-lab-preview-area--small {
    min-height: 80px;
  }

  .debug-logo-lab-preview-svg {
    max-width: 100%;
    max-height: 72px;
  }

  .debug-logo-lab-preview-png {
    max-width: 90%;
    max-height: 100px;
    object-fit: contain;
    border-radius: 6px;
  }

  .debug-logo-lab-preview-svg--inverted {
    filter: invert(0.85) hue-rotate(180deg);
  }

  .debug-logo-lab-preview-small {
    max-height: 32px;
    max-width: 100px;
  }

  .debug-logo-lab-footer {
    text-align: center;
    padding: 40px 24px 0;
    color: #475569;
    font-size: 14px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

/* ── Component ── */
export default function DebugLogoLab() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered =
    activeFilter === "all"
      ? LOGO_CONCEPTS
      : LOGO_CONCEPTS.filter((c) => c.category === activeFilter);

  const selected = LOGO_CONCEPTS.find((c) => c.id === selectedId);

  return (
    <div className="debug-logo-lab-page" dir="rtl">
      <style>{DEBUG_LOGO_LAB_STYLES}</style>
      {/* ── Header ── */}
      <header className="debug-logo-lab-header">
        <div className="debug-logo-lab-header-glow" />
        <h1 className="debug-logo-lab-title">
          <span className="debug-logo-lab-title-icon">🔬</span>
          معمل شعارات الرحلة
        </h1>
        <p className="debug-logo-lab-subtitle">
          {LOGO_CONCEPTS.length} مقترح شعار — اختار اللي يمثّلك
        </p>
      </header>

      {/* ── Filter Bar ── */}
      <nav className="debug-logo-lab-filter-bar">
        {[
          { key: "all", label: "📋 الكل", count: LOGO_CONCEPTS.length },
          { key: "geometric", label: "🔷 هندسي", count: LOGO_CONCEPTS.filter((c) => c.category === "geometric").length },
          { key: "figurative", label: "🧍 تشكيلي", count: LOGO_CONCEPTS.filter((c) => c.category === "figurative").length },
          { key: "abstract", label: "✨ تجريدي", count: LOGO_CONCEPTS.filter((c) => c.category === "abstract").length },
          { key: "composite", label: "🎨 مركّب", count: LOGO_CONCEPTS.filter((c) => c.category === "composite").length },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActiveFilter(f.key)}
            className={`debug-logo-lab-filter-btn ${activeFilter === f.key ? "debug-logo-lab-filter-btn--active" : ""}`}
          >
            {f.label}
            <span className="debug-logo-lab-filter-count">{f.count}</span>
          </button>
        ))}
      </nav>

      {/* ── Grid ── */}
      <div className="debug-logo-lab-grid">
        {filtered.map((concept) => (
          <div
            key={concept.id}
            onClick={() => setSelectedId(selectedId === concept.id ? null : concept.id)}
            onMouseEnter={() => setHoveredId(concept.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`debug-logo-lab-card ${selectedId === concept.id ? "debug-logo-lab-card--selected" : ""} ${hoveredId === concept.id && selectedId !== concept.id ? "debug-logo-lab-card--hovered" : ""}`}
          >
            {/* Category Badge */}
            <div className="debug-logo-lab-category-badge">
              {CATEGORY_LABELS[concept.category]}
            </div>

            {/* Logo Preview */}
            <div className="debug-logo-lab-logo-preview">
              {concept.type === "svg" ? (
                <img
                  src={concept.src}
                  alt={concept.name}
                  className="debug-logo-lab-svg-logo"
                />
              ) : (
                <img
                  src={concept.src}
                  alt={concept.name}
                  className="debug-logo-lab-png-logo"
                />
              )}
            </div>

            {/* Info */}
            <div className="debug-logo-lab-card-info">
              <h3 className="debug-logo-lab-card-name">{concept.name}</h3>
              <span className="debug-logo-lab-card-name-en">{concept.nameEn}</span>
              <p className="debug-logo-lab-card-tagline">« {concept.tagline} »</p>
            </div>

            {/* Expanded Details */}
            {selectedId === concept.id && (
              <div className="debug-logo-lab-expanded-details">
                <p className="debug-logo-lab-description">{concept.description}</p>

                <div className="debug-logo-lab-strengths-section">
                  <span className="debug-logo-lab-strengths-label">💪 نقاط القوة:</span>
                  <div className="debug-logo-lab-strengths-list">
                    {concept.strengths.map((s, i) => (
                      <span key={i} className="debug-logo-lab-strength-tag">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="debug-logo-lab-best-for-section">
                  <span className="debug-logo-lab-best-for-label">🎯 مناسب: </span>
                  <span className="debug-logo-lab-best-for-text">{concept.bestFor}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Selected Comparison Panel ── */}
      {selected && (
        <div className="debug-logo-lab-comparison-panel">
          <h2 className="debug-logo-lab-comparison-title">
            👁️ معاينة مكبّرة — {selected.name}
          </h2>
          <div className="debug-logo-lab-comparison-content">
            {/* Dark Preview */}
            <div className="debug-logo-lab-preview-box">
              <span className="debug-logo-lab-preview-label">على خلفية داكنة</span>
              <div className="debug-logo-lab-preview-area debug-logo-lab-preview-area--dark">
                <img
                  src={selected.src}
                  alt={selected.name}
                  className={selected.type === "svg" ? "debug-logo-lab-preview-svg" : "debug-logo-lab-preview-png"}
                />
              </div>
            </div>
            {/* Light Preview */}
            <div className="debug-logo-lab-preview-box">
              <span className="debug-logo-lab-preview-label">على خلفية فاتحة</span>
              <div className="debug-logo-lab-preview-area debug-logo-lab-preview-area--light">
                <img
                  src={selected.src}
                  alt={selected.name}
                  className={selected.type === "svg" ? "debug-logo-lab-preview-svg debug-logo-lab-preview-svg--inverted" : "debug-logo-lab-preview-png"}
                />
              </div>
            </div>
            {/* Small Preview */}
            <div className="debug-logo-lab-preview-box">
              <span className="debug-logo-lab-preview-label">حجم صغير (favicon)</span>
              <div className="debug-logo-lab-preview-area debug-logo-lab-preview-area--dark debug-logo-lab-preview-area--small">
                <img
                  src={selected.src}
                  alt={selected.name}
                  className={`debug-logo-lab-preview-small ${selected.type === "svg" ? "debug-logo-lab-preview-svg" : "debug-logo-lab-preview-png"}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="debug-logo-lab-footer">
        <p>اضغط على أي شعار لمعاينة التفاصيل والمقارنة 👆</p>
      </footer>
    </div>
  );
}

