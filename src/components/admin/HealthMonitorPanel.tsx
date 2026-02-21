import { type FC, useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import type { HealthCheckResult, HealthIssue } from "../../ai/autoHealthCheck";
import type { ErrorAnalysisResult } from "../../ai/aiErrorAnalyzer";

export const HealthMonitorPanel: FC = () => {
  const [healthHistory, setHealthHistory] = useState<HealthCheckResult[]>([]);
  const [errorHistory, setErrorHistory] = useState<ErrorAnalysisResult[]>([]);
  const [selectedCheck, setSelectedCheck] = useState<HealthCheckResult | null>(null);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "healthy">("all");

  useEffect(() => {
    const loadData = (): void => {
      try {
        const health = JSON.parse(localStorage.getItem("dawayir-health-history") || "[]") as HealthCheckResult[];
        setHealthHistory(health.slice(-50));

        const rawErrors = JSON.parse(localStorage.getItem("dawayir-error-history") || "[]") as Array<{
          message?: string;
          timestamp?: number;
          severity?: "low" | "medium" | "high" | "critical";
          resolved?: boolean;
        }>;

        const normalizedErrors: ErrorAnalysisResult[] = rawErrors.map((item) => ({
          error: { message: item.message || "Unknown error" },
          analysis: {
            rootCause: item.message || "Unknown root cause",
            severity: item.severity || "low",
            category: "runtime",
            affectedFeatures: [],
          },
          suggestedFixes: [],
          similarErrors: [
            {
              message: item.message || "Unknown error",
              timestamp: item.timestamp || Date.now(),
              resolved: Boolean(item.resolved),
            },
          ],
        }));

        setErrorHistory(normalizedErrors.slice(-20));
      } catch (error) {
        console.error("Failed to load health data:", error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60_000);
    return () => clearInterval(interval);
  }, []);

  const filteredHistory = healthHistory.filter((check) => {
    if (filter === "all") return true;
    return check.status === filter;
  });

  const countByCategory = (issues: HealthIssue[], category: HealthIssue["category"]): number =>
    issues.filter((issue) => issue.category === category).length;

  const stats = {
    total: healthHistory.length,
    healthy: healthHistory.filter((c) => c.status === "healthy").length,
    warning: healthHistory.filter((c) => c.status === "warning").length,
    critical: healthHistory.filter((c) => c.status === "critical").length,
    avgScore: healthHistory.length > 0 ? healthHistory.reduce((sum, c) => sum + c.score, 0) / healthHistory.length : 0,
    lastCheck: healthHistory[healthHistory.length - 1] || null,
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">?????? ??? ??????</h2>
        </div>
        <div className="text-sm text-gray-400">
          ??? ???: {stats.lastCheck ? new Date(stats.lastCheck.timestamp).toLocaleString("ar-EG") : "?? ????"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-sm text-gray-400">?????? ????????</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
          <div className="text-sm text-gray-400">???</div>
          <div className="text-2xl font-bold text-green-400">{stats.healthy}</div>
        </div>
        <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
          <div className="text-sm text-gray-400">?????</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.warning}</div>
        </div>
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
          <div className="text-sm text-gray-400">???</div>
          <div className="text-2xl font-bold text-red-400">{stats.critical}</div>
        </div>
        <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/30">
          <div className="flex items-center gap-2 text-sm text-gray-400"><TrendingUp className="w-4 h-4 text-cyan-400" />????? ??????</div>
          <div className="text-2xl font-bold text-cyan-400">{stats.avgScore.toFixed(0)}</div>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "healthy", "warning", "critical"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === f ? "bg-cyan-500 text-white" : "bg-gray-800/50 text-gray-400"}`}
          >
            {f === "all" ? "????" : f === "healthy" ? "???" : f === "warning" ? "?????" : "???"}
          </button>
        ))}
      </div>

      <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="p-4 border-b border-gray-700/50"><h3 className="text-lg font-bold text-white">??? ????????</h3></div>
        <div className="divide-y divide-gray-700/50 max-h-96 overflow-y-auto">
          {filteredHistory.slice().reverse().map((check, idx) => (
            <div key={idx} onClick={() => setSelectedCheck(check)} className="p-4 hover:bg-gray-700/30 cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-white">???? ?????: {check.score}</span>
                <div className="flex items-center gap-2 text-xs text-gray-400"><Clock className="w-3 h-3" />{new Date(check.timestamp).toLocaleString("ar-EG")}</div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs text-gray-400">
                <div>?????: <span className="text-red-400">{countByCategory(check.issues, "error")}</span></div>
                <div>???????: <span className="text-yellow-400">{countByCategory(check.issues, "data")}</span></div>
                <div>??????: <span className="text-blue-400">{countByCategory(check.issues, "performance")}</span></div>
                <div>??????: <span className="text-purple-400">{countByCategory(check.issues, "state")}</span></div>
              </div>
              {check.autoFixedIssues.length > 0 && <div className="mt-2 text-xs text-green-400">? ?? ????? {check.autoFixedIssues.length} ????? ????????</div>}
            </div>
          ))}
        </div>
      </div>

      {selectedCheck && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700/50 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">?????? ?????</h3>
              <button onClick={() => setSelectedCheck(null)} className="text-gray-400 hover:text-white">?</button>
            </div>
            <div className="p-6 space-y-3">
              <div className="text-white font-bold">??????: {selectedCheck.status}</div>
              <div className="text-white font-bold">??????: {selectedCheck.score}</div>
              {selectedCheck.issues.map((issue, idx) => (
                <div key={idx} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="text-sm text-white">{issue.description}</div>
                  <div className="text-xs text-gray-400">{issue.category} - {issue.severity}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {errorHistory.length > 0 && (
        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="p-4 border-b border-gray-700/50">
            <h3 className="text-lg font-bold text-white">????? ??????? ???????</h3>
          </div>
          <div className="divide-y divide-gray-700/50 max-h-96 overflow-y-auto">
            {errorHistory.slice().reverse().map((error, idx) => (
              <div key={idx} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white">{error.analysis.rootCause}</span>
                  <span className="text-xs text-gray-400">{error.analysis.severity}</span>
                </div>
                {error.analysis.affectedFeatures.length > 0 && (
                  <div className="text-xs text-gray-400">???????: {error.analysis.affectedFeatures.join(", ")}</div>
                )}
                {error.suggestedFixes.length > 0 && (
                  <div className="mt-2 text-xs text-cyan-400">???? ??????: {error.suggestedFixes.length}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {healthHistory.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          ?? ???? ?????? ???.
        </div>
      )}
    </div>
  );
};
