import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EditableText } from "../EditableText";
import React from "react";

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
    <motion.form
      onSubmit={onContinue}
      className="text-right h-full min-h-0 flex flex-col relative z-10 transition-colors duration-700"
    >
      {/* Subtle emergency glow */}
      {isEmergency === true && (
        <div
          className="absolute -inset-10 pointer-events-none z-[-1] rounded-3xl"
          style={{
            background: "radial-gradient(ellipse at center, rgba(225,29,72,0.08) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-6" dir="ltr">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              idx < internalStep
                ? isEmergency === true
                  ? "bg-rose-400"
                  : "bg-teal-400"
                : idx === internalStep
                  ? isEmergency === true
                    ? "bg-rose-400/40"
                    : "bg-teal-400/40"
                  : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 min-h-0 relative z-10 flex flex-col justify-center">
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
              <div className="text-center">
                <p className={`text-xs mb-2 font-bold ${isEmergency === true ? "text-rose-400" : "text-teal-400"}`}>
                  الخطوة الأولى
                </p>
                <h2 className="text-2xl sm:text-3xl font-black mb-2 text-center text-white font-alexandria">
                  <EditableText
                    id="add_person_emergency_q_wizard"
                    defaultText="هل فيه خطر على سلامتك؟"
                    page="add_person"
                    showEditIcon={false}
                  />
                </h2>
                <p className="text-zinc-400 text-sm text-center max-w-sm mx-auto leading-relaxed mt-4 font-tajawal">
                  لو فيه أي محاولة إيذاء، عنف، أو ابتزاز — اختار "فيه خطر" عشان نساعدك فوراً.
                </p>

              </div>
              
              <div className="w-full flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => handleEmergencySelect(false)}
                  className={`group relative flex-1 flex flex-col items-center justify-center text-center p-8 transition-all duration-300 rounded-2xl border ${
                    isEmergency === false
                      ? "bg-teal-500/10 border-teal-400/30 text-teal-300"
                      : "bg-white/[0.03] border-white/5 text-zinc-400 hover:border-teal-500/30 hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="text-3xl mb-4 opacity-80 group-hover:opacity-100 transition-opacity">🟢</span>
                  <span className="text-sm font-bold font-tajawal">
                    <EditableText id="add_person_emergency_no" defaultText="آمن" page="add_person" editOnClick={false} />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleEmergencySelect(true)}
                  className={`group relative flex-1 flex flex-col items-center justify-center text-center p-8 transition-all duration-300 rounded-2xl border ${
                    isEmergency === true
                      ? "bg-rose-500/10 border-rose-400/30 text-rose-300"
                      : "bg-white/[0.03] border-white/5 text-zinc-400 hover:border-rose-500/30 hover:bg-rose-950/10"
                  }`}
                >
                  <span className="text-3xl mb-4 opacity-80 group-hover:opacity-100 transition-opacity">🔴</span>
                  <span className="text-sm font-bold font-tajawal">
                    <EditableText id="add_person_emergency_yes" defaultText="فيه خطر" page="add_person" editOnClick={false} />
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
              <div className="text-center mb-4">
                <p className={`text-xs mb-2 font-bold ${isEmergency === true ? "text-rose-400" : "text-teal-400"}`}>
                  السؤال الأول
                </p>
                <h2 className={`text-2xl sm:text-3xl font-black text-center leading-relaxed font-alexandria ${isEmergency === true ? "text-rose-200" : "text-white"}`}>
                  <EditableText id="add_person_quick_q1" defaultText={question1} page="add_person" showEditIcon={false} />
                </h2>
              </div>
              <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
                {options1.map((opt) => {
                  const isSelected = quickAnswer1 === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleQ1Select(opt.value)}
                      className={`group relative w-full flex items-center p-4 text-sm font-bold transition-all duration-300 rounded-2xl border overflow-hidden font-tajawal ${
                        isSelected
                          ? isEmergency === true
                            ? "bg-rose-500/10 text-rose-300 border-rose-400/30"
                            : "bg-teal-500/10 text-teal-300 border-teal-400/30"
                          : "bg-white/[0.03] border-white/5 text-zinc-400 hover:bg-white/[0.06] hover:border-white/15 hover:text-zinc-200"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 ml-3 flex items-center justify-center shrink-0 transition-colors ${isSelected ? (isEmergency ? "border-rose-400 bg-rose-400" : "border-teal-400 bg-teal-400") : "border-white/20"}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span>{opt.label}</span>
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
              <div className="text-center mb-4">
                 <p className={`text-xs mb-2 font-bold ${isEmergency === true ? "text-rose-400" : "text-teal-400"}`}>
                  السؤال الثاني
                </p>
                <h2 className={`text-xl sm:text-2xl font-black text-center leading-relaxed ${isEmergency === true ? "text-rose-200" : "text-white"}`}>
                  <EditableText id="add_person_quick_q2" defaultText={question2} page="add_person" showEditIcon={false} />
                </h2>
              </div>
              <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
                {options2.map((opt) => {
                  const isSelected = quickAnswer2 === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onSelectQuick2(opt.value)}
                      className={`group relative w-full flex items-center p-4 text-sm font-bold transition-all duration-300 rounded-2xl border overflow-hidden font-tajawal ${
                        isSelected
                          ? isEmergency === true
                            ? "bg-rose-500/10 text-rose-300 border-rose-400/30"
                            : "bg-teal-500/10 text-teal-300 border-teal-400/30"
                          : "bg-white/[0.03] border-white/5 text-zinc-500 hover:bg-white/[0.06] hover:border-white/15 hover:text-zinc-200"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 ml-3 flex items-center justify-center shrink-0 transition-colors ${isSelected ? (isEmergency ? "border-rose-400 bg-rose-400" : "border-teal-400 bg-teal-400") : "border-white/20"}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 shrink-0 flex justify-end relative z-10 w-full max-w-md mx-auto">
        <button
          type="button"
          className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-zinc-500 text-sm font-bold hover:bg-white/[0.06] hover:text-zinc-300 transition-all duration-300 font-tajawal"
          onClick={handleBack}
        >
          <EditableText id="add_person_quick_back" defaultText="رجوع" page="add_person" editOnClick={false} />
        </button>
      </div>
    </motion.form>
  );
};



