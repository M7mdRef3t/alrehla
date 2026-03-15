import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEmergencyState } from "../state/emergencyState";
import { useMapState } from "../state/mapState";
import { usePulseState } from "../state/pulseState";
import { emergencyCopy } from "../copy/emergency";
import { EditableText } from "./EditableText";
import { derivePowerBankNetwork } from "../utils/powerBankNetwork";

export interface EmergencyOverlayProps {
  onStartBreathing?: () => void;
  onStartScenario?: () => void;
  onOpenPowerBank?: (nodeId: string) => void;
}

export const EmergencyOverlay: FC<EmergencyOverlayProps> = ({
  onStartBreathing,
  onStartScenario,
  onOpenPowerBank
}) => {
  const close = useEmergencyState((s) => s.close);
  const context = useEmergencyState((s) => s.context);
  const nodes = useMapState((s) => s.nodes);
  const pulseEnergy = usePulseState((s) => s.lastPulse?.energy ?? null);
  const powerBankNetwork = useMemo(
    () => derivePowerBankNetwork(nodes, context, pulseEnergy),
    [context, nodes, pulseEnergy]
  );

  const handleBreathing = () => {
    onStartBreathing?.();
    close();
  };

  const handleScenario = () => {
    onStartScenario?.();
    close();
  };

  const handleOpenPowerBank = (nodeId: string) => {
    onOpenPowerBank?.(nodeId);
    close();
  };

  const showRoomActions = onStartBreathing != null || onStartScenario != null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/90 px-4 backdrop-blur-lg"
      onClick={close}
      aria-labelledby="emergency-title"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="relative w-full max-w-md bg-transparent text-center"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={close}
          className="absolute -top-12 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="emergency-title" className="mb-6 text-4xl font-bold text-white md:text-5xl">
          <EditableText id="emergency_room_title" defaultText="غرفة الطوارئ" page="emergency" showEditIcon={false} />
        </h2>

        <p className="mb-10 text-lg leading-relaxed text-white/90 md:text-xl">
          <EditableText id="emergency_title" defaultText={emergencyCopy.title} page="emergency" multiline showEditIcon={false} />
        </p>

        {context?.source === "person" ? (
          <div className="mb-8 rounded-2xl border border-rose-300/30 bg-white/10 p-4 text-right">
            <p className="mb-2 text-sm font-bold text-rose-200">
              {context.title ?? `لو ${context.personLabel} فتحك دلوقتي...`}
            </p>
            {context.body ? (
              <p className="mb-3 text-sm leading-relaxed text-white/80">{context.body}</p>
            ) : null}
            {context.reasons && context.reasons.length > 0 ? (
              <div className="flex flex-wrap justify-end gap-2">
                {context.reasons.map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {powerBankNetwork ? (
          <section className="mb-8 rounded-2xl border border-teal-400/25 bg-teal-500/10 p-4 text-right shadow-[0_0_20px_rgba(20,184,166,0.12)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="rounded-full bg-teal-400 px-3 py-1 text-[11px] font-bold text-slate-950">
                {powerBankNetwork.totalAnchors} مراسي جاهزة
              </span>
              <h3 className="text-sm font-bold text-teal-100">{powerBankNetwork.title}</h3>
            </div>

            <p className="text-sm leading-relaxed text-white/85">{powerBankNetwork.summary}</p>

            {powerBankNetwork.bestMatch ? (
              <div className="mt-4 rounded-2xl border border-teal-400/30 bg-black/20 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white">
                    المرساة الأولى
                  </span>
                  <span className="text-xs font-semibold text-teal-200">
                    {powerBankNetwork.bestMatch.score}% ملاءمة
                  </span>
                </div>

                <p className="text-sm font-bold text-white">{powerBankNetwork.bestMatch.headline}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  {powerBankNetwork.bestMatch.summary}
                </p>

                <ul className="mt-3 space-y-2">
                  {powerBankNetwork.bestMatch.reasons.map((reason) => (
                    <li
                      key={reason}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed text-white/80"
                    >
                      {reason}
                    </li>
                  ))}
                </ul>

                {onOpenPowerBank ? (
                  <button
                    type="button"
                    onClick={() => handleOpenPowerBank(powerBankNetwork.bestMatch!.nodeId)}
                    className="mt-4 w-full rounded-full bg-teal-400 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-teal-300"
                  >
                    افتح {powerBankNetwork.bestMatch.label}
                  </button>
                ) : null}
              </div>
            ) : null}

            {powerBankNetwork.backupMatches.length > 0 ? (
              <div className="mt-4 space-y-2">
                {powerBankNetwork.backupMatches.map((item) => (
                  <button
                    key={item.nodeId}
                    type="button"
                    onClick={() => handleOpenPowerBank(item.nodeId)}
                    disabled={!onOpenPowerBank}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-right transition-colors enabled:hover:bg-white/10 disabled:cursor-default"
                  >
                    <span className="text-xs font-semibold text-teal-200">{item.score}%</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{item.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/70">{item.summary}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {showRoomActions ? (
          <div className="mb-10 flex flex-col gap-4">
            {onStartBreathing ? (
              <button
                type="button"
                className="w-full rounded-2xl bg-rose-500 px-8 py-5 text-lg font-semibold text-white transition-all duration-200 hover:bg-rose-600 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-red-950"
                onClick={handleBreathing}
                aria-label="تمرين تنفس دقيقة"
              >
                <EditableText
                  id="emergency_breathing_cta"
                  defaultText="تمرين تنفس (دقيقة)"
                  page="emergency"
                  editOnClick={false}
                />
              </button>
            ) : null}
            {onStartScenario ? (
              <button
                type="button"
                className="w-full rounded-2xl border-2 border-white/40 bg-white/15 px-8 py-5 text-lg font-semibold text-white transition-all duration-200 hover:bg-white/25 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-red-950"
                onClick={handleScenario}
                aria-label="سيناريو رد احترافي"
              >
                <EditableText
                  id="emergency_scenario_cta"
                  defaultText="سيناريو رد احترافي"
                  page="emergency"
                  editOnClick={false}
                />
              </button>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          className="rounded-full bg-rose-400 px-10 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-rose-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-red-950"
          onClick={close}
          title="خروج هادئ"
          aria-label="خروج هادئ"
        >
          <EditableText id="emergency_exit" defaultText={emergencyCopy.exit} page="emergency" editOnClick={false} />
        </button>

        {emergencyCopy.supportLines.length > 0 ? (
          <div className="mt-8 border-t border-white/20 pt-8 text-right">
            <h3 className="mb-3 text-lg font-semibold text-white">
              <EditableText id="emergency_support_title" defaultText={emergencyCopy.supportTitle} page="emergency" showEditIcon={false} />
            </h3>
            <ul className="space-y-3">
              {emergencyCopy.supportLines.map((line, i) => (
                <li key={line.phone} className="text-sm text-white/90">
                  <span className="font-medium">
                    <EditableText
                      id={`emergency_support_${i + 1}_name`}
                      defaultText={line.name}
                      page="emergency"
                      showEditIcon={false}
                    />
                  </span>
                  {" - "}
                  <a href={`tel:${line.phone}`} className="text-teal-300 underline hover:text-teal-200">
                    {line.phone}
                  </a>
                  <span className="mt-0.5 block text-xs text-white/70">
                    <EditableText
                      id={`emergency_support_${i + 1}_desc`}
                      defaultText={line.description}
                      page="emergency"
                      multiline
                      showEditIcon={false}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};
