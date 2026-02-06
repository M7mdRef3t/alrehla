import type { FC } from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { PulseFocus, PulseMood } from "../state/pulseState";

interface PulseCheckModalProps {
  isOpen: boolean;
  onSubmit: (payload: { energy: number; mood: PulseMood; focus: PulseFocus; auto?: boolean }) => void;
  onClose: () => void;
}

const MOODS: Array<{ id: PulseMood; label: string; emoji: string }> = [
  { id: "bright", label: "رايق", emoji: "☀️" },
  { id: "calm", label: "هادئ", emoji: "🌤️" },
  { id: "anxious", label: "قلقان", emoji: "☁️" },
  { id: "angry", label: "غضبان", emoji: "⛈️" },
  { id: "sad", label: "حزين", emoji: "🌧️" }
];

const FOCUS_OPTIONS: Array<{ id: PulseFocus; label: string }> = [
  { id: "event", label: "موقف حصل" },
  { id: "thought", label: "فكرة مش بتروح" },
  { id: "body", label: "جسدي تعبان" },
  { id: "none", label: "ولا حاجة، جاي أكمل" }
];

export const PulseCheckModal: FC<PulseCheckModalProps> = ({ isOpen, onSubmit, onClose }) => {
  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState<PulseMood>("calm");
  const [focus, setFocus] = useState<PulseFocus>("none");
  const [touched, setTouched] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (!isOpen) return;
    setEnergy(5);
    setMood("calm");
    setFocus("none");
    setTouched(false);
    setSecondsLeft(5);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (touched) return;
    if (secondsLeft <= 0) {
      onSubmit({ energy, mood, focus, auto: true });
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [isOpen, secondsLeft, touched, energy, mood, focus, onSubmit]);

  const handleSubmit = () => {
    onSubmit({ energy, mood, focus });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">ضبط البوصلة</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">النبض اللحظي قبل كل شيء</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>استجابة تلقائية خلال</span>
                <span className="font-semibold">{secondsLeft}s</span>
              </div>
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all"
                  style={{ width: `${(secondsLeft / 5) * 100}%` }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">مؤشر البطارية 🔋</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={energy}
                  onChange={(e) => {
                    setEnergy(Number(e.target.value));
                    setTouched(true);
                  }}
                  className="w-full accent-teal-600"
                />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>فاصل شحن</span>
                  <span className="font-semibold">{energy}/10</span>
                  <span>فايق ومستعد</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">الطقس الداخلي 🌦️</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMood(item.id);
                        setTouched(true);
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        mood === item.id
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-teal-200"
                      }`}
                    >
                      <span className="mr-1">{item.emoji}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">التركيز الحالي 🎯</label>
                <div className="grid grid-cols-2 gap-2">
                  {FOCUS_OPTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFocus(item.id);
                        setTouched(true);
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        focus === item.id
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 rounded-full bg-teal-600 text-white py-3 text-sm font-semibold hover:bg-teal-700 transition-all"
              >
                جاهز
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-slate-300"
              >
                تخطي
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
