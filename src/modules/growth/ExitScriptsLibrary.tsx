import type { FC } from "react";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Shield, Heart, Flame, Brain, DoorOpen,
  ArrowRight, Copy, Check, BookOpen, ChevronLeft, Sparkles, Wind
} from "lucide-react";
import {
  SITUATION_LABELS,
  type QuickPathSituation,
  type QuickPathResult,
  generateQuickPath,
} from "@/services/quickPath";

/* ══════════════════════════════════════════
   EXIT SCRIPTS LIBRARY — مكتبة جمل الخروج
   Standalone browseable page — all exit phrases
   organized by situation, with copy + AI generation
   ══════════════════════════════════════════ */

/** Static base phrases for each situation — curated library */
const LIBRARY: Record<QuickPathSituation, {
  category: string;
  icon: FC<{ className?: string }>;
  colorClass: { text: string, bg: string, border: string, glow: string };
  phrases: { text: string; context: string }[];
}> = {
  pressure: {
    category: "ضغط من شخص",
    icon: Zap,
    colorClass: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30", glow: "hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]" },
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
    colorClass: { text: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30", glow: "hover:shadow-[0_0_20px_-5px_rgba(244,114,182,0.3)]" },
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
    colorClass: { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", glow: "hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]" },
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
    colorClass: { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30", glow: "hover:shadow-[0_0_20px_-5px_rgba(56,189,248,0.3)]" },
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
    colorClass: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]" },
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
    colorClass: { text: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/30", glow: "hover:shadow-[0_0_20px_-5px_rgba(217,70,239,0.3)]" },
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
      className="min-h-screen pb-24 bg-slate-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      dir="rtl"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 transition-colors w-10 h-10 flex items-center justify-center bg-white/5">
            <ChevronLeft className="w-5 h-5 text-white/70" />
          </button>
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-400" />
              مكتبة جمل الخروج
            </h1>
            <p className="text-[11px] text-violet-300/50 font-medium mt-0.5">بروتوكولات الانسحاب التكتيكي</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-8 relative z-10">
        
        {/* Category Grid */}
        {!selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <p className="text-sm font-bold text-white/40 text-right uppercase tracking-wider">حدد طبيعة الضغط:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const { bg, text, border, glow } = cat.colorClass;
                return (
                  <motion.button
                    key={cat.key}
                    onClick={() => { setSelectedCategory(cat.key); setAiGenerated(null); setAiContext(""); }}
                    className={`flex items-center justify-between p-5 rounded-2xl text-right transition-all border block relative overflow-hidden group ${bg} ${border} ${glow}`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${border} bg-black/20 shadow-inner group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 ${text}`} />
                      </div>
                      <div>
                        <span className="text-base font-bold text-white block">{cat.label}</span>
                        <span className="text-xs text-white/40 mt-1 block">{cat.phrases.length} جملة جاهزة</span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Body-First CTA */}
            {onOpenGrounding && (
              <motion.button
                onClick={onOpenGrounding}
                className="w-full flex items-center justify-between p-5 rounded-2xl text-sm font-bold mt-6 bg-sky-500/10 border border-sky-500/20 text-sky-400 group relative overflow-hidden"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center gap-2">
                  <Wind className="w-5 h-5" />
                  محتاج أهدى جسمي الأول..
                </span>
                <ArrowRight className="w-4 h-4 relative z-10 opacity-50 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Category Detail */}
        {selectedCategory && currentCategory && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Back & Category Header Header */}
            <div className={`p-6 rounded-3xl border relative overflow-hidden shadow-inner ${currentCategory.colorClass.bg} ${currentCategory.colorClass.border}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors mb-4 relative z-10 bg-black/20 px-3 py-1.5 rounded-full w-fit"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                رجوع للتصنيفات
              </button>

              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-black/30 border ${currentCategory.colorClass.border}`}>
                  <currentCategory.icon className={`w-7 h-7 ${currentCategory.colorClass.text}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{currentCategory.category}</h2>
                  <p className="text-sm text-white/60 mt-1">{currentCategory.phrases.length} تفاعل جاهز للاستخدام الفوري</p>
                </div>
              </div>
            </div>

            {/* AI Generation Cyberbox */}
            <div className="rounded-3xl border border-violet-500/30 bg-slate-900 overflow-hidden relative shadow-[0_0_40px_-10px_rgba(139,92,246,0.15)] group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent pointer-events-none" />
              <div className="p-6 relative z-10 space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  مولد الردود الذكي (جارفيس)
                </h3>
                <textarea
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="اوصف الموقف بدقة (مثلاً: مديري بيطلب مني تقرير في الويك إند)..."
                  className="w-full rounded-2xl p-4 text-sm text-white resize-none outline-none bg-black/40 border border-violet-500/20 focus:border-violet-400/60 transition-colors shadow-inner"
                  rows={2}
                />
                <button
                  onClick={() => void handleAIGenerate()}
                  disabled={aiLoading}
                  className="w-full py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ background: aiLoading ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                >
                  {aiLoading ? (
                    <>
                      <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                      جاري تحليل التكتيك والمخرج...
                    </>
                  ) : (
                    <>توليد رد استراتيجي</>
                  )}
                </button>

                <AnimatePresence>
                  {aiGenerated && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="space-y-3 pt-4 border-t border-violet-500/20 mt-4 overflow-hidden"
                    >
                      <div className="rounded-2xl p-5 bg-violet-500/10 border border-violet-500/20 shadow-inner">
                        <p className="text-base font-bold text-white leading-relaxed">{aiGenerated.exitPhrase}</p>
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => void handleCopy(aiGenerated.exitPhrase)}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                              copiedPhrase === aiGenerated.exitPhrase ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-violet-500/20 border-violet-500/30 text-violet-300 hover:bg-violet-500/30'
                            }`}
                          >
                            {copiedPhrase === aiGenerated.exitPhrase ? <><Check className="w-4 h-4" /> تم تأمين النسخ</> : <><Copy className="w-4 h-4" /> نسخ للرد السريع</>}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl p-4 bg-sky-500/10 border border-sky-500/20">
                          <p className="text-[11px] text-sky-400 font-bold mb-1 uppercase tracking-widest flex items-center gap-1.5"><Wind className="w-3 h-3"/> تنفس الآن</p>
                          <p className="text-xs text-white/80 font-medium leading-relaxed">{aiGenerated.breathingCue}</p>
                        </div>
                        <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
                          <p className="text-[11px] text-white/40 font-bold mb-1 uppercase tracking-widest">توجيه تكتيكي</p>
                          <p className="text-xs text-white/80 font-medium leading-relaxed">{aiGenerated.followUpAction}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Phrase Cards */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest px-2">الأرشيف الثابت</h3>
              <div className="space-y-3">
                {currentCategory.phrases.map((phrase, i) => (
                  <motion.div
                    key={i}
                    className={`rounded-2xl p-5 border bg-white/[0.02] flex items-start justify-between gap-4 transition-all ${
                      copiedPhrase === phrase.text ? 'border-emerald-500/30 shadow-[0_0_20px_-10px_rgba(16,185,129,0.3)]' : 'border-white/5 hover:bg-white/[0.04]'
                    }`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div>
                      <p className="text-base font-bold text-white leading-relaxed mb-2">"{phrase.text}"</p>
                      <p className="text-[11px] text-white/40 font-medium">{phrase.context}</p>
                    </div>
                    <button
                      onClick={() => void handleCopy(phrase.text)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                        copiedPhrase === phrase.text ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {copiedPhrase === phrase.text ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
