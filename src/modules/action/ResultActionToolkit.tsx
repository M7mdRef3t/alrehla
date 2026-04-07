import React, { type FC, useRef, useEffect } from "react";
import { Mic, Square, Play, Flame } from "lucide-react";
import type { Ring } from "../map/mapTypes";
import {
  adviceDatabase,
  type AdviceCategory,
  type AdviceZone
} from "@/data/adviceScripts";

const READY_SITUATIONS: string[] = [
  "لما اتصل بيا بالليل وأنا نايم وحسيت إن طاقتي اتسحبت",
  "لما طلب مني حاجة وقلت لأ وحسيت بذنب",
  "لما قعدنا نتكلم ساعة وأنا حسيت إني مهدود",
  "لما تدخل في تفاصيل حياتي وحسيت بضغط",
  "لما تجاهلت حدودي وحسيت إنني مش محترم"
];

// Helper function to analyze user input and provide feedback
interface InputAnalysis {
  type: 'good' | 'needs-detail' | 'warning';
  title: string;
  feedback: string;
}

const analyzeInput = (input: string): InputAnalysis | null => {
  const text = input.trim();
  
  if (text.length === 0) return null;
  
  // Too short (less than 10 characters)
  if (text.length < 10) {
    return {
      type: 'needs-detail',
      title: 'محتاج تفاصيل أكتر',
      feedback: 'حاول تكتب تفاصيل أكتر عشان نقدر نفهم الموقف كويس'
    };
  }
  
  // Check for generic/vague phrases
  const vaguePatterns = [
    /دايما/i,
    /عمره ما/i,
    /مش بيسمع/i,
    /مش بيفهم/i
  ];
  
  const hasVaguePattern = vaguePatterns.some(pattern => pattern.test(text));
  
  if (hasVaguePattern && text.length < 30) {
    return {
      type: 'needs-detail',
      title: 'ممكن تكون أدق؟',
      feedback: 'حاول تذكر موقف محدد حصل فعلاً (متى، فين، إيه اللي حصل بالظبط)'
    };
  }
  
  // Check for specific details (good signs)
  const hasSpecificDetails = (
    /لما|وقت|الساعة|يوم|امبارح|أول امبارح|النهارده/i.test(text) ||
    text.split(' ').length >= 8
  );
  
  // Check for emotional awareness
  const hasEmotionalWords = /حسيت|شعرت|تعبت|مش مرتاح|ضغط|زهقت|مضايق|خايف|قلقان|زعلان/i.test(text);
  
  if (hasSpecificDetails && hasEmotionalWords) {
    return {
      type: 'good',
      title: 'ممتاز! موقف واضح',
      feedback: 'كده تمام، الموقف واضح ومحدد وفيه تفاصيل. ده هيساعدك تفهم أكتر'
    };
  }
  
  if (hasSpecificDetails) {
    return {
      type: 'good',
      title: 'كويس! في تفاصيل',
      feedback: 'الموقف واضح. لو حبيت، ممكن تضيف إحساسك وقتها'
    };
  }
  
  if (text.length > 20) {
    return {
      type: 'needs-detail',
      title: 'كويس، لكن ممكن أحسن',
      feedback: 'حاول تذكر: متى حصل ده بالظبط؟ وكنت حاسس بإيه وقتها؟'
    };
  }
  
  return {
    type: 'needs-detail',
    title: 'محتاج تفاصيل أكتر شوية',
    feedback: 'اكتب موقف حقيقي حصل: متى، إيه اللي اتقال، وكنت حاسس بإيه'
  };
};

interface ResultActionToolkitProps {
  personLabel: string;
  ring: Ring;
  score: number;
  category: AdviceCategory;
  completedFirstSteps?: string[];
  stepInputs?: Record<string, string[]>;
  onToggleFirstStep?: (stepId: string) => void;
  onUpdateStepInputs?: (stepId: string, inputs: string[]) => void;
  compactMode?: boolean; // If true, show only first steps without header/footer
}

export const ResultActionToolkit: FC<ResultActionToolkitProps> = ({
  personLabel,
  ring,
  score,
  category,
  completedFirstSteps,
  stepInputs,
  onToggleFirstStep,
  onUpdateStepInputs,
  compactMode = false
}) => {
  const [expandedStep, setExpandedStep] = React.useState<string | null>(null);
  const [voiceStepId, setVoiceStepId] = React.useState<string | null>(null);
  const [recording, setRecording] = React.useState(false);
  const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startVoiceRecording = async (stepId: string) => {
    if (typeof navigator?.mediaDevices?.getUserMedia !== "function") {
      setToast("المتصفح لا يدعم التسجيل الصوتي");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        if (chunksRef.current.length) {
          setRecordedBlob(new Blob(chunksRef.current, { type: "audio/webm" }));
        }
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      mr.start();
      setVoiceStepId(stepId);
      setRecording(true);
      setExpandedStep(stepId);
    } catch {
      setRecording(false);
      setVoiceStepId(null);
      setToast("تعذّر الوصول للميكروفون");
      setTimeout(() => setToast(null), 2000);
    }
  };

  const stopVoiceRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setRecording(false);
  };

  const burnVoiceTape = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const audio = new Audio(url);
    audio.playbackRate = 0.72;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      setRecordedBlob(null);
      setVoiceStepId(null);
      setToast("تم حرق الشريط");
      setTimeout(() => setToast(null), 2000);
    };
    audio.play();
  };

  const useVoiceAsDraft = () => {
    if (!voiceStepId || !onUpdateStepInputs) return;
    onUpdateStepInputs(voiceStepId, ["تم التسجيل الصوتي (عدّل النص لو حابب)"]);
    setRecordedBlob(null);
    setVoiceStepId(null);
    if (!completedFirstSteps?.includes(voiceStepId)) setTimeout(() => onToggleFirstStep?.(voiceStepId), 300);
    setToast("تمت إضافة المسودة من التسجيل");
    setTimeout(() => setToast(null), 2000);
  };

  let zone: AdviceZone;
  if (score > 2) {
    zone = "red";
  } else if (score >= 1) {
    zone = "yellow";
  } else {
    zone = "green";
  }

  const adviceByZone = adviceDatabase[zone];
  const advice =
    adviceByZone[category] ?? adviceByZone.general ?? adviceDatabase.green.general;

  const [toast, setToast] = React.useState<string | null>(null);

  const ringLabel =
    ring === "green"
      ? "مدار قريب"
      : ring === "yellow"
      ? "مدار متذبذب"
      : "مدار بعيد";

  // First action steps based on ring
  type StepType = { text: string; requiresInput?: boolean; placeholder?: string; inputCount?: number };
  
  const firstSteps: Record<"red" | "yellow" | "green", StepType[]> = {
    red: [
      { 
        text: "موقف واحد حسيت فيه إنك اتضغطت أو اتسحبت منك طاقة", 
        requiresInput: true, 
        placeholder: "مثال: لما اتصل بيا بالليل وأنا نايم...",
        inputCount: 1
      },
      { text: "حدد سقف آمن للتواصل (حتى لو مكالمة قصيرة)" },
      { text: "حاجة بسيطة تعملها لما تحس بثقل (مشي، قعدة هادية، سكوت)" }
    ],
    yellow: [
      { 
        text: "سجّل موقف واحد حسيت فيه بعدم الراحة", 
        requiresInput: true, 
        placeholder: "اكتب الموقف بالتفصيل...",
        inputCount: 1
      },
      { text: "جهز جملة بسيطة للرفض: 'مش هقدر دلوقتي'" },
      { text: "قلل التواصل: من يومي لـ يوم ويوم" }
    ],
    green: [
      { 
        text: "اكتب 3 حاجات إيجابية عن العلاقة دي", 
        requiresInput: true, 
        placeholder: "مثال: بيسمعني لما أكون تعبان...",
        inputCount: 3
      },
      { text: "عبّر عن امتنانك للشخص ده" },
      { text: "حدد وقت خاص ليك (يوم راحة أسبوعي)" }
    ]
  };

  const understanding = {
    red: "العلاقة دي بتاخد منك أكتر مما بتديك. جسمك بيحذرك - اسمع له.",
    yellow: "في أنماط مش صحية محتاجة انتباه. الحدود هتحميك.",
    green: "المدار آمن ومتوازن. حافظ على نفس القواعد."
  };

  return (
    <section
      className="relative text-center"
      aria-labelledby="result-title"
    >
      {!compactMode && (
        <>
          {/* النتيجة الرئيسية */}
          <div className="p-6 bg-linear-to-br from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl">
            <h2
              id="result-title"
              className="text-2xl font-bold text-slate-900 mb-2"
            >
              {advice.title}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              الشخص: <span className="font-semibold text-slate-700">{personLabel}</span> — الدائرة: <span className="font-semibold text-slate-700">{ringLabel}</span>
            </p>
            <p className="text-base text-gray-700 leading-relaxed max-w-md mx-auto">
              {advice.message}
            </p>
          </div>

          {/* فهم الوضع */}
          <div className="mt-6 p-5 bg-blue-50 border-2 border-blue-200 rounded-xl text-right">
            <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
              <span>🔍</span> فهم الوضع
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {understanding[zone]}
            </p>
          </div>
        </>
      )}

      {/* الخطوة الأولى */}
      <div className={`p-5 bg-teal-50 border-2 border-teal-300 rounded-xl text-right ${compactMode ? '' : 'mt-6'}`}>
        <h3 className="text-base font-bold text-teal-900 mb-2 flex items-center gap-2">
          <span>⚡</span> الخطوة الأولى (النهاردة)
        </h3>
        <p className="text-xs text-teal-700 mb-3 font-medium">
          اختار خطوة واحدة بس…
        </p>
        {!compactMode && (
          <p className="text-xs text-teal-600 mb-3">
            📝 اكتب المواقف المطلوبة عشان نولّد ليك مسار حماية مخصص (30 يوم)
          </p>
        )}
        <div className="space-y-3">
          {firstSteps[zone].map((step, index) => {
            const stepId = `${zone}-${index}`;
            const isCompleted = completedFirstSteps?.includes(stepId) || false;
            const isInteractive = !!onToggleFirstStep;
            const currentInputs = stepInputs?.[stepId] || [];
            const isExpanded = expandedStep === stepId;
            
            const allInputsFilled = step.requiresInput 
              ? currentInputs.filter(inp => inp.trim()).length >= (step.inputCount || 1)
              : true;
            
            return (
              <div key={index} className="border-2 border-teal-200 rounded-lg overflow-hidden">
                <div className={`flex items-start gap-3 p-3 transition-all duration-150 ${
                  isCompleted ? 'bg-teal-100 border-teal-400' : 'bg-white'
                }`}>
                  <input
                    id={`result-action-radio-${stepId}-${index}`}
                    name={`resultActionRadio${stepId}${index}`}
                    type="radio"
                    checked={isExpanded}
                    onChange={() => setExpandedStep(stepId)}
                    disabled={!isInteractive}
                    className="w-9 h-9 sm:w-5 sm:h-5 border-gray-300 text-teal-600 focus:ring-teal-500 mt-0.5 shrink-0"
                    style={{ cursor: isInteractive ? 'pointer' : 'not-allowed' }}
                  />
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => setExpandedStep(isExpanded ? null : stepId)}
                      disabled={!isInteractive}
                      className={`text-right w-full text-sm leading-relaxed ${
                        isCompleted ? 'text-teal-800 font-medium line-through' : 'text-slate-700'
                      } ${isInteractive ? 'hover:text-teal-800 font-medium' : ''}`}
                    >
                      {step.text}
                    </button>
                    {step.requiresInput && isInteractive && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setExpandedStep(isExpanded ? null : stepId)}
                          className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                        >
                          {isExpanded ? '▼' : '◀'} اضغط للكتابة
                        </button>
                        {voiceStepId === stepId && recording && (
                          <>
                            <span className="text-xs text-rose-600 font-medium">جاري التسجيل...</span>
                            <button
                              type="button"
                              onClick={stopVoiceRecording}
                              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium"
                              title="إيقاف التسجيل"
                            >
                              <Square className="w-3.5 h-3.5" />
                              إيقاف
                            </button>
                          </>
                        )}
                        {voiceStepId === stepId && recordedBlob && !recording && (
                          <span className="inline-flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={burnVoiceTape}
                              className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800"
                              title="تشغيل ثم حرق الشريط"
                            >
                              <Play className="w-3.5 h-3.5" />
                              تشغيل
                            </button>
                            <button
                              type="button"
                              onClick={() => { setRecordedBlob(null); setVoiceStepId(null); setToast("تم التخلص من التسجيل"); setTimeout(() => setToast(null), 2000); }}
                              className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800"
                              title="احرق الشريط"
                            >
                              <Flame className="w-3.5 h-3.5" />
                              حرق الشريط
                            </button>
                            <button
                              type="button"
                              onClick={useVoiceAsDraft}
                              className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium"
                              title="استخدم كمسودة في الخطوة"
                            >
                              استخدم كمسودة
                            </button>
                          </span>
                        )}
                        {!(voiceStepId === stepId && (recording || recordedBlob)) && (
                          <button
                            type="button"
                            onClick={() => startVoiceRecording(stepId)}
                            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800"
                            title="تسجيل صوتي"
                          >
                            <Mic className="w-4 h-4" />
                            تسجيل صوتي
                          </button>
                        )}
                        <span className="text-xs text-teal-600">|</span>
                        <button
                          type="button"
                          onClick={() => setExpandedStep(isExpanded ? null : stepId)}
                          className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                          title="اعرض مواقف جاهزة تختار منها"
                        >
                          مواقف جاهزة
                        </button>
                      </div>
                    )}
                    {step.requiresInput && (
                      <p className="text-xs text-gray-500 mt-1">
                        {currentInputs.filter(inp => inp.trim()).length} / {step.inputCount ?? 1} تم
                      </p>
                    )}
                  </div>
                  {isCompleted && <span className="text-green-600 text-sm font-bold shrink-0">✓</span>}
                </div>
                
                {step.requiresInput && isExpanded && isInteractive && (
                  <div className="p-4 bg-teal-50 border-t-2 border-teal-200 space-y-3">
                    {/* مواقف جاهزة */}
                    <div>
                      <p className="text-xs font-semibold text-teal-800 mb-2">مواقف جاهزة (اختار واحد وزود تفاصيل لو حابب):</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {READY_SITUATIONS.map((sit, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              const newInputs = [sit];
                              onUpdateStepInputs?.(stepId, newInputs);
                              if (!isCompleted) setTimeout(() => onToggleFirstStep?.(stepId), 300);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white border-2 border-teal-200 text-xs text-teal-800 hover:border-teal-400 hover:bg-teal-50"
                          >
                            {sit.length > 35 ? sit.slice(0, 35) + '…' : sit}
                          </button>
                        ))}
                      </div>
                    </div>
                    {Array.from({ length: step.inputCount || 1 }).map((_, inputIndex) => {
                      const currentInput = currentInputs[inputIndex] || '';
                      const analysis = analyzeInput(currentInput);
                      
                      return (
                        <div key={inputIndex}>
                          <label className="block text-xs font-semibold text-teal-800 mb-1">
                            {step.inputCount && step.inputCount > 1 ? `${inputIndex + 1}.` : ''} اكتب هنا أو عدّل الجاهز:
                          </label>
                          <textarea
                            id={`result-action-textarea-${stepId}-${inputIndex}`}
                            name={`resultActionTextarea${stepId}${inputIndex}`}
                            value={currentInput}
                            onChange={(e) => {
                              const newInputs = [...currentInputs];
                              newInputs[inputIndex] = e.target.value;
                              onUpdateStepInputs?.(stepId, newInputs);
                              const filledCount = newInputs.filter(inp => inp?.trim()).length;
                              if (filledCount >= (step.inputCount || 1) && !isCompleted) {
                                setTimeout(() => onToggleFirstStep?.(stepId), 300);
                              }
                            }}
                            placeholder={step.placeholder}
                            rows={3}
                            className="w-full border-2 border-teal-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                          />
                          {currentInput.trim() && analysis && (
                            <div className={`mt-2 p-3 rounded-lg border-2 ${
                              analysis.type === 'good' 
                                ? 'bg-green-50 border-green-300' 
                                : analysis.type === 'needs-detail'
                                ? 'bg-blue-50 border-blue-300'
                                : 'bg-amber-50 border-amber-300'
                            }`}>
                              <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                                {analysis.type === 'good' && '✅'}
                                {analysis.type === 'needs-detail' && '💡'}
                                {analysis.type === 'warning' && '⚠️'}
                                <span className={
                                  analysis.type === 'good' 
                                    ? 'text-green-800' 
                                    : analysis.type === 'needs-detail'
                                    ? 'text-blue-800'
                                    : 'text-amber-800'
                                }>
                                  {analysis.title}
                                </span>
                              </p>
                              <p className="text-xs text-gray-700 leading-relaxed">
                                {analysis.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {allInputsFilled && !isCompleted && (
                      <div className="p-3 bg-green-50 border-2 border-green-300 rounded-lg text-center">
                        <p className="text-sm font-semibold text-green-800">
                          🎉 تمام! هيتم التشييك تلقائياً
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {!onToggleFirstStep && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            💡 هتقدر تشيّك على الخطوات دي بعد ما تضيف الشخص
          </p>
        )}
      </div>

      {!compactMode && (
        <div className="mt-6 p-4 bg-linear-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
          <p className="text-sm text-purple-900 font-semibold mb-2">
            🎯 هيحصل إيه بعد كده؟
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            بعد ما تكتب المواقف المطلوبة فوق، هنولّد ليك مسار حماية كامل (30 يوم) مخصص ليك بناءً على الأنماط اللي لقيناها. هتلاقي خطوات الرحلة تظهر تلقائياً أول ما تكمل الكتابة.
          </p>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 rounded-full bg-[#32D74B] text-white px-5 py-2 text-sm font-semibold z-50">
          {toast}
        </div>
      )}
    </section>
  );
};
