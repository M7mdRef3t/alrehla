/**
 * PerformanceRadarPanel
 * لوحة رادار الأداء — تعرض بيانات الـ performance_logs من Supabase
 * تُضاف داخل HealthMonitorPanel (تبويبة مراقب النبض)
 */

import { type FC, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Flame,
  RefreshCw,
  BarChart3,
  Globe,
  Timer,
  Zap,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";

/* ── Types ── */

interface PerformanceLog {
  id: number;
  session_id: string;
  status: "healthy" | "degraded" | "critical";
  avg_lag_ms: number | null;
  p95_lag_ms: number | null;
  long_tasks_1m: number;
  freezes_1m: number;
  last_freeze_at: string | null;
  url: string | null;
  created_at: string;
}

interface SummaryStats {
  total: number;
  healthy: number;
  degraded: number;
  critical: number;
  avgLag: number;
  p95Lag: number;
  totalFreezes: number;
  uniqueSessions: number;
  topUrls: { url: string; count: number; criticalCount: number }[];
}

/* ── Helpers ── */

const STATUS_CONFIG = {
  healthy: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", label: "سليم" },
  degraded: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", label: "متراجع" },
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", label: "حرج" },
};

function formatMs(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  return `منذ ${Math.floor(hrs / 24)} يوم`;
}

/* ── Mini Sparkline Bar Chart ── */
const SparkBars: FC<{ data: PerformanceLog[]; field: "freezes_1m" | "avg_lag_ms" }> = ({ data, field }) => {
  const values = data.slice(-24).map((d) => (field === "freezes_1m" ? d.freezes_1m : (d.avg_lag_ms ?? 0)));
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-[2px] h-10">
      {values.map((v, i) => {
        const pct = (v / max) * 100;
        const isHigh = pct > 70;
        return (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-300"
            style={{
              height: `${Math.max(pct, 4)}%`,
              background: isHigh ? "#ef4444" : "#06b6d4",
              opacity: 0.7 + (i / values.length) * 0.3,
            }}
          />
        );
      })}
    </div>
  );
};

/* ── Status Badge ── */
const StatusBadge: FC<{ status: PerformanceLog["status"] }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="text-[9px] font-black px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
};

/* ── Main Component ── */

export const PerformanceRadarPanel: FC = () => {
  const [logs, setLogs] = useState<PerformanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | PerformanceLog["status"]>("all");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchLogs = useCallback(async () => {
    if (!supabase) {
      setError("Supabase غير متاح");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("performance_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (fetchError) throw fetchError;
      setLogs((data ?? []) as PerformanceLog[]);
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
    // Auto-refresh every 30s
    const interval = setInterval(() => void fetchLogs(), 30_000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  /* ── Compute Stats ── */
  const stats: SummaryStats = (() => {
    if (logs.length === 0) {
      return { total: 0, healthy: 0, degraded: 0, critical: 0, avgLag: 0, p95Lag: 0, totalFreezes: 0, uniqueSessions: 0, topUrls: [] };
    }

    const healthy = logs.filter((l) => l.status === "healthy").length;
    const degraded = logs.filter((l) => l.status === "degraded").length;
    const critical = logs.filter((l) => l.status === "critical").length;

    const lagValues = logs.map((l) => l.avg_lag_ms ?? 0).filter((v) => v > 0);
    const avgLag = lagValues.length ? lagValues.reduce((a, b) => a + b, 0) / lagValues.length : 0;

    const p95Values = logs.map((l) => l.p95_lag_ms ?? 0).filter((v) => v > 0);
    const p95Lag = p95Values.length ? Math.max(...p95Values) : 0;

    const totalFreezes = logs.reduce((a, l) => a + (l.freezes_1m ?? 0), 0);
    const uniqueSessions = new Set(logs.map((l) => l.session_id)).size;

    // Top URLs by frequency + critical count
    const urlMap: Record<string, { count: number; criticalCount: number }> = {};
    for (const log of logs) {
      const url = log.url ?? "(unknown)";
      if (!urlMap[url]) urlMap[url] = { count: 0, criticalCount: 0 };
      urlMap[url].count++;
      if (log.status === "critical") urlMap[url].criticalCount++;
    }
    const topUrls = Object.entries(urlMap)
      .map(([url, v]) => ({ url, ...v }))
      .sort((a, b) => b.criticalCount - a.criticalCount || b.count - a.count)
      .slice(0, 5);

    return { total: logs.length, healthy, degraded, critical, avgLag, p95Lag, totalFreezes, uniqueSessions, topUrls };
  })();

  const filteredLogs = statusFilter === "all" ? logs : logs.filter((l) => l.status === statusFilter);

  /* ── Render ── */
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}
          >
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">رادار أداء العميل</h2>
            <p className="text-[11px] text-slate-500">Freeze Detection · Lag Tracking · Critical Sessions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-600">
            آخر تحديث: {lastRefreshed.toLocaleTimeString("ar-EG")}
          </span>
          <button
            onClick={() => void fetchLogs()}
            disabled={loading}
            className="p-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "إجمالي السجلات", value: stats.total, icon: <BarChart3 className="w-4 h-4" />, color: "#94a3b8" },
          {
            label: "جلسات حرجة",
            value: stats.critical,
            icon: <Flame className="w-4 h-4" />,
            color: "#ef4444",
            highlight: stats.critical > 0,
          },
          { label: "إجمالي التجمدات", value: stats.totalFreezes, icon: <Timer className="w-4 h-4" />, color: "#f59e0b" },
          { label: "جلسات فريدة", value: stats.uniqueSessions, icon: <Globe className="w-4 h-4" />, color: "#06b6d4" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl"
            style={{
              background: stat.highlight ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${stat.highlight ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            <div className="flex items-center gap-2 mb-2" style={{ color: stat.color }}>
              {stat.icon}
              <span className="text-[10px] font-bold text-slate-400">{stat.label}</span>
            </div>
            <p className="text-2xl font-black" style={{ color: stat.color }}>
              {stat.value.toLocaleString()}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Lag Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          className="p-4 rounded-2xl"
          style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-[10px] font-bold text-slate-400">متوسط التأخير (Avg Lag)</span>
          </div>
          <p className="text-2xl font-black text-violet-300">{formatMs(stats.avgLag)}</p>
          {logs.length > 0 && <SparkBars data={[...logs].reverse()} field="avg_lag_ms" />}
        </div>

        <div
          className="p-4 rounded-2xl"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-bold text-slate-400">أعلى تأخير (P95)</span>
          </div>
          <p className="text-2xl font-black text-red-300">{formatMs(stats.p95Lag)}</p>
        </div>

        <div
          className="p-4 rounded-2xl"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-400">نسبة التجمد (Freeze Rate)</span>
          </div>
          {logs.length > 0 && <SparkBars data={[...logs].reverse()} field="freezes_1m" />}
        </div>
      </div>

      {/* Top Problem URLs */}
      {stats.topUrls.length > 0 && (
        <div
          className="p-4 rounded-2xl space-y-3"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs font-black text-slate-400 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            أكثر الصفحات تسجيلاً للمشاكل
          </p>
          <div className="space-y-2">
            {stats.topUrls.map((item) => (
              <div key={item.url} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 truncate font-mono" dir="ltr">{item.url}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.criticalCount > 0 && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                      {item.criticalCount} حرج
                    </span>
                  )}
                  <span className="text-[9px] text-slate-500">{item.count} سجل</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        {(["all", "critical", "degraded", "healthy"] as const).map((f) => {
          const labels = { all: "الكل", critical: "حرج", degraded: "متراجع", healthy: "سليم" };
          const colors = { all: "#94a3b8", critical: "#ef4444", degraded: "#f59e0b", healthy: "#10b981" };
          const isActive = statusFilter === f;
          return (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: isActive ? `${colors[f]}20` : "rgba(255,255,255,0.04)",
                border: `1px solid ${isActive ? `${colors[f]}40` : "rgba(255,255,255,0.06)"}`,
                color: isActive ? colors[f] : "#64748b",
              }}
            >
              {labels[f]}
            </button>
          );
        })}
        <span className="mr-auto text-[10px] text-slate-600">{filteredLogs.length} سجل</span>
      </div>

      {/* Logs Table */}
      {loading && logs.length === 0 ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-cyan-400/30 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-slate-500">جاري تحميل بيانات الأداء...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-16 text-center rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)" }}>
          <CheckCircle2 className="w-8 h-8 text-emerald-400/30 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-bold">لا توجد سجلات في هذه الفترة</p>
          <p className="text-[10px] text-slate-600 mt-1">النظام يعمل بشكل مثالي أو لم تُسجَّل أي جلسات بعد</p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Table Header */}
          <div
            className="grid text-[10px] font-black text-slate-500 px-4 py-3 uppercase tracking-widest"
            style={{ gridTemplateColumns: "1fr 80px 90px 90px 60px 60px 120px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            <span>الجلسة / الصفحة</span>
            <span>الحالة</span>
            <span>متوسط التأخير</span>
            <span>P95</span>
            <span>مهام ثقيلة</span>
            <span>تجمدات</span>
            <span>الوقت</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-white/[0.03] max-h-96 overflow-y-auto">
            {filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid items-center px-4 py-3 hover:bg-white/[0.02] transition-colors"
                style={{ gridTemplateColumns: "1fr 80px 90px 90px 60px 60px 120px" }}
              >
                <div className="min-w-0 pr-1">
                  <p className="text-[10px] font-mono text-slate-400 truncate" dir="ltr">
                    {log.session_id === "anonymous" ? "زائر مجهول" : log.session_id.slice(0, 12) + "…"}
                  </p>
                  {log.url && (
                    <p className="text-[9px] text-slate-600 truncate" dir="ltr">{log.url}</p>
                  )}
                </div>
                <StatusBadge status={log.status} />
                <span className={`text-xs font-bold ${(log.avg_lag_ms ?? 0) > 200 ? "text-amber-400" : "text-slate-400"}`}>
                  {formatMs(log.avg_lag_ms)}
                </span>
                <span className={`text-xs font-bold ${(log.p95_lag_ms ?? 0) > 500 ? "text-red-400" : "text-slate-400"}`}>
                  {formatMs(log.p95_lag_ms)}
                </span>
                <span className={`text-xs font-bold text-center ${log.long_tasks_1m > 2 ? "text-amber-400" : "text-slate-500"}`}>
                  {log.long_tasks_1m}
                </span>
                <span className={`text-xs font-bold text-center ${log.freezes_1m > 0 ? "text-red-400" : "text-slate-500"}`}>
                  {log.freezes_1m}
                </span>
                <span className="text-[9px] text-slate-600">{timeAgo(log.created_at)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
