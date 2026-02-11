import type { FC } from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Brain } from "lucide-react";
import { consciousnessService, type MemoryMatch } from "../services/consciousnessService";

interface ConsciousnessArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsciousnessArchiveModal: FC<ConsciousnessArchiveModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<MemoryMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<"all" | "pulse" | "chat" | "note">("all");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    void consciousnessService
      .fetchArchive({ limit: 200 })
      .then((data) => {
        setItems(data);
      })
      .catch((err: unknown) => {
        console.error("ConsciousnessArchive error:", err);
        setError("تعذر تحميل أرشيف الوعي حالياً.");
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filteredItems =
    sourceFilter === "all"
      ? items.filter((i) => !i.hidden)
      : items.filter((i) => !i.hidden && (i.source ?? "pulse") === sourceFilter);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 sm:inset-auto sm:bottom-10 sm:right-10 sm:w-[420px] sm:h-[520px] bg-white rounded-3xl border border-slate-200 z-50 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-teal-600 text-white flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold text-slate-900">أرشيف الوعي</h3>
                  <p className="text-[11px] text-slate-500">آخر اللحظات اللي خزّناها من البوصلة والشات</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="px-4 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-500">النوع:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSourceFilter("all")}
                  className={`px-2 py-0.5 rounded-full border ${
                    sourceFilter === "all"
                      ? "bg-teal-600 text-white border-teal-700"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setSourceFilter("pulse")}
                  className={`px-2 py-0.5 rounded-full border ${
                    sourceFilter === "pulse"
                      ? "bg-amber-500 text-white border-amber-600"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  البوصلة
                </button>
                <button
                  type="button"
                  onClick={() => setSourceFilter("chat")}
                  className={`px-2 py-0.5 rounded-full border ${
                    sourceFilter === "chat"
                      ? "bg-purple-500 text-white border-purple-600"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  الشات
                </button>
                <button
                  type="button"
                  onClick={() => setSourceFilter("note")}
                  className={`px-2 py-0.5 rounded-full border ${
                    sourceFilter === "note"
                      ? "bg-sky-500 text-white border-sky-600"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  ملاحظات
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50/60">
              {loading && (
                <p className="text-xs text-slate-500 text-center mt-8">جاري تحميل الأرشيف...</p>
              )}
              {error && !loading && (
                <p className="text-xs text-rose-600 text-center mt-4">{error}</p>
              )}
              {!loading && !error && filteredItems.length === 0 && (
                <p className="text-xs text-slate-500 text-center mt-6">لسه مفيش لحظات محفوظة في الأرشيف.</p>
              )}
              {!loading &&
                !error &&
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-right"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString("ar-EG", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : ""}
                      </span>
                      {item.source && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.source === "pulse"
                              ? "bg-amber-100 text-amber-800"
                              : item.source === "chat"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {item.source === "pulse"
                            ? "من البوصلة"
                            : item.source === "chat"
                              ? "من الشات"
                              : "ملاحظة"}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <p className="mt-1 text-[10px] text-slate-500">
                        الوسوم: {item.tags.join(" • ")}
                      </p>
                    )}
                    {item.manual_notes && (
                      <p className="mt-1 text-[10px] text-slate-500 whitespace-pre-wrap">
                        ملاحظات: {item.manual_notes}
                      </p>
                    )}
                  </div>
                ))}
            </div>

            <div className="px-4 py-2 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-slate-600 hover:text-slate-800 font-semibold"
              >
                تم · إغلاق الأرشيف
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

