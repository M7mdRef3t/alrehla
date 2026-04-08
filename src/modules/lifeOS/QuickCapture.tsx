"use client";

import { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, AlertTriangle, Brain, Lightbulb, Trophy, BookOpen, Target } from "lucide-react";
import { LIFE_DOMAINS, type LifeDomainId, type LifeEntryType } from "@/types/lifeDomains";
import { useLifeState } from "@/state/lifeState";

const ENTRY_TYPES: { id: LifeEntryType; label: string; icon: React.ReactNode; color: string; placeholder: string }[] = [
  {
    id: "thought",
    label: "فكرة",
    icon: <Lightbulb className="w-4 h-4" />,
    color: "#8b5cf6",
    placeholder: "إيه اللي في بالك دلوقتي؟"
  },
  {
    id: "problem",
    label: "مشكلة",
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "#ef4444",
    placeholder: "إيه اللي مضايقك أو واقفك؟"
  },
  {
    id: "decision",
    label: "قرار",
    icon: <Brain className="w-4 h-4" />,
    color: "#f59e0b",
    placeholder: "إيه القرار اللي محيرك؟"
  },
  {
    id: "goal",
    label: "هدف",
    icon: <Target className="w-4 h-4" />,
    color: "#06b6d4",
    placeholder: "إيه اللي عايز تحققه؟"
  },
  {
    id: "win",
    label: "إنجاز",
    icon: <Trophy className="w-4 h-4" />,
    color: "#10b981",
    placeholder: "إيه اللي عملته وحسيت بيه بإنجاز؟"
  },
  {
    id: "lesson",
    label: "درس",
    icon: <BookOpen className="w-4 h-4" />,
    color: "#ec4899",
    placeholder: "إيه اللي اتعلمته النهاردة؟"
  }
];

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCapture = memo(function QuickCapture({ isOpen, onClose }: QuickCaptureProps) {
  const [selectedType, setSelectedType] = useState<LifeEntryType>("thought");
  const [selectedDomain, setSelectedDomain] = useState<LifeDomainId>("self");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const addEntry = useLifeState((s) => s.addEntry);
  const addProblem = useLifeState((s) => s.addProblem);
  const addDecision = useLifeState((s) => s.addDecision);

  const activeConfig = ENTRY_TYPES.find((t) => t.id === selectedType) ?? ENTRY_TYPES[0];

  const handleSave = useCallback(() => {
    if (!content.trim()) return;
    setIsSaving(true);

    if (selectedType === "problem") {
      addProblem(content.trim(), selectedDomain, "medium");
    } else if (selectedType === "decision") {
      addDecision(content.trim(), selectedDomain, "this_week");
    } else {
      addEntry(selectedType, content.trim(), selectedDomain);
    }

    setIsSaving(false);
    setContent("");
    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
      onClose();
    }, 800);
  }, [content, selectedType, selectedDomain, addEntry, addProblem, addDecision, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{
              background: "rgba(8, 10, 20, 0.95)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              backdropFilter: "blur(32px)",
              boxShadow: "0 -10px 60px rgba(139, 92, 246, 0.1)"
            }}
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Top accent line */}
            <div
              className="absolute top-0 inset-x-0 h-px"
              style={{ background: `linear-gradient(to right, transparent, ${activeConfig.color}60, transparent)` }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" dir="rtl">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${activeConfig.color}15`,
                    border: `1px solid ${activeConfig.color}30`
                  }}
                >
                  <Zap className="w-4 h-4" style={{ color: activeConfig.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">التقاط سريع</h3>
                  <p className="text-[10px] text-white/30 font-bold">سجّل فكرتك قبل ما تنسى</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            {/* Entry type selector */}
            <div className="px-6 pb-3" dir="rtl">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {ENTRY_TYPES.map((type) => {
                  const isActive = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shrink-0"
                      style={{
                        background: isActive ? `${type.color}20` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isActive ? `${type.color}40` : "rgba(255,255,255,0.06)"}`,
                        color: isActive ? type.color : "rgba(255,255,255,0.4)"
                      }}
                    >
                      {type.icon}
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Domain selector */}
            <div className="px-6 pb-3" dir="rtl">
              <div className="flex gap-1.5 flex-wrap">
                {LIFE_DOMAINS.map((domain) => {
                  const isActive = selectedDomain === domain.id;
                  return (
                    <button
                      key={domain.id}
                      onClick={() => setSelectedDomain(domain.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                      style={{
                        background: isActive ? `${domain.color}18` : "transparent",
                        border: `1px solid ${isActive ? `${domain.color}35` : "rgba(255,255,255,0.05)"}`,
                        color: isActive ? domain.color : "rgba(255,255,255,0.3)"
                      }}
                    >
                      <span>{domain.icon}</span>
                      {domain.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text input */}
            <div className="px-6 pb-4" dir="rtl">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={activeConfig.placeholder}
                className="w-full min-h-[100px] rounded-2xl p-4 text-sm text-white font-medium placeholder:text-white/20 resize-none focus:outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${content.trim() ? `${activeConfig.color}30` : "rgba(255,255,255,0.06)"}`,
                  caretColor: activeConfig.color
                }}
                autoFocus
              />
            </div>

            {/* Save button */}
            <div className="px-6 pb-6" dir="rtl">
              <button
                onClick={handleSave}
                disabled={!content.trim() || isSaving}
                className="w-full py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: justSaved ? "#10b981" : content.trim() ? activeConfig.color : "rgba(255,255,255,0.05)",
                  color: content.trim() ? "#0a0a0f" : "rgba(255,255,255,0.3)"
                }}
              >
                {justSaved ? (
                  <>✓ تم الحفظ</>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    حفظ
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
