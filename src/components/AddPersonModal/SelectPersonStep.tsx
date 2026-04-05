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
    "اكتب اسماً رمزياً لحماية مساحتك (اختياري)...",
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
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-stretch min-h-0 flex-1 overflow-y-auto pr-1 pb-4 scrollbar-none"
          style={{ gridAutoRows: "minmax(0, 1fr)" }}
        >
          {suggestions.map((suggestion: SuggestionCard) => {
            const Icon = suggestion.icon;
            const isSelected = selectedTitle === suggestion.label && !showCustomTitleInput;
            return (
              <motion.button
                key={suggestion.label}
                type="button"
                onClick={() => {
                  import("../../services/soundManager").then(m => m.soundManager.playEffect("cosmic_pulse"));
                  onTitleSelect(suggestion.label);
                }}
                className={`group relative w-full h-full min-h-0 flex flex-col items-center justify-center gap-3 rounded-2xl border transition-all duration-500 focus-visible:outline-none p-4 overflow-hidden ${isSelected
                    ? "bg-teal-500/10 border-teal-400/50 shadow-[0_0_40px_rgba(45,212,191,0.15)]"
                    : "bg-slate-900/40 border-white/5 hover:border-slate-500 hover:bg-slate-800/60"
                  }`}
                title={`اختيار "${suggestion.label}"`}
                whileHover={{ scale: isSelected ? 1 : 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* HUD Corners */}
                <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l rounded-tl-lg transition-colors duration-500 ${isSelected ? "border-teal-400" : "border-white/10 group-hover:border-white/30"}`} />
                <div className={`absolute top-0 right-0 w-3 h-3 border-t border-r rounded-tr-lg transition-colors duration-500 ${isSelected ? "border-teal-400" : "border-white/10 group-hover:border-white/30"}`} />
                <div className={`absolute bottom-0 left-0 w-3 h-3 border-b border-l rounded-bl-lg transition-colors duration-500 ${isSelected ? "border-teal-400" : "border-white/10 group-hover:border-white/30"}`} />
                <div className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r rounded-br-lg transition-colors duration-500 ${isSelected ? "border-teal-400" : "border-white/10 group-hover:border-white/30"}`} />

                {isSelected && (
                  <motion.div 
                    className="absolute inset-0 bg-teal-400/[0.03] pointer-events-none"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                <div
                  className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-500 ${isSelected ? "bg-teal-400/20 shadow-[0_0_20px_rgba(45,212,191,0.3)] rotate-0" : "bg-white/5 group-hover:bg-white/10 rotate-[-5deg] group-hover:rotate-0"
                    }`}
                >
                  <Icon className={`${isSelected ? "text-teal-300" : "text-slate-500 group-hover:text-slate-300"} w-7 h-7 transition-colors duration-500`} strokeWidth={1.5} />
                </div>
                <div
                  className={`min-h-9 flex items-center justify-center text-center font-black tracking-tight ${isSelected ? "text-teal-300 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]" : "text-slate-400 group-hover:text-slate-200"
                    } text-xs sm:text-sm line-clamp-2 transition-colors duration-500`}
                >
                  {suggestion.label}
                </div>
              </motion.button>
            );
          })}
          <motion.button
            type="button"
            onClick={() => onTitleSelect("__custom__")}
            className={`group relative w-full h-full min-h-0 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed transition-all duration-300 focus-visible:outline-none p-4 overflow-hidden ${showCustomTitleInput && customTitleInput.trim()
                ? "bg-slate-800/80 border-slate-500"
                : "bg-slate-900/40 border-slate-700 hover:border-slate-500"
              }`}
            title="إضافة مسمى مخصص"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-12 h-12 shrink-0 rounded-full bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center transition-colors">
              <span className="text-slate-400 group-hover:text-slate-200 text-2xl font-light leading-none">+</span>
            </div>
            <div className="min-h-9 flex items-center justify-center text-center text-xs sm:text-sm font-bold text-slate-500 group-hover:text-slate-300 tracking-wide transition-colors">
              <EditableText id="add_person_select_other" defaultText="مسمى آخر" page="add_person" showEditIcon={false} />
            </div>
          </motion.button>
        </div>
        {showCustomTitleInput && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 shrink-0">
            <input
              id="custom-title-input"
              name="customTitle"
              type="text"
              value={customTitleInput}
              onChange={(e) => onCustomTitleChange(e.target.value)}
              placeholder={customTitlePlaceholder}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all font-bold placeholder:text-white/20"
              autoFocus
            />
          </motion.div>
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
          <label htmlFor="person-name-input" className="block text-xs font-semibold text-teal-500/60 mb-2 uppercase tracking-widest">
            <EditableText id="add_person_name_label" defaultText="معرف الكيان (الاسم الرمزي)" page="add_person" showEditIcon={false} />
          </label>
          <input
            id="person-name-input"
            name="personName"
            type="text"
            value={customName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={namePlaceholder}
            title="اكتب اسم الشخص (اختياري)"
            className="w-full bg-white/[0.02] border border-white/5 text-teal-300 text-lg sm:text-xl font-black focus:border-teal-500/50 focus:bg-white/[0.05] focus:ring-0 outline-none placeholder:text-white/10 transition-all duration-700 py-5 px-6 rounded-2xl font-mono tracking-wider shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]"
          />
          <p className="text-[10px] text-slate-500 mt-3 font-mono tracking-widest">
            <EditableText id="add_person_name_preview_prefix" defaultText="[ TARGET_ID ]: " page="add_person" showEditIcon={false} />
            <span className="font-bold text-teal-400 ml-1">
              <span className="animate-pulse mr-1 opacity-50">&gt;</span>
              {customName.trim() || selectedTitle}
            </span>
          </p>
          {contextualHint ? (
            <p className="text-[10px] text-[var(--soft-teal)] mt-1.5 bg-[var(--soft-teal)]/5 rounded-md px-2.5 py-2 border-l-2 border-[var(--soft-teal)] tracking-wide">
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

      <div className="mt-8 shrink-0 flex gap-4">
        <button
          type="button"
          className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:bg-white/10 hover:text-white transition-all duration-500"
          onClick={onCancel}
        >
          <EditableText id="add_person_cancel" defaultText="إلغاء الأمر" page="add_person" editOnClick={false} />
        </button>
        <button
          type="submit"
          disabled={!selectedTitle}
          className={`flex-1 px-6 py-4 rounded-2xl font-black tracking-widest transition-all duration-700 ${
            selectedTitle 
              ? "bg-teal-500 text-white shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(45,212,191,0.5)]" 
              : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
          }`}
        >
          <EditableText id="add_person_next" defaultText="استمر" page="add_person" editOnClick={false} />
        </button>
      </div>
    </form>
  );
};



