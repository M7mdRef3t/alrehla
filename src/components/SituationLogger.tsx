import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, X, Calendar } from "lucide-react";
import type { SituationLog } from "../types/recoveryPlan";

interface SituationLoggerProps {
  logs: SituationLog[];
  onAddLog: (log: Omit<SituationLog, "id" | "date">) => void;
  onDeleteLog: (logId: string) => void;
}

export const SituationLogger: FC<SituationLoggerProps> = ({
  logs,
  onAddLog,
  onDeleteLog
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newLog, setNewLog] = useState({
    situation: "",
    feeling: "",
    response: "",
    outcome: "",
    lesson: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLog.situation.trim() && newLog.feeling.trim()) {
      onAddLog(newLog);
      setNewLog({
        situation: "",
        feeling: "",
        response: "",
        outcome: "",
        lesson: ""
      });
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setNewLog({
      situation: "",
      feeling: "",
      response: "",
      outcome: "",
      lesson: ""
    });
    setIsAdding(false);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          سجل المواقف
        </h3>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="rounded-full bg-purple-600 text-white p-2 hover:bg-purple-700 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            title="إضافة موقف جديد"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4 text-right">
        سجّل تقارير الميدان عشان تراجعها وتعرف إيه اللي بينزف طاقتك.
      </p>

      {/* Add Log Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            onSubmit={handleSubmit}
            className="mb-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                  تقرير الموقف <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newLog.situation}
                  onChange={(e) => setNewLog({ ...newLog, situation: e.target.value })}
                  placeholder="مثال: طلب مني فلوس بشكل مفاجئ"
                  className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                  قراءة الرادار <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newLog.feeling}
                  onChange={(e) => setNewLog({ ...newLog, feeling: e.target.value })}
                  placeholder="مثال: ضغط + ذنب"
                  className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                  المناورة اللي اتنفذت
                </label>
                <input
                  type="text"
                  value={newLog.response}
                  onChange={(e) => setNewLog({ ...newLog, response: e.target.value })}
                  placeholder='مثال: قولت "مش مناسب دلوقتي"'
                  className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                  نتيجة المناورة
                </label>
                <input
                  type="text"
                  value={newLog.outcome}
                  onChange={(e) => setNewLog({ ...newLog, outcome: e.target.value })}
                  placeholder="مثال: حصل شد بسيط وبعدها هدوء"
                  className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
                  قاعدة جديدة
                </label>
                <input
                  type="text"
                  value={newLog.lesson}
                  onChange={(e) => setNewLog({ ...newLog, lesson: e.target.value })}
                  placeholder="مثال: الوضوح بيقلل النزيف"
                  className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 font-medium hover:bg-gray-200 active:scale-95 transition-all duration-150"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={!newLog.situation.trim() || !newLog.feeling.trim()}
                className="rounded-full bg-purple-600 text-white px-4 py-2 text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all duration-150"
              >
                حفظ
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Logs List */}
      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لسه مفيش تقارير ميدان</p>
            <p className="text-xs mt-1">اضغط + وسجّل أول تقرير</p>
          </div>
        ) : (
          logs.map((log) => (
            <motion.div
              key={log.id}
              className="p-4 bg-white border border-purple-200 rounded-xl text-right relative group hover:border-purple-400 transition-colors duration-150"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              layout
            >
              {/* Delete Button */}
              <button
                type="button"
                onClick={() => onDeleteLog(log.id)}
                className="absolute top-2 left-2 w-9 h-9 sm:w-6 sm:h-6 rounded-full bg-rose-500 text-white flex items-center justify-center sm:opacity-0 group-hover:opacity-100 hover:bg-rose-600 active:scale-95 transition-all duration-150 z-10"
                title="حذف التقرير"
              >
                <X className="w-4 h-4 sm:w-3 sm:h-3" strokeWidth={2.5} />
              </button>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-purple-700">التقرير:</span>{" "}
                  <span className="text-slate-900">{log.situation}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-700">الرادار:</span>{" "}
                  <span className="text-slate-700">{log.feeling}</span>
                </div>
                {log.response && (
                  <div>
                    <span className="font-semibold text-purple-700">المناورة:</span>{" "}
                    <span className="text-slate-700">{log.response}</span>
                  </div>
                )}
                {log.outcome && (
                  <div>
                    <span className="font-semibold text-purple-700">النتيجة:</span>{" "}
                    <span className="text-slate-700">{log.outcome}</span>
                  </div>
                )}
                {log.lesson && (
                  <div className="pt-2 border-t border-purple-100">
                    <span className="font-semibold text-teal-600">✓ القاعدة:</span>{" "}
                    <span className="text-slate-700 italic">{log.lesson}</span>
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                {new Date(log.date).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
