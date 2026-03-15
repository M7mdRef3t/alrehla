import type { FC } from "react";
import { mapCopy } from "../copy/map";
import type { GenerationalEchoSnapshot } from "../utils/generationalEcho";

interface GenerationalEchoCardProps {
  snapshot: GenerationalEchoSnapshot;
  onOpenRecoveryPath?: () => void;
}

const toneStyles: Record<
  GenerationalEchoSnapshot["tone"],
  { shell: string; badge: string; item: string; button: string }
> = {
  danger: {
    shell: "bg-rose-50 border-rose-200",
    badge: "bg-rose-600 text-white",
    item: "bg-white/85 border-rose-200",
    button: "bg-rose-600 hover:bg-rose-700 text-white"
  },
  caution: {
    shell: "bg-orange-50 border-orange-200",
    badge: "bg-orange-500 text-white",
    item: "bg-white/85 border-orange-200",
    button: "bg-orange-500 hover:bg-orange-600 text-white"
  }
};

export const GenerationalEchoCard: FC<GenerationalEchoCardProps> = ({
  snapshot,
  onOpenRecoveryPath
}) => {
  const styles = toneStyles[snapshot.tone];

  return (
    <section className={`mb-6 rounded-2xl border p-4 text-right ${styles.shell}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-bold text-slate-700">
          {snapshot.branchLabel}
        </span>
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${styles.badge}`}>
          {snapshot.title}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-slate-700">{snapshot.summary}</p>

      <ul className="mt-4 space-y-2">
        {snapshot.reasons.map((reason) => (
          <li
            key={reason}
            className={`rounded-xl border px-3 py-2 text-sm leading-relaxed text-slate-800 ${styles.item}`}
          >
            {reason}
          </li>
        ))}
      </ul>

      {onOpenRecoveryPath ? (
        <button
          type="button"
          onClick={onOpenRecoveryPath}
          className={`mt-4 w-full rounded-full px-4 py-3 text-sm font-bold transition-colors ${styles.button}`}
        >
          {mapCopy.focusTraumaRecoveryCta}
        </button>
      ) : null}
    </section>
  );
};
