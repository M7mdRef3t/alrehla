import type { FC } from "react";

const LIVE_STATUS = {
  live: { label: "مباشر", color: "text-teal-300", bg: "bg-teal-500/15 border-teal-500/30" },
  fallback: { label: "محلي", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/30" }
} as const;

interface LiveStatusBarProps {
  title: string;
  mode: keyof typeof LIVE_STATUS;
  isLoading: boolean;
  lastUpdatedAt: number | null;
}

export const LiveStatusBar: FC<LiveStatusBarProps> = ({ title, mode, isLoading, lastUpdatedAt }) => (
  <div className="flex items-center justify-between px-1 mb-2">
    <div className="flex items-center gap-2">
      <p className="text-[10px] text-slate-500">{title}</p>
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${LIVE_STATUS[mode].bg} ${LIVE_STATUS[mode].color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${mode === "live" ? "bg-teal-300" : "bg-amber-300"} ${isLoading ? "animate-pulse" : ""}`} />
        {LIVE_STATUS[mode].label}
      </span>
    </div>
    <p className="text-[10px] text-slate-500">
      {isLoading ? "جاري التحديث..." : (lastUpdatedAt ? `آخر تحديث ${new Date(lastUpdatedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}` : "بانتظار أول تحديث")}
    </p>
  </div>
);
