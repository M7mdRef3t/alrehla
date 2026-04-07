import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, Trophy, Target, X } from "lucide-react";

// بيانات التدريب (سيناريوهات جاهزة)
const SCENARIOS = [
  {
    id: 1,
    title: "مكالمة نص الليل",
    description: "زميل في الشغل بيكلمك الساعة 11 بالليل عشان يسأل على حاجة مش مستعجلة، وانت تعبان.",
    correctRing: "yellow", // المشروط
    options: [
      { id: "a", text: "أرد عليه وأساعده عشان مايحرجنيش", isCorrect: false, feedback: "غلط. كده انت فتحت مساحتك الخاصة لشغل، وده هيستنزفك." },
      { id: "b", text: "ما أردش، وأرد الصبح في مواعيد العمل", isCorrect: true, feedback: "صح! دي حدود زمنية سليمة. الشغل ليه وقت، والراحة ليها وقت." },
      { id: "c", text: "أعمله بلوك فوراً", isCorrect: false, feedback: "مبالغة. ده زميل شغل، التجاهل المؤدب أو الرد الصبح هو الحل المتوازن." },
    ]
  },
  {
    id: 2,
    title: "صديق الشكوى المستمرة",
    description: "واحد صاحبك كل ما يقابلك يشتكي ساعة كاملة من حياته، ولما تيجي تتكلم يقاطعك ويكمل شكوى.",
    correctRing: "red", // الاستنزاف
    options: [
      { id: "a", text: "أسمعه للآخر، الصاحب للصاحب", isCorrect: false, feedback: "ده مش صاحب، ده 'مستنزف'. العلاقة دي طرف واحد فقط." },
      { id: "b", text: "أقوله 'أنا كمان عندي مشاكل' وأحكيله", isCorrect: false, feedback: "كده دخلنا في خناقة مين تعبان أكتر. مش حل." },
      { id: "c", text: "أصارحه: 'أنا طاقتي مش سامحة أسمع شكوى النهاردة'", isCorrect: true, feedback: "ممتاز! ده توكيد حقك في حماية طاقتك بدون قسوة." },
    ]
  },
  {
    id: 3,
    title: "الأهل والتدخل",
    description: "قريب ليك بيعلق على طريقة لبسك أو تربيتك لعيالك قدام الناس.",
    correctRing: "yellow", // المشروط
    options: [
      { id: "a", text: "أرسم حدود بالكلام: 'أنا بفضل الكلام ده يكون بينا بس'", isCorrect: true, feedback: "صح. حفظت كرامتك وحافظت على العلاقة بحدود." },
      { id: "b", text: "أسكت عشان صلة الرحم", isCorrect: false, feedback: "السكوت هنا موافقة ضمنية على الإهانة، وده هيزود التطاول." },
      { id: "c", text: "أرد بنفس الأسلوب قدام الناس", isCorrect: false, feedback: "كده بنضرب السُم بالسُم. أحسن نحافظ على كرامتنا بهدوء." },
    ]
  },
  {
    id: 4,
    title: "طلب الفلوس المتكرر",
    description: "واحد من العيلة كل شهر بيطلب فلوس، وانت عارف إنه بيصرفها على حاجات مش ضرورية.",
    correctRing: "red",
    options: [
      { id: "a", text: "أديله عشان مش عايز مشاكل", isCorrect: false, feedback: "كده بقيت ماكينة صراف. مفيش نهاية للطلبات لو مفيش حدود." },
      { id: "b", text: "أقوله 'لأ' بوضوح وأشرح إني مش قادر", isCorrect: true, feedback: "ممتاز! الوضوح والحدود المالية مش قسوة، ده حماية ليك." },
      { id: "c", text: "أتجاهل الرسايل وأتظاهر إني مش شايفها", isCorrect: false, feedback: "التجاهل بيولّد حقد. الوضوح أفضل من الهروب." },
    ]
  },
  {
    id: 5,
    title: "الشريك والذنب العاطفي",
    description: "شريكك كل ما تطلب وقت لنفسك يقولك 'مش باين عليك بتحبني'.",
    correctRing: "red",
    options: [
      { id: "a", text: "ألغي خططي وأقعد معاه عشان مش عايز يزعل", isCorrect: false, feedback: "ده ابتزاز عاطفي. لو ألغيت احتياجاتك كل مرة، هتفقد نفسك." },
      { id: "b", text: "أقوله: 'الوقت لنفسي مش معناه إني مش بحبك'", isCorrect: true, feedback: "صح! الحب الصحي مش معناه الذوبان. كل واحد ليه مساحة." },
      { id: "c", text: "أخرج وأسيب الموضوع يهدى لوحده", isCorrect: false, feedback: "الهروب من المواجهة بيخلي النمط يتكرر. الأفضل توضيح الحدود بهدوء." },
    ]
  }
];

interface RelationshipGymProps {
  onClose: () => void;
  /** بعد نهاية الجيم: ينتقل للمستخدم لبدء الرحلة */
  onStartJourney?: () => void;
}

export const RelationshipGym: React.FC<RelationshipGymProps> = ({ onClose, onStartJourney }) => {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentScenario = SCENARIOS[currentScenarioIndex];
  const isLastScenario = currentScenarioIndex === SCENARIOS.length - 1;

  const handleOptionClick = (optionId: string, isCorrect: boolean) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
    setIsAnswered(true);
    if (isCorrect) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (isLastScenario) {
      setIsComplete(true);
    } else {
      setCurrentScenarioIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  const handleRestart = () => {
    setCurrentScenarioIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsComplete(false);
  };

  // Results Screen
  if (isComplete) {
    const percentage = Math.round((score / SCENARIOS.length) * 100);
    let message = "";
    let emoji = "";
    
    if (percentage >= 80) {
      message = "ممتاز! فاهم حدودك كويس جداً";
      emoji = "🌟";
    } else if (percentage >= 60) {
      message = "كويس! لسه محتاج تدريب أكتر";
      emoji = "💪";
    } else {
      message = "محتاج تشتغل على حدودك أكتر";
      emoji = "📚";
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-200 p-8 text-center"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Trophy className="w-16 h-16 text-teal-600 mx-auto mb-4" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {emoji} {message}
          </h2>
          
          <div className="text-5xl font-bold text-teal-600 my-6">
            {score} / {SCENARIOS.length}
          </div>
          
          <p className="text-gray-600 mb-8">
            خلصت التدريب بنسبة نجاح {percentage}%
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={handleRestart}
              className="flex-1 rounded-full bg-gray-100 text-gray-700 px-6 py-3 font-bold hover:bg-gray-200 transition-colors"
            >
              جرب تاني
            </button>
            <button
              onClick={() => {
                onStartJourney?.();
              }}
              className="flex-1 rounded-full bg-teal-600 text-white px-6 py-3 font-bold hover:bg-teal-700 transition-colors"
            >
              ابدأ رحلتك
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 border-b border-teal-100 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-white/80 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors z-10"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-6 h-6 text-teal-600" />
              جيم العلاقات
            </h2>
            <p className="text-sm text-slate-500 mt-1">سيناريو {currentScenarioIndex + 1} من {SCENARIOS.length}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-teal-600">{score}</div>
            <div className="text-xs text-slate-400 font-medium">نقطة</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-100">
          <motion.div 
            className="h-full bg-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentScenarioIndex + 1) / SCENARIOS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScenario.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">{currentScenario.title}</h3>
                <p className="text-gray-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {currentScenario.description}
                </p>
              </div>

              <div className="space-y-3">
                {currentScenario.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  let btnClass = "w-full text-right p-4 rounded-xl border-2 transition-all relative ";
                  
                  if (isAnswered) {
                    if (option.isCorrect) btnClass += "border-green-500 bg-green-50";
                    else if (isSelected && !option.isCorrect) btnClass += "border-rose-500 bg-rose-50";
                    else btnClass += "border-gray-100 opacity-50";
                  } else {
                    btnClass += "border-gray-200 hover:border-teal-400 hover:bg-teal-50 cursor-pointer active:scale-[0.99]";
                  }

                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => handleOptionClick(option.id, option.isCorrect)}
                      className={btnClass}
                      disabled={isAnswered}
                      whileTap={!isAnswered ? { scale: 0.98 } : {}}
                    >
                      <span className={`font-semibold block mb-1 ${
                        isAnswered && option.isCorrect ? "text-green-900" : 
                        isAnswered && isSelected && !option.isCorrect ? "text-rose-900" : 
                        "text-slate-900"
                      }`}>
                        {option.text}
                      </span>
                      
                      <AnimatePresence>
                        {isAnswered && (isSelected || option.isCorrect) && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`text-sm mt-2 pt-2 border-t font-medium ${
                              option.isCorrect ? "border-green-200 text-green-800" : "border-rose-200 text-rose-800"
                            }`}
                          >
                            {option.feedback}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {isAnswered && option.isCorrect && (
                        <CheckCircle2 className="absolute top-4 left-4 w-6 h-6 text-green-600" />
                      )}
                      {isAnswered && isSelected && !option.isCorrect && (
                        <XCircle className="absolute top-4 left-4 w-6 h-6 text-rose-600" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors"
          >
            تخطي
          </button>
          
          {isAnswered ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold hover:bg-slate-800 transition-colors"
            >
              {isLastScenario ? "شوف النتيجة" : "السؤال التالي"}
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="text-slate-400 text-sm py-3 font-medium">اختار إجابة...</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
