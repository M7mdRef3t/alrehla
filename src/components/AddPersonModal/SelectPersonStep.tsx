import type { FC, ReactNode } from "react";
import { motion } from "framer-motion";
import { mapCopy } from "../../copy/map";
import { SUGGESTIONS, type SuggestionCard } from "./constants";
import { EditableText } from "../EditableText";
import { useAppContentString } from "../../hooks/useAppContentString";

interface SelectPersonStepProps {
  goalId: string;
  selectedTitle: string;
  customTitleInput: string;
  showCustomTitleInput: boolean;
  customName: string;
  encouragementHint?: boolean;
  contextualHint?: string;
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
  encouragementHint,
  contextualHint,
  afterNameContent,
  onTitleSelect,
  onCustomTitleChange,
  onNameChange,
  onCancel,
  onContinue
}) => {
  const suggestions = SUGGESTIONS[goalId] || SUGGESTIONS.general;

  const customTitlePlaceholder = useAppContentString(
    "add_person_custom_title_placeholder",
    "اكتب اللقب...",
    { page: "add_person" }
  );

  const namePlaceholder = useAppContentString(
    "add_person_name_placeholder",
    "مثال: أحمد، محمد، سارة...",
    { page: "add_person" }
  );

  return (
    <form onSubmit={onContinue} className="text-right flex flex-col min-h-0 h-full">
      <h2 id="add-person-title" className="text-xl font-bold text-slate-900 mb-4 shrink-0">
        <EditableText id="map_add_person_title" defaultText={mapCopy.addPersonTitle} page="map" />
      </h2>
  
      {/* Step 1: Select Title — على قد المحتوى؛ لو المحتوى هيحتاج سكرول يملأ بدون سكرول */}
      <div className="flex flex-col min-h-0 flex-auto overflow-hidden mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2 shrink-0">
          <EditableText id="add_person_select_label" defaultText="اختر اللقب" page="add_person" showEditIcon={false} />{" "}
          <span className="text-red-500">*</span>
        </label>
        <div
          className="grid grid-cols-3 gap-2 items-stretch min-h-0 flex-1 overflow-hidden"
          style={{ gridAutoRows: "minmax(0, 1fr)" }}
        >
          {suggestions.map((suggestion: SuggestionCard) => {
            const Icon = suggestion.icon;
            const isSelected = selectedTitle === suggestion.label && !showCustomTitleInput;
            return (
              <motion.button
                key={suggestion.label}
                type="button"
                onClick={() => onTitleSelect(suggestion.label)}
                className={`w-full h-full min-h-0 flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 ${
                  isSelected
                    ? "bg-teal-50 border-teal-500"
                    : "bg-white border-gray-100 hover:border-teal-300 hover:bg-teal-50"
                }`}
                title={`اختر "${suggestion.label}"`}
                whileHover={{ scale: isSelected ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
                    isSelected ? "bg-teal-200" : "bg-teal-100"
                  }`}
                >
                  <Icon className={`${isSelected ? "text-teal-700" : "text-teal-600"} w-5 h-5`} strokeWidth={2} />
                </div>
                <div
                  className={`min-h-9 flex items-center justify-center text-center font-semibold leading-tight ${
                    isSelected ? "text-teal-900" : "text-slate-900"
                  } text-xs sm:text-sm line-clamp-2`}
                >
                  {suggestion.label}
                </div>
              </motion.button>
            );
          })}
          <motion.button
            type="button"
            onClick={() => onTitleSelect("__custom__")}
            className={`w-full h-full min-h-0 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1 ${
              showCustomTitleInput && customTitleInput.trim()
                ? "bg-gray-100 border-gray-400"
                : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
            }`}
            title="اكتب لقب يدوياً"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-10 h-10 shrink-0 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-slate-700 text-lg font-bold leading-none">+</span>
            </div>
            <div className="min-h-9 flex items-center justify-center text-center text-xs sm:text-sm font-semibold text-gray-700 leading-tight">
              <EditableText id="add_person_select_other" defaultText="حد تاني" page="add_person" showEditIcon={false} />
            </div>
          </motion.button>
        </div>
        {showCustomTitleInput && (
          <div className="mt-2 shrink-0">
            <input
              type="text"
              value={customTitleInput}
              onChange={(e) => onCustomTitleChange(e.target.value)}
              placeholder={customTitlePlaceholder}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
          className="shrink-0"
        >
          <label htmlFor="person-name-input" className="block text-xs font-medium text-gray-700 mb-1">
            <EditableText id="add_person_name_label" defaultText="الاسم (اختياري)" page="add_person" showEditIcon={false} />
          </label>
          <input
            id="person-name-input"
            name="personName"
            type="text"
            value={customName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={namePlaceholder}
            title="اكتب اسم الشخص (اختياري)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
          <p className="text-xs text-gray-500 mt-1">
            <EditableText id="add_person_name_preview_prefix" defaultText="سيظهر كـ:" page="add_person" showEditIcon={false} />{" "}
            <span className="font-semibold text-teal-700">
              {customName.trim() || selectedTitle}
            </span>
          </p>
          {contextualHint ? (
            <p className="text-xs text-[var(--color-primary)] mt-1 bg-[var(--color-primary)]/10 rounded-lg px-2 py-1.5 border border-[var(--color-primary)]">
              {contextualHint}
            </p>
          ) : null}
          {encouragementHint && !contextualHint && (
            <p className="text-xs text-teal-600 mt-1 bg-teal-50 rounded-lg px-2 py-1.5 border border-teal-100">
              تقدر تستخدم لقب أو رمز (مثل: س، المدير، أو الحرف الأول) لخصوصية كاملة.
            </p>
          )}
        </motion.div>
      )}

      {encouragementHint && !selectedTitle && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-teal-600 mt-2 bg-teal-50 rounded-lg px-2 py-1.5 border border-teal-100 shrink-0"
        >
          تقدر تستخدم لقب أو رمز (مثل: س، المدير، أو الحرف الأول) لخصوصية كاملة.
        </motion.p>
      )}

      {afterNameContent ? <div className="shrink-0">{afterNameContent}</div> : null}
  
      <div className="mt-3 shrink-0 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-full bg-gray-100 px-6 py-3 text-sm text-gray-700 font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          onClick={onCancel}
          title="إلغاء وإغلاق النافذة"
        >
          <EditableText id="add_person_cancel" defaultText="إلغاء" page="add_person" editOnClick={false} />
        </button>
        <button
          type="submit"
          disabled={!selectedTitle}
          className="flex-1 rounded-full bg-teal-600 text-white px-6 py-3 text-sm font-semibold hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          title={selectedTitle ? "التالي: حلل إحساسك" : "اختر اللقب أولاً"}
        >
          <EditableText id="add_person_next" defaultText="التالي" page="add_person" editOnClick={false} />
        </button>
      </div>
    </form>
  );
};


