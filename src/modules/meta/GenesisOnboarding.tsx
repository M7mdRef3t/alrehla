import { useMemo, useState } from "react";
import { DndContext, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { useKineticSensors } from "@/hooks/useKineticSensors";
import { supabase } from "@/services/supabaseClient";
import { isPublicPaymentsEnabled } from "@/config/payments";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";

interface GenesisOnboardingProps {
  userId: string;
  onCompleted: () => void;
}

function buildReactionText(velocity: number, hesitationMs: number): string {
  if (velocity >= 900) return "ألقيت به باندفاع.. واضح إن الحمل ضاغط عليك بقوة.";
  if (hesitationMs >= 1600) return "التردد واضح.. أنت تشيل الكثير قبل أن تتركه.";
  return "خطوتك متزنة.. بدأنا نرى شكل الحمل الحقيقي بوضوح.";
}

function DraggableLoad() {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: "genesis-load" });
  const style = {
    transform: CSS.Translate.toString(transform),
    touchAction: "none" as const,
    cursor: isDragging ? "grabbing" : "grab"
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      type="button"
      className="w-28 h-28 rounded-full border border-white/20 text-sm font-bold text-white bg-white/10 backdrop-blur-md shadow-[0_0_32px_rgba(255,255,255,0.08)]"
      aria-label="حملك الحالي"
    >
      حِملك الحالي
    </button>
  );
}

function DropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "genesis-dropzone" });
  return (
    <div
      ref={setNodeRef}
      className={`w-full max-w-sm h-28 rounded-2xl border-2 border-dashed transition-colors ${isOver ? "border-teal-400 bg-teal-400/10" : "border-white/20 bg-white/5"}`}
    >
      <div className="h-full w-full flex items-center justify-center text-sm text-slate-300">
        أفلت الحمل هنا
      </div>
    </div>
  );
}

export function GenesisOnboarding({ userId, onCompleted }: GenesisOnboardingProps) {
  const { onDragStart, onDragMove, onDragEnd } = useKineticSensors();
  const [reaction, setReaction] = useState<string | null>(null);
  const [dropped, setDropped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { distance: 5 } });
  const sensors = useSensors(mouseSensor, touchSensor);
  const openOverlay = useAppOverlayState((s) => s.openOverlay);

  const title = useMemo(
    () => (dropped ? "رصدنا الإشارة الأولى." : "قبل أي خريطة.. ابدأ بالحمل."),
    [dropped]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const snapshot = onDragEnd(event);
    if (String(event.over?.id ?? "") !== "genesis-dropzone") return;
    if (!snapshot) return;

    setDropped(true);
    setReaction(buildReactionText(snapshot.velocityPxPerSec, snapshot.hesitationMs));
    console.warn("[GenesisFlow] drop_captured", {
      userId,
      velocityPxPerSec: snapshot.velocityPxPerSec,
      hesitationMs: snapshot.hesitationMs,
      profile: snapshot.profile
    });
  };

  const markOnboardedAndEnter = async () => {
    if (!supabase) {
      setError("Supabase غير متاح حالياً.");
      return;
    }

    setSaving(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("mark_user_onboarded", { p_user_id: userId });
    setSaving(false);

    if (rpcError || !data) {
      setError(rpcError?.message || "تعذر تأكيد بداية الرحلة.");
      return;
    }

    const tokenReset = await supabase
      .from("profiles")
      .update({ awareness_tokens: 0 })
      .eq("id", userId);
    if (tokenReset.error) {
      console.warn("[GenesisFlow] awareness_tokens_reset_failed", { userId, error: tokenReset.error.message });
    }

    localStorage.setItem("dawayir-journey-onboarding-done", "true");
    localStorage.setItem("dawayir-onboarding-map-seen", "true");
    console.warn("[GenesisFlow] onboarding_marked", { userId, awarenessTokens: 0 });
    onCompleted();
  };

  const handleActivation = () => {
    if (!isPublicPaymentsEnabled) return;
    openOverlay("premiumBridge");
  };

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-xl">
      <div className="h-full w-full flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center"
        >
          <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-300 mb-4">بداية الرحلة</p>
          <h2 className="text-2xl font-black text-white mb-2">{title}</h2>
          <p className="text-sm text-slate-400 mb-8">اسحب الدائرة إلى منطقة الإفلات. هذه أول بصمة وعي في رحلتك.</p>

          <DndContext sensors={sensors} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={handleDragEnd}>
            <div className="flex flex-col items-center gap-8">
              <DraggableLoad />
              <DropZone />
            </div>
          </DndContext>

          {reaction && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 text-sm font-semibold text-amber-200"
            >
              {reaction}
            </motion.p>
          )}

          {error && <p className="mt-4 text-xs text-rose-300">{error}</p>}

          {dropped && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              {isPublicPaymentsEnabled && (
                <button
                  type="button"
                  onClick={handleActivation}
                  className="px-6 py-3 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors"
                >
                  افتح المسار المتقدم
                </button>
              )}
              <button
                type="button"
                onClick={markOnboardedAndEnter}
                disabled={saving}
                className="px-6 py-3 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition-colors disabled:opacity-60"
              >
                {saving ? "جارٍ التثبيت..." : "سأستكشف خريطتي بنفسي"}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
