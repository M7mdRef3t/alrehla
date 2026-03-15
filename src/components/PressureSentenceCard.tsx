import type { FC } from "react";
import { useState } from "react";
import type { PressureSentenceSnapshot } from "../utils/pressureSentence";

interface PressureSentenceCardProps {
  snapshot: PressureSentenceSnapshot;
}

const toneStyles: Record<
  PressureSentenceSnapshot["tone"],
  { shell: string; badge: string; sentence: string }
> = {
  danger: {
    shell: "bg-rose-50 border-rose-200",
    badge: "bg-rose-600 text-white",
    sentence: "bg-white/90 border-rose-200"
  },
  caution: {
    shell: "bg-amber-50 border-amber-200",
    badge: "bg-amber-500 text-white",
    sentence: "bg-white/90 border-amber-200"
  },
  steady: {
    shell: "bg-slate-100 border-slate-200",
    badge: "bg-slate-700 text-white",
    sentence: "bg-white/90 border-slate-200"
  }
};

export const PressureSentenceCard: FC<PressureSentenceCardProps> = ({ snapshot }) => {
  const [copied, setCopied] = useState(false);
  const styles = toneStyles[snapshot.tone];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snapshot.copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className={`mb-6 rounded-2xl border p-4 text-right ${styles.shell}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-bold text-slate-700 hover:bg-white"
        >
          {copied ? "تم النسخ" : "نسخ الجملة"}
        </button>
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${styles.badge}`}>
          {snapshot.sourceLabel}
        </span>
      </div>

      <h3 className="text-sm font-bold text-slate-900">{snapshot.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        {snapshot.summary}
      </p>

      <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-relaxed text-slate-900 ${styles.sentence}`}>
        {snapshot.sentence}
      </div>
    </section>
  );
}
