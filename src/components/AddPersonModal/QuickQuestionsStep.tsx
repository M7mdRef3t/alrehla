import type { FC } from "react";
import { motion } from "framer-motion";
import { getOptionButtonClass } from "../../utils/optionColors";
import type { OptionTier } from "../../utils/optionColors";
import { EditableText } from "../EditableText";

interface OptionItem {
  value: string;
  label: string;
}

interface QuickQuestionsStepProps {
  title: string;
  question1: string;
  options1: OptionItem[];
  question2: string;
  options2: OptionItem[];
  quickAnswer1: string | null;
  quickAnswer2: string | null;
  isEmergency: boolean;
  onSelectQuick1: (value: string) => void;
  onSelectQuick2: (value: string) => void;
  onSelectEmergency: (value: boolean) => void;
  onBack: () => void;
  onContinue: (e: React.FormEvent) => void;
  disableSubmit: boolean;
  getTier1: (value: string) => OptionTier;
  getTier2: (value: string) => OptionTier;
  nextLabel: string;
}

export const QuickQuestionsStep: FC<QuickQuestionsStepProps> = ({
  title,
  question1,
  options1,
  question2,
  options2,
  quickAnswer1,
  quickAnswer2,
  isEmergency,
  onSelectQuick1,
  onSelectQuick2,
  onSelectEmergency,
  onBack,
  onContinue,
  disableSubmit,
  getTier1,
  getTier2,
  nextLabel
}) => {
  return (
    <form onSubmit={onContinue} className="text-right h-full min-h-0 flex flex-col relative z-10 transition-colors duration-700">
      
      {/* Red Alert Ambient Glow */}
      {isEmergency && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -inset-10 pointer-events-none z-[-1] rounded-3xl"
          style={{
            background: "radial-gradient(ellipse at center, rgba(244,63,94,0.15) 0%, rgba(244,63,94,0.05) 50%, transparent 100%)",
            boxShadow: "inset 0 0 120px rgba(244,63,94,0.2)"
          }}
        />
      )}

      <h2 className={`text-xl font-extrabold mb-6 tracking-tight transition-colors ${isEmergency ? "text-rose-100 drop-shadow-[0_0_8px_rgba(225,29,72,0.6)]" : "text-slate-100"}`}>
        <EditableText id="add_person_quick_title" defaultText={title} page="add_person" />
      </h2>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-5 mb-6 relative z-10">
        <div className={`rounded-3xl p-6 transition-all duration-700 bg-white/[0.03] border ${isEmergency ? "border-rose-900/50 shadow-[0_0_30px_rgba(244,63,94,0.05)]" : "border-white/5"}`}>
          <p className={`text-xs font-black mb-5 tracking-[0.2em] uppercase ${isEmergency ? "text-rose-400" : "text-teal-500/60"}`}>
            <EditableText id="add_person_quick_q1" defaultText={question1} page="add_person" showEditIcon={false} />
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {options1.map((opt) => {
              const isSelected = quickAnswer1 === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectQuick1(opt.value)}
                  className={`flex items-center justify-center text-center px-4 py-3.5 text-xs sm:text-sm font-bold transition-all duration-500 rounded-2xl border ${
                    isSelected 
                      ? isEmergency 
                        ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] scale-[1.02]'
                        : 'bg-teal-500 text-white border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.2)] scale-[1.02]' 
                      : isEmergency
                        ? 'bg-rose-950/20 border-rose-900/40 text-rose-500/60 hover:bg-rose-900/30 hover:text-rose-300'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className={`rounded-3xl p-6 transition-all duration-700 bg-white/[0.03] border ${isEmergency ? "border-rose-900/50 shadow-[0_0_30px_rgba(244,63,94,0.05)]" : "border-white/5"}`}>
          <p className={`text-xs font-black mb-5 tracking-[0.2em] uppercase ${isEmergency ? "text-rose-400" : "text-teal-500/60"}`}>
            <EditableText id="add_person_quick_q2" defaultText={question2} page="add_person" showEditIcon={false} />
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {options2.map((opt) => {
              const isSelected = quickAnswer2 === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectQuick2(opt.value)}
                  className={`flex items-center justify-center text-center px-4 py-3.5 text-xs sm:text-sm font-bold transition-all duration-500 rounded-2xl border ${
                    isSelected 
                      ? isEmergency 
                        ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] scale-[1.02]'
                        : 'bg-teal-500 text-white border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.2)] scale-[1.02]' 
                      : isEmergency
                        ? 'bg-rose-950/20 border-rose-900/40 text-rose-500/60 hover:bg-rose-900/30 hover:text-rose-300'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className={`mt-2 rounded-3xl transition-all duration-700 overflow-hidden border ${isEmergency ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.15)] scale-[1.02]' : 'bg-white/[0.03] border-white/5'}`}>
            <div className={`p-6 border-b ${isEmergency ? 'border-rose-500/30 bg-rose-500/10' : 'border-white/5'} flex items-center justify-between`}>
              <div className={`text-xs font-black tracking-[0.1em] uppercase ${isEmergency ? 'text-rose-400' : 'text-slate-400'}`}>
                <EditableText
                  id="add_person_emergency_q"
                  defaultText="حالة طوارئ؟ (إيذاء، ابتزاز)"
                  page="add_person"
                  showEditIcon={false}
                />
              </div>
              {isEmergency && (
                <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity }} className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_15px_#f43f5e]" />
              )}
            </div>
            <div className="p-6 flex gap-4">
              <button
                type="button"
                onClick={() => {
                  import("../../services/soundManager").then(m => m.soundManager.playEffect("cosmic_pulse"));
                  onSelectEmergency(false);
                }}
                className={`flex-1 flex items-center justify-center text-center p-4 text-xs sm:text-sm font-black tracking-widest transition-all duration-500 rounded-2xl border ${!isEmergency ? 'bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-transparent border-white/5 text-slate-600 hover:border-white/10'}`}
              >
                <EditableText id="add_person_emergency_no" defaultText="آمن" page="add_person" editOnClick={false} />
              </button>
              <button
                type="button"
                onClick={() => {
                  import("../../services/soundManager").then(m => m.soundManager.playEffect("tension"));
                  onSelectEmergency(true);
                }}
                className={`flex-1 flex items-center justify-center text-center p-4 text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-700 rounded-2xl border ${isEmergency ? 'bg-rose-600 border-rose-400 text-white shadow-[0_0_30px_rgba(244,63,94,0.4)] scale-105' : 'bg-rose-950/20 border-rose-900/50 text-rose-500/60 hover:bg-rose-900/40 hover:text-rose-400'}`}
              >
                <EditableText
                  id="add_person_emergency_yes"
                  defaultText="طوارئ ⚠️"
                  page="add_person"
                  editOnClick={false}
                />
              </button>
            </div>
        </div>
      </div>
      <div className="mt-8 shrink-0 flex gap-4 relative z-10">
        <button
          type="button"
          className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:bg-white/10 hover:text-white transition-all duration-500"
          onClick={onBack}
        >
          <EditableText id="add_person_quick_back" defaultText="رجوع" page="add_person" editOnClick={false} />
        </button>
        <button
          type="submit"
          disabled={disableSubmit}
          className={`flex-1 px-6 py-4 rounded-2xl font-black tracking-widest transition-all duration-700 ${
            isEmergency 
              ? "bg-rose-600 text-white shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:bg-rose-500" 
              : "bg-teal-500 text-white shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:bg-teal-400"
          }`}
        >
          <EditableText id="add_person_quick_next" defaultText={nextLabel} page="add_person" editOnClick={false} />
        </button>
      </div>
    </form>
  );
};

