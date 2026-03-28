/**
 * Guilt Court — محكمة الذنب ⚖️
 * يساعد المستخدم على مواجهة مشاعر الذنب بطريقة تفاعلية وعادلة.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gavel, ShieldCheck, Scale, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { soundManager } from "../services/soundManager";
import { trackStartTrial } from "../services/analytics";
import { useJourneyState } from "../state/journeyState";
import { userTrialsService } from "../services/userTrialsService";

interface GuiltCourtProps {
  onBack?: () => void;
}

type TrialStage = "prosecution" | "defense" | "verdict";

export const GuiltCourt: React.FC<GuiltCourtProps> = ({ onBack }) => {
  const [charge, setCharge] = useState("");
  const [stage, setStage] = useState<TrialStage | "entry">("entry");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const mirrorName = useJourneyState((s) => s.mirrorName);

  const startTrial = () => {
    if (!charge.trim()) return;
    soundManager.playEffect("gavel");
    trackStartTrial({
      content_name: "guilt_court_start_trial",
      content_category: "trial_flow",
      trial_context: "guilt_court"
    });
    setStage("prosecution");
  };

  const resetCourt = () => {
    setCharge("");
    setStage("entry");
    setSaveError(false);
  };

  const handleVerdict = async () => {
    setIsSaving(true);
    soundManager.playEffect("gavel");
    
    const result = await userTrialsService.saveTrialResult({
      charge,
      defense_points: [
        "الحفاظ على الطاقة ليس جريمة",
        "مبدأ المسؤولية الفردية"
      ],
      verdict: "براءة استراتيجية"
    });

    setIsSaving(false);
    if (!result) setSaveError(true);
    setStage("verdict");
  };

  return (
    <div className="min-h-screen text-slate-200 flex flex-col font-sans relative overflow-hidden" style={{ background: "var(--space-void)" }} dir="rtl">
      {/* Cinematic Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: "radial-gradient(circle at 10% 10%, rgba(45,212,191,0.1) 0%, transparent 50%), radial-gradient(circle at 90% 90%, rgba(139,92,246,0.1) 0%, transparent 50%)" }} />
      <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      {/* Header with back button */}
      <header className="flex items-center gap-3 p-6 border-b border-white/5">
        {onBack && (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="رجوع"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center border" style={{ background: "rgba(45,212,191,0.1)", borderColor: "rgba(45,212,191,0.3)" }}>
          <Gavel className="w-5 h-5" style={{ color: "var(--soft-teal)" }} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">محكمة الذنب</h1>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            {mirrorName ? `جاري مراجعة ذمة: ${mirrorName}` : "براءة استراتيجية"}
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-6">
        <AnimatePresence mode="wait">
          {stage === "entry" && (
            <motion.div
              key="entry"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="rounded-3xl p-8 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                <h2 className="text-xl font-bold text-white mb-2 text-right">
                  ما الذي تشعر بالذنب تجاهه؟
                </h2>
                <p className="text-sm mb-6 text-right" style={{ color: "var(--text-secondary)" }}>
                  اكتب بحرية — المحكمة آمنة وسرية تماماً.
                </p>
                <textarea
                  className="w-full h-32 rounded-2xl p-4 text-right text-lg outline-none resize-none transition-all"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "var(--text-primary)"
                  }}
                  placeholder="مثال: أشعر بالذنب لأنني لم أرد على اتصال والدي..."
                  value={charge}
                  onChange={(e) => setCharge(e.target.value)}
                  onFocus={(e) => { e.target.style.borderColor = "var(--soft-teal)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.06)"; }}
                />
                <button
                  onClick={startTrial}
                  disabled={!charge.trim()}
                  className="w-full mt-6 py-4 font-black rounded-2xl transition-all flex items-center justify-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "var(--soft-teal)", color: "var(--space-void)" }}
                >
                  ابدأ المحاكمة
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
                "الشعور بالذنب يضعك تحت محاكمة ظالمة داخل رأسك — لنجعلها عادلة."
              </p>
            </motion.div>
          )}

          {stage === "prosecution" && (
            <motion.div
              key="prosecution"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-6"
            >
              <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
                <AlertCircle className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                <div className="text-right">
                  <h3 className="font-bold text-red-400 text-sm uppercase mb-1">صوت الاتهام الداخلي {mirrorName && `ـ ${mirrorName}`}</h3>
                  <p className="text-slate-300">"{charge}"</p>
                </div>
              </div>

              <div className="glass-card p-8 border-white/5 space-y-6 text-right">
                <p className="text-lg text-white font-medium leading-relaxed">
                  هذا الصوت يقول إنك "مقصّر" أو "أناني". لكن قبل الحكم، نسأل:
                  ما الفرق بين <strong style={{ color: "var(--soft-teal)" }}>التقصير الحقيقي</strong> و
                  <strong style={{ color: "var(--warm-amber)" }}> الحفاظ على طاقتك</strong> بشكل مشروع؟
                </p>
                <button
                  onClick={() => setStage("defense")}
                  className="w-full py-4 font-bold rounded-2xl transition-all"
                  style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)", color: "var(--soft-teal)" }}
                >
                  استدعاء المحامي الاستراتيجي 🛡️
                </button>
              </div>
            </motion.div>
          )}

          {stage === "defense" && (
            <motion.div
              key="defense"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 text-right"
            >
              <div className="flex items-center gap-3 justify-end mb-6">
                <h2 className="text-2xl font-black text-white">دفاع استراتيجي</h2>
                <ShieldCheck className="w-8 h-8 text-teal-400" />
              </div>

              <div className="space-y-4">
                <DefenseArgument
                  title="الحفاظ على الطاقة ليس جريمة"
                  text="بعض القرارات التي تستنزف طاقتك قد تبدو واجبات — لكن تعاملك مع نفسك باحتياط هو فرضية استراتيجية، ليس أنانية."
                />
                <DefenseArgument
                  title="مبدأ المسؤولية الفردية"
                  text="أنت مسؤول عن استمرارك الصحي — ليس عن إخماد مخاوف الآخرين الناتجة عن أسلوب تواصلهم."
                />
              </div>

              <button
                onClick={handleVerdict}
                disabled={isSaving}
                className="w-full mt-8 py-4 font-black rounded-2xl flex items-center justify-center gap-2 text-slate-950 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ background: "var(--soft-teal)" }}
              >
                {isSaving ? "جاري تسجيل الحكم في السجلات..." : "إصدار الحكم"}
                <Scale className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {stage === "verdict" && (
            <motion.div
              key="verdict"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-10"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto animate-pulse"
                style={{ background: "rgba(45,212,191,0.15)", border: "2px solid var(--soft-teal)" }}
              >
                <Gavel className="w-12 h-12" style={{ color: "var(--soft-teal)" }} />
              </div>

              <h1 className="text-4xl font-black text-white tracking-tight">
                حكم المحكمة: <span style={{ color: "var(--soft-teal)" }}>براءة استراتيجية</span>
              </h1>

              <div className="rounded-3xl p-8 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="text-xl leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>
                  "بناءً على الأدلة، تبيّن أن شعورك بالذنب هو{" "}
                  <strong className="text-white">رد فعل عاطفي</strong> وليس دليلاً على خطأ حقيقي. أنت لا تؤذي أحداً — أنت فقط تتوقف عن إيذاء نفسك."
                </p>
                
                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-teal-400 opacity-60">
                   <ShieldCheck className="w-3 h-3" />
                   {saveError ? "تم التسجيل محلياً (خطأ في المزامنة)" : "تم حفظ الحكم في سجلاتك السيادية"}
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={resetCourt}
                  className="px-8 py-3 rounded-full font-bold transition-all hover:opacity-90"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}
                >
                  محاكمة جديدة
                </button>
                {onBack && (
                  <button
                    onClick={onBack}
                    className="px-8 py-3 rounded-full font-bold transition-all hover:opacity-90"
                    style={{ background: "var(--soft-teal)", color: "var(--space-void)" }}
                  >
                    العودة للأدوات
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const DefenseArgument = ({ title, text }: { title: string; text: string }) => (
  <div
    className="p-6 rounded-2xl transition-all"
    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(45,212,191,0.2)"; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
  >
    <h3 className="font-black text-sm mb-2 uppercase tracking-wide" style={{ color: "var(--soft-teal)" }}>{title}</h3>
    <p className="leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>{text}</p>
  </div>
);
