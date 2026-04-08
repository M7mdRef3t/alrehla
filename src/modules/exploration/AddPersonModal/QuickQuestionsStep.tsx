import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  isEmergency: boolean | null;
  onSelectQuick1: (value: string) => void;
  onSelectQuick2: (value: string) => void;
  onSelectEmergency: (value: boolean) => void;
  onBack: () => void;
  onContinue: (e: React.FormEvent) => void;
  disableSubmit: boolean;
  nextLabel: string;
}

import React from "react";

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
  const [internalStep, setInternalStep] = React.useState(0);

  React.useEffect(() => {
    // Only auto-advance if we've reached the end of the wizard AND all answers are provided
    if (internalStep === 2 && quickAnswer1 && quickAnswer2 && isEmergency !== null) {
      const t = setTimeout(() => {
        onContinue({ preventDefault: () => {} } as React.FormEvent);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [internalStep, quickAnswer1, quickAnswer2, isEmergency, onContinue]);

  const handleBack = () => {
    if (internalStep > 0) {
      setInternalStep((s) => s - 1);
    } else {
      onBack();
    }
  };

  const handleEmergencySelect = (val: boolean) => {
    import("@/services/soundManager").then((m) =>
      m.soundManager.playEffect(val ? "tension" : "cosmic_pulse")
    );
    onSelectEmergency(val);
    setTimeout(() => setInternalStep(1), 300);
  };

  const handleQ1Select = (val: string) => {
    onSelectQuick1(val);
    setTimeout(() => setInternalStep(2), 300);
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  return (
    <form
      onSubmit={onContinue}
      className="text-right h-full min-h-0 flex flex-col relative z-10 transition-colors duration-700"
    >
      {/* Red Alert Ambient Glow */}
      {isEmergency === true && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -inset-10 pointer-events-none z-[-1] rounded-3xl"
          style={{
            background: "radial-gradient(ellipse at center, rgba(244,63,94,0.15) 0%, rgba(244,63,94,0.05) 50%, transparent 100%)",
            boxShadow: "inset 0 0 120px rgba(244,63,94,0.2)",
          }}
        />
      )}

      {/* Progress Bar — dir=ltr to prevent RTL confusion */}
      <div className="flex items-center gap-2 mb-6" dir="ltr">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              idx < internalStep
                ? isEmergency === true
                  ? "bg-rose-500 shadow-[0_0_10px_#f43f5e]"
                  : "bg-teal-500 shadow-[0_0_10px_#2dd4bf]"
                : idx === internalStep
                  ? isEmergency === true
                    ? "bg-rose-500/40"
                    : "bg-teal-500/40"
                  : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 relative z-10 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {internalStep === 0 && (
            <motion.div
              key="step0"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center justify-center space-y-8"
            >
              <h2 className="text-2xl sm:text-3xl font-black mb-2 text-center text-slate-100">
                <EditableText
                  id="add_person_emergency_q_wizard"
                  defaultText="هل توجد حالة طوارئ؟"
                  page="add_person"
                  showEditIcon={false}
                />
              </h2>
              <p className="text-slate-400 text-sm text-center max-w-sm mb-6">
                لو فيه أي محاولة إيذاء، عنف، أو ابتزاز صريح اختار طوارئ عشان الأبلكيشن يتصرف فوراً.
              </p>
              <div className="w-full flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => handleEmergencySelect(false)}
                  className={`flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 transition-all duration-500 rounded-3xl border ${
                    isEmergency === false
                      ? "bg-white/10 border-white/20 text-white shadow-[0_0_30px_rgba(255,255,255,0.15)] scale-[1.02]"
                      : "bg-white/[0.03] border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="text-2xl mb-3">🛡️</span>
                  <span className="text-lg font-black tracking-widest">
                    <EditableText id="add_person_emergency_no" defaultText="آمن" page="add_person" editOnClick={false} />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleEmergencySelect(true)}
                  className={`flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 transition-all duration-700 rounded-3xl border ${
                    isEmergency === true
                      ? "bg-rose-600 border-rose-400 text-white shadow-[0_0_40px_rgba(244,63,94,0.4)] scale-105"
                      : "bg-rose-950/20 border-rose-900/50 text-rose-500/70 hover:bg-rose-900/40 hover:text-rose-400"
                  }`}
                >
                  <span className="text-2xl mb-3">⚠️</span>
                  <span className="text-lg font-black tracking-widest uppercase">
                    <EditableText id="add_person_emergency_yes" defaultText="طوارئ" page="add_person" editOnClick={false} />
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {internalStep === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col h-full justify-center space-y-8"
            >
              <h2 className={`text-2xl sm:text-3xl font-black text-center tracking-tight leading-relaxed ${isEmergency === true ? "text-rose-200" : "text-white"}`}>
                <EditableText id="add_person_quick_q1" defaultText={question1} page="add_person" showEditIcon={false} />
              </h2>
              <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
                {options1.map((opt) => {
                  const isSelected = quickAnswer1 === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleQ1Select(opt.value)}
                      className={`w-full flex items-center p-5 text-base sm:text-lg font-bold transition-all duration-500 rounded-2xl border ${
                        isSelected
                          ? isEmergency === true
                            ? "bg-rose-500 text-white border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)] scale-[1.02]"
                            : "bg-teal-500 text-white border-teal-400 shadow-[0_0_30px_rgba(45,212,191,0.2)] scale-[1.02]"
                          : isEmergency === true
                          ? "bg-rose-950/20 border-rose-900/40 text-rose-500/60 hover:bg-rose-900/30 hover:text-rose-300"
                          : "bg-white/[0.03] border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full mr-4 rtl:ml-4 rtl:mr-0 border-2 flex items-center justify-center transition-colors ${isSelected ? "border-white" : "border-slate-500"}`}>
                         {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {internalStep === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col h-full justify-center space-y-8"
            >
              <h2 className={`text-2xl sm:text-3xl font-black text-center tracking-tight leading-relaxed ${isEmergency === true ? "text-rose-200" : "text-white"}`}>
                <EditableText id="add_person_quick_q2" defaultText={question2} page="add_person" showEditIcon={false} />
              </h2>
              <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
                {options2.map((opt) => {
                  const isSelected = quickAnswer2 === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onSelectQuick2(opt.value)}
                      className={`w-full flex items-center p-5 text-base sm:text-lg font-bold transition-all duration-500 rounded-2xl border ${
                        isSelected
                          ? isEmergency === true
                            ? "bg-rose-500 text-white border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)] scale-[1.02]"
                            : "bg-teal-500 text-white border-teal-400 shadow-[0_0_30px_rgba(45,212,191,0.2)] scale-[1.02]"
                          : isEmergency === true
                          ? "bg-rose-950/20 border-rose-900/40 text-rose-500/60 hover:bg-rose-900/30 hover:text-rose-300"
                          : "bg-white/[0.03] border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full mr-4 rtl:ml-4 rtl:mr-0 border-2 flex items-center justify-center transition-colors ${isSelected ? "border-white" : "border-slate-500"}`}>
                         {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 shrink-0 flex justify-end relative z-10 w-full max-w-md mx-auto">
        <button
          type="button"
          className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:bg-white/10 hover:text-white transition-all duration-500"
          onClick={handleBack}
        >
          <EditableText id="add_person_quick_back" defaultText="رجوع" page="add_person" editOnClick={false} />
        </button>
      </div>
    </form>
  );
};



