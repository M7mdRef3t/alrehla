"use client";

import React, { useState, useCallback } from "react";
import {
  getStaticQuickPath,
  resolvePathId,
  PATH_NAMES,
  PATH_DESCRIPTIONS,
  SITUATION_LABELS,
  SITUATION_ICONS,
} from "@alrehla/masarat";
import type {
  QuickPathSituation,
  QuickPathResult,
  PathId,
  Ring,
  ContactLevel,
} from "@alrehla/masarat";
import { eventBus } from "@/shared/events/bus";


// ─── Constants ─────────────────────────────────────────
const PATH_ICONS: Record<PathId, string> = {
  path_protection:  "🛡️",
  path_detox:       "🌿",
  path_negotiation: "🤝",
  path_deepening:   "🌱",
  path_sos:         "🚨",
};

const PATH_COLORS: Record<PathId, string> = {
  path_protection:  "#ef4444",
  path_detox:       "#10b981",
  path_negotiation: "#f59e0b",
  path_deepening:   "#22c55e",
  path_sos:         "#dc2626",
};

const RING_LABELS: Record<Ring, { ar: string; color: string; icon: string }> = {
  red:    { ar: "منطقة حمراء — علاقة مؤلمة",  color: "#ef4444", icon: "🔴" },
  yellow: { ar: "منطقة صفراء — علاقة صعبة",  color: "#f59e0b", icon: "🟡" },
  green:  { ar: "منطقة خضراء — علاقة صحية",  color: "#22c55e", icon: "🟢" },
};

const CONTACT_LABELS: Record<ContactLevel, { ar: string; icon: string }> = {
  high:   { ar: "احتكاك عالٍ — تتعامل معه كثيراً", icon: "🔥" },
  medium: { ar: "احتكاك متوسط — أحياناً",          icon: "☁️" },
  low:    { ar: "احتكاك قليل — نادراً",              icon: "🌬️" },
  none:   { ar: "لا احتكاك — قطعت التواصل",          icon: "🚫" },
};

type Mode = "home" | "quick" | "finder" | "result";

// ─── Component ─────────────────────────────────────────
export default function MasaratScreen() {
  const [mode, setMode] = useState<Mode>("home");
  const [selectedSituation, setSelectedSituation] = useState<QuickPathSituation | null>(null);
  const [quickResult, setQuickResult] = useState<QuickPathResult | null>(null);
  const [selectedRing, setSelectedRing] = useState<Ring | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactLevel | null>(null);
  const [resolvedPath, setResolvedPath] = useState<PathId | null>(null);


  // ── Quick Path handler ──
  const handleQuickPath = useCallback((situation: QuickPathSituation) => {
    const result = getStaticQuickPath(situation);
    setSelectedSituation(situation);
    setQuickResult(result);
    eventBus.emit("masarat:quick_path_used", { situation });
  }, []);

  // ── Path Finder handler ──
  const handleResolvePath = useCallback((ringOverride?: Ring, contactOverride?: ContactLevel) => {
    const ring = ringOverride || selectedRing;
    const contact = contactOverride || selectedContact;
    if (!ring || !contact) return;

    const pathId = resolvePathId({
      zone: ring,
      contact: contact,
    });
    setResolvedPath(pathId);
    setMode("result");
    eventBus.emit("masarat:path_resolved", { pathId });
  }, [selectedRing, selectedContact]);

  const handleSaveActivePath = useCallback(() => {
    if (!resolvedPath) return;
    try {
      localStorage.setItem("masarat-active-path", resolvedPath);
    } catch { /* noop */ }
    eventBus.emit("masarat:path_activated", { pathId: resolvedPath });
  }, [resolvedPath]);

  // ─── Render modes ───────────────────────────────────
  return (
    <div style={S.pageWrapper}>
      <div style={S.pageContainer}>
        {/* Header */}
      <header style={S.header}>
        {mode !== "home" && (
          <button style={S.backBtn} onClick={() => {
            setMode("home");
            setQuickResult(null);
            setSelectedSituation(null);
            setResolvedPath(null);
          }}>
            ← رجوع
          </button>
        )}
        <div style={S.headerCenter}>
          <h1 style={S.title}>🧭 مسارات</h1>
          <p style={S.subtitle}>دليلك في رحلة الحدود والعلاقات</p>
        </div>
      </header>

      {/* Home */}
      {mode === "home" && <HomeMode onQuick={() => setMode("quick")} onFinder={() => setMode("finder")} />}

      {/* Quick Path */}
      {mode === "quick" && !quickResult && (
        <QuickMode onSelect={handleQuickPath} />
      )}
      {mode === "quick" && quickResult && selectedSituation && (
        <QuickResult
          result={quickResult}
          situation={selectedSituation}
          onBack={() => { setQuickResult(null); setSelectedSituation(null); }}
        />
      )}

      {/* Path Finder */}
      {mode === "finder" && (
        <FinderMode
          selectedRing={selectedRing}
          setSelectedRing={setSelectedRing}
          selectedContact={selectedContact}
          setSelectedContact={setSelectedContact}
          onResolve={handleResolvePath}
          canResolve={!!selectedRing && !!selectedContact}
        />
      )}

      {/* Result */}
      {mode === "result" && resolvedPath && (
        <PathResult pathId={resolvedPath} onSave={handleSaveActivePath} />
      )}
      </div>
    </div>
  );
}

// ─── Home Mode ─────────────────────────────────────────
function HomeMode({ onQuick, onFinder }: { onQuick: () => void; onFinder: () => void }) {
  const activePath = typeof window !== "undefined"
    ? (localStorage.getItem("masarat-active-path") as PathId | null)
    : null;

  return (
    <div style={S.content}>
      {/* Philosophy Banner */}
      <div style={S.philosophyBanner}>
        <span style={S.philosophyIcon}>💡</span>
        <p style={S.philosophyText}>
          <strong>كل التعافي حدود</strong><br />
          حدود خارجية مع الشخص، وحدود داخلية مع النفس.
        </p>
      </div>

      {/* Active Path Card */}
      {activePath && (
        <div style={{
          ...S.card,
          borderColor: PATH_COLORS[activePath],
          borderWidth: 2,
          marginBottom: 20,
        }}>
          <div style={S.cardRow}>
            <span style={{ fontSize: 28 }}>{PATH_ICONS[activePath]}</span>
            <div>
              <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>مسارك النشط</p>
              <p style={{ fontSize: 17, fontWeight: 700, margin: 0, color: PATH_COLORS[activePath] }}>
                {PATH_NAMES[activePath]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mode Buttons */}
      <div style={S.modeGrid}>
        <ModeCard
          icon="⚡"
          title="المسار السريع"
          subtitle="لحظة طوارئ — محتاج رد فوري"
          color="#ef4444"
          onClick={onQuick}
        />
        <ModeCard
          icon="🗺️"
          title="اكتشف مسارك"
          subtitle="حدد علاقتك واحصل على خطة مخصصة"
          color="#2dd4bf"
          onClick={onFinder}
        />
      </div>

      {/* 5 Paths Info */}
      <div style={{ marginTop: 28 }}>
        <h2 style={{ ...S.sectionTitle, marginBottom: 14 }}>🌟 المسارات الخمسة</h2>
        {(Object.keys(PATH_NAMES) as PathId[]).map(pathId => (
          <div key={pathId} style={S.pathRow}>
            <span style={{ fontSize: 22 }}>{PATH_ICONS[pathId]}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: PATH_COLORS[pathId] }}>
                {PATH_NAMES[pathId]}
              </p>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.65, lineHeight: 1.4, marginTop: 2 }}>
                {PATH_DESCRIPTIONS[pathId].substring(0, 80)}...
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quick Mode ────────────────────────────────────────
function QuickMode({ onSelect }: { onSelect: (s: QuickPathSituation) => void }) {
  const situations: QuickPathSituation[] = ["pressure", "guilt", "anger", "overwhelmed", "boundary", "escape"];

  return (
    <div style={S.content}>
      <div style={S.urgentBanner}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
          ⚡ أنت في موقف صعب — اختر اللي بيحصل معاك
        </p>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          مش محتاج تفكر كتير — اختر وهتاخد رد فوري
        </p>
      </div>
      <div style={S.situationGrid}>
        {situations.map(sit => (
          <button key={sit} style={S.situationBtn} onClick={() => onSelect(sit)}>
            <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>
              {SITUATION_ICONS[sit]}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{SITUATION_LABELS[sit]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Quick Result ──────────────────────────────────────
function QuickResult({ result, situation, onBack }: {
  result: QuickPathResult;
  situation: QuickPathSituation;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.exitPhrase).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={S.content}>
      <div style={S.resultHeader}>
        <span style={{ fontSize: 40 }}>{SITUATION_ICONS[situation]}</span>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{SITUATION_LABELS[situation]}</h2>
      </div>

      <div style={{ ...S.card, borderColor: "#ef4444", borderLeftWidth: 4 }}>
        <p style={S.cardLabel}>🗣️ قول فوراً</p>
        <p style={S.exitPhrase}>{result.exitPhrase}</p>
        <button style={S.copyBtn} onClick={handleCopy}>
          {copied ? "✓ تم النسخ" : "📋 انسخ العبارة"}
        </button>
      </div>

      <div style={{ ...S.card, marginTop: 16 }}>
        <p style={S.cardLabel}>🌬️ تنفّس</p>
        <p style={S.cardText}>{result.breathingCue}</p>
      </div>

      <div style={{ ...S.card, marginTop: 16 }}>
        <p style={S.cardLabel}>👣 الخطوة التالية</p>
        <p style={S.cardText}>{result.followUpAction}</p>
      </div>

      <button style={S.backActionBtn} onClick={onBack}>
        🔄 موقف تاني
      </button>
    </div>
  );
}

// ─── Finder Mode ───────────────────────────────────────
function FinderMode({
  selectedRing, setSelectedRing,
  selectedContact, setSelectedContact,
  onResolve, canResolve,
}: {
  selectedRing: Ring | null;
  setSelectedRing: (r: Ring) => void;
  selectedContact: ContactLevel | null;
  setSelectedContact: (c: ContactLevel) => void;
  onResolve: (ring?: Ring, contact?: ContactLevel) => void;
  canResolve: boolean;
}) {
  return (
    <div style={S.content}>
      <div style={S.finderBanner}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
          🗺️ احنا هنحدد مسارك المناسب
        </p>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          سؤالين بس — وهتعرف خطتك
        </p>
      </div>

      {/* Question 1: Ring */}
      <div style={S.questionBlock}>
        <h3 style={S.questionTitle}>① العلاقة دي في أي منطقة؟</h3>
        <div style={S.optionsList}>
          {(["red", "yellow", "green"] as Ring[]).map(ring => (
            <button
              key={ring}
              style={{
                ...S.optionBtn,
                borderColor: selectedRing === ring ? RING_LABELS[ring].color : "rgba(255,255,255,0.1)",
                backgroundColor: selectedRing === ring ? `${RING_LABELS[ring].color}18` : "transparent",
              }}
              onClick={() => setSelectedRing(ring)}
            >
              <span style={{ fontSize: 22 }}>{RING_LABELS[ring].icon}</span>
              <span style={S.optionText}>{RING_LABELS[ring].ar}</span>
              {selectedRing === ring && <span style={{ color: RING_LABELS[ring].color }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Question 2: Contact (shown after ring selected) */}
      {selectedRing && (
        <div style={S.questionBlock}>
          <h3 style={S.questionTitle}>② مدى الاحتكاك مع الشخص ده؟</h3>
          <div style={S.optionsList}>
            {(["high", "medium", "low", "none"] as ContactLevel[]).map(c => (
              <button
                key={c}
                style={{
                  ...S.optionBtn,
                  borderColor: selectedContact === c ? "#2dd4bf" : "rgba(255,255,255,0.1)",
                  backgroundColor: selectedContact === c ? "#2dd4bf18" : "transparent",
                }}
                onClick={() => {
                  setSelectedContact(c);
                  // ⚡ الانتقال التلقائي: تأخير بسيط عشان يلحق يشوف الاختيار
                  setTimeout(() => onResolve(selectedRing!, c), 400);
                }}
              >
                <span style={{ fontSize: 20 }}>{CONTACT_LABELS[c].icon}</span>
                <span style={S.optionText}>{CONTACT_LABELS[c].ar}</span>
                {selectedContact === c && <span style={{ color: "#2dd4bf" }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Path Result ───────────────────────────────────────
function PathResult({ pathId, onSave }: { pathId: PathId; onSave: () => void }) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setSaved(true);
  };

  return (
    <div style={S.content}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <span style={{ fontSize: 64, display: "block", marginBottom: 12 }}>
          {PATH_ICONS[pathId]}
        </span>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: PATH_COLORS[pathId], margin: 0 }}>
          {PATH_NAMES[pathId]}
        </h2>
        <p style={{ fontSize: 13, opacity: 0.6, marginTop: 8 }}>هذا مسارك المناسب</p>
      </div>

      <div style={{ ...S.card, borderColor: PATH_COLORS[pathId], borderLeftWidth: 4 }}>
        <p style={S.cardLabel}>📋 وصف المسار</p>
        <p style={{ ...S.cardText, lineHeight: 1.7 }}>
          {PATH_DESCRIPTIONS[pathId]}
        </p>
      </div>

      {/* Philosophy note per path */}
      <div style={{ ...S.card, marginTop: 16, backgroundColor: "rgba(255,255,255,0.03)" }}>
        <p style={S.cardLabel}>🌟 خلاصة الحكمة</p>
        <p style={S.cardText}>
          {pathId === "path_protection" && "\"الحدود الخارجية درع — مش هجوم. قول لأ هو عطاء لنفسك.\""}
          {pathId === "path_detox" && "\"الصيام الشعوري ليس بُعداً — هو عودة لنفسك. عقلك يحتاج هدوء.\""}
          {pathId === "path_negotiation" && "\"المسافة الصحية تحفظ العلاقة — قرّب ما ينفع وابعد ما يضر.\""}
          {pathId === "path_deepening" && "\"علاقة خضراء كنز — استثمر فيها بوعي وصدق.\""}
          {pathId === "path_sos" && "\"سلامتك فوق كل شيء — اطلب المساعدة الآن. مش وقت الصمت.\""}
        </p>
      </div>

      <button
        style={{
          ...S.resolveBtn,
          backgroundColor: saved ? "#10b981" : PATH_COLORS[pathId],
          marginTop: 24,
        }}
        onClick={handleSave}
        disabled={saved}
      >
        {saved ? "✓ تم حفظ المسار" : "💾 احفظ هذا المسار"}
      </button>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────
function ModeCard({ icon, title, subtitle, color, onClick }: {
  icon: string; title: string; subtitle: string; color: string; onClick: () => void;
}) {
  return (
    <button style={{ ...S.modeCard, borderColor: color }} onClick={onClick}>
      <span style={{ fontSize: 36, marginBottom: 10, display: "block" }}>{icon}</span>
      <span style={{ ...S.modeName, color }}>{title}</span>
      <span style={S.modeSubtitle}>{subtitle}</span>
    </button>
  );
}

// ─── Styles ────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0e1f 0%, #0f172a 100%)",
    color: "#e2e8f0",
    fontFamily: "'Tajawal', 'Inter', sans-serif",
    direction: "rtl",
    paddingTop: 80,
    paddingBottom: 80,
  },
  pageContainer: {
    maxWidth: 640,
    margin: "0 auto",
  },
  header: {
    padding: "20px 20px 12px",
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  backBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#94a3b8",
    padding: "6px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "inherit",
  },
  headerCenter: { flex: 1 },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    background: "linear-gradient(135deg, #2dd4bf, #60a5fa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subtitle: {
    margin: 0,
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },

  content: {
    padding: "20px 20px",
  },

  philosophyBanner: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(45,212,191,0.06)",
    border: "1px solid rgba(45,212,191,0.15)",
    marginBottom: 24,
  },
  philosophyIcon: { fontSize: 24, flexShrink: 0 },
  philosophyText: { margin: 0, fontSize: 14, lineHeight: 1.6 },

  modeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  modeCard: {
    padding: "20px 14px",
    borderRadius: 16,
    border: "2px solid",
    background: "rgba(255,255,255,0.03)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    textAlign: "center" as const,
    transition: "transform 0.2s ease, background 0.2s ease",
    fontFamily: "inherit",
  },
  modeName: { fontSize: 15, fontWeight: 800, marginBottom: 6 },
  modeSubtitle: { fontSize: 12, opacity: 0.6, lineHeight: 1.4 },

  sectionTitle: { fontSize: 17, fontWeight: 700 },

  pathRow: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },

  // Quick mode
  urgentBanner: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    marginBottom: 24,
  },
  situationGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
  },
  situationBtn: {
    padding: "16px 10px",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    cursor: "pointer",
    color: "#e2e8f0",
    fontFamily: "inherit",
    transition: "all 0.2s ease",
    textAlign: "center" as const,
  },

  // Results
  resultHeader: {
    textAlign: "center" as const,
    marginBottom: 24,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 10,
  },
  card: {
    padding: 18,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  cardRow: {
    display: "flex",
    gap: 14,
    alignItems: "center",
  },
  cardLabel: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    opacity: 0.7,
    marginBottom: 10,
  },
  cardText: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.7,
  },
  exitPhrase: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 1.5,
    color: "#f1f5f9",
  },
  copyBtn: {
    marginTop: 12,
    padding: "8px 18px",
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#fca5a5",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "inherit",
  },
  backActionBtn: {
    marginTop: 20,
    width: "100%",
    padding: "12px",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: 15,
    fontFamily: "inherit",
    fontWeight: 600,
  },

  // Finder
  finderBanner: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(45,212,191,0.06)",
    border: "1px solid rgba(45,212,191,0.15)",
    marginBottom: 24,
  },
  questionBlock: { marginBottom: 24 },
  questionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 14,
    color: "#94a3b8",
  },
  optionsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  optionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    borderRadius: 12,
    border: "2px solid",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#e2e8f0",
    fontFamily: "inherit",
    textAlign: "right" as const,
    transition: "all 0.2s ease",
  },
  optionText: { flex: 1, fontSize: 14, fontWeight: 600 },

  resolveBtn: {
    width: "100%",
    padding: "16px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #2dd4bf, #60a5fa)",
    color: "#0a0e1f",
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: 8,
    transition: "opacity 0.2s ease",
  },
};
