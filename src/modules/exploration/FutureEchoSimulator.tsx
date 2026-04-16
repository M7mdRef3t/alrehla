import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, GitBranch, Zap, HeartPulse, AlertTriangle, ShieldCheck } from "lucide-react";

interface FutureEchoSimulatorProps {
  patternTitle: string;
  onClose: () => void;
}

export const FutureEchoSimulator: FC<FutureEchoSimulatorProps> = ({ patternTitle, onClose }) => {
  // null = initial split screen, "collapse" = negative path, "healing" = positive path
  const [reality, setReality] = useState<"collapse" | "healing" | null>(null);

  const healingData = {
    id: "healing",
    title: "مسار التشافي (Synthesis)",
    date: "بعد ٦ أشهر",
    description: `لأنك اخترت اليوم كسر نمط «${patternTitle}»، زادت مساحة الأمان. لم تعد تهرب في لحظات الضغط، بل أصبحت تواجه بصدق.`,
    metrics: [
      { label: "عمق الاتصال", value: "+80%", color: "#10B981" },
      { label: "حاجز التوتر", value: "-60%", color: "#34D399" }
    ],
    bg: "rgba(16,185,129,0.03)",
    border: "rgba(16,185,129,0.2)",
    accent: "#10b981",
    Icon: ShieldCheck,
  };

  const collapseData = {
    id: "collapse",
    title: "مسار العزلة (The Drift)",
    date: "بعد ٦ أشهر",
    description: `استمرارك في نمط «${patternTitle}» خلق هوة صامتة. المسافة زادت والكلمات قلت، وأصبح التباعد هو الحل السهل لكل خلاف.`,
    metrics: [
      { label: "جدار الصمت", value: "+90%", color: "#F43F5E" },
      { label: "الأمان العاطفي", value: "-75%", color: "#FB7185" }
    ],
    bg: "rgba(244,63,94,0.03)",
    border: "rgba(244,63,94,0.2)",
    accent: "#f43f5e",
    Icon: AlertTriangle,
  };

  const activeData = reality === "healing" ? healingData : reality === "collapse" ? collapseData : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(5,8,16,0.95)", backdropFilter: "blur(40px)",
        display: "flex", flexDirection: "column",
        color: "white"
      }}
      dir="rtl"
    >
      {/* Header */}
      <div style={{ padding: "24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, padding: 8, cursor: "pointer", color: "#94a3b8"
        }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
            <GitBranch size={18} color="#A78BFA" /> صدى المستقبل
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b" }}>
            كيف سيشكل نمط «{patternTitle}» شكل العلاقة بعد ٦ أشهر؟
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px", paddingBottom: 40 }}>
        
        {/* Initial Choice (Bifurcation) */}
        <AnimatePresence mode="wait">
          {!reality ? (
            <motion.div key="split" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p style={{ textAlign: "center", fontSize: 14, color: "#94a3b8", marginBottom: 32, fontWeight: 700 }}>
                اختر مساراً لرؤية النتيجة...
              </p>
              <div style={{ display: "flex", gap: 16, flexDirection: "column" }}>
                <button onClick={() => setReality("collapse")} style={{
                  padding: "24px", borderRadius: 24, textAlign: "right",
                  background: "linear-gradient(135deg, rgba(244,63,94,0.05), rgba(244,63,94,0.01))",
                  border: "1px solid rgba(244,63,94,0.2)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 16
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(244,63,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", shrink: 0 }}>
                    <AlertTriangle size={24} color="#f43f5e" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#f43f5e" }}>استمرار النمط</h3>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>ماذا لو استسلمت لنمط «{patternTitle}» ولم تغيره؟</p>
                  </div>
                </button>

                <button onClick={() => setReality("healing")} style={{
                  padding: "24px", borderRadius: 24, textAlign: "right",
                  background: "linear-gradient(135deg, rgba(16,185,129,0.05), rgba(16,185,129,0.01))",
                  border: "1px solid rgba(16,185,129,0.2)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 16
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", shrink: 0 }}>
                    <ShieldCheck size={24} color="#10b981" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#10b981" }}>كسر النمط</h3>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>ماذا لو قاومت رغبتك المعتادة وبدأت رحلة التغيير اليوم؟</p>
                  </div>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div style={{
                background: activeData!.bg, border: `1px solid ${activeData!.border}`,
                borderRadius: 32, padding: "32px 24px", textAlign: "center"
              }}>
                <activeData.Icon size={48} color={activeData!.accent} style={{ margin: "0 auto 16px", display: "block" }} />
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: activeData!.accent }}>{activeData!.title}</h3>
                <p style={{ margin: "8px 0 24px", fontSize: 12, color: "#64748b", fontWeight: 700 }}>{activeData!.date}</p>
                <p style={{ margin: "0 auto 32px", fontSize: 14, color: "#e2e8f0", lineHeight: 1.8, maxWidth: 300 }}>
                  {activeData!.description}
                </p>

                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  {activeData!.metrics.map((m, i) => (
                    <div key={i} style={{
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                      padding: "16px", borderRadius: 20, flex: 1, maxWidth: 140
                    }}>
                      <span style={{ fontSize: 22, fontWeight: 900, color: m.color, display: "block", marginBottom: 4 }}>{m.value}</span>
                      <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24 }}>
                <button onClick={() => setReality(null)} style={{
                  padding: "16px 24px", borderRadius: 16, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontWeight: 800, cursor: "pointer",
                  fontSize: 12
                }}>
                  رؤية السيناريو الآخر
                </button>
                <button onClick={onClose} style={{
                  padding: "16px 24px", borderRadius: 16, background: `rgba(255,255,255,0.1)`,
                  border: `1px solid rgba(255,255,255,0.2)`, color: "#fff", fontWeight: 800, cursor: "pointer",
                  fontSize: 12
                }}>
                  فهمت الرسالة
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
