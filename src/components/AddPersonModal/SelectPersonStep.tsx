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
    "أدخل مسمى مخصص...",
    { page: "add_person" }
  );

  const namePlaceholder = useAppContentString(
    "add_person_name_placeholder",
    "مثلاً: فلان الفلاني (اختياري)...",
    { page: "add_person" }
  );

  return (
    <form onSubmit={onContinue} className="text-right flex flex-col min-h-0 h-full">
      <h2 id="add-person-title" className="text-xl font-extrabold text-slate-100 mb-6 shrink-0 tracking-tight">
        <EditableText id="map_add_person_title" defaultText={mapCopy.addPersonTitle} page="map" />
      </h2>

      {/* Step 1: Select Title — اختر من الاقتراحات أو المسميات العامة لوصف هذا الكيان */}
      <div className="flex flex-col min-h-0 flex-auto overflow-hidden mb-6">
        <label className="block text-sm font-semibold text-slate-300 mb-3 shrink-0">
          <EditableText id="add_person_select_label" defaultText="نوع العلاقة" page="add_person" showEditIcon={false} />{" "}
          <span className="text-rose-500">*</span>
        </label>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-stretch min-h-0 flex-1 overflow-y-auto pr-1 pb-2 scrollbar-none"
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
                className={`w-full h-full min-h-0 flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 p-3 ${isSelected
                    ? "bg-teal-500/20 border-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.15)]"
                    : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10"
                  }`}
                title={`اختيار "${suggestion.label}"`}
                whileHover={{ scale: isSelected ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${isSelected ? "bg-teal-500/30" : "bg-white/5"
                    }`}
                >
                  <Icon className={`${isSelected ? "text-teal-400" : "text-slate-400"} w-5 h-5`} strokeWidth={2} />
                </div>
                <div
                  className={`min-h-9 flex items-center justify-center text-center font-bold leading-tight ${isSelected ? "text-teal-100" : "text-slate-300"
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
            className={`w-full h-full min-h-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 p-3 ${showCustomTitleInput && customTitleInput.trim()
                ? "bg-white/10 border-white/30"
                : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
              }`}
            title="إضافة مسمى مخصص"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center">
              <span className="text-slate-400 text-lg font-bold leading-none">+</span>
            </div>
            <div className="min-h-9 flex items-center justify-center text-center text-xs sm:text-sm font-bold text-slate-400 leading-tight">
              <EditableText id="add_person_select_other" defaultText="مسمى آخر" page="add_person" showEditIcon={false} />
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
              className="ds-input"
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
          <label htmlFor="person-name-input" className="block text-xs font-semibold text-slate-400 mb-2">
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
            className="ds-input"
          />
          <p className="text-xs text-slate-500 mt-2">
            <EditableText id="add_person_name_preview_prefix" defaultText="سيظهر بـ:" page="add_person" showEditIcon={false} />{" "}
            <span className="font-bold text-teal-400">
              {customName.trim() || selectedTitle}
            </span>
          </p>
          {contextualHint ? (
            <p className="text-xs text-[var(--soft-teal)] mt-1 bg-[var(--soft-teal)]/10 rounded-lg px-2 py-1.5 border border-[var(--soft-teal)]">
              {contextualHint}
            </p>
          ) : null}
          {encouragementHint && !contextualHint && (
            <p className="text-xs text-teal-400 mt-2 bg-teal-500/10 rounded-xl px-3 py-2.5 border border-teal-500/20">
              ممكن تكتفي بلقب أو رمز (مثلاً: حد من العيلة أو زميل عمل) وتحافظ على خصوصيتك.
            </p>
          )}
        </motion.div>
      )}

      {encouragementHint && !selectedTitle && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-teal-400 mt-4 bg-teal-500/10 rounded-xl px-3 py-2.5 border border-teal-500/20 shrink-0"
        >
          اختار الشخص اللي شاغل بالك دلوقتي (سواء للأفضل أو للأسوأ) وهنحلل أثره.
        </motion.p>
      )}

      {afterNameContent ? <div className="shrink-0">{afterNameContent}</div> : null}

      <div className="mt-6 shrink-0 flex gap-3">
        <button
          type="button"
          data-variant="ghost"
          data-size="md"
          className="ds-button flex-1"
          onClick={onCancel}
        >
          <EditableText id="add_person_cancel" defaultText="إلغاء الأمر" page="add_person" editOnClick={false} />
        </button>
        <button
          type="submit"
          data-variant="primary"
          data-size="md"
          disabled={!selectedTitle}
          className="ds-button flex-1"
        >
          <EditableText id="add_person_next" defaultText="استمر" page="add_person" editOnClick={false} />
        </button>
      </div>
    </form>
  );
};



