import type { FC } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Users, 
  UserCircle, 
  Heart, 
  Briefcase, 
  UserCheck,
  UserX,
  Building2,
  ArrowLeft,
  UserPlus,
  X,
  type LucideIcon 
} from "lucide-react";
import { mapCopy } from "../copy/map";
import { addPersonCopy } from "../copy/addPerson";
import { useMapState } from "../state/mapState";
import { FeelingCheck, type FeelingAnswers, feelingScore, feelingScoreToRing } from "./FeelingCheck";
import { RealityCheck, realityScoreToRing } from "./RealityCheck";
import { PlacementStep } from "./AddPersonModal/PlacementStep";
import { suggestInitialRing, type QuickAnswer1, type QuickAnswer2 } from "../utils/suggestInitialRing";
import type { Ring } from "../modules/map/mapTypes";
import type { AdviceCategory } from "../data/adviceScripts";
import { getGoalAction } from "../copy/goalPicker";

// Smart suggestions with icons based on goalId
interface SuggestionCard {
  label: string;
  icon: LucideIcon;
}

const SUGGESTIONS: Record<string, SuggestionCard[]> = {
  family: [
    { label: "أب", icon: User },
    { label: "أم", icon: Heart },
    { label: "أخ", icon: Users },
    { label: "أخت", icon: UserCircle },
    { label: "ابن", icon: UserCheck },
    { label: "ابنة", icon: UserCircle },
    { label: "قريب", icon: Users }
  ],
  work: [
    { label: "مدير", icon: Briefcase },
    { label: "زميل", icon: Users },
    { label: "عميل", icon: Building2 },
    { label: "مدير سابق", icon: UserX }
  ],
  love: [
    { label: "شريك", icon: Heart },
    { label: "خطيب", icon: Heart },
    { label: "زوج", icon: Heart },
    { label: "إكس", icon: UserX }
  ],
  money: [
    { label: "صديق", icon: Users },
    { label: "جار", icon: UserCheck },
    { label: "معرفة", icon: UserCircle }
  ],
  unknown: [
    { label: "صديق", icon: Users },
    { label: "جار", icon: UserCheck },
    { label: "معرفة", icon: UserCircle }
  ],
  general: [
    { label: "صديق", icon: Users },
    { label: "جار", icon: UserCheck },
    { label: "معرفة", icon: UserCircle }
  ]
};

// Dynamic placeholders based on goalId
const PLACEHOLDERS: Record<string, string> = {
  family: "مثال: ماما / الأب / الأخ الكبير",
  work: "مثال: المدير / الزميل / العميل",
  love: "مثال: الشريك / الخطيب / الإكس",
  money: "مثال: الصديق / الجار",
  unknown: "مثال: الشخص اللي في بالك",
  general: "مثال: الشخص اللي في بالك"
};

type AddPersonStep =
  | "select"
  | "quickQuestions"
  | "feeling"
  | "position"
  | "placement"
  | "result";

interface AddPersonModalProps {
  goalId: string;
  category: AdviceCategory;
  /** عند "تم" يُستدعى بدون معامل. عند "افتح [الاسم]" يُستدعى بمعرّف العقدة لفتح نافذة الشخص */
  onClose: (openNodeId?: string) => void;
}

export const AddPersonModal: FC<AddPersonModalProps> = ({ goalId, category, onClose }) => {
  const [step, setStep] = useState<AddPersonStep>("select");
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [customTitleInput, setCustomTitleInput] = useState("");
  const [showCustomTitleInput, setShowCustomTitleInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const [currentRing, setCurrentRing] = useState<Ring>("yellow");
  const [recommendedRing, setRecommendedRing] = useState<Ring>("yellow");
  const [healthScore, setHealthScore] = useState<number>(0);
  const [addedNodeId, setAddedNodeId] = useState<string | null>(null);
  const [pendingPlacement, setPendingPlacement] = useState<{ finalLabel: string; score: number; healthAnswers: FeelingAnswers } | null>(null);
  const [quickAnswer1, setQuickAnswer1] = useState<QuickAnswer1 | null>(null);
  const [quickAnswer2, setQuickAnswer2] = useState<QuickAnswer2 | null>(null);
  const [suggestedRingFromQuestions, setSuggestedRingFromQuestions] = useState<Ring | null>(null);
  const [suggestionReasonFromQuestions, setSuggestionReasonFromQuestions] = useState<string | null>(null);
  const addNode = useMapState((s) => s.addNode);

  const suggestions = SUGGESTIONS[goalId] || SUGGESTIONS.general;

  const handleContinue = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedTitle) {
      setCurrentRing("yellow");
      setStep("quickQuestions");
    }
  };

  const handleQuickQuestionsDone = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickAnswer1 == null || quickAnswer2 == null) return;
    const { ring, reason } = suggestInitialRing(quickAnswer1, quickAnswer2);
    setSuggestedRingFromQuestions(ring);
    setSuggestionReasonFromQuestions(reason);
    setStep("feeling");
  };

  const handleFeelingDone = (healthAnswers: FeelingAnswers) => {
    const score = feelingScore(healthAnswers);
    const ring = feelingScoreToRing(healthAnswers);
    setRecommendedRing(ring);
    setHealthScore(score);

    const finalLabel = customName.trim() || selectedTitle;
    setPendingPlacement({ finalLabel, score, healthAnswers });
    setStep("placement");
  };

  const handleRealityDone = (answers: Parameters<typeof realityScoreToRing>[0]) => {
    if (!pendingPlacement) return;
    const ring = realityScoreToRing(answers);
    const { finalLabel, score, healthAnswers } = pendingPlacement;
    const nodeId = addNode(finalLabel, ring, { score, answers: healthAnswers });
    setAddedNodeId(nodeId);
    setRecommendedRing(ring);
    setPendingPlacement(null);
    setStep("result");
  };

  const handlePlacementDrop = (ring: Ring) => {
    if (!pendingPlacement) return;
    const { finalLabel, score, healthAnswers } = pendingPlacement;
    const nodeId = addNode(finalLabel, ring, { score, answers: healthAnswers });
    setAddedNodeId(nodeId);
    setPendingPlacement(null);
    setStep("result");
  };

  const handleTitleSelect = (title: string) => {
    if (title === "__custom__") {
      setShowCustomTitleInput(true);
      setSelectedTitle(customTitleInput.trim() || "");
      return;
    }
    setShowCustomTitleInput(false);
    setCustomTitleInput("");
    setSelectedTitle(title);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
      aria-labelledby="add-person-title"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="relative bg-white border border-gray-200 rounded-2xl px-8 py-8 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-slate-500 hover:text-slate-700"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
        {step === "select" ? (
          <form onSubmit={handleContinue} className="text-right">
            <h2 id="add-person-title" className="text-xl font-bold text-slate-900 mb-4">
              {mapCopy.addPersonTitle}
            </h2>
        
        {/* Step 1: Select Title (Required) */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر اللقب <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-4">
            {suggestions.map((suggestion) => {
              const Icon = suggestion.icon;
              const isSelected = selectedTitle === suggestion.label && !showCustomTitleInput;
              return (
                <motion.button
                  key={suggestion.label}
                  type="button"
                  onClick={() => handleTitleSelect(suggestion.label)}
                  className={`flex flex-col items-center justify-center gap-2 min-h-[88px] rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 p-3 ${
                    isSelected
                      ? "bg-teal-50 shadow-sm ring-1 ring-teal-200"
                      : "bg-slate-50/80 hover:bg-teal-50/60 shadow-none hover:shadow-sm"
                  }`}
                  title={`اختر "${suggestion.label}"`}
                  whileHover={{ scale: isSelected ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`rounded-full flex items-center justify-center w-10 h-10 shrink-0 ${
                    isSelected ? "bg-teal-200" : "bg-teal-100"
                  }`}>
                    <Icon className={`${isSelected ? "text-teal-700" : "text-teal-600"} w-5 h-5`} strokeWidth={2} />
                  </div>
                  <span className={`font-semibold text-sm ${isSelected ? "text-teal-900" : "text-slate-900"}`}>
                    {suggestion.label}
                  </span>
                </motion.button>
              );
            })}
            <motion.button
              type="button"
              onClick={() => handleTitleSelect("__custom__")}
              className={`flex flex-col items-center justify-center gap-2 min-h-[88px] rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 p-3 ${
                showCustomTitleInput && customTitleInput.trim()
                  ? "bg-teal-50 shadow-sm ring-1 ring-teal-200"
                  : "bg-slate-50/80 hover:bg-teal-50/60 shadow-none hover:shadow-sm"
              }`}
              title="اكتب لقب يدوياً"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`rounded-full flex items-center justify-center w-10 h-10 shrink-0 ${
                showCustomTitleInput && customTitleInput.trim() ? "bg-teal-200" : "bg-slate-100"
              }`}>
                <UserPlus className={`${showCustomTitleInput && customTitleInput.trim() ? "text-teal-700" : "text-slate-500"} w-5 h-5`} strokeWidth={2} />
              </div>
              <span className={`font-semibold text-sm ${showCustomTitleInput && customTitleInput.trim() ? "text-teal-900" : "text-slate-600"}`}>
                حد تاني
              </span>
            </motion.button>
          </div>
          {showCustomTitleInput && (
            <div className="mt-3">
              <input
                type="text"
                value={customTitleInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setCustomTitleInput(v);
                  setSelectedTitle(v.trim());
                }}
                placeholder="اكتب اللقب..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Step 2: Optional Name (only shown after title selection) */}
        {selectedTitle && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label htmlFor="person-name-input" className="block text-sm font-medium text-gray-700 mb-2">
              الاسم (اختياري)
            </label>
            <input
              id="person-name-input"
              name="personName"
              type="text"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder={`مثال: أحمد، محمد، سارة...`}
              title="اكتب اسم الشخص (اختياري)"
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">
              سيظهر كـ: <span className="font-semibold text-teal-700">
                {customName.trim() || selectedTitle}
              </span>
            </p>
          </motion.div>
        )}
        
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-full bg-gray-100 px-6 py-3 text-sm text-gray-700 font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            onClick={onClose}
            title="إلغاء وإغلاق النافذة"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={!selectedTitle}
            className="flex-1 rounded-full bg-teal-600 text-white px-6 py-3 text-sm font-semibold shadow-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            title={selectedTitle ? "التالي: حلل إحساسك" : "اختر اللقب أولاً"}
          >
            التالي
          </button>
            </div>
          </form>
        ) : step === "quickQuestions" ? (
          <form onSubmit={handleQuickQuestionsDone} className="text-right">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {addPersonCopy.quickQuestionsTitle}
            </h2>
            <div className="space-y-5 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">{addPersonCopy.question1}</p>
                <div className="flex flex-wrap gap-2">
                  {addPersonCopy.options1.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setQuickAnswer1(opt.value as QuickAnswer1)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        quickAnswer1 === opt.value
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-teal-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">{addPersonCopy.question2}</p>
                <div className="flex flex-wrap gap-2">
                  {addPersonCopy.options2.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setQuickAnswer2(opt.value as QuickAnswer2)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        quickAnswer2 === opt.value
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-teal-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-full bg-gray-100 px-6 py-3 text-sm text-gray-700 font-medium hover:bg-gray-200"
                onClick={() => setStep("select")}
              >
                رجوع
              </button>
              <button
                type="submit"
                disabled={quickAnswer1 == null || quickAnswer2 == null}
                className="flex-1 rounded-full bg-teal-600 text-white px-6 py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {addPersonCopy.nextAfterQuestions}
              </button>
            </div>
          </form>
        ) : step === "feeling" ? (
          <div>
            <FeelingCheck
              personLabel={customName.trim() || selectedTitle}
              onDone={handleFeelingDone}
            />
          </div>
        ) : step === "position" && pendingPlacement ? (
          <RealityCheck
            personLabel={pendingPlacement.finalLabel}
            onDone={handleRealityDone}
            onBack={() => setStep("feeling")}
          />
        ) : step === "placement" && pendingPlacement ? (
          <PlacementStep
            personLabel={pendingPlacement.finalLabel}
            onPlace={(ring) => handlePlacementDrop(ring)}
            suggestedRing={suggestedRingFromQuestions ?? undefined}
            suggestionReason={suggestionReasonFromQuestions || undefined}
          />
        ) : step === "result" ? (
          <ResultScreen
            personLabel={customName.trim() || selectedTitle}
            ring={recommendedRing}
            score={healthScore}
            category={category}
            goalId={goalId}
            summaryOnly
            addedNodeId={addedNodeId ?? undefined}
            onClose={onClose}
          />
        ) : null}
      </motion.div>
    </div>
  );
};

// ============================================
// Result Screen — في الإضافة: البطاقتين + تم + افتح [الاسم].
// ============================================
interface ResultScreenProps {
  personLabel: string;
  ring: Ring;
  score: number;
  category: AdviceCategory;
  goalId: string;
  /** عند true نعرض البطاقتين + تم + افتح [الاسم] (نافذة إضافة شخص) */
  summaryOnly?: boolean;
  /** معرّف العقدة المضافة — لو وُجد نعرض زر "افتح [الاسم]" */
  addedNodeId?: string;
  onClose?: (openNodeId?: string) => void;
}

const ResultScreen: FC<ResultScreenProps> = ({
  personLabel,
  ring,
  score,
  category,
  goalId,
  summaryOnly = false,
  addedNodeId,
  onClose
}) => {
  let zone: "red" | "yellow" | "green";
  if (score > 2) {
    zone = "red";
  } else if (score >= 1) {
    zone = "yellow";
  } else {
    zone = "green";
  }

  const stateLabel = ring === "green" ? "صحية" : ring === "yellow" ? "محتاجة انتباه" : "استنزاف";

  const understanding = {
    red: `علاقتك مع ${personLabel} بتاخد منك أكتر مما بتديك. جسمك بيحذرك - اسمع له.`,
    yellow: `في أنماط مش صحية في علاقتك مع ${personLabel} محتاجة انتباه. الحدود هتحميك.`,
    green: `علاقتك مع ${personLabel} صحية ومتوازنة. حافظ عليها واستمر.`
  };

  const personalizedTitle = {
    red: `قربك من "${personLabel}" مؤلم ومحتاج حماية`,
    yellow: `علاقتك مع "${personLabel}" محتاجة ضبط`,
    green: `علاقتك مع "${personLabel}" صحية وآمنة`
  };

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      {/* النتيجة الرئيسية */}
      <div className="p-6 bg-linear-to-br from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {personalizedTitle[zone]}
        </h2>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-500 text-center">
          <p>
            الحالة: <span className="font-semibold text-slate-700">{stateLabel}</span>
          </p>
          {getGoalAction(goalId) && (
            <p>
              الهدف: <span className="font-semibold text-slate-700">{getGoalAction(goalId)}</span>
            </p>
          )}
        </div>
      </div>

      {/* فهم الوضع */}
      <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-xl text-right mb-6">
        <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
          <span>🔍</span> فهم الوضع
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          {understanding[zone]}
        </p>
      </div>

      {summaryOnly && onClose ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onClose(addedNodeId)}
            className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-200"
          >
            افتح {personLabel}
          </button>
          <button
            type="button"
            onClick={() => onClose()}
            className="w-full rounded-full bg-gray-100 text-gray-700 px-8 py-3 text-sm font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-200"
          >
            تم
          </button>
        </div>
      ) : null}
    </motion.div>
  );
};
