import type { FC, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mapCopy } from "@/copy/map";
import { SUGGESTIONS, type SuggestionCard } from "./constants";
import { EditableText } from "../EditableText";
import { useAppContentString } from "@/hooks/useAppContentString";

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
      <h2 id="add-person-title" className="text-2xl font-black text-white mb-2 shrink-0 font-alexandria leading-[1.8]">
        <EditableText id="map_add_person_title" defaultText={mapCopy.addPersonTitle} page="map" />
      </h2>
      <p className="text-sm text-zinc-400 mb-6 shrink-0 font-tajawal">اختار الشخص اللي عايز تفهم علاقتك بيه</p>

      {/* Step 1: Select Title — اختر من الاقتراحات أو المسميات العامة لوصف هذا الكيان */}
      <div className="flex flex-col min-h-0 flex-auto overflow-hidden mb-6">
        <label className="block text-xs text-zinc-400 mb-3 shrink-0 font-tajawal">
          <EditableText id="add_person_acquire_target" defaultText="مين الشخص ده؟" page="add_person" showEditIcon={false} /> <span className="text-rose-400">*</span>
        </label>
        
        <div
          className="flex flex-col gap-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 pb-4 scrollbar-hide"
        >
          {suggestions.map((suggestion: SuggestionCard, idx: number) => {
            const Icon = suggestion.icon;
            const isSelected = selectedTitle === suggestion.label && !showCustomTitleInput;
            return (
              <motion.button
                key={suggestion.label}
                type="button"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  import("@/services/soundManager").then(m => m.soundManager.playEffect("cosmic_pulse"));
                  onTitleSelect(suggestion.label);
                }}
                className={`group relative w-full flex items-center gap-3 rounded-2xl transition-all duration-300 focus-visible:outline-none p-3 overflow-hidden ${isSelected
                    ? "bg-teal-500/10 border border-teal-400/30 shadow-[0_0_20px_rgba(45,212,191,0.08)]"
                    : "bg-white/[0.03] border border-transparent hover:border-white/10 hover:bg-white/[0.05]"
                  }`}
                title={`اختيار "${suggestion.label}"`}
                whileTap={{ scale: 0.98 }}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <motion.div 
                    layoutId="selection-glow"
                    className="absolute inset-0 rounded-2xl bg-teal-400/5 pointer-events-none"
                  />
                )}

                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 z-10 ${isSelected ? "bg-teal-400/15 text-teal-300" : "bg-white/5 text-zinc-500 group-hover:text-zinc-300 group-hover:bg-white/8"}`}>
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div className={`flex-1 text-right z-10 font-tajawal text-sm ${isSelected ? "text-teal-300 font-bold" : "text-zinc-300 group-hover:text-white"}`}>
                  {suggestion.label}
                </div>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-teal-400 shrink-0 shadow-[0_0_8px_#2dd4bf]" />
                )}
              </motion.button>
            );
          })}
          
          <motion.button
            type="button"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: suggestions.length * 0.05 }}
            onClick={() => onTitleSelect("__custom__")}
            className={`group relative w-full flex items-center gap-3 rounded-2xl border border-dashed transition-all duration-300 focus-visible:outline-none p-3 overflow-hidden ${showCustomTitleInput
                ? "bg-teal-500/10 border-teal-400/30"
                : "bg-white/[0.02] border-white/10 hover:border-teal-500/30 hover:bg-white/[0.04]"
              }`}
            title="إضافة مسمى مخصص"
            whileTap={{ scale: 0.98 }}
          >
            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors duration-300 ${showCustomTitleInput ? "bg-teal-400/15 text-teal-300" : "bg-white/5 text-zinc-500 group-hover:text-zinc-300"}`}>
              <span className="text-xl font-light leading-none">+</span>
            </div>
            <div className={`flex-1 text-right font-tajawal text-sm ${showCustomTitleInput ? "text-teal-300 font-bold" : "text-zinc-400 group-hover:text-zinc-200"}`}>
              <EditableText id="add_person_select_other" defaultText="مسمى آخر" page="add_person" showEditIcon={false} />
            </div>
          </motion.button>
        </div>

        <AnimatePresence>
          {showCustomTitleInput && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: "auto" }} 
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 shrink-0 overflow-hidden"
            >
              <div className="relative bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
                <input
                  id="custom-title-input"
                  name="customTitle"
                  type="text"
                  value={customTitleInput}
                  onChange={(e) => onCustomTitleChange(e.target.value)}
                  placeholder={customTitlePlaceholder}
                  className="w-full bg-transparent text-teal-300 px-4 py-3 focus:outline-none placeholder:text-zinc-700 font-tajawal text-sm"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step 2: Optional Name */}
      {selectedTitle && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="shrink-0"
        >
        <label htmlFor="person-name-input" className="block text-xs text-zinc-400 mb-2 flex items-center gap-2 font-tajawal">
            <EditableText id="add_person_name_label" defaultText="اسم رمزي (اختياري)" page="add_person" showEditIcon={false} />
          </label>
          
          <div className="relative bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
            <input
              id="person-name-input"
              name="personName"
              type="text"
              value={customName}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={namePlaceholder}
              title="اكتب اسم الشخص (اختياري)"
              className="w-full bg-transparent text-white text-lg font-bold px-5 py-4 focus:outline-none placeholder:text-zinc-600 transition-all duration-300 font-tajawal"
            />
          </div>
          
          <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1 font-tajawal">
            هيتسجل باسم:
            <span className="font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-lg">
              {customName.trim() || selectedTitle}
            </span>
          </p>
          
          {contextualHint ? (
            <p className="text-[10px] text-teal-300 mt-2 bg-teal-900/20 rounded-sm px-3 py-2 border-l-2 border-teal-500/50 tracking-wide">
              {contextualHint}
            </p>
          ) : null}
          {encouragementHint && !contextualHint && (
            <p className="text-[10px] text-teal-400 mt-2 bg-teal-900/20 rounded-sm px-3 py-2 border-l-2 border-teal-500/50">
              ممكن تكتفي بلقب أو رمز (مثلاً: حد من العيلة أو زميل عمل) وتحافظ على خصوصيتك.
            </p>
          )}
        </motion.div>
      )}

      {encouragementHint && !selectedTitle && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] text-teal-400 mt-4 bg-teal-900/20 rounded-sm px-3 py-2 border-l-2 border-teal-500/50 shrink-0"
        >
          اختار الشخص اللي شاغل بالك دلوقتي (سواء للأفضل أو للأسوأ) وهنحلل أثره.
        </motion.p>
      )}

      {afterNameContent ? <div className="shrink-0">{afterNameContent}</div> : null}

      <div className="mt-6 shrink-0 flex gap-3">
        <button
          type="button"
          className="flex-1 px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-zinc-500 text-sm font-bold hover:bg-white/[0.06] hover:text-zinc-300 transition-all duration-300 font-tajawal"
          onClick={() => onCancel()}
        >
          <EditableText id="add_person_cancel" defaultText="رجوع" page="add_person" editOnClick={false} />
        </button>
        <button
          type="submit"
          disabled={!selectedTitle}
          className={`flex-1 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 relative overflow-hidden group font-tajawal ${
            selectedTitle 
              ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 hover:border-teal-400/50 hover:shadow-[0_8px_30px_rgba(45,212,191,0.12)]" 
              : "bg-white/[0.03] text-zinc-700 border border-white/5 cursor-not-allowed"
          }`}
        >
          {selectedTitle && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          )}
          <EditableText id="add_person_next" defaultText="يلا نكمل ←" page="add_person" editOnClick={false} />
        </button>
      </div>
    </form>
  );
};





