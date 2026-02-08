import type { FC } from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { PulseFocus, PulseMood } from "../state/pulseState";

interface PulseCheckModalProps {
  isOpen: boolean;
  context?: "regular" | "start_recovery";
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

const MOOD_STYLE: Record<
  PulseMood,
  { selected: string; hover: string; ring: string }
> = {
  bright: {
    selected: "bg-yellow-300 text-slate-900 border-yellow-400 shadow-sm",
    hover: "hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-900",
    ring: "focus-visible:ring-yellow-400"
  },
  calm: {
    selected: "bg-teal-500 text-white border-teal-600 shadow-sm",
    hover: "hover:bg-teal-50 hover:border-teal-200 hover:text-teal-800",
    ring: "focus-visible:ring-teal-400"
  },
  anxious: {
    selected: "bg-amber-500 text-white border-amber-600 shadow-sm",
    hover: "hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800",
    ring: "focus-visible:ring-amber-400"
  },
  angry: {
    selected: "bg-rose-500 text-white border-rose-600 shadow-sm",
    hover: "hover:bg-rose-50 hover:border-rose-200 hover:text-rose-800",
    ring: "focus-visible:ring-rose-400"
  },
  sad: {
    selected: "bg-sky-500 text-white border-sky-600 shadow-sm",
    hover: "hover:bg-sky-50 hover:border-sky-200 hover:text-sky-800",
    ring: "focus-visible:ring-sky-400"
  }
};

const FOCUS_STYLE: Record<
  PulseFocus,
  { selected: string; hover: string; ring: string }
> = {
  event: {
    selected: "bg-teal-500 text-white border-teal-600 shadow-sm",
    hover: "hover:bg-teal-50 hover:border-teal-200 hover:text-teal-800",
    ring: "focus-visible:ring-teal-400"
  },
  thought: {
    selected: "bg-amber-500 text-white border-amber-600 shadow-sm",
    hover: "hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800",
    ring: "focus-visible:ring-amber-400"
  },
  body: {
    selected: "bg-rose-500 text-white border-rose-600 shadow-sm",
    hover: "hover:bg-rose-50 hover:border-rose-200 hover:text-rose-800",
    ring: "focus-visible:ring-rose-400"
  },
  none: {
    selected: "bg-emerald-500 text-white border-emerald-600 shadow-sm",
    hover: "hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800",
    ring: "focus-visible:ring-emerald-400"
  }
};

function energyColorHex(energy: number): string {
  if (energy <= 3) return "#f43f5e"; // rose-500
  if (energy <= 6) return "#f59e0b"; // amber-500
  return "#14b8a6"; // teal-500
}

export const PulseCheckModal: FC<PulseCheckModalProps> = ({ isOpen, context: _context = "regular", onSubmit, onClose }) => {
  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState<PulseMood>("calm");
  const [focus, setFocus] = useState<PulseFocus>("none");
  const fillHex = energyColorHex(energy);
  // Range is 1..10, so normalize using (value-min)/(max-min) to match the thumb position.
  const pct = Math.max(0, Math.min(100, ((energy - 1) / 9) * 100));

  useEffect(() => {
    if (!isOpen) return;
    setEnergy(5);
    setMood("calm");
    setFocus("none");
  }, [isOpen]);

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
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">مؤشر طاقتك 🔋</label>
                <div className="relative w-full py-2">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-slate-200 dark:bg-slate-600" />
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-2 rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: fillHex }}
                  />
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={energy}
                    onChange={(e) => {
                      setEnergy(Number(e.target.value));
                    }}
                    className="pulse-range relative w-full"
                    style={
                      {
                        accentColor: fillHex,
                        "--pulse-fill": fillHex
                      } as React.CSSProperties
                    }
                  />
                </div>
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
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                        mood === item.id
                          ? `${MOOD_STYLE[item.id].selected} ${MOOD_STYLE[item.id].ring}`
                          : `border-slate-200 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 ${MOOD_STYLE[item.id].hover} focus-visible:ring-slate-300`
                      }`}
                    >
                      <span>{item.emoji}</span>
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
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                        focus === item.id
                          ? `${FOCUS_STYLE[item.id].selected} ${FOCUS_STYLE[item.id].ring}`
                          : `border-slate-200 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 ${FOCUS_STYLE[item.id].hover} focus-visible:ring-slate-300`
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
