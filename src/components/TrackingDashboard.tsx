import type { FC } from "react";
import { useState, useEffect } from "react";
import { X, BarChart3, Users, Shield } from "lucide-react";
import {
  getTrackingMode,
  setTrackingMode,
  getTrackingApiUrl,
  setTrackingApiUrl,
  getAggregateStats,
  getSessionsWithProgress,
  clearAllJourneyEvents,
  type TrackingMode as Mode
} from "../services/journeyTracking";
import { isSupabaseReady } from "../services/supabaseClient";
import { AIContentStudioWidget } from "./AIContentStudioWidget";
import { WeeklyWrapModal } from "./WeeklyWrapModal";
import { AggressiveBurnoutModal } from "./AggressiveBurnoutModal";
import { useAppContentString } from "../hooks/useAppContentString";
import { isUserMode } from "../config/appEnv";

interface TrackingDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const PATH_NAMES: Record<string, string> = {
  path_protection: "درع الحماية",
  path_detox: "الصيام الشعوري",
  path_negotiation: "فن المسافة",
  path_deepening: "الجذور العميقة",
  path_sos: "الطوارئ القصوى"
};

export const TrackingDashboard: FC<TrackingDashboardProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<Mode>(() => (isUserMode ? "identified" : getTrackingMode()));
  const [confirmClear, setConfirmClear] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(() => getTrackingApiUrl() ?? "");
  const [apiUrlSaved, setApiUrlSaved] = useState(false);

  const apiUrlPlaceholder = useAppContentString(
    "tracking_api_url_placeholder",
    "https://your-server.com/api/tracking",
    { page: "tracking" }
  );

  useEffect(() => {
    if (isOpen) setApiUrlInput(getTrackingApiUrl() ?? "");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isUserMode) return;
    if (mode !== "identified") {
      setTrackingMode("identified");
      setMode("identified");
    }
  }, [isOpen, mode]);

  const handleModeChange = (v: Mode) => {
    if (isUserMode && v !== "identified") return;
    setTrackingMode(v);
    setMode(v);
  };

  const stats = getAggregateStats();
  const sessions = getSessionsWithProgress();

  const handleClearEvents = () => {
    if (confirmClear) {
      clearAllJourneyEvents();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const handleSaveApiUrl = () => {
    setTrackingApiUrl(apiUrlInput.trim() || null);
    setApiUrlSaved(true);
    setTimeout(() => setApiUrlSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      <AggressiveBurnoutModal />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div
          className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              لوحة المتابعة
            </h2>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto">
            {/* رابط الباكند */}
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">رابط الخادم للتتبع (اختياري)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {isSupabaseReady
                  ? "Supabase متصل — الإرسال يتم تلقائياً. الرابط هنا احتياطي فقط."
                  : "لو ضبطت رابط، كل حدث تتبع هيترسل تلقائياً للخادم عشان تقدر تتابع من لوحة خارجية."}
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  placeholder={apiUrlPlaceholder}
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleSaveApiUrl}
                  className="rounded-lg bg-teal-600 text-white px-4 py-2 text-sm font-semibold hover:bg-teal-700 disabled:opacity-50"
                >
                  {apiUrlSaved ? "تم الحفظ" : "حفظ"}
                </button>
              </div>
            </div>

            {/* اختيار النظام */}
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">نظام التتبع</p>
              {isUserMode ? (
                <div className="rounded-lg border-2 border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 p-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <div className="flex flex-col">
                    <span className="font-medium">مع هوية</span>
                    <span className="text-xs opacity-80">مفعّل إجباريًا في وضع المستخدم لضمان سلامة المزامنة.</span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleModeChange("anonymous")}
                    className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${mode === "anonymous"
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200"
                      : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                  >
                    <Shield className="w-5 h-5" />
                    <span>بدون هوية</span>
                    <span className="text-xs opacity-80">إحصائيات مجمّعة فقط</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange("identified")}
                    className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${mode === "identified"
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200"
                      : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                  >
                    <Users className="w-5 h-5" />
                    <span>مع هوية</span>
                    <span className="text-xs opacity-80">لمتابعة ومساعدة المستخدمين</span>
                  </button>
                </div>
              )}
            </div>

            {/* إحصائيات مجمّعة — تظهر دايماً */}
            <div className="p-3 border border-slate-200 dark:border-slate-600 rounded-xl">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">إحصائيات مجمّعة (للاستفادة العامة)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400 text-xs">مسارات مُنشأة</p>
                  <p className="font-bold text-teal-600 dark:text-teal-400">{stats.totalPathStarts}</p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400 text-xs">تمارين مُنجَزة</p>
                  <p className="font-bold text-teal-600 dark:text-teal-400">{stats.totalTaskCompletions}</p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400 text-xs">متوسط المزاج</p>
                  <p className="font-bold text-amber-600 dark:text-amber-400">{stats.avgMoodScore ?? "—"} / 5</p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400 text-xs">علاقات مُضافة</p>
                  <p className="font-bold text-violet-600 dark:text-violet-400">{stats.totalNodesAdded}</p>
                </div>
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400 text-xs">إعادة تحضير مسار</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{stats.pathRegenerates}</p>
                </div>
              </div>
              {Object.keys(stats.byPathId).length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">حسب المسار</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.byPathId).map(([pathId, v]) => (
                      <span key={pathId} className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-600 rounded">
                        {PATH_NAMES[pathId] ?? pathId}: {v.starts} بداية، {v.completions} إنجاز
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* قائمة الجلسات — تظهر فقط في وضع "مع هوية" */}
            {mode === "identified" && (
              <div className="p-3 border border-violet-200 dark:border-violet-800 rounded-xl">
                <h3 className="text-sm font-bold text-violet-800 dark:text-violet-200 mb-3">جلسات (لمتابعة ومساعدة المستخدمين)</h3>
                {sessions.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد جلسات مسجّلة بعد. التتبع "مع هوية" يبدأ من الآن.</p>
                ) : (
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {sessions.map((s) => (
                      <li
                        key={s.sessionId}
                        className="p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-right"
                      >
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate" title={s.sessionId}>
                          {s.sessionId.slice(0, 20)}…
                        </p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          آخر نشاط: {s.lastActivity}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          مسارات: {s.pathStarts} — تمارين مُنجَزة: {s.taskCompletions} — علاقات: {s.nodesAdded}
                          {s.lastPathId && ` — آخر مسار: ${PATH_NAMES[s.lastPathId] ?? s.lastPathId}`}
                        </p>
                        {s.moodScores.length > 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            مزاج مسجّل: {s.moodScores.length} مرة، آخر قيمة {s.moodScores[s.moodScores.length - 1]}/5
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleClearEvents}
                className={`text-sm px-3 py-1.5 rounded-lg ${confirmClear ? "bg-red-600 text-white" : "bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300"}`}
              >
                {confirmClear ? "اضغط مرة أخرى لمسح كل الأحداث" : "مسح كل أحداث التتبع"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
