import type { FC } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Home,
  Heart,
  Wallet,
  HelpCircle,
  type LucideIcon
} from "lucide-react";
import { resolveAdviceCategory, type AdviceCategory } from "../data/adviceScripts";
import { goalPickerCopy } from "../copy/goalPicker";
import { trackEvent, AnalyticsEvents } from "../services/analytics";

// Icon lookup for each goal type
const ICON_MAP: Record<string, LucideIcon> = {
  work: Briefcase,
  family: Home,
  love: Heart,
  money: Wallet,
  unknown: HelpCircle
};

const tileVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" }
  })
};

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
  const handleSelect = (goalId: string) => {
    const category = resolveAdviceCategory(goalId);
    trackEvent(AnalyticsEvents.GOAL_SELECTED, { goal_id: goalId, category });
    onContinue(category, goalId);
  };

  return (
    <main
      className="w-full max-w-4xl py-10 md:py-14 text-center"
      aria-labelledby="goal-title"
    >
      <h1
        id="goal-title"
        className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4"
      >
        {goalPickerCopy.title}
      </h1>
      <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto mb-10">
        {goalPickerCopy.subtitle}
      </p>

      <div
        className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 justify-items-center max-w-2xl mx-auto mb-12"
        role="group"
        aria-label="اختر أكثر حاجة شاغلة بالك"
      >
        {goalPickerCopy.options.map((option, i) => {
          const Icon = ICON_MAP[option.id];
          const isSelected = initialGoalId != null && option.id === initialGoalId;
          return (
            <motion.button
              key={option.id}
              type="button"
              custom={i}
              variants={tileVariants}
              initial="hidden"
              animate="visible"
              className={`w-full max-w-[280px] rounded-2xl shadow-sm border-2 px-6 py-6 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 cursor-pointer select-none hover:shadow-md hover:scale-[1.02] ${
                isSelected
                  ? "border-teal-500 bg-teal-50 dark:bg-teal-900/40 dark:border-teal-600"
                  : "border-transparent bg-white dark:bg-slate-800 hover:border-teal-200 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/30"
              }`}
              onClick={() => handleSelect(option.id)}
              title={option.label}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex justify-center mb-3">
                <Icon
                  className="w-12 h-12 text-slate-500"
                  aria-hidden="true"
                />
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {option.label}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {option.subtitle}
              </p>
            </motion.button>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          className="rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 px-6 py-3 text-sm text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 cursor-pointer select-none"
          onClick={onBack}
          title="رجوع للشاشة السابقة"
          aria-label="رجوع"
        >
          {goalPickerCopy.buttons.back}
        </button>
      </div>
    </main>
  );
};
