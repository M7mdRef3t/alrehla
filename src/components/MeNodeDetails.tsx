import type { FC } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, PenLine, Wind, Shield } from "lucide-react";
import { useMeState, type BatteryState } from "../state/meState";
import { useMapState } from "../state/mapState";
import { useAppContentString } from "../hooks/useAppContentString";

interface MeNodeDetailsProps {
  onClose: () => void;
  onStartBreathing: () => void;
}

const BATTERY_OPTIONS: { value: BatteryState; label: string; emoji: string }[] = [
  { value: "drained", label: "فاصل", emoji: "🪫" },
  { value: "okay", label: "ماشي", emoji: "😐" },
  { value: "charged", label: "شحن", emoji: "⚡" }
];

export const MeNodeDetails: FC<MeNodeDetailsProps> = ({ onClose, onStartBreathing }) => {
  const { battery, setBattery, journalNote, setJournalNote, shieldMode, setShieldMode } = useMeState();
  const nodes = useMapState((s) => s.nodes);
  const [showJournal, setShowJournal] = useState(false);
  const [journalInput, setJournalInput] = useState("");

  const journalPlaceholder = useAppContentString(
    "me_journal_placeholder",
    "اكتب هنا...",
    { page: "me_node" }
  );

  const redCount = nodes.filter((n) => n.ring === "red").length;
  const yellowCount = nodes.filter((n) => n.ring === "yellow").length;
  const greenCount = nodes.filter((n) => n.ring === "green").length;
  const loadHigh = redCount > greenCount;

  const handleSaveJournal = () => {
    setJournalNote(journalInput);
    setShowJournal(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="me-card-title"
    >
      <motion.div
        className="w-full max-w-md rounded-2xl overflow-hidden bg-linear-to-br from-[var(--soft-teal)] via-purple-500 to-[var(--soft-teal)] text-white"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 id="me-card-title" className="text-xl font-bold">
              أنت — حالتك
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* بطاريتك النهاردة؟ */}
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-white/90 mb-3">
              بطاريتك النهاردة؟
            </h3>
            <div className="flex gap-2 p-1.5 rounded-xl bg-white/15">
              {BATTERY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBattery(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-sm font-medium transition-all ${
                    battery === opt.value
                      ? "bg-white text-[var(--soft-teal)]"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* اقتراح وضع الدرع عند فاصل */}
          {battery === "drained" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-white/15 border border-white/20"
            >
              <p className="text-sm text-white/95 mb-3">
                تحب نحمي مساحتك ونخفي إشعارات الناس اللي في الأحمر دلوقتي؟
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShieldMode(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/25 hover:bg-white/35 text-sm font-semibold"
                >
                  <Shield className="w-4 h-4" />
                  ثبّت مساحتك
                </button>
                <button
                  type="button"
                  onClick={() => setShieldMode(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
                >
                  لا، شكراً
                </button>
              </div>
              {shieldMode && (
                <p className="mt-2 text-xs text-white/80">
                  مساحتك محمية — إشعارات الأحمر مخفية.
                </p>
              )}
            </motion.div>
          )}

          {/* إحصائيات الخريطة */}
          <section className="mb-6 p-4 rounded-xl bg-white/10">
            <h3 className="text-sm font-semibold text-white/90 mb-3">
              نظرة على الخريطة
            </h3>
            <ul className="space-y-1.5 text-sm">
              <li className="flex justify-between">
                <span>🔴 الأحمر</span>
                <span className="font-semibold">{redCount} أشخاص</span>
              </li>
              <li className="flex justify-between">
                <span>🟡 الأصفر</span>
                <span className="font-semibold">{yellowCount} أشخاص</span>
              </li>
              <li className="flex justify-between">
                <span>🟢 الأخضر</span>
                <span className="font-semibold">{greenCount} أشخاص</span>
              </li>
            </ul>
            {loadHigh && (
              <p className="mt-3 text-amber-200 text-sm font-medium">
                ⚠️ الحمل عالي — الأحمر أكتر من الأخضر.
              </p>
            )}
          </section>

          {/* أزرار سريعة */}
          <section className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setJournalInput(journalNote);
                setShowJournal(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-semibold transition-colors"
            >
              <PenLine className="w-4 h-4" />
              فضفضة حرة
            </button>
            <button
              type="button"
              onClick={onStartBreathing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-semibold transition-colors"
            >
              <Wind className="w-4 h-4" />
              افصل دقيقة (تنفس)
            </button>
          </section>
        </div>
      </motion.div>

      {/* مودال فضفضة حرة */}
      {showJournal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowJournal(false)}
        >
          <motion.div
            className="w-full max-w-md rounded-xl bg-white p-4 text-left"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-bold text-slate-900 mb-2">فضفضة حرة</h4>
            <textarea
              id="me-node-journal"
              name="meNodeJournal"
              value={journalInput}
              onChange={(e) => setJournalInput(e.target.value)}
              placeholder={journalPlaceholder}
              rows={5}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--soft-teal)]"
            />
            <div className="mt-3 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowJournal(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveJournal}
                className="px-4 py-2 rounded-lg bg-[var(--soft-teal)] text-white text-sm font-semibold hover:bg-[var(--soft-teal)]"
              >
                حفظ
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};


