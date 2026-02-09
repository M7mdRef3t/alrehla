import type { FC } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Briefcase,
  Home,
  Heart,
  Wallet,
  HelpCircle,
  Users,
  Star,
  Target
} from "lucide-react";
import { resolveAdviceCategory, type AdviceCategory } from "../data/adviceScripts";
import { goalPickerCopy } from "../copy/goalPicker";
import { useJourneyState } from "../state/journeyState";
import { EditableText } from "./EditableText";
import { trackEvent, AnalyticsEvents } from "../services/analytics";

// Icon lookup for each goal type
const ICON_MAP: Record<string, any> = {
  work: Briefcase,
  family: Home,
  friends: Users,
  love: Heart,
  money: Wallet,
  unknown: HelpCircle
};

const ENABLED_GOAL_IDS = ["family", "friends", "work", "love", "money", "unknown"];

const tileVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      delay: i * 0.1, 
      duration: 0.5, 
      ease: [0.16, 1, 0.3, 1] 
    }
  })
};

// Smart recommendations based on baseline answers
function getSmartRecommendations(baselineAnswers?: any): string[] {
  if (!baselineAnswers) return [];
  
  const recommendations: string[] = [];
  
  // If boundaries are weak (q1 <= 2), recommend family and friends
  if (baselineAnswers.q1 && baselineAnswers.q1 <= 2) {
    recommendations.push("family", "friends");
  }
  
  // If energy drain is high (q2 >= 4), recommend work and money
  if (baselineAnswers.q2 && baselineAnswers.q2 >= 4) {
    recommendations.push("work", "money");
  }
  
  // If relationship clarity is low, recommend love
  if (baselineAnswers.q3 === "no") {
    recommendations.push("love");
  }
  
  // If motivation is high (q4 >= 4), recommend all areas
  if (baselineAnswers.q4 && baselineAnswers.q4 >= 4) {
    return ENABLED_GOAL_IDS;
  }
  
  return recommendations.length > 0 ? recommendations : ["family"]; // Default to family
}

interface GoalPickerProps {
  /** الهدف المحفوظ سابقاً (يُظهَر كمحدد عند الرجوع للخطوة) */
  initialGoalId?: string;
  onBack: () => void;
  onContinue: (category: AdviceCategory, goalId: string) => void;
}

export const GoalPicker: FC<GoalPickerProps> = ({
  initialGoalId,
  onBack,
  onContinue
}) => {
  const [recommendedGoals, setRecommendedGoals] = useState<string[]>([]);
  const baselineAnswers = useJourneyState((s) => s.baselineAnswers);

  useEffect(() => {
    const recommendations = getSmartRecommendations(baselineAnswers);
    setRecommendedGoals(recommendations);
  }, [baselineAnswers]);

  const handleSelect = (goalId: string) => {
    if (!ENABLED_GOAL_IDS.includes(goalId)) return;
    const category = resolveAdviceCategory(goalId);
    trackEvent(AnalyticsEvents.GOAL_SELECTED, { goal_id: goalId, category });
    onContinue(category, goalId);
  };

  return (
    <main
      className="w-full max-w-4xl py-10 md:py-14 text-center"
      aria-labelledby="goal-title"
    >
      {/* Progress indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-teal-600 to-blue-600 rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              خطوة 2 من 4
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              اختيار الهدف
            </p>
          </div>
        </div>
        <div className="mt-3 w-full max-w-xs mx-auto h-1 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"
            initial={{ width: "25%" }}
            animate={{ width: "50%" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Emotional introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h1
          id="goal-title"
          className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6"
        >
          <EditableText id="goal_picker_title" defaultText={goalPickerCopy.title} page="goal_picker" />
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
          <EditableText
            id="goal_picker_subtitle"
            defaultText={goalPickerCopy.subtitle}
            page="goal_picker"
            multiline
            showEditIcon={false}
          />
        </p>
      </motion.div>

      {/* Enhanced goal cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 justify-items-center max-w-4xl mx-auto mb-12"
        role="group"
        aria-label="اختر أكثر حاجة شاغلة بالك"
      >
        {goalPickerCopy.options.map((option, i) => {
          const Icon = ICON_MAP[option.id];
          const isEnabled = ENABLED_GOAL_IDS.includes(option.id);
          const isSelected = initialGoalId != null && option.id === initialGoalId;
          const isRecommended = recommendedGoals.includes(option.id);
          
          return (
            <motion.div
              key={option.id}
              custom={i}
              variants={tileVariants}
              initial="hidden"
              animate="visible"
              className="relative group"
            >
              {/* Recommended badge */}
              {isRecommended && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 400 }}
                  className="absolute -top-3 -right-3 z-10"
                >
                  <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    موصى به
                  </div>
                </motion.div>
              )}
              
              <motion.button
                type="button"
                className={`group/card relative w-full max-w-[320px] rounded-2xl shadow-lg border-2 px-8 py-8 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none ${
                  !isEnabled
                    ? "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 cursor-not-allowed opacity-75 focus-visible:ring-gray-300"
                    : isSelected
                      ? "border-teal-500 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/40 dark:to-blue-900/40 dark:border-teal-600 cursor-pointer focus-visible:ring-teal-400 hover:shadow-xl hover:scale-[1.02]"
                      : "border-transparent bg-white dark:bg-slate-800 hover:border-teal-200 dark:hover:border-teal-700 hover:bg-gradient-to-br hover:from-teal-50 hover:to-blue-50 dark:hover:from-teal-900/30 dark:hover:to-blue-900/30 cursor-pointer focus-visible:ring-teal-400 hover:shadow-xl hover:scale-[1.02]"
                }`}
                onClick={() => handleSelect(option.id)}
                title={isEnabled ? option.label : "قريبًا"}
                disabled={!isEnabled}
                whileTap={isEnabled ? { scale: 0.98 } : undefined}
                whileHover={isEnabled ? { scale: 1.02, y: -4 } : {}}
              >
                {!isEnabled && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/90 dark:bg-slate-900/90 opacity-0 group-hover/card:opacity-100 transition-opacity z-10 text-base font-bold text-slate-600 dark:text-slate-300">
                    <EditableText
                      id="goal_picker_coming_soon"
                      defaultText="قريبًا"
                      page="goal_picker"
                      showEditIcon={false}
                    />
                  </span>
                )}
                
                <div className="flex justify-center mb-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Icon
                      className={`w-16 h-16 ${!isEnabled ? "text-slate-400 dark:text-slate-500" : "text-teal-600 dark:text-teal400"}`}
                      aria-hidden="true"
                    />
                  </motion.div>
                </div>
                
                <p className={`text-lg font-bold mb-3 ${!isEnabled ? "text-slate-500 dark:text-slate-500" : "text-slate-900 dark:text-white"}`}>
                  <EditableText
                    id={`goal_picker_option_${option.id}_label`}
                    defaultText={option.label}
                    page="goal_picker"
                    editOnClick={false}
                  />
                </p>
                
                <p className={`text-sm leading-relaxed ${!isEnabled ? "text-slate-400 dark:text-slate-500" : "text-slate-600 dark:text-slate-400"}`}>
                  <EditableText
                    id={`goal_picker_option_${option.id}_subtitle`}
                    defaultText={option.subtitle}
                    page="goal_picker"
                    multiline
                    editOnClick={false}
                  />
                </p>
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex justify-center"
      >
        <motion.button
          type="button"
          className="rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 px-8 py-4 text-base text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-[0.98] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 cursor-pointer select-none shadow-md hover:shadow-lg"
          onClick={onBack}
          title="رجوع للشاشة السابقة"
          aria-label="رجوع"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <EditableText
            id="goal_picker_back"
            defaultText={goalPickerCopy.buttons.back}
            page="goal_picker"
            editOnClick={false}
          />
        </motion.button>
      </motion.div>
    </main>
  );
};
