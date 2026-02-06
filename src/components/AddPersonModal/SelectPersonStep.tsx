import type { FC, ReactNode } from "react";
import { motion } from "framer-motion";
import { mapCopy } from "../../copy/map";
import { SUGGESTIONS, type SuggestionCard } from "./constants";

interface SelectPersonStepProps {
  goalId: string;
  selectedTitle: string;
  customTitleInput: string;
  showCustomTitleInput: boolean;
  customName: string;
  afterNameContent?: ReactNode;
  onTitleSelect: (title: string) => void;
  onCustomTitleChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onCancel: () => void;
  onContinue: (e: React.FormEvent) => void;
}

export const SelectPersonStep: FC<SelectPersonStepProps> = ({
  goalId,
  selectedTitle,
  customTitleInput,
  showCustomTitleInput,
  customName,
  afterNameContent,
  onTitleSelect,
  onCustomTitleChange,
  onNameChange,
  onCancel,
  onContinue
}) => {
  const suggestions = SUGGESTIONS[goalId] || SUGGESTIONS.general;

  return (
    <form onSubmit={onContinue} className="text-right">
      <h2 id="add-person-title" className="text-xl font-bold text-slate-900 mb-4">
        {mapCopy.addPersonTitle}
      </h2>
  
      {/* Step 1: Select Title (Required) */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          اختر اللقب <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {suggestions.map((suggestion: SuggestionCard) => {
            const Icon = suggestion.icon;
            const isSelected = selectedTitle === suggestion.label && !showCustomTitleInput;
            const isPillar = goalId === "family" && (suggestion.label === "أب" || suggestion.label === "أم");
            return (
              <motion.button
                key={suggestion.label}
                type="button"
                onClick={() => onTitleSelect(suggestion.label)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 ${
                  isSelected
                    ? "bg-teal-50 border-teal-500 shadow-md"
                    : "bg-white border-gray-100 hover:border-teal-300 hover:bg-teal-50"
                } ${isPillar ? "p-3" : "p-2.5"}`}
                title={`اختر "${suggestion.label}"`}
                whileHover={{ scale: isSelected ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`rounded-full flex items-center justify-center ${
                  isSelected ? "bg-teal-200" : "bg-teal-100"
                } ${isPillar ? "w-10 h-10" : "w-8 h-8"}`}>
                  <Icon className={`${isSelected ? "text-teal-700" : "text-teal-600"} ${isPillar ? "w-5 h-5" : "w-4 h-4"}`} strokeWidth={2} />
                </div>
                <span className={`font-semibold ${isSelected ? "text-teal-900" : "text-slate-900"} ${isPillar ? "text-base" : "text-xs"}`}>
                  {suggestion.label}
                </span>
              </motion.button>
            );
          })}
          <motion.button
            type="button"
            onClick={() => onTitleSelect("__custom__")}
            className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 border-dashed transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1 ${
              showCustomTitleInput && customTitleInput.trim()
                ? "bg-gray-100 border-gray-400"
                : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
            }`}
            title="اكتب لقب يدوياً"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-xs font-medium text-gray-600">حد تاني</span>
          </motion.button>
        </div>
        {showCustomTitleInput && (
          <div className="mt-3">
            <input
              type="text"
              value={customTitleInput}
              onChange={(e) => onCustomTitleChange(e.target.value)}
              placeholder="اكتب اللقب..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Step 2: Optional Name */}
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
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="مثال: أحمد، محمد، سارة..."
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

      {afterNameContent}
  
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          className="flex-1 rounded-full bg-gray-100 px-6 py-3 text-sm text-gray-700 font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          onClick={onCancel}
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
  );
};
