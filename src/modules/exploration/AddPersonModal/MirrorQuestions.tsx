import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MirrorQuestionsProps {
  verdictAction: string;
  isFamilyRelation: boolean;
  displayName: string;
}

interface MirrorQuestion {
  question: string;
  followUp: string;
}

function getMirrorQuestions(
  verdictAction: string,
  isFamilyRelation: boolean,
  displayName: string
): MirrorQuestion[] {
  // Family emergency / protect pattern — the rescuer codependency
  if (isFamilyRelation && (verdictAction === "protect" || verdictAction === "safe_distance")) {
    return [
      {
        question: `لو صاحبك كان في نفس الموقف مع أخوه — كنت هتقول له إيه؟`,
        followUp: "الإجابة اللي هتديها لصاحبك هي اللي محتاج تسمعها لنفسك."
      },
      {
        question: `لو مكنتش أنت موجود — مين كان هيشيل مكانك؟`,
        followUp: "لو الإجابة 'محدش' — يبقى أنت بتشيل دور مش دورك. أنت مش مسؤول عن إنقاذ حد من نفسه."
      },
      {
        question: `${displayName} فعلاً بيتغير — ولا أنت بتكرر نفس الدور كل مرة؟`,
        followUp: "التكرار بنفس الطريقة وتوقع نتيجة مختلفة — ده مش حب، ده عادة مؤلمة."
      },
      {
        question: `المرة دي فعلاً مختلفة — ولا أنت بتقنع نفسك إنها مختلفة زي كل مرة قبلها؟`,
        followUp: "لو فعلاً مظلوم — ساعده في الحاجة المحددة دي بس. حدد نقطة نهاية واضحة قبل ما تبدأ: 'هعمل كذا وبس'. المساعدة المحددة ≠ الإنقاذ الدائم."
      },
      {
        question: `أنت خايف من إيه بالضبط — إنك ماتساعدوش ولا إنك تساعده ويرجع نفس الفيلم من الأول؟`,
        followUp: "لو الخوف من 'اللي بعد المساعدة' — يبقى المشكلة مش في المساعدة نفسها. المشكلة إنك بتساعد بدون شروط. قبل ما تتحرك — حط شروطك بالورقة والقلم: 'هساعدك في ده بس. لو رجعت لنفس الطريق — مش هكون موجود المرة الجاية.'"
      },
      {
        question: `إيه اللي هيحصل ليك أنت — جسمك، نفسيتك، حياتك — لو فضلت ماشي بنفس الطريقة سنة كمان؟`,
        followUp: "لو الإجابة مخيفة — يبقى الأولوية إنك تحمي نفسك. مش أنانية — دي مسؤولية."
      },
      {
        question: `طب لو أنت عارف إنك هترجع تعمل نفس اللي بتعمله كل مرة — يبقى مين اللي محتاج يتغير فعلاً؟`,
        followUp: "لو عارف إنك مش هتقدر تلتزم بشروطك لوحدك — قول شروطك لحد تاني تثق فيه. مش عشان يقرر عنك — عشان يفكّرك لما تنسى. اللي بيكسر وعده لنفسه محتاج شاهد — مش محتاج قوة إرادة."
      }
    ];
  }

  // Non-family cut
  if (verdictAction === "cut") {
    return [
      {
        question: `لو ${displayName} اختفى من حياتك بكرة — هتحس بإيه بعد أسبوع؟`,
        followUp: "لو الإجابة 'راحة' — جسمك عارف الإجابة من زمان."
      },
      {
        question: `إيه أكتر حاجة بتخليك تتمسك — حب حقيقي ولا خوف من الوحدة؟`,
        followUp: "فيه فرق كبير بين 'بحبه' و'بخاف من اللي هيحصل لو مشي'."
      },
      {
        question: `لو حد بيحبك شاف الموقف ده من بره — كان هيقول لك إيه؟`,
        followUp: "أحياناً اللي حواليك شايفين الحقيقة أوضح منك."
      }
    ];
  }

  // Distance / emotional prisoner
  if (verdictAction === "distance") {
    return [
      {
        question: `أنت بتفكر في ${displayName} قد إيه في اليوم؟ والتفكير ده بيضيف لك ولا بيسحب منك؟`,
        followUp: "لو التفكير بيسحب — يبقى عقلك محتاج مسافة قبل قلبك."
      },
      {
        question: `هو/هي عارف/ة إنك متأثر لهالدرجة — ولا أنت لوحدك بتتحمل؟`,
        followUp: "العلاقة اللي طرف واحد فيها بيتألم والتاني مش واخد باله — مش علاقة متوازنة."
      },
      {
        question: `إيه اللي محتاج يحصل عشان العلاقة دي تبقى صحية — وهل ده في إيدك ولا في إيده؟`,
        followUp: "لو مش في إيدك — يبقى مسؤوليتك الوحيدة هي حماية نفسك."
      }
    ];
  }

  // Eggshells / negotiate
  if (verdictAction === "negotiate") {
    return [
      {
        question: `أنت بتغير سلوكك أو كلامك عشان تتجنب رد فعل ${displayName}؟`,
        followUp: "لو الإجابة أيوه — يبقى أنت بتعيش بقواعد حد تاني، مش بقواعدك."
      },
      {
        question: `لو قلت رأيك بصراحة — إيه أسوأ سيناريو ممكن يحصل؟`,
        followUp: "غالباً الخوف أكبر من الواقع. والصراحة بتبني حدود أقوى من الصمت."
      }
    ];
  }

  // Healthy / maintain
  return [
    {
      question: `إيه الحاجة اللي ${displayName} بيعملها وبتخليك تحس إنك مش لوحدك؟`,
      followUp: "حافظ على اللحظات دي — وقول ليه إنها فارقة معاك."
    }
  ];
}

export const MirrorQuestions: FC<MirrorQuestionsProps> = ({
  verdictAction,
  isFamilyRelation,
  displayName
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [savedStates, setSavedStates] = useState<Record<number, boolean>>({});

  const questions = getMirrorQuestions(verdictAction, isFamilyRelation, displayName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="relative"
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full text-right p-5 sm:p-6 rounded-2xl border transition-all duration-300 group ${
          isExpanded 
            ? "bg-white/[0.04] border-white/15" 
            : "bg-white/[0.02] border-white/8 hover:bg-white/[0.04] hover:border-white/12"
        }`}
      >
        <div className="flex items-center justify-between">
          <motion.span 
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-white/40 text-sm"
          >↓</motion.span>
          <div className="flex items-center gap-3">
            <span className="text-lg">🪞</span>
            <div>
              <h4 className="text-sm font-black text-white/90 font-tajawal">أسئلة المرآة</h4>
              <p className="text-[11px] text-white/40 font-tajawal">أسئلة تساعدك تشوف الحقيقة بنفسك — مش هنقرر عنك</p>
            </div>
          </div>
        </div>
      </button>

      {/* Questions List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 mt-4">
              {questions.map((q, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className={`p-5 rounded-xl border transition-all duration-300 ${
                    activeIndex === idx
                      ? "bg-white/[0.06] border-teal-500/30"
                      : "bg-white/[0.02] border-white/8"
                  }`}>
                    {/* Header (Clickable to expand) */}
                    <button
                      type="button"
                      onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
                      className="w-full text-right hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-black mt-0.5 ${
                          activeIndex === idx ? "bg-teal-500/20 text-teal-400" : "bg-white/8 text-white/40"
                        }`}>
                          {idx + 1}
                        </div>
                        <p className={`text-base leading-relaxed font-bold flex-1 ${
                          activeIndex === idx ? "text-white" : "text-white/70"
                        }`}>
                          {q.question}
                        </p>
                      </div>
                    </button>

                    {/* Follow-up & Interactive Content */}
                    <AnimatePresence>
                      {activeIndex === idx && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.25 }}
                          className="mt-4 mr-10"
                        >
                          {/* Follow up Insight */}
                          <div className="mb-5 p-4 rounded-lg bg-teal-500/[0.06] border-r-2 border-teal-500/40">
                            <p className="text-sm text-teal-200/80 leading-relaxed font-medium">
                              {q.followUp}
                            </p>
                          </div>

                          {/* Interactive Choices */}
                          <div className="flex gap-2 mb-4">
                            {['نعم', 'لا', 'مش متأكد'].map((opt) => (
                              <button
                                key={opt}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAnswers(prev => ({ ...prev, [idx]: opt }));
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                  answers[idx] === opt
                                    ? "bg-teal-500 text-[var(--ds-color-space-deep)] shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>

                          {/* Free text reflection */}
                          <div className="relative">
                            <textarea
                              placeholder="مساحة لتفريغ أفكارك بينك وبين نفسك (اختياري)..."
                              value={textAnswers[idx] || ""}
                              onChange={(e) => {
                                setTextAnswers(prev => ({ ...prev, [idx]: e.target.value }));
                                setSavedStates(prev => ({ ...prev, [idx]: false }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  setSavedStates(prev => ({ ...prev, [idx]: true }));
                                }
                              }}
                              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 pb-12 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 resize-none min-h-[100px] transition-colors"
                            />
                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                               {savedStates[idx] ? (
                                 <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-[11px] font-bold text-teal-400 bg-teal-500/10 px-2 py-1 rounded-md border border-teal-500/20"
                                 >
                                    ✓ تم الحفظ
                                 </motion.span>
                               ) : (
                                 <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSavedStates(prev => ({ ...prev, [idx]: true }));
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                                 >
                                    حفظ (Enter)
                                 </button>
                               )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: questions.length * 0.1 + 0.3 }}
              className="mt-8 p-5 rounded-xl bg-white/[0.02] border border-white/8 text-right"
            >
              <p className="text-sm text-white/50 leading-relaxed font-tajawal font-bold">
                الإجابات دي مساحتك الخاصة ومفيش حد هيشوفها. الهدف منها مواجهة نفسك وتفريغ الضغط.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
