import type { FC } from "react";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Shield, Heart, Flame, Brain, DoorOpen,
  ArrowRight, Copy, Check, BookOpen, ChevronLeft
} from "lucide-react";
import {
  SITUATION_LABELS,
  SITUATION_ICONS,
  type QuickPathSituation,
  type QuickPathResult,
  generateQuickPath,
} from "../services/quickPath";

/* ══════════════════════════════════════════
   EXIT SCRIPTS LIBRARY — مكتبة جمل الخروج
   Standalone browseable page — all exit phrases
   organized by situation, with copy + AI generation
   ══════════════════════════════════════════ */

/** Static base phrases for each situation — curated library */
const LIBRARY: Record<QuickPathSituation, {
  category: string;
  icon: FC<{ className?: string }>;
  color: string;
  bg: string;
  phrases: { text: string; context: string }[];
}> = {
  pressure: {
    category: "ضغط من شخص",
    icon: Zap,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.1)",
    phrases: [
      { text: "محتاج وقت أفكر — هرد عليك بعدين", context: "لما حد يطلب منك قرار فوري" },
      { text: "أنا مقدرش آخذ القرار ده دلوقتي", context: "لما حد يضغط عليك تقرر حاجة كبيرة" },
      { text: "هخلص اللي عندي الأول وبعدين نتكلم", context: "لما حد يقاطعك أو يستعجلك" },
      { text: "الموضوع ده محتاج تفكير — مش هسرّع", context: "لما حد يحسسك إنك لازم تستجيب فوراً" },
    ],
  },
  guilt: {
    category: "إحساس بالذنب",
    icon: Heart,
    color: "#f472b6",
    bg: "rgba(244,114,182,0.1)",
    phrases: [
      { text: "أنا بحاول أعمل اللي أقدر عليه — ده مش أنانية", context: "لما حد يزعلك إنك حطيت حدود" },
      { text: "مش كل حاجة مسؤوليتي — وده مش معناه إني مش فاهم", context: "لما تحس بالذنب لرفض طلب" },
      { text: "أنا محتاج أهتم بنفسي الأول عشان أقدر أساعد", context: "لما تحس إنك بتسيب حد" },
      { text: "اختياري لنفسي مش اختيار ضدك", context: "لما حد يفهم رفضك إنك بتعاديه" },
    ],
  },
  anger: {
    category: "غضب",
    icon: Flame,
    color: "#fb923c",
    bg: "rgba(251,146,60,0.1)",
    phrases: [
      { text: "مش هقدر أكمل الكلام دلوقتي — محتاج أهدى", context: "لما تحس إنك هتنفجر" },
      { text: "هنرجع نتكلم لما نكون هاديين", context: "لما الموقف يتصاعد" },
      { text: "أنا سامعك بس مش في الوضع المناسب أرد", context: "لما حد يستفزك" },
      { text: "الصوت العالي مش هيوصلنا لحاجة — نهدى الأول", context: "لما الكلام يبقى صراخ" },
    ],
  },
  overwhelmed: {
    category: "إرهاق",
    icon: Brain,
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.1)",
    phrases: [
      { text: "أنا مش في الوضع المناسب دلوقتي — نتكلم بعدين", context: "لما تحس إنك مش قادر تستوعب" },
      { text: "محتاج 5 دقايق لوحدي", context: "لما كل حاجة تبقى كتير" },
      { text: "عندي حاجات كتير — هتعامل معاها واحدة واحدة", context: "لما تحس بالشلل من كتر المطلوب" },
      { text: "مش لازم أحل كل حاجة النهاردة", context: "لما تحس إن كل المسؤوليات عليك" },
    ],
  },
  boundary: {
    category: "محتاج أقول لأ",
    icon: Shield,
    color: "#34d399",
    bg: "rgba(52,211,153,0.1)",
    phrases: [
      { text: "لأ، مش هقدر — شكراً لفهمك", context: "رفض بسيط ومباشر" },
      { text: "ممكن أساعدك في حاجة تانية بس دي لأ", context: "رفض جزئي — بتقول لأ لكن بتفتح باب" },
      { text: "الموضوع ده فوق طاقتي دلوقتي", context: "لما حد يطلب أكتر مما تقدر" },
      { text: "أنا بحترمك، بس مش هعمل ده", context: "رفض مع احترام" },
    ],
  },
  escape: {
    category: "محتاج أخرج",
    icon: DoorOpen,
    color: "#e879f9",
    bg: "rgba(232,121,249,0.1)",
    phrases: [
      { text: "معذرة، محتاج أمشي دلوقتي", context: "خروج فوري من موقف" },
      { text: "عندي حاجة ضرورية — هتكلم بعدين", context: "لما تحتاج عذر سريع" },
      { text: "مش مرتاح هنا — همشي", context: "لما الموقف مش آمن نفسياً" },
      { text: "هاجي وقت تاني — دلوقتي مش مناسب", context: "لما تحتاج تأجل" },
    ],
  },
};

interface ExitScriptsLibraryProps {
  onBack: () => void;
  onOpenGrounding?: () => void;
}

export const ExitScriptsLibrary: FC<ExitScriptsLibraryProps> = ({ onBack, onOpenGrounding }) => {
  const [selectedCategory, setSelectedCategory] = useState<QuickPathSituation | null>(null);
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);
  const [aiGenerated, setAiGenerated] = useState<QuickPathResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContext, setAiContext] = useState("");

  const categories = useMemo(
    () => (Object.keys(LIBRARY) as QuickPathSituation[]).map((k) => ({
      key: k,
      ...LIBRARY[k],
      emoji: SITUATION_ICONS[k],
      label: SITUATION_LABELS[k],
    })),
    []
  );

  const currentCategory = selectedCategory ? LIBRARY[selectedCategory] : null;

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPhrase(text);
      setTimeout(() => setCopiedPhrase(null), 2000);
    } catch { /* clipboard may not be available */ }
  }, []);

  const handleAIGenerate = useCallback(async () => {
    if (!selectedCategory) return;
    setAiLoading(true);
    try {
      const result = await generateQuickPath(selectedCategory, aiContext || undefined);
      setAiGenerated(result);
    } catch { /* fallback handled by service */ }
    setAiLoading(false);
  }, [selectedCategory, aiContext]);

  return (
    <motion.div
      className="min-h-screen pb-24"
      style={{ background: "var(--bg-primary, #0a0a1a)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      dir="rtl"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(10,10,26,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white/70" />
        </button>
        <div>
          <h1 className="text-lg font-black text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-400" />
            مكتبة جمل الخروج
          </h1>
          <p className="text-[11px] text-white/40">جمل جاهزة لكل موقف — انسخ واستخدم فوراً</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">

        {/* Category Grid */}
        {!selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-sm text-white/50 text-right">اختار الموقف اللي أنت فيه:</p>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <motion.button
                    key={cat.key}
                    onClick={() => { setSelectedCategory(cat.key); setAiGenerated(null); setAiContext(""); }}
                    className="flex items-center gap-3 p-4 rounded-2xl text-right transition-all"
                    style={{ background: cat.bg, border: `1px solid ${cat.color}30` }}
                    whileHover={{ scale: 1.02, borderColor: `${cat.color}60` }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${cat.color}20` }}>
                      <span style={{ color: cat.color }}><Icon className="w-5 h-5" /></span>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">{cat.label}</span>
                      <span className="text-[10px] text-white/30">{cat.phrases.length} جملة</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Body-First CTA */}
            {onOpenGrounding && (
              <motion.button
                onClick={onOpenGrounding}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-sm font-bold text-teal-300 mt-4"
                style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.15)" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🫁 تقنيات تهدئة الجسم أولاً
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Category Detail */}
        {selectedCategory && currentCategory && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Back to categories */}
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              <ArrowRight className="w-3 h-3" />
              كل الفئات
            </button>

            {/* Category header */}
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: currentCategory.bg, border: `1px solid ${currentCategory.color}30` }}>
              <span className="text-2xl">{SITUATION_ICONS[selectedCategory]}</span>
              <div>
                <h2 className="text-lg font-black text-white">{currentCategory.category}</h2>
                <p className="text-xs text-white/40">{currentCategory.phrases.length} جملة جاهزة + AI</p>
              </div>
            </div>

            {/* Phrase Cards */}
            <div className="space-y-3">
              {currentCategory.phrases.map((phrase, i) => (
                <motion.div
                  key={i}
                  className="rounded-2xl p-4 border border-white/5 bg-white/[0.02]"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <p className="text-base font-bold text-white leading-relaxed mb-2">"{phrase.text}"</p>
                  <p className="text-[11px] text-white/30 mb-3">{phrase.context}</p>
                  <button
                    onClick={() => void handleCopy(phrase.text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                    style={{
                      background: copiedPhrase === phrase.text ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)",
                      color: copiedPhrase === phrase.text ? "#34d399" : "rgba(255,255,255,0.5)",
                      border: `1px solid ${copiedPhrase === phrase.text ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    {copiedPhrase === phrase.text ? (
                      <><Check className="w-3 h-3" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3 h-3" /> انسخ الجملة</>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>

            {/* AI Generation */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-4 space-y-3">
              <h3 className="text-sm font-bold text-violet-300 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                جملة مخصصة بالذكاء الاصطناعي
              </h3>
              <textarea
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder="اوصف الموقف بسطرين عشان الجملة تبقى أدق..."
                className="w-full rounded-xl p-3 text-sm text-white resize-none outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", minHeight: 60 }}
                rows={2}
              />
              <button
                onClick={() => void handleAIGenerate()}
                disabled={aiLoading}
                className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: aiLoading ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              >
                {aiLoading ? (
                  <>
                    <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                    جارفيس بيجهز...
                  </>
                ) : (
                  <><Zap className="w-4 h-4" /> ولّد جملة مخصصة</>
                )}
              </button>

              <AnimatePresence>
                {aiGenerated && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <div className="rounded-xl p-4" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                      <p className="text-base font-bold text-white">{aiGenerated.exitPhrase}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)" }}>
                      <p className="text-xs text-sky-300 font-bold mb-1">🫁 تنفس</p>
                      <p className="text-xs text-white/60">{aiGenerated.breathingCue}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="text-[10px] text-white/30 font-bold mb-1">خطوة تالية</p>
                      <p className="text-xs text-white/50">{aiGenerated.followUpAction}</p>
                    </div>
                    <button
                      onClick={() => void handleCopy(aiGenerated.exitPhrase)}
                      className="w-full py-2 rounded-lg text-xs font-bold text-violet-300 hover:bg-white/5 transition-colors"
                      style={{ border: "1px solid rgba(139,92,246,0.2)" }}
                    >
                      {copiedPhrase === aiGenerated.exitPhrase ? "✓ تم النسخ" : "📋 انسخ الجملة"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
