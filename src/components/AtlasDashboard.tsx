import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { X, Thermometer, Network, FlaskConical, TrendingUp, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { useMapState } from "../state/mapState";
import { getSymptomLabel } from "../data/symptoms";
import {
  getPainHeatmapData,
  getSymptomAnatomyData,
  getRecoveryLabData,
  getCollectiveConsciousnessData,
  getAtlasAlerts,
  type RecoveryLabBar
} from "../services/atlasAggregation";

interface AtlasDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const ZONE_COLORS: Record<string, string> = {
  red: "#dc2626",
  yellow: "#eab308",
  green: "#22c55e",
  grey: "#64748b"
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const AtlasDashboard: FC<AtlasDashboardProps> = ({ isOpen, onClose }) => {
  const nodes = useMapState((s) => s.nodes);

  const heatmap = useMemo(() => getPainHeatmapData(nodes), [nodes]);
  const symptomData = useMemo(
    () => getSymptomAnatomyData(nodes, getSymptomLabel),
    [nodes]
  );
  const recoveryData = useMemo(() => getRecoveryLabData(), []);
  const timeSeriesData = useMemo(() => getCollectiveConsciousnessData(), []);
  const alerts = useMemo(() => getAtlasAlerts(), []);

  const roles = ["العيلة", "الشغل", "الحب", "الفلوس والحياة", "غير محدد"];
  const zones = ["أحمر", "أصفر", "أخضر", "رمادي"];
  const maxHeat = useMemo(() => Math.max(1, ...heatmap.map((c) => c.count)), [heatmap]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="لوحة تحكم الأطلس"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            لوحة تحكم الأطلس
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {alerts.length > 0 && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <ul className="text-sm text-amber-900 dark:text-amber-100 space-y-1">
                {alerts.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 1. خريطة الألم الحرارية */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
              <Thermometer className="w-5 h-5 text-red-500" />
              خريطة الألم الحرارية
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              أين يتركز الوجع؟ (دور × منطقة)
            </p>
                <div className="overflow-x-auto">
              <div className="inline-block min-w-[400px]">
                <div className="grid grid-cols-6 gap-1 text-center text-xs">
                  <div className="col-span-1" />
                  {roles.map((r) => (
                    <div
                      key={r}
                      className="font-medium text-slate-600 dark:text-slate-300 truncate"
                      title={r}
                    >
                      {r}
                    </div>
                  ))}
                  {zones.map((zoneLabel) => (
                    <div key={`row-${zoneLabel}`} className="contents">
                      <div className="font-medium text-slate-600 dark:text-slate-300 flex items-center justify-center">
                        {zoneLabel}
                      </div>
                      {roles.map((roleLabel) => {
                        const cell = heatmap.find(
                          (c) => c.zoneLabel === zoneLabel && c.roleLabel === roleLabel
                        );
                        const count = cell?.count ?? 0;
                        const zoneKey = cell?.zone ?? "grey";
                        const color = ZONE_COLORS[zoneKey] ?? "#64748b";
                        const opacity =
                          count === 0
                            ? 0.12
                            : maxHeat > 0
                              ? 0.3 + (count / maxHeat) * 0.7
                              : 0.3;
                        const bgColor =
                          count === 0
                            ? "rgba(148,163,184,0.2)"
                            : hexToRgba(color, opacity);
                        return (
                          <div
                            key={`${zoneLabel}-${roleLabel}`}
                            className="rounded-md flex items-center justify-center min-h-[36px] text-slate-800 dark:text-slate-200 font-medium"
                            style={{ backgroundColor: bgColor }}
                            title={`${count}`}
                          >
                            {count > 0 ? count : "—"}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>أحمر = أزمة، أصفر = حدود، أخضر = أمان، رمادي = فك ارتباط</span>
            </div>
          </section>

          {/* 2. تشريح الأعراض */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
              <Network className="w-5 h-5 text-violet-500" />
              تشريح الأعراض
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              شكل الوجع إيه؟ (عرض × دور)
            </p>
            {symptomData.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
                لا توجد بيانات أعراض مجمّعة بعد.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <BarChart
                    data={symptomData.slice(0, 20).map((d) => ({
                      name: `${d.symptomLabel} (${d.roleLabel})`,
                      count: d.count,
                      role: d.roleLabel
                    }))}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 80, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                    <XAxis type="number" fontSize={11} />
                    <YAxis type="category" dataKey="name" width={78} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="عدد" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* 3. مختبر التعافي */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
              <FlaskConical className="w-5 h-5 text-teal-500" />
              مختبر التعافي
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              إيه اللي بيعالج الناس فعلاً؟ (معدل إكمال المسارات)
            </p>
            {recoveryData.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
                لا توجد بيانات مسارات بعد.
              </p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <BarChart
                    data={recoveryData}
                    margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                    <XAxis dataKey="pathLabel" fontSize={11} tick={{ fontSize: 10 }} />
                    <YAxis fontSize={11} unit="%" domain={[0, 100]} />
                    <Tooltip
                      formatter={(value: number | string | null | undefined, _name: string, props: { payload?: RecoveryLabBar }) => [`${props?.payload?.completionRate ?? Number(value ?? 0)}%`,
                        "معدل الإكمال"
                      ]}
                      labelFormatter={(_label: string, payload: Array<{ payload?: RecoveryLabBar }> | undefined) =>
                        payload?.[0]?.payload?.pathLabel
                          ? `${payload[0].payload.pathLabel} — بدايات: ${payload[0].payload.starts}`
                          : ""
                      }
                    />
                    <Bar dataKey="completionRate" fill="#14b8a6" radius={[4, 4, 0, 0]} name="معدل الإكمال %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* 4. مؤشر الوعي الجماعي */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
              <TrendingUp className="w-5 h-5 text-sky-500" />
              مؤشر الوعي الجماعي
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              النشاط مع الوقت (بدء مسارات، مهام مكتملة، أشخاص مضافون)
            </p>
            {timeSeriesData.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
                لا توجد بيانات زمنية بعد.
              </p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <LineChart
                    data={timeSeriesData.map((d) => ({
                      ...d,
                      dateShort: d.date.slice(5)
                    }))}
                    margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                    <XAxis dataKey="dateShort" fontSize={10} />
                    <YAxis fontSize={11} />
                    <Tooltip
                      labelFormatter={(
                        _label: string,
                        payload: Array<{ payload?: { date?: string } }> | undefined
                      ) => payload?.[0]?.payload?.date ?? ""}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="pathStarts"
                      stroke="#0ea5e9"
                      name="بدء مسار"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="taskCompletions"
                      stroke="#22c55e"
                      name="مهام مكتملة"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="nodesAdded"
                      stroke="#8b5cf6"
                      name="أشخاص مضافون"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center pb-4">
            كل البيانات مجمّعة بدون هوية. لا أسماء ولا محتوى خام.
          </p>
        </div>
      </motion.div>
    </div>
  );
};


