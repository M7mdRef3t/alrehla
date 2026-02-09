import type { FC } from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, Flame, MessageSquare, Send, Wind } from "lucide-react";
import { useMapState } from "../state/mapState";
import { realityCheckImaginaryArgument } from "../utils/noiseSilencingAI";
import { BreathingOverlay } from "./BreathingOverlay";
import { useAppContentString } from "../hooks/useAppContentString";

type Step = "who" | "awareness" | "dump" | "reality" | "closure" | "done";

const AWARENESS_MSG =
  "أنت بتحاول تقنع طيف.. هو مش سامعك، وأنت الوحيد اللي بتدفع الفاتورة من أعصابك.";

const CLOSURE_TEMPLATE = `أنا بقرر دلوقتي أقفل الملف ده. أنا قلت اللي عندي (حتى لو مسمعوش)، وأنا مسامح نفسي إني معرفتش أرد وقتها. الموضوع انتهى.`;

interface NoiseSilencingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NoiseSilencingModal: FC<NoiseSilencingModalProps> = ({ isOpen, onClose }) => {
  const nodes = useMapState((s) => s.nodes);
  const [step, setStep] = useState<Step>("who");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showAwarenessPopup, setShowAwarenessPopup] = useState(false);
  const [rantText, setRantText] = useState("");
  const [closureText, setClosureText] = useState(CLOSURE_TEMPLATE);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);

  const rantPlaceholder = useAppContentString(
    "noise_rant_placeholder",
    "قول كل اللي نفسك تقوله للشخص ده...",
    { page: "noise_silencing" }
  );

  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [burning, setBurning] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const personLabel = selectedNode?.label ?? "";
  const canRecord = typeof MediaRecorder !== "undefined";

  useEffect(() => {
    if (!isOpen) {
      setStep("who");
      setSelectedNodeId(nodes.length > 0 ? nodes[0]!.id : null);
      setShowAwarenessPopup(false);
      setRantText("");
      setClosureText(CLOSURE_TEMPLATE);
      setAiResponse(null);
      setRecordedBlob(null);
      setBurning(false);
    }
  }, [isOpen, nodes]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleSelectWho = () => {
    if (!selectedNodeId) return;
    setShowAwarenessPopup(true);
  };

  const handleAwarenessAck = () => {
    setShowAwarenessPopup(false);
    setStep("dump");
  };

  const startRecording = async () => {
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
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    }
    setRecording(false);
  };

  const burnTape = () => {
    if (!recordedBlob) return;
    setBurning(true);
    const url = URL.createObjectURL(recordedBlob);
    const audio = new Audio(url);
    audio.playbackRate = 0.72;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      setRecordedBlob(null);
      setBurning(false);
      setStep("reality");
    };
    audio.play();
  };

  const skipBurnAndGoToReality = () => {
    setRecordedBlob(null);
    setStep("reality");
  };

  const runRealityCheck = async () => {
    setAiLoading(true);
    setAiResponse(null);
    const text = rantText.trim() || undefined;
    const res = await realityCheckImaginaryArgument(text ?? "", personLabel);
    setAiResponse(res ?? "تعذر الاتصال بالذكاء الاصطناعي. جرب مرة تانية.");
    setAiLoading(false);
  };

  const goToClosure = () => {
    setStep("closure");
  };

  const finishClosure = () => {
    setStep("done");
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-50"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="fixed inset-x-4 top-[10%] bottom-[10%] z-50 max-w-lg mx-auto rounded-2xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              تشويش الإشارة
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* الخطوة 1: بتتخانق مع مين؟ */}
            {step === "who" && (
              <>
                <p className="text-slate-700 dark:text-slate-300">
                  بتتخانق مع مين في دماغك دلوقتي؟
                </p>
                <div className="flex flex-wrap gap-2">
                  {nodes.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setSelectedNodeId(n.id)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        selectedNodeId === n.id
                          ? "bg-teal-600 text-white border-teal-600"
                          : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
                {nodes.length === 0 && (
                  <p className="text-slate-500 text-sm">
                    مفيش جبهات في الميدان. أضف جبهة أولاً من مركز القيادة.
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSelectWho}
                  disabled={!selectedNodeId}
                  className="w-full py-3 rounded-xl bg-teal-600 text-white font-semibold disabled:opacity-50"
                >
                  كمل
                </button>
              </>
            )}

            {/* بوب-أب التوعية */}
            {showAwarenessPopup && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 p-4">
                <p className="text-amber-900 dark:text-amber-100 font-medium mb-4">
                  {AWARENESS_MSG}
                </p>
                <button
                  type="button"
                  onClick={handleAwarenessAck}
                  className="w-full py-2 rounded-lg bg-amber-600 text-white font-medium"
                >
                  فهمت
                </button>
              </div>
            )}

            {/* الخطوة 2: التفريغ — صوتي أو كتابي */}
            {step === "dump" && !showAwarenessPopup && (
              <>
                <p className="text-slate-700 dark:text-slate-300 text-sm">
                  طلع اللي في نفسك هنا. صوت أو كتابة — ثم نحرق الشريط.
                </p>
                {canRecord && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4">
                    {!recording && !recordedBlob && (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="flex items-center gap-2 text-teal-600 dark:text-teal-400"
                      >
                        <Mic className="w-5 h-5" />
                        تسجيل صوتي
                      </button>
                    )}
                    {recording && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm">جاري التسجيل...</span>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="flex items-center gap-1 text-red-600"
                        >
                          <MicOff className="w-4 h-4" /> إيقاف
                        </button>
                      </div>
                    )}
                    {recordedBlob && !burning && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          شريط جاهز
                        </span>
                      </div>
                    )}
                    {burning && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 py-2">
                        الكلام خرج من جسمك.. مبقاش ملكك خلاص.
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    أو اكتب اللي نفسك تقوله
                  </label>
                  <textarea
                    value={rantText}
                    onChange={(e) => setRantText(e.target.value)}
                    placeholder={rantPlaceholder}
                    className="w-full min-h-[120px] rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-slate-900 dark:text-white placeholder:text-slate-400 resize-y"
                    dir="rtl"
                  />
                </div>
                {(recordedBlob || rantText.trim()) && (
                  <button
                    type="button"
                    onClick={recordedBlob ? burnTape : skipBurnAndGoToReality}
                    className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-white bg-teal-600"
                  >
                    {recordedBlob ? (
                      <>
                        <Flame className="w-5 h-5" /> حرق الشريط ثم التحليل
                      </>
                    ) : (
                      "كمل للتحليل الواقعي"
                    )}
                  </button>
                )}
              </>
            )}

            {/* الخطوة 3: التحليل الواقعي (AI) */}
            {step === "reality" && (
              <>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  محاكمة الأفكار — مرساة الواقع
                </p>
                {!aiResponse && !aiLoading && (
                  <button
                    type="button"
                    onClick={runRealityCheck}
                    className="w-full py-3 rounded-xl bg-teal-600 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" /> احصل على التحليل
                  </button>
                )}
                {aiLoading && (
                  <p className="text-slate-500 text-sm">جاري التحليل...</p>
                )}
                {aiResponse && (
                  <div className="rounded-xl bg-slate-100 dark:bg-slate-700 p-4 text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-sm">
                    {aiResponse}
                  </div>
                )}
                <button
                  type="button"
                  onClick={goToClosure}
                  disabled={aiLoading}
                  className="w-full py-3 rounded-xl bg-slate-700 dark:bg-slate-600 text-white font-semibold"
                >
                  كمل — رسالة الوداع
                </button>
              </>
            )}

            {/* الخطوة 4: النهاية البديلة (قفلة) */}
            {step === "closure" && (
              <>
                <p className="text-slate-700 dark:text-slate-300">
                  اكتب رسالة الوداع للفكرة دي.
                </p>
                <textarea
                  value={closureText}
                  onChange={(e) => setClosureText(e.target.value)}
                  className="w-full min-h-[140px] rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-slate-900 dark:text-white resize-y"
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={finishClosure}
                  className="w-full py-3 rounded-xl bg-teal-600 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" /> أقفل الملف
                </button>
              </>
            )}

            {/* انتهى */}
            {step === "done" && (
              <>
                <p className="text-slate-700 dark:text-slate-300 text-center font-medium">
                  الموضوع انتهى. خد نفس.
                </p>
                <button
                  type="button"
                  onClick={() => setShowBreathing(true)}
                  className="w-full py-3 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 font-semibold flex items-center justify-center gap-2"
                >
                  <Wind className="w-5 h-5" /> هدّي نفسك — تنفس
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  خلصت
                </button>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {showBreathing && (
        <BreathingOverlay
          onClose={() => {
            setShowBreathing(false);
            onClose();
          }}
          autoCloseAfterCycles={0}
        />
      )}
    </>
  );
};
