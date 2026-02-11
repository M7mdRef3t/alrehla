import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronLeft } from "lucide-react";
import type { Ring } from "../modules/map/mapTypes";
import { getSymptomsByRing, getSymptomWeight, WEIGHT_THRESHOLD_RED, WEIGHT_THRESHOLD_YELLOW, CATEGORY_RULES, HEALTHY_RELATIONSHIP_SIGNS, type Symptom, type SymptomCategory } from "../data/symptoms";

interface SymptomsChecklistProps {
  ring: Ring;
  personLabel: string;
  selectedSymptoms?: string[];
  onSymptomsChange?: (symptomIds: string[]) => void;
  readOnly?: boolean;
}

const CATEGORY_ORDER: SymptomCategory[] = [
  "emotional",
  "psychological",
  "behavioral",
  "physical",
  "neurological",
  "spiritual",
  "financial",
  "social",
  "professional",
  "time",
  "family",
  "values"
];

export const SymptomsChecklist: FC<SymptomsChecklistProps> = ({
  ring,
  personLabel,
  selectedSymptoms = [],
  onSymptomsChange,
  readOnly = false
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedSymptoms));
  const symptoms = getSymptomsByRing(ring);
  const [showRule, setShowRule] = useState(false);
  const [showHealthyRef, setShowHealthyRef] = useState(false);
  const [showThirtyTest, setShowThirtyTest] = useState(false);

  /** اختبار 30 ثانية — 3 أسئلة → 🟢🟡🔴 */
  type TestAnswer = "green" | "yellow" | "red";
  const [testAnswers, setTestAnswers] = useState<[TestAnswer | null, TestAnswer | null, TestAnswer | null]>([null, null, null]);
  const THIRTY_SECOND_QUESTIONS = [
    "بعد التعامل معاه.. طاقتي عاملة إزاي؟",
    "حسّيت إني بسيب موقعي الحقيقي؟",
    "في شدّ داخلي أو ضجيج ذنب؟"
  ] as const;
  const testOptions: { value: TestAnswer; label: string; color: string }[] = [
    { value: "green", label: "هدوء / استقرار", color: "bg-teal-100 border-teal-400 text-teal-800" },
    { value: "yellow", label: "حذر / شدّ", color: "bg-amber-100 border-amber-400 text-amber-800" },
    { value: "red", label: "ضغط / ضجيج / اختناق", color: "bg-rose-100 border-rose-400 text-rose-800" }
  ];
  const setTestAnswer = (qIndex: 0 | 1 | 2, value: TestAnswer) => {
    setTestAnswers((prev) => {
      const next = [...prev] as [TestAnswer | null, TestAnswer | null, TestAnswer | null];
      next[qIndex] = value;
      return next;
    });
  };
  const testComplete = testAnswers[0] !== null && testAnswers[1] !== null && testAnswers[2] !== null;
  const testResult: TestAnswer | null = testComplete
    ? (testAnswers.includes("red") ? "red" : testAnswers.includes("yellow") ? "yellow" : "green")
    : null;
  const testResultLabel = testResult === "green" ? "🟢 هدوء / استقرار" : testResult === "yellow" ? "🟡 حذر / شدّ" : testResult === "red" ? "🔴 ضغط / ضجيج / اختناق" : null;
  const testResultColor = testResult === "green" ? "bg-teal-50 border-teal-300 text-teal-800" : testResult === "yellow" ? "bg-amber-50 border-amber-300 text-amber-800" : testResult === "red" ? "bg-rose-50 border-rose-300 text-rose-800" : "";

  // مزامنة الاختيارات مع القيم المحفوظة (عند إعادة فتح النافذة أو تغيير الشخص)
  useEffect(() => {
    setSelected(new Set(selectedSymptoms || []));
  }, [selectedSymptoms]);

  const handleToggle = (symptomId: string) => {
    if (readOnly) return;

    const newSelected = new Set(selected);
    if (newSelected.has(symptomId)) {
      newSelected.delete(symptomId);
    } else {
      newSelected.add(symptomId);
    }
    setSelected(newSelected);
    onSymptomsChange?.(Array.from(newSelected));
  };

  const getCategoryEmoji = (category: SymptomCategory) => {
    switch (category) {
      case "emotional": return "💭";
      case "physical": return "🫀";
      case "behavioral": return "🎯";
      case "psychological": return "🧠";
      case "neurological": return "⚡";
      case "spiritual": return "✨";
      case "financial": return "💰";
      case "social": return "👥";
      case "professional": return "💼";
      case "time": return "⏱";
      case "family": return "🏠";
      case "values": return "⚖";
    }
  };

  const getCategoryLabel = (category: SymptomCategory) => {
    switch (category) {
      case "emotional": return "عاطفي";
      case "physical": return "جسدي";
      case "behavioral": return "سلوكي";
      case "psychological": return "نفسي";
      case "neurological": return "عصبي";
      case "spiritual": return "روحي";
      case "financial": return "مالي";
      case "social": return "اجتماعي";
      case "professional": return "مهني";
      case "time": return "وقتي";
      case "family": return "عائلي";
      case "values": return "قيمي";
    }
  };

  const groupedSymptoms = symptoms.reduce(
    (acc, symptom) => {
      if (!acc[symptom.category]) acc[symptom.category] = [];
      acc[symptom.category].push(symptom);
      return acc;
    },
    {} as Record<SymptomCategory, Symptom[]>
  );

  const availableCategories = CATEGORY_ORDER.filter((c) => (groupedSymptoms[c]?.length ?? 0) > 0);
  const [activeTab, setActiveTab] = useState<SymptomCategory>(
    availableCategories[0] ?? "emotional"
  );

  const currentSymptoms = groupedSymptoms[activeTab] ?? [];

  // نتيجة مرتبطة بالاختيارات: درجة التأثير + الغالب + جملة
  const selectedCount = selected.size;
  const impactLevel: "none" | "light" | "medium" | "high" =
    selectedCount === 0 ? "none" : selectedCount <= 3 ? "light" : selectedCount <= 7 ? "medium" : "high";
  const dominantCategories = (Object.keys(groupedSymptoms) as SymptomCategory[])
    .map((cat) => ({ category: cat, count: (groupedSymptoms[cat] ?? []).filter((s) => selected.has(s.id)).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2)
    .map((x) => x.category);
  const dominantLabels = dominantCategories.map(getCategoryLabel).join(" و ");

  /** مجموع أوزان الأعراض المختارة (معادلة الرادار: جسد 10، عقل/سلوك أحمر 5، أصفر 3) */
  const selectedSymptomsList = symptoms.filter((s) => selected.has(s.id));
  const totalWeight = selectedSymptomsList.reduce((sum, s) => sum + getSymptomWeight(ring, s.category), 0);
  const hasRedPhysical = selectedSymptomsList.some((s) => s.category === "physical" && ring === "red");
  const weightVerdictRed = totalWeight >= WEIGHT_THRESHOLD_RED || hasRedPhysical;
  const weightVerdictYellow = !weightVerdictRed && totalWeight >= WEIGHT_THRESHOLD_YELLOW;

  const getRingLabel = (r: Ring) =>
    r === "green" ? "تموضع آمن" : r === "yellow" ? "منطقة حذر" : "مدار بعيد";

  const getImpactCopy = () => {
    if (impactLevel === "none") return null;
    const levelText = impactLevel === "light" ? "خفيف" : impactLevel === "medium" ? "متوسط" : "شديد";
    const levelColor = impactLevel === "light" ? "text-teal-700 bg-teal-50 border-teal-200" : impactLevel === "medium" ? "text-amber-800 bg-amber-50 border-amber-200" : "text-rose-800 bg-rose-50 border-rose-200";
    const summaries: Record<Ring, Record<"light" | "medium" | "high", string>> = {
      green: {
        light: "المدار مستقر والتأثير محدود. كمل على نفس القواعد.",
        medium: "المدار في تموضع آمن، بس في إشارات محتاجة مراقبة وضبط مساحة.",
        high: "حتى مع تموضع آمن، الإشارات كتير. راجع المسافة لو لسه الضغط مستمر."
      },
      yellow: {
        light: "المدار في منطقة حذر والتأثير خفيف. ثبّت مساحتك بدري يمنع الانزلاق.",
        medium: "إشارات الحذر واضحة. محتاج مسار حماية وحدود أوضح.",
        high: "المدار قرب من الخطر. لازم مسافة أوضح وقواعد أقوى فورًا."
      },
      red: {
        light: "المدار بياخد من طاقتك حتى لو الإشارات قليلة. حماية المساحة ضرورية.",
        medium: "الضغط واضح. محتاج مسار حماية مع حدود حاسمة.",
        high: "الضغط شديد. لازم مساحة آمنة فورًا وتخفيف الاحتكاك لأقل درجة."
      }
    };
    const summary = summaries[ring][impactLevel];
    return { levelText, levelColor, summary, relationshipLabel: getRingLabel(ring) };
  };

  const impactCopy = getImpactCopy();

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-purple-900 text-right">
        📋 اختار كل الإشارات اللي ظهرت مع مدار {personLabel}
      </p>

      {/* تابات الفئات */}
      <div className="overflow-x-auto overflow-y-hidden rounded-xl bg-slate-100 border border-slate-200 p-1">
        <div className="flex gap-1.5 min-w-0 w-max">
          {availableCategories.map((category) => {
            const isActive = activeTab === category;
            const selectedInCategory = (groupedSymptoms[category] ?? []).filter((s) => selected.has(s.id)).length;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveTab(category)}
                className={`shrink-0 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive ? "bg-white text-purple-900 border border-purple-200" : "text-slate-600 hover:bg-white/60"
                }`}
              >
                <span>{getCategoryEmoji(category)}</span>
                <span>{getCategoryLabel(category)}</span>
                {selectedInCategory > 0 && (
                  <span className={`min-w-4 h-4 px-0.5 rounded-full text-[10px] flex items-center justify-center ${isActive ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-600"}`}>
                    {selectedInCategory}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* قاعدة الفئة — قابلة للطي */}
      {CATEGORY_RULES[activeTab] && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRule((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-slate-600 text-right"
          >
            <span>القاعدة (من المرجع)</span>
            {showRule ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0 rotate-180" />}
          </button>
          {showRule && (
            <p className="px-3 pb-2 text-xs text-slate-600 italic border-t border-slate-100 pt-2" dir="rtl">
              🛑 {CATEGORY_RULES[activeTab]}
            </p>
          )}
        </div>
      )}

      {/* قائمة الأعراض — الأولوية الأولى */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {currentSymptoms.map((symptom) => {
            const isSelectedSymptom = selected.has(symptom.id);
            return (
              <motion.button
                key={symptom.id}
                type="button"
                onClick={() => handleToggle(symptom.id)}
                disabled={readOnly}
                className={`w-full p-4 rounded-xl border-2 text-right transition-all duration-200 ${
                  isSelectedSymptom
                    ? "bg-teal-50 border-teal-500"
                    : "bg-white border-gray-200 hover:border-teal-300 hover:bg-teal-50/50"
                } ${readOnly ? "cursor-default" : "cursor-pointer active:scale-[0.99]"}`}
                whileTap={!readOnly ? { scale: 0.98 } : {}}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`shrink-0 w-10 h-10 sm:w-6 sm:h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelectedSymptom ? "bg-teal-500 border-teal-500" : "bg-white border-gray-300"
                    }`}
                  >
                    {isSelectedSymptom && (
                      <Check className="w-6 h-6 sm:w-4 sm:h-4 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span
                    className={`text-sm flex-1 ${
                      isSelectedSymptom ? "text-teal-900 font-medium" : "text-gray-700"
                    }`}
                  >
                    {symptom.text}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* نتيجة مرتبطة بالاختيارات — تظهر بعد الاختيار */}
      {impactCopy && selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border-2 p-4 text-right ${impactCopy.levelColor}`}
        >
          <div className="flex flex-wrap items-center justify-end gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/80">درجة التأثير: {impactCopy.levelText}</span>
            {impactCopy.relationshipLabel && <span className="text-xs font-semibold">حالة المدار: {impactCopy.relationshipLabel}</span>}
            {dominantLabels && <span className="text-xs font-semibold">الغالب: {dominantLabels}</span>}
            <span className="text-xs text-slate-600">نقاط: {totalWeight}</span>
          </div>
          <p className="text-sm leading-relaxed">{impactCopy.summary}</p>
          {(weightVerdictRed || weightVerdictYellow) && (
            <p className={`text-xs font-bold mt-2 pt-2 border-t border-current/20 ${weightVerdictRed ? "text-rose-700" : "text-amber-700"}`} dir="rtl">
              {weightVerdictRed ? "🛑 الرادار حسمها: المدار ده في أحمر واضح." : "⚠ إجمالي الإشارات في منطقة حذر: ثبّت مساحتك فورًا."}
            </p>
          )}
        </motion.div>
      )}

      {/* مرجع: أعراض العلاقة الصحية — قابلة للطي (مطوية افتراضيًا) */}
      <div className="rounded-lg border border-slate-200 bg-teal-50/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowHealthyRef((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-teal-800 text-right"
        >
          <span>🟢 مرجع: مؤشرات المدار الآمن</span>
          {showHealthyRef ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0 rotate-180" />}
        </button>
        {showHealthyRef && (
          <ul className="px-3 pb-3 text-xs text-teal-700 space-y-1 list-none border-t border-teal-100 pt-2" dir="rtl">
            {HEALTHY_RELATIONSHIP_SIGNS.map((sign, i) => (
              <li key={i}>• {sign}</li>
            ))}
          </ul>
        )}
      </div>

      {/* اختبار 30 ثانية — قابل للطي (مطوي افتراضيًا) */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowThirtyTest((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-slate-700 text-right"
        >
          <span>⏱ اختبار 30 ثانية للرادار (اختياري)</span>
          {showThirtyTest ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0 rotate-180" />}
        </button>
        {showThirtyTest && (
          <div className="p-3 border-t border-slate-100 space-y-3 text-right">
            <p className="text-xs text-slate-600">جاوب 3 أسئلة بسرعة وخد القراءة:</p>
            {THIRTY_SECOND_QUESTIONS.map((q, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-slate-700 mb-1">{i + 1}. {q}</p>
                <div className="flex flex-wrap gap-2 justify-end">
                  {testOptions.map((opt) => {
                    const isSelected = testAnswers[i] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTestAnswer(i as 0 | 1 | 2, opt.value)}
                        className={`text-xs px-2.5 py-1 rounded-full border-2 transition-all ${opt.color} ${isSelected ? "ring-2 ring-offset-1 ring-slate-400" : "opacity-80 hover:opacity-100"}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {testComplete && testResultLabel && (
              <div className={`rounded-lg border-2 p-2 text-center font-bold text-xs ${testResultColor}`}>
                النتيجة: {testResultLabel}
              </div>
            )}
          </div>
        )}
      </div>

      {selected.size > 0 && !readOnly && (
        <p className="text-xs text-center text-teal-700 font-medium">
          ✓ اخترت {selected.size} مؤشر
        </p>
      )}
    </div>
  );
};
