import type { FC } from "react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Calendar, TrendingUp } from "lucide-react";
import { useDailyJournalState } from "../state/dailyJournalState";

interface DailyJournalArchiveProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEEK_THEMES: Record<number, { color: string; label: string }> = {
  1: { color: "#2dd4bf", label: "الوعي بالذات" },
  2: { color: "#a78bfa", label: "دواير القرب" },
  3: { color: "#fbbf24", label: "الحدود والتحرر" },
  4: { color: "#34d399", label: "النظرة للمستقبل" },
};

function formatArabicDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getWeekFromQuestionId(id: number): number {
  if (id <= 7) return 1;
  if (id <= 14) return 2;
  if (id <= 21) return 3;
  return 4;
}

export const DailyJournalArchive: FC<DailyJournalArchiveProps> = ({ isOpen, onClose }) => {
  const rawEntries = useDailyJournalState((s) => s.entries);
  const entries = useMemo(
    () => [...rawEntries].sort((a, b) => b.savedAt - a.savedAt),
    [rawEntries]
  );
  const totalAnswers = useMemo(
    () => rawEntries.filter((e) => e.answer.length > 0).length,
    [rawEntries]
  );

  // إحصاء أكثر كلمة تكررت في الإجابات (كلمات 4 أحرف فأكثر)
  const topWord = useMemo(() => {
    const allText = entries.map((e) => e.answer).join(" ");
    const words = allText
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .map((w) => w.replace(/[^ا-ي]/g, ""));
    const freq: Record<string, number> = {};
    words.forEach((w) => {
      if (w) freq[w] = (freq[w] ?? 0) + 1;
    });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? null;
  }, [entries]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(10,10,26,0.85)", backdropFilter: "blur(10px)" }}
      role="dialog"
      aria-labelledby="journal-archive-title"
    >
      <motion.div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden text-right"
        style={{
          background: "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(10,10,26,0.99) 100%)",
          border: "1px solid rgba(45,212,191,0.15)",
        }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── رأس الصفحة ── */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 transition-colors hover:bg-white/5"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-400" />
              <h2 id="journal-archive-title" className="text-lg font-bold text-white">
                كتاب رحلتي
              </h2>
            </div>
          </div>

          <div className="w-9" />
        </div>

        {/* ── ملخص الإحصاء ── */}
        {entries.length > 0 && (
          <div
            className="mx-4 mt-4 mb-2 rounded-2xl p-4 shrink-0"
            style={{
              background: "rgba(45,212,191,0.05)",
              border: "1px solid rgba(45,212,191,0.12)",
            }}
          >
            <div className="flex items-start gap-3">
              <TrendingUp className="w-4 h-4 mt-0.5 shrink-0 text-teal-400" />
              <p className="text-[13px] leading-relaxed" style={{ color: "rgba(203,213,225,0.8)" }}>
                {topWord
                  ? `في رحلتك، جاوبت على ${totalAnswers} سؤال.. وأكتر كلمة اتكررت في إجاباتك كانت "${topWord}".`
                  : `في رحلتك، جاوبت على ${totalAnswers} سؤال حتى الآن.`
                }
              </p>
            </div>
          </div>
        )}

        {/* ── قائمة الإجابات ── */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Calendar className="w-10 h-10 text-slate-700" />
              <p className="text-sm text-slate-500 text-center">
                لسه ما بدأتش رحلتك مع سؤال اليوم
                <br />
                <span className="text-xs text-slate-600">أجب على سؤال اليوم وهتتحفظ هنا</span>
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-3 mt-2">
                {entries.map((entry, i) => {
                  const week = getWeekFromQuestionId(entry.questionId);
                  const theme = WEEK_THEMES[week] ?? WEEK_THEMES[1];
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className="rounded-2xl p-4"
                      style={{
                        background: "rgba(255,255,255,0.025)",
                        border: `1px solid ${theme.color}18`,
                      }}
                    >
                      {/* التاريخ والثيم */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            color: theme.color,
                            background: `${theme.color}12`,
                          }}
                        >
                          {theme.label}
                        </span>
                        <span className="text-[11px]" style={{ color: "rgba(148,163,184,0.5)" }}>
                          {formatArabicDate(entry.date)}
                        </span>
                      </div>

                      {/* السؤال */}
                      <p
                        className="text-[12px] leading-relaxed mb-2"
                        style={{ color: "rgba(148,163,184,0.55)" }}
                      >
                        {entry.questionText}
                      </p>

                      {/* الإجابة */}
                      <p
                        className="text-[14px] font-medium leading-relaxed italic"
                        style={{ color: "rgba(226,232,240,0.85)" }}
                      >
                        "{entry.answer}"
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* ── تذييل ── */}
        {entries.length > 0 && (
          <div
            className="px-5 py-4 text-center shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <p className="text-[12px] italic" style={{ color: "rgba(45,212,191,0.4)" }}>
              الكلمات اللي كتبتها هي شاهد على طريق مشيته..
              <br />
              كل سطر هو خطوة أقرب لنفسك
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
