import type { FC } from "react";
import { useState, useEffect, useCallback } from "react";
import { Play, Square } from "lucide-react";

export interface CustomExerciseSpec {
  type: "countdown" | "stopwatch";
  title: string;
  durationSeconds?: number;
}

interface CustomExerciseCardProps {
  spec: CustomExerciseSpec;
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const CustomExerciseCard: FC<CustomExerciseCardProps> = ({ spec }) => {
  const duration = Math.max(0, spec.durationSeconds ?? 60);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(spec.type === "countdown" ? duration : 0);

  const tick = useCallback(() => {
    if (spec.type === "countdown") {
      setSeconds((s) => (s <= 0 ? 0 : s - 1));
    } else {
      setSeconds((s) => s + 1);
    }
  }, [spec.type]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, tick]);

  const display = spec.type === "countdown" ? seconds : seconds;
  const done = spec.type === "countdown" && seconds <= 0 && running;

  return (
    <div className="mt-2 rounded-xl border border-teal-200 bg-teal-50 p-3 max-w-[85%]">
      <p className="text-sm font-medium text-teal-900 mb-2">{spec.title}</p>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-mono font-bold text-teal-700 tabular-nums">
          {formatSeconds(display)}
        </span>
        {!running ? (
          <button
            type="button"
            onClick={() => setRunning(true)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 text-white px-3 py-2 text-sm font-medium hover:bg-teal-700 transition-colors"
            aria-label="ابدأ"
          >
            <Play className="w-4 h-4" />
            ابدأ
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setRunning(false)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-600 text-white px-3 py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
            aria-label="إيقاف"
          >
            <Square className="w-4 h-4" />
            إيقاف
          </button>
        )}
      </div>
      {done && (
        <p className="text-xs text-teal-600 mt-2">تمام! خلصت المدة.</p>
      )}
    </div>
  );
};
