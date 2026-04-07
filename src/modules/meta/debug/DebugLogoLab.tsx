"use client";
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
    <div style={styles.page} dir="rtl">
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerGlow} />
        <h1 style={styles.title}>
          <span style={styles.titleIcon}>🔬</span>
          معمل شعارات الرحلة
        </h1>
        <p style={styles.subtitle}>
          {LOGO_CONCEPTS.length} مقترح شعار — اختار اللي يمثّلك
        </p>
      </header>

      {/* ── Filter Bar ── */}
      <nav style={styles.filterBar}>
        {[
          { key: "all", label: "📋 الكل", count: LOGO_CONCEPTS.length },
          { key: "geometric", label: "🔷 هندسي", count: LOGO_CONCEPTS.filter((c) => c.category === "geometric").length },
          { key: "figurative", label: "🧍 تشكيلي", count: LOGO_CONCEPTS.filter((c) => c.category === "figurative").length },
          { key: "abstract", label: "✨ تجريدي", count: LOGO_CONCEPTS.filter((c) => c.category === "abstract").length },
          { key: "composite", label: "🎨 مركّب", count: LOGO_CONCEPTS.filter((c) => c.category === "composite").length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            style={{
              ...styles.filterBtn,
              ...(activeFilter === f.key ? styles.filterBtnActive : {}),
            }}
          >
            {f.label}
            <span style={styles.filterCount}>{f.count}</span>
          </button>
        ))}
      </nav>

      {/* ── Grid ── */}
      <div style={styles.grid}>
        {filtered.map((concept) => (
          <div
            key={concept.id}
            onClick={() => setSelectedId(selectedId === concept.id ? null : concept.id)}
            onMouseEnter={() => setHoveredId(concept.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              ...styles.card,
              ...(selectedId === concept.id ? styles.cardSelected : {}),
              ...(hoveredId === concept.id && selectedId !== concept.id ? styles.cardHovered : {}),
            }}
          >
            {/* Category Badge */}
            <div style={styles.categoryBadge}>
              {CATEGORY_LABELS[concept.category]}
            </div>

            {/* Logo Preview */}
            <div style={styles.logoPreview}>
              {concept.type === "svg" ? (
                <img
                  src={concept.src}
                  alt={concept.name}
                  style={styles.svgLogo}
                />
              ) : (
                <img
                  src={concept.src}
                  alt={concept.name}
                  style={styles.pngLogo}
                />
              )}
            </div>

            {/* Info */}
            <div style={styles.cardInfo}>
              <h3 style={styles.cardName}>{concept.name}</h3>
              <span style={styles.cardNameEn}>{concept.nameEn}</span>
              <p style={styles.cardTagline}>« {concept.tagline} »</p>
            </div>

            {/* Expanded Details */}
            {selectedId === concept.id && (
              <div style={styles.expandedDetails}>
                <p style={styles.description}>{concept.description}</p>

                <div style={styles.strengthsSection}>
                  <span style={styles.strengthsLabel}>💪 نقاط القوة:</span>
                  <div style={styles.strengthsList}>
                    {concept.strengths.map((s, i) => (
                      <span key={i} style={styles.strengthTag}>{s}</span>
                    ))}
                  </div>
                </div>

                <div style={styles.bestForSection}>
                  <span style={styles.bestForLabel}>🎯 مناسب: </span>
                  <span style={styles.bestForText}>{concept.bestFor}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Selected Comparison Panel ── */}
      {selected && (
        <div style={styles.comparisonPanel}>
          <h2 style={styles.comparisonTitle}>
            👁️ معاينة مكبّرة — {selected.name}
          </h2>
          <div style={styles.comparisonContent}>
            {/* Dark Preview */}
            <div style={styles.previewBox}>
              <span style={styles.previewLabel}>على خلفية داكنة</span>
              <div style={{ ...styles.previewArea, background: "#080D18" }}>
                <img
                  src={selected.src}
                  alt={selected.name}
                  style={selected.type === "svg" ? styles.previewSvg : styles.previewPng}
                />
              </div>
            </div>
            {/* Light Preview */}
            <div style={styles.previewBox}>
              <span style={styles.previewLabel}>على خلفية فاتحة</span>
              <div style={{ ...styles.previewArea, background: "#F1F5F9" }}>
                <img
                  src={selected.src}
                  alt={selected.name}
                  style={{
                    ...(selected.type === "svg" ? styles.previewSvg : styles.previewPng),
                    filter: selected.type === "svg" ? "invert(0.85) hue-rotate(180deg)" : "none",
                  }}
                />
              </div>
            </div>
            {/* Small Preview */}
            <div style={styles.previewBox}>
              <span style={styles.previewLabel}>حجم صغير (favicon)</span>
              <div style={{ ...styles.previewArea, background: "#080D18", minHeight: 80 }}>
                <img
                  src={selected.src}
                  alt={selected.name}
                  style={{
                    ...(selected.type === "svg" ? styles.previewSvg : styles.previewPng),
                    maxHeight: 32,
                    maxWidth: 100,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <p>اضغط على أي شعار لمعاينة التفاصيل والمقارنة 👆</p>
      </footer>
    </div>
  );
}

/* ── Styles ── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #050A14 0%, #0A1628 40%, #0F172A 100%)",
    color: "#E2E8F0",
    fontFamily: "Cairo, 'Segoe UI', Arial, sans-serif",
    padding: "0 0 60px 0",
  },
  header: {
    position: "relative",
    textAlign: "center",
    padding: "48px 24px 32px",
    overflow: "hidden",
  },
  headerGlow: {
    position: "absolute",
    top: "-50%",
    left: "50%",
    transform: "translateX(-50%)",
    width: 600,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(ellipse, rgba(20,184,166,0.15) 0%, transparent 70%)",
    pointerEvents: "none" as const,
  },
  title: {
    fontSize: 36,
    fontWeight: 800,
    margin: 0,
    background: "linear-gradient(135deg, #67E8F9 0%, #14B8A6 50%, #A78BFA 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    position: "relative" as const,
  },
  titleIcon: {
    WebkitTextFillColor: "initial",
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
    marginTop: 8,
  },
  filterBar: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
    padding: "0 24px 32px",
    flexWrap: "wrap" as const,
  },
  filterBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 18px",
    borderRadius: 24,
    border: "1px solid rgba(100,116,139,0.3)",
    background: "rgba(15,23,42,0.6)",
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  filterBtnActive: {
    borderColor: "#14B8A6",
    background: "rgba(20,184,166,0.15)",
    color: "#5EEAD4",
    boxShadow: "0 0 20px rgba(20,184,166,0.2)",
  },
  filterCount: {
    fontSize: 11,
    fontWeight: 700,
    background: "rgba(100,116,139,0.2)",
    padding: "2px 7px",
    borderRadius: 10,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: 20,
    padding: "0 24px",
    maxWidth: 1400,
    margin: "0 auto",
  },
  card: {
    background: "rgba(15,23,42,0.7)",
    border: "1px solid rgba(100,116,139,0.2)",
    borderRadius: 16,
    padding: 20,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative" as const,
    overflow: "hidden",
    backdropFilter: "blur(12px)",
  },
  cardHovered: {
    borderColor: "rgba(103,232,249,0.4)",
    transform: "translateY(-4px)",
    boxShadow: "0 12px 40px rgba(20,184,166,0.15)",
  },
  cardSelected: {
    borderColor: "#14B8A6",
    boxShadow: "0 0 30px rgba(20,184,166,0.25), inset 0 0 30px rgba(20,184,166,0.05)",
  },
  categoryBadge: {
    position: "absolute" as const,
    top: 12,
    left: 12,
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 10,
    background: "rgba(30,41,59,0.8)",
    border: "1px solid rgba(100,116,139,0.25)",
    color: "#94A3B8",
  },
  logoPreview: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    padding: "16px 8px",
    borderRadius: 12,
    background: "radial-gradient(ellipse at center, rgba(8,13,24,0.9) 0%, rgba(15,23,42,0.6) 100%)",
    marginBottom: 16,
    border: "1px solid rgba(51,65,85,0.3)",
  },
  svgLogo: {
    maxWidth: "100%",
    maxHeight: 80,
    filter: "drop-shadow(0 0 8px rgba(20,184,166,0.3))",
  },
  pngLogo: {
    maxWidth: "85%",
    maxHeight: 100,
    objectFit: "contain" as const,
    borderRadius: 8,
    filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.4))",
  },
  cardInfo: {
    textAlign: "center" as const,
  },
  cardName: {
    fontSize: 20,
    fontWeight: 800,
    margin: "0 0 2px",
    color: "#F1F5F9",
  },
  cardNameEn: {
    fontSize: 12,
    fontWeight: 500,
    color: "#64748B",
    letterSpacing: "0.5px",
    display: "block",
    marginBottom: 8,
  },
  cardTagline: {
    fontSize: 14,
    color: "#5EEAD4",
    fontWeight: 600,
    margin: 0,
    fontStyle: "italic" as const,
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: "1px solid rgba(100,116,139,0.2)",
    animation: "fadeIn 0.3s ease",
  },
  description: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#CBD5E1",
    margin: "0 0 14px",
  },
  strengthsSection: {
    marginBottom: 12,
  },
  strengthsLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#94A3B8",
    display: "block",
    marginBottom: 6,
  },
  strengthsList: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 6,
  },
  strengthTag: {
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: 14,
    background: "rgba(20,184,166,0.12)",
    border: "1px solid rgba(20,184,166,0.25)",
    color: "#5EEAD4",
  },
  bestForSection: {
    padding: "10px 14px",
    borderRadius: 10,
    background: "rgba(59,130,246,0.08)",
    border: "1px solid rgba(59,130,246,0.15)",
  },
  bestForLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#93C5FD",
  },
  bestForText: {
    fontSize: 13,
    color: "#CBD5E1",
  },
  comparisonPanel: {
    maxWidth: 1000,
    margin: "40px auto 0",
    padding: "0 24px",
  },
  comparisonTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#F1F5F9",
    textAlign: "center" as const,
    marginBottom: 20,
  },
  comparisonContent: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
  },
  previewBox: {
    textAlign: "center" as const,
  },
  previewLabel: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#64748B",
    marginBottom: 8,
  },
  previewArea: {
    borderRadius: 12,
    border: "1px solid rgba(100,116,139,0.25)",
    padding: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  previewSvg: {
    maxWidth: "100%",
    maxHeight: 72,
  },
  previewPng: {
    maxWidth: "90%",
    maxHeight: 100,
    objectFit: "contain" as const,
    borderRadius: 6,
  },
  footer: {
    textAlign: "center" as const,
    padding: "40px 24px 0",
    color: "#475569",
    fontSize: 14,
  },
};
