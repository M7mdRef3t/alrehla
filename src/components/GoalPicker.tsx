import type { FC } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Briefcase,
  Home,
  Heart,
  Wallet,
  HelpCircle,
  Users,
  type LucideIcon
} from "lucide-react";
import { resolveAdviceCategory, type AdviceCategory } from "../data/adviceScripts";
import { goalPickerCopy } from "../copy/goalPicker";
import { EditableText } from "./EditableText";
import { trackEvent, AnalyticsEvents } from "../services/analytics";

// Icon lookup for each goal type
const ICON_MAP: Record<string, LucideIcon> = {
  work: Briefcase,
  family: Home,
  friends: Users,
  love: Heart,
  money: Wallet,
  unknown: HelpCircle
};

const ENABLED_GOAL_IDS = ["family", "friends", "work", "love", "money", "unknown"];

const tileVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }
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
      <h1
        id="goal-title"
        className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4"
      >
        <EditableText id="goal_picker_title" defaultText={goalPickerCopy.title} page="goal_picker" />
      </h1>
      <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto mb-10">
        <EditableText
          id="goal_picker_subtitle"
          defaultText={goalPickerCopy.subtitle}
          page="goal_picker"
          multiline
          showEditIcon={false}
        />
      </p>

      <div
        className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 justify-items-center max-w-2xl mx-auto mb-12"
        role="group"
        aria-label="اختر أكثر حاجة شاغلة بالك"
      >
        {goalPickerCopy.options.map((option, i) => {
          const Icon = ICON_MAP[option.id];
          const isEnabled = ENABLED_GOAL_IDS.includes(option.id);
          const isSelected = initialGoalId != null && option.id === initialGoalId;
          return (
            <motion.button
              key={option.id}
              type="button"
              custom={i}
              variants={tileVariants}
              initial="hidden"
              animate="visible"
              className={`group/card relative w-full max-w-[280px] rounded-2xl shadow-sm border-2 px-6 py-6 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none ${
                !isEnabled
                  ? "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 cursor-not-allowed opacity-75 focus-visible:ring-gray-300"
                  : isSelected
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-900/40 dark:border-teal-600 cursor-pointer focus-visible:ring-teal-400 hover:shadow-md hover:scale-[1.02]"
                    : "border-transparent bg-white dark:bg-slate-800 hover:border-teal-200 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/30 cursor-pointer focus-visible:ring-teal-400 hover:shadow-md hover:scale-[1.02]"
              }`}
              onClick={() => handleSelect(option.id)}
              title={isEnabled ? option.label : "قريبًا"}
              disabled={!isEnabled}
              whileTap={isEnabled ? { scale: 0.98 } : undefined}
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
              <div className="flex justify-center mb-3">
                <Icon
                  className={`w-12 h-12 ${!isEnabled ? "text-slate-400 dark:text-slate-500" : "text-slate-500"}`}
                  aria-hidden="true"
                />
              </div>
              <p className={`text-base font-bold mb-1 ${!isEnabled ? "text-slate-500 dark:text-slate-500" : "text-slate-900 dark:text-white"}`}>
                <EditableText
                  id={`goal_picker_option_${option.id}_label`}
                  defaultText={option.label}
                  page="goal_picker"
                  editOnClick={false}
                />
              </p>
              <p className={`text-sm leading-relaxed ${!isEnabled ? "text-slate-400 dark:text-slate-500" : "text-slate-500 dark:text-slate-400"}`}>
                <EditableText
                  id={`goal_picker_option_${option.id}_subtitle`}
                  defaultText={option.subtitle}
                  page="goal_picker"
                  multiline
                  editOnClick={false}
                />
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
          <EditableText
            id="goal_picker_back"
            defaultText={goalPickerCopy.buttons.back}
            page="goal_picker"
            editOnClick={false}
          />
        </button>
      </div>
    </main>
  );
};
