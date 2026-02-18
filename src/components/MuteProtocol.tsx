import type { FC } from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, Flame, VolumeX, Shield, Zap, RefreshCw } from "lucide-react";
import { useMapState } from "../state/mapState";
import { BreathingOverlay } from "./BreathingOverlay";
import { useContinuousSpeechRecognition } from "../hooks/useContinuousSpeechRecognition";

type ProtocolStep = "analyze_source" | "intercept_signal" | "incinerate" | "mission_report";

interface NoiseSilencingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionComplete?: () => void;
}

export const NoiseSilencingModal: FC<NoiseSilencingModalProps> = ({ isOpen, onClose, onSessionComplete }) => {
  const nodes = useMapState((s) => s.nodes);
  const [step, setStep] = useState<ProtocolStep>("analyze_source");
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null);
  const [signalText, setSignalText] = useState("");
  const [energySaved, setEnergySaved] = useState(0);
  const [burning, setBurning] = useState(false);
  const [burnProgress, setBurnProgress] = useState(0);

  // Audio recording refs
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const {
    isSupported: sttSupported,
    isListening: sttListening,
    transcript: sttTranscript,
    start: sttStart,
    stop: sttStop,
    clear: sttClear
  } = useContinuousSpeechRecognition({ lang: "ar-EG" });

  useEffect(() => {
    if (!isOpen) {
      setStep("analyze_source");
      setTargetNodeId(null);
      setSignalText("");
      setEnergySaved(0);
      setBurning(false);
      setBurnProgress(0);
      sttClear();
    }
  }, [isOpen, sttClear]);

  // Sync STT to text
  useEffect(() => {
    if (sttTranscript) {
      setSignalText((prev) => prev + " " + sttTranscript);
      sttClear(); // Clear buffer to avoid dupes if possible, or handle smarter
    }
  }, [sttTranscript, sttClear]);

  const handleStartIncineration = () => {
    setStep("incinerate");
    setBurning(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setBurnProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setBurning(false);
        setEnergySaved(Math.floor(Math.random() * 15) + 15); // Random 15-30%
        setStep("mission_report");
      }
    }, 40);
  };

  const handleClose = () => {
    onSessionComplete?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header - Tactical */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20">
                  <VolumeX className="w-4 h-4 text-rose-500" />
                </div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  بروتوكول كاتم الصوت
                </h2>
              </div>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">

              {/* Step 1: Target Selection */}
              {step === "analyze_source" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <p className="text-xs font-mono text-rose-400">حدد مصدر التشويش (Threat Source)</p>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-4">
                    من أي جبهة تأتي الإشارات المزعجة؟
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    {nodes.map((node) => (
                      <button
                        key={node.id}
                        onClick={() => setTargetNodeId(node.id)}
                        className={`p-3 rounded-lg border text-right transition-all ${targetNodeId === node.id
                          ? "bg-rose-500/20 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                          }`}
                      >
                        <span className="block text-sm font-semibold">{node.label}</span>
                      </button>
                    ))}
                  </div>
                  {nodes.length === 0 && (
                    <p className="text-slate-500 text-sm">لا توجد جبهات نشطة حالياً. (أضف علاقات من الخريطة)</p>
                  )}

                  <button
                    disabled={!targetNodeId}
                    onClick={() => setStep("intercept_signal")}
                    className="w-full mt-4 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg tracking-wide transition-all shadow-lg shadow-rose-900/20"
                  >
                    تأكيد المصدر وبدء الاعتراض
                  </button>
                </div>
              )}

              {/* Step 2: Signal Interception (Input) */}
              {step === "intercept_signal" && (
                <div className="space-y-4 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-slate-400">STATUS: RECORDING SIGNAL...</p>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [10, 20, 10] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1 bg-rose-500/50 rounded-full"
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm">
                    اكتب أو سجل كل "الضوضاء" اللي في عقلك تجاه الشخص ده. فرّغ الشحنة هنا عشان نحرقها.
                  </p>

                  <textarea
                    value={signalText}
                    onChange={(e) => setSignalText(e.target.value)}
                    placeholder="اكتب هنا... (لن يتم حفظ هذا الكلام، سيتم حرقه فوراً)"
                    className="flex-1 min-h-[150px] w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500/50 resize-none font-mono text-sm leading-relaxed"
                    dir="rtl"
                  />

                  <div className="flex justify-between items-center bg-slate-800/50 rounded-lg p-2">
                    <button
                      onClick={sttListening ? sttStop : sttStart}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${sttListening
                        ? "bg-rose-500/20 text-rose-400 animate-pulse"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}
                    >
                      {sttListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      {sttListening ? "إيقاف اللاقط" : "تسجيل صوتي"}
                    </button>
                    <span className="text-xs text-slate-500 font-mono">
                      {signalText.length} CHARS
                    </span>
                  </div>

                  <button
                    disabled={!signalText.trim()}
                    onClick={handleStartIncineration}
                    className="w-full py-3 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group"
                  >
                    <Flame className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    حرق الإشارة (Incinerate)
                  </button>
                </div>
              )}

              {/* Step 3: Incineration (Animation) */}
              {step === "incinerate" && (
                <div className="flex flex-col items-center justify-center h-64 space-y-6 text-center">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 0.9, 1.1, 1], rotate: [0, 5, -5, 3, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="absolute inset-0 bg-transparent"
                    >
                      <Flame className="w-32 h-32 text-orange-500 filter drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0, scale: 0 }}
                      transition={{ duration: 2 }}
                      className="absolute text-slate-900 font-mono font-bold text-xs bg-white/10 backdrop-blur-md p-2 rounded transform rotate-12"
                    >
                      NOISE SIGNAL
                    </motion.div>
                  </div>

                  <div className="w-full max-w-xs space-y-2">
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-orange-500 to-rose-600"
                        style={{ width: `${burnProgress}%` }}
                      />
                    </div>
                    <p className="text-xs font-mono text-orange-400 animate-pulse">
                      INCINERATING NEURAL NOISE... {burnProgress}%
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Mission Report */}
              {step === "mission_report" && (
                <div className="flex flex-col items-center text-center space-y-6 py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                    className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                  >
                    <Shield className="w-10 h-10 text-emerald-400" />
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">تم تأمين المجال</h3>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto">
                      تم التخلص من الإشارات المزعجة بنجاح. عقلك الآن في وضع الصمت الآمن.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="text-center px-4 border-l border-slate-700">
                      <p className="text-xs text-slate-500 font-mono mb-1">ENERGY SAVED</p>
                      <p className="text-xl font-bold text-emerald-400 flex items-center justify-center gap-1">
                        <Zap className="w-4 h-4" /> +{energySaved}%
                      </p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-xs text-slate-500 font-mono mb-1">SYSTEM STATUS</p>
                      <p className="text-xl font-bold text-emerald-400">STABLE</p>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg border border-slate-600 transition-all"
                  >
                    العودة لمركز القيادة
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
