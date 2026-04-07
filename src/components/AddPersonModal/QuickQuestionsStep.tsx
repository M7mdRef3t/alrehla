import type { FC } from "react";

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
  nextLabel
}) => {
  return (
    <form onSubmit={onContinue} className="text-right h-full min-h-0 flex flex-col relative z-10 transition-colors duration-700">
      
      {/* Red Alert Ambient Glow */}
      {isEmergency && (
        <div 
          className="absolute -inset-8 pointer-events-none z-[-1] animate-pulse rounded-3xl"
          style={{
            background: "radial-gradient(ellipse at center, rgba(153,27,27,0.4) 0%, rgba(69,10,10,0.15) 50%, transparent 100%)",
            boxShadow: "inset 0 0 100px rgba(153,27,27,0.3)"
          }}
        />
      )}

      <h2 className={`text-xl font-extrabold mb-6 tracking-tight transition-colors ${isEmergency ? "text-rose-100 drop-shadow-[0_0_8px_rgba(225,29,72,0.6)]" : "text-slate-100"}`}>
        <EditableText id="add_person_quick_title" defaultText={title} page="add_person" />
      </h2>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-5 mb-6 relative z-10">
        <div className={`border rounded-2xl p-4 transition-all duration-500 ${isEmergency ? "bg-rose-950/20 border-rose-900/50" : "bg-slate-900/50 border-slate-700"}`}>
          <p className={`text-sm font-semibold mb-4 tracking-wide border-b pb-2 ${isEmergency ? "text-rose-200 border-rose-900/50" : "text-slate-300 border-slate-800"}`}>
            <EditableText id="add_person_quick_q1" defaultText={question1} page="add_person" showEditIcon={false} />
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {options1.map((opt) => {
              const isSelected = quickAnswer1 === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectQuick1(opt.value)}
                  className={`flex items-center justify-center text-center p-3 text-xs sm:text-sm font-bold transition-all rounded-xl border ${
                    isSelected 
                      ? isEmergency 
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                        : 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : isEmergency
                        ? 'bg-rose-950/40 border-rose-900/60 text-rose-400/60 hover:bg-rose-900/40 hover:text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className={`border rounded-2xl p-4 transition-all duration-500 mt-4 ${isEmergency ? "bg-rose-950/20 border-rose-900/50" : "bg-slate-900/50 border-slate-700"}`}>
          <p className={`text-sm font-semibold mb-4 tracking-wide border-b pb-2 ${isEmergency ? "text-rose-200 border-rose-900/50" : "text-slate-300 border-slate-800"}`}>
            <EditableText id="add_person_quick_q2" defaultText={question2} page="add_person" showEditIcon={false} />
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {options2.map((opt) => {
              const isSelected = quickAnswer2 === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectQuick2(opt.value)}
                  className={`flex items-center justify-center text-center p-3 text-xs sm:text-sm font-bold transition-all rounded-xl border ${
                    isSelected 
                      ? isEmergency 
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                        : 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : isEmergency
                        ? 'bg-rose-950/40 border-rose-900/60 text-rose-400/60 hover:bg-rose-900/40 hover:text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className={`mt-6 rounded-2xl transition-all duration-500 overflow-hidden border ${isEmergency ? 'bg-rose-950/40 border-rose-500/50 shadow-[0_0_40px_rgba(225,29,72,0.2)] scale-[1.02]' : 'bg-slate-900/30 border-slate-800'}`}>
            <div className={`p-4 border-b ${isEmergency ? 'border-rose-900 bg-rose-950/50' : 'border-slate-800'} flex items-center justify-between`}>
              <div className={`text-sm font-black tracking-wide ${isEmergency ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]' : 'text-slate-400'}`}>
                <EditableText
                  id="add_person_emergency_q"
                  defaultText="هل الوضع طوارئ؟ (إيذاء بدني، ابتزاز خطير)"
                  page="add_person"
                  showEditIcon={false}
                />
              </div>
              {isEmergency ? (
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping shadow-[0_0_10px_#f43f5e]" />
              ) : null}
            </div>
            <div className="p-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  import("../../services/soundManager").then(m => m.soundManager.playEffect("cosmic_pulse"));
                  onSelectEmergency(false);
                }}
                className={`flex-1 flex items-center justify-center text-center p-3 text-xs sm:text-sm font-bold transition-all rounded-xl border ${!isEmergency ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-500/70 hover:border-slate-700 hover:bg-slate-800'}`}
              >
                <EditableText id="add_person_emergency_no" defaultText="آمن" page="add_person" editOnClick={false} />
              </button>
              <button
                type="button"
                onClick={() => {
                  import("../../services/soundManager").then(m => m.soundManager.playEffect("tension"));
                  onSelectEmergency(true);
                }}
                className={`flex-1 flex items-center justify-center text-center p-3 text-xs sm:text-sm font-black tracking-widest uppercase transition-all rounded-xl border ${isEmergency ? 'bg-rose-600 border-rose-400 text-white shadow-[0_0_30px_rgba(225,29,72,0.5)] scale-105' : 'bg-rose-950/20 border-rose-900/50 text-rose-500 hover:bg-rose-900/40 hover:text-rose-400'}`}
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
      <div className="mt-6 shrink-0 flex gap-3 relative z-10">
        <button
          type="button"
          data-variant="ghost"
          data-size="md"
          className="ds-button flex-1"
          onClick={onBack}
        >
          <EditableText id="add_person_quick_back" defaultText="رجوع" page="add_person" editOnClick={false} />
        </button>
        <button
          type="submit"
          disabled={disableSubmit}
          className={`ds-button flex-1 border ${isEmergency ? "bg-rose-600 hover:bg-rose-500 border-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.4)]" : "bg-teal-600 hover:bg-teal-500 border-teal-400"} text-white font-bold transition-all`}
        >
          <EditableText id="add_person_quick_next" defaultText={nextLabel} page="add_person" editOnClick={false} />
        </button>
      </div>
    </form>
  );
};

