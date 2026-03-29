"use client";

import type { FC } from "react";
import { useState, useCallback, useEffect, useRef, memo, useTransition } from "react";
import { motion } from "framer-motion";

const ONBOARDING_STYLES = `
@keyframes ob-ring-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
@keyframes ob-center-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
@keyframes ob-icon-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}
.ob-step-enter {
  opacity: 1; transform: translateX(0);
  transition: opacity 0.32s ease-out, transform 0.32s ease-out;
}
.ob-step-exit {
  opacity: 0; transform: translateX(40px);
  transition: opacity 0.2s ease-in, transform 0.2s ease-in;
  pointer-events: none; position: absolute; inset: 0;
}
.ob-btn-tap:active { transform: scale(0.97); }

/* Force dark-mode variables inside onboarding regardless of theme */
.ob-dark-force {
  --color-primary-soft: rgba(10, 14, 31, 0.95);
  --glass-bg: rgba(12, 17, 40, 0.78);
  --glass-bg-hover: rgba(15, 22, 50, 0.88);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-border-hover: rgba(255, 255, 255, 0.18);
  --text-primary: #ffffff;
  --text-secondary: rgba(203, 213, 225, 0.95);
  --text-muted: rgba(148, 163, 184, 0.7);
  --text-accent: #2dd4bf;
  --soft-teal: #2dd4bf;
  --soft-teal-dim: rgba(45, 212, 191, 0.12);
  --soft-teal-glow: rgba(45, 212, 191, 0.25);
}
`;
import { useMapState } from "../state/mapState";
import { setInLocalStorage } from "../services/browserStorage";
import { recordFlowEvent } from "../services/journeyTracking";
import { AnalyticsEvents, trackCompleteRegistration, trackEvent, trackLead } from "../services/analytics";
import { FirstSparkOnboarding } from "./FirstSparkOnboarding";
import { AlertTriangle, CheckCircle2, ShieldCheck, Mail, ArrowRight, Sparkles, Layout, Zap } from "lucide-react";
import { signInWithMagicLink } from "../services/authService";
import { sendRecoveryPlanEmail } from "../services/emailService";
import { getStoredLeadAttribution } from "../services/marketingAttribution";
import type { AdviceCategory } from "../data/adviceScripts";
import { enableNotificationsWithPrompt, getNotificationPermission } from "../services/pushNotifications";

/* ════════════════════════════════════════════════
   ONBOARDING FLOW — 3 خطوات للرحلة
   بص جواك → حط كل حد في مكانه → شوف الصورة
   ════════════════════════════════════════════════ */

const ONBOARDING_KEY = "dawayir-journey-onboarding-done";
const ONBOARDING_COMPLETION_SESSION_KEY = "dawayir-onboarding-completed-session";

/* eslint-disable react-refresh/only-export-components */
export function markJourneyOnboardingDone(): void {
  setInLocalStorage(ONBOARDING_KEY, "true");
}

export function resetJourneyOnboarding(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ONBOARDING_KEY);
  }
}

export function hasCompletedJourneyOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}
/* eslint-enable react-refresh/only-export-components */

interface OnboardingFlowProps {
  onComplete: (skipped?: boolean) => void;
}


/* ── Slide transition removed: now CSS-only (see ONBOARDING_STYLES) ── */

/* ── Ring colors ── */
type Ring = "green" | "yellow" | "red";

const RING_COLORS: Record<Ring, { bg: string; border: string; label: string; labelAr: string }> = {
  green: { bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.5)", label: "green", labelAr: "قريب" },
  yellow: { bg: "rgba(251,191,36,0.15)", border: "rgba(251,191,36,0.5)", label: "yellow", labelAr: "متذبذب" },
  red: { bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.5)", label: "red", labelAr: "بعيد" },
};



/* ── Step 1: Inventory ── */
const StepInventory: FC<{
  onNext: (items: { name: string; category: AdviceCategory }[]) => void;
  onSkip: () => void;
}> = memo(({ onNext, onSkip }) => {
  // Use refs for input values to avoid re-rendering the entire tree on each keystroke
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);
  const [categories, setCategories] = useState<AdviceCategory[]>(["family", "family", "family"]);
  // Track which inputs have text (for UI updates like border color and category buttons)
  const [hasText, setHasText] = useState<boolean[]>([false, false, false]);
  // Track if at least one field is filled for the button state
  const [canContinue, setCanContinue] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncHasText = useCallback(() => {
    // Debounce: only trigger React state update after 200ms of inactivity
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const newHasText = inputRefs.current.map((ref) => (ref?.value?.trim()?.length ?? 0) > 0);
      setHasText(newHasText);
      setCanContinue(newHasText.some(Boolean));
    }, 200);
  }, []);

  const updateCategory = useCallback((i: number, cat: AdviceCategory) => {
    setCategories((prev) => {
      const n = [...prev];
      n[i] = cat;
      return n;
    });
  }, []);

  const handleNext = useCallback(() => {
    const items = inputRefs.current
      .map((ref, i) => ({
        name: ref?.value?.trim() ?? "",
        category: categories[i],
      }))
      .filter((item) => item.name.length > 0);
    onNext(items);
  }, [categories, onNext]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Illustration */}
      <div className="flex justify-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(45,212,191,0.12), rgba(139,92,246,0.12))",
            border: "1.5px solid rgba(45,212,191,0.25)",
            animation: "ob-icon-breathe 3s ease-in-out infinite",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(45,212,191,0.8)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          بص جواك
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          قبل ما نرسم، فكّر في أكتر 3 أشخاص واخدين مساحة من تفكيرك النهاردة.. سواء بالسلب أو الإيجاب.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-2 p-2 rounded-2xl"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
          >
            <input
              type="text"
              ref={(el) => { inputRefs.current[i] = el; }}
              defaultValue=""
              onInput={syncHasText}
              placeholder={i === 0 ? "الاسم الأول.." : i === 1 ? "الاسم الثاني.." : "الاسم الثالث (اختياري).."}
              className="w-full rounded-xl px-4 py-2 text-sm text-right outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1.5px solid ${hasText[i] ? "rgba(45,212,191,0.4)" : "var(--glass-border)"}`,
                color: "var(--text-primary)",
              }}
              maxLength={30}
              dir="rtl"
            />
            {hasText[i] && (
              <div className="flex gap-1 justify-end items-center">
                <span className="text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>ده يقربلك إيه؟</span>
                {(["family", "work", "general"] as AdviceCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateCategory(i, cat)}
                    className="px-3 py-1 rounded-full text-[10px] font-bold transition-all"
                    style={{
                      background: categories[i] === cat ? "rgba(45,212,191,0.2)" : "transparent",
                      border: `1px solid ${categories[i] === cat ? "rgba(45,212,191,0.5)" : "rgba(255,255,255,0.1)"}`,
                      color: categories[i] === cat ? "var(--soft-teal)" : "var(--text-muted)"
                    }}
                  >
                    {cat === "family" ? "عيلة" : cat === "work" ? "شغل" : "تاني"}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={!canContinue}
        className="w-full rounded-2xl py-3.5 text-sm font-bold transition-all ob-btn-tap"
        style={{
          background: canContinue ? "var(--soft-teal)" : "var(--glass-border)",
          color: canContinue ? "var(--space-void)" : "var(--text-muted)",
          cursor: canContinue ? "pointer" : "not-allowed",
        }}
      >
        يلا نكمل →
      </button>

      <button
        type="button"
        onClick={onSkip}
        className="text-center text-xs transition-colors"
        style={{ color: "var(--text-muted)" }}
      >
        تخطي
      </button>
    </div>
  );
});

/* ── Step 2: Mapping (drag-drop simulation) ── */
interface NameCard { name: string; category: AdviceCategory; ring: Ring | null; placed: boolean }

const StepMapping: FC<{
  items: { name: string; category: AdviceCategory }[];
  onNext: (mapped: NameCard[]) => void;
  onSkip: () => void;
}> = ({ items, onNext, onSkip }) => {
  const [cards, setCards] = useState<NameCard[]>(
    items.map((item) => ({ ...item, ring: null, placed: false }))
  );
  const [dragging, setDragging] = useState<number | null>(null);
  const [firstPlaced, setFirstPlaced] = useState(false);

  const handleDrop = (ring: Ring, e: React.DragEvent) => {
    e.preventDefault();
    if (dragging === null) return;
    setCards((prev) =>
      prev.map((c, i) =>
        i === dragging ? { ...c, ring, placed: true } : c
      )
    );
    if (!firstPlaced) setFirstPlaced(true);
    setDragging(null);
  };

  const handleRingClick = (cardIdx: number, ring: Ring) => {
    setCards((prev) =>
      prev.map((c, i) =>
        i === cardIdx ? { ...c, ring, placed: true } : c
      )
    );
    if (!firstPlaced) setFirstPlaced(true);
  };

  const allPlaced = cards.every((c) => c.placed);

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="text-center">
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          حط كل حد في مكانه
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          اختار لكل اسم مداره.. القريب للقلب في النص، والبعيد في المدارات الخارجية.
        </p>
      </div>

      {/* Ring drop zones */}
      <div className="flex flex-col gap-2">
        {(["green", "yellow", "red"] as Ring[]).map((ring) => {
          const conf = RING_COLORS[ring];
          const placedHere = cards.filter((c) => c.ring === ring);
          return (
            <div
              key={ring}
              className="rounded-2xl px-4 py-3 flex items-center gap-3 transition-all"
              style={{ background: conf.bg, border: `1.5px solid ${conf.border}`, minHeight: 56 }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(ring, e)}
            >
              <span className="text-xs font-semibold w-16 text-right shrink-0" style={{ color: conf.border }}>
                {conf.labelAr}
              </span>
              <div className="flex gap-2 flex-wrap flex-1">
                {placedHere.map((c) => (
                  <span
                    key={c.name}
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: conf.border, color: "#0f172a" }}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Name cards — unplaced */}
      <div className="flex flex-wrap gap-2 justify-center min-h-[40px]">
        {cards.map((c, i) =>
          !c.placed ? (
            <div
              key={c.name}
              className="px-4 py-2 rounded-full text-sm font-semibold cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-105 active:scale-95"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "var(--text-primary)",
              }}
              draggable
              onDragStart={() => setDragging(i)}
              onDragEnd={() => setDragging(null)}
            >
              {c.name}
            </div>
          ) : null
        )}
      </div>

      {/* Tap to place fallback (mobile) */}
      {!allPlaced && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>
            أو اضغط على الاسم واختار مداره
          </p>
          {cards.map((c, i) =>
            !c.placed ? (
              <div key={c.name} className="flex items-center gap-2 justify-center">
                <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {c.name}:
                </span>
                {(["green", "yellow", "red"] as Ring[]).map((ring) => (
                  <button
                    key={ring}
                    type="button"
                    onClick={() => handleRingClick(i, ring)}
                    className="text-[11px] font-bold px-3 py-1 rounded-full transition-all"
                    style={{
                      background: RING_COLORS[ring].bg,
                      border: `1px solid ${RING_COLORS[ring].border}`,
                      color: RING_COLORS[ring].border,
                    }}
                  >
                    {RING_COLORS[ring].labelAr}
                  </button>
                ))}
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Encouragement after first placement */}
      {firstPlaced && !allPlaced && (
        <p
          className="text-center text-xs transition-opacity duration-300"
          style={{ color: "rgba(45,212,191,0.7)" }}
        >
          بالظبط كدة.. إنت اللي بتحدد المساحة.
        </p>
      )}

      <button
        type="button"
        onClick={() => onNext(cards)}
        disabled={!allPlaced}
        className="w-full rounded-2xl py-3.5 text-sm font-bold transition-all ob-btn-tap"
        style={{
          background: allPlaced ? "rgba(45,212,191,0.9)" : "rgba(255,255,255,0.05)",
          color: allPlaced ? "#0f172a" : "rgba(255,255,255,0.25)",
          cursor: allPlaced ? "pointer" : "not-allowed",
        }}
      >
        شوف الصورة →
      </button>

      <button type="button" onClick={onSkip} className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
        تخطي
      </button>
    </div>
  );
};

/* ── Step 3: Insight ── */
const StepInsight: FC<{ items: { name: string; category: AdviceCategory }[]; onComplete: () => void; onSkip: () => void }> = ({ items, onComplete, onSkip }) => {
  const count = items.length;
  const names = items.map(i => i.name);

  return (
    <div className="flex flex-col gap-6 w-full items-center text-center">

      {/* Animated map glow - CSS animations (no JS blocking) */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        {[44, 68, 88].map((r, i) => (
          <div
            key={r}
            className="absolute rounded-full"
            style={{
              width: r,
              height: r,
              border: `1px solid rgba(45,212,191,${0.35 - i * 0.08})`,
              animation: `ob-ring-pulse ${2.5 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`,
            }}
          />
        ))}
        {/* Center pulse */}
        <div
          className="rounded-full"
          style={{ width: 18, height: 18, background: "rgba(45,212,191,0.9)", boxShadow: "0 0 24px rgba(45,212,191,0.5)", animation: "ob-center-pulse 2s ease-in-out infinite" }}
        />
        {/* Node dots around center */}
        {names.slice(0, 3).map((_, i) => {
          const angle = (i / 3) * 2 * Math.PI - Math.PI / 2;
          const r = 34;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 10, height: 10,
                background: ["rgba(52,211,153,0.9)", "rgba(251,191,36,0.9)", "rgba(248,113,113,0.9)"][i],
                left: 60 + Math.cos(angle) * r - 5,
                top: 60 + Math.sin(angle) * r - 5,
                boxShadow: `0 0 10px ${["rgba(52,211,153,0.5)", "rgba(251,191,36,0.5)", "rgba(248,113,113,0.5)"][i]}`,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 200, damping: 15 }}
            />
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          مبروك.. دي أول خريطة لوعيك
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {count === 1
            ? `حطيت ${names[0]} في مداره.`
            : count === 2
              ? `حطيت ${names[0]} و${names[1]} في مداراتهم.`
              : `حطيت ${names[0]}، ${names[1]}، و${names[2]} في مداراتهم.`}
          {" "}مش محتاجة تكون مثالية، المهم إنها حقيقية.
        </p>
      </div>

      <div
        className="w-full rounded-2xl p-4"
        style={{
          background: "linear-gradient(135deg, rgba(45,212,191,0.06), rgba(139,92,246,0.06))",
          border: "1px solid rgba(45,212,191,0.2)",
        }}
      >
        <p className="text-sm leading-relaxed" style={{ color: "rgba(45,212,191,0.85)" }}>
          "التعافي مش سحر، هو إنك بقيت شايف خريطتك بوضوح."
        </p>
      </div>

      <div
        className="w-full rounded-2xl p-4 border border-rose-500/20 bg-rose-950/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
        <p className="text-xs font-bold text-rose-400 mb-1 flex items-center gap-1 justify-center">
          <AlertTriangle className="w-4 h-4" />
          سر الدواير (The Aha Moment)
        </p>
        <p className="text-[13px] text-slate-300 leading-relaxed mt-2">
          علاقاتك اللي بتستنزفك مش بس أسماء، دي بتتحول لـ <span className="text-rose-400 font-bold">ثقوب سوداء</span> مرئية تسحب طاقتك بانقباض مستمر.. إحنا هنا عشان نوقّف النزيف ده.
        </p>
      </div>

      <button
        type="button"
        onClick={onComplete}
        className="w-full rounded-2xl py-3.5 text-sm font-bold ob-btn-tap hover:brightness-110 transition-all"
        style={{ background: "rgba(45,212,191,0.9)", color: "#0f172a" }}
      >
        أنطلق لرحلتك ←
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSkip();
        }}
        className="text-center text-xs transition-colors hover:text-slate-300 cursor-pointer"
        style={{ color: "var(--text-muted)" }}
      >
        تخطي
      </button>

      <p className="text-[11px]" style={{ color: "rgba(148,163,184,0.5)" }}>
        متقلقش، مفيش إجابة غلط.. دي خريطتك إنت.
      </p>

    </div>
  );
};


/* ── Step 4: Contact Capture ── */
const StepContactCapture: FC<{ onComplete: (email: string, whatsapp: string) => void; onSkip: () => void }> = ({ onComplete, onSkip }) => {
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email && !whatsapp) {
      setError("يا ريت تسيب وسيلة تواصل واحدة على الأقل عشان نبعتلك الخطة.");
      return;
    }
    setLoading(true);
    try {
      await onComplete(email, whatsapp);
    } catch (err) {
      setError("حصلت مشكلة. جرب تاني.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2 text-white">
          احفظ خريطتك وابدأ رحلة التعافي
        </h2>
        <p className="text-sm leading-relaxed text-slate-400">
          عشان تحفظ خريطتك وبصيرة النهاردة، سجل وسيلة تواصل نبعتلك عليها "روشتة الدواير" ونحفظ تقدمك.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold pr-2 text-slate-500 uppercase tracking-widest">الإيميل</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@mail.com"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)", color: "var(--text-primary)" }}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold pr-2 text-slate-500 uppercase tracking-widest">رقم الواتساب (اختياري)</label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="01xxxxxxxxx"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)", color: "var(--text-primary)" }}
            dir="ltr"
          />
        </div>

        {error && <p className="text-[10px] text-rose-400 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl py-3.5 mt-2 text-sm font-bold ob-btn-tap hover:brightness-110 transition-all flex items-center justify-center gap-2"
          style={{ background: "var(--soft-teal)", color: "#0f172a" }}
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-[#0f172a]/30 border-t-[#0f172a] rounded-full animate-spin" />
              <span>جاري تحضير الروشتة...</span>
            </div>
          ) : (
            <>
              حفظ وتفعيل الرحلة
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={onSkip}
        className="text-center text-[11px] text-slate-400 hover:text-white transition-colors"
      >
        تخطي للآن (كدخول ضيف)
      </button>

      <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-400/70" />
        <span className="text-[10px] text-slate-400">بياناتك مشفرة ومحمية بالكامل</span>
      </div>
    </div>
  );
};

/* ── Step 5: Recovery Plan Preview ── */
const StepRecoveryPlanPreview: FC<{
  collectedItems: { name: string; category: AdviceCategory }[];
  onComplete: () => void;
}> = ({ collectedItems, onComplete }) => {
  return (
    <div className="flex flex-col gap-6 w-full py-2">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 mb-2">
          <Sparkles className="w-6 h-6 text-teal-400" />
        </div>
        <h2 className="text-xl font-bold text-white">خطتك الشخصية جاهزة!</h2>
        <p className="text-sm text-slate-400">
          تم تحليل خريطتك وبناء "روشتة الدواير" الخاصة بك.
        </p>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Layout className="w-3.5 h-3.5" />
            ملخص بصيرتك
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">علاقات تم رصدها</span>
              <span className="text-white font-mono">{collectedItems.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">مستوى الوضوح</span>
              <span className="text-teal-400 font-bold">عالٍ جداً</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 space-y-3">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            الخطوة الأولى المقترحة
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            ابدأ بتفعيل "درع الدواير" للأشخاص في الدائرة الحمراء لتقليل الضجيج العاطفي فوراً.
          </p>
        </div>
      </div>

      <div className="text-center space-y-4 pt-2">
        <button
          onClick={onComplete}
          id="ob-plan-preview-safe-haven"
          className="w-full rounded-2xl py-4 text-base font-bold ob-btn-tap hover:brightness-110 transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)]"
          style={{ background: "var(--soft-teal)", color: "#0f172a" }}
        >
          دخول الملاذ الآمن ←
        </button>
        <p className="text-[10px] text-slate-500 px-4">
          تم إرسال نسخة مفصلة من الخطوة الأولى إلى بريدك الإلكتروني (تأكد من مجلد Spam).
        </p>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════
   Main OnboardingFlow
   ════════════════════════════════════════════════ */
export const OnboardingFlow: FC<OnboardingFlowProps> = memo(({ onComplete }) => {
  const addNode = useMapState((s) => s.addNode);
  const [step, setStep] = useState(0);
  const [prevStep, setPrevStep] = useState(-1);
  const [collectedItems, setCollectedItems] = useState<{ name: string; category: AdviceCategory }[]>([]);
  const completionTrackedRef = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    try {
      recordFlowEvent("onboarding_opened");
      trackEvent(AnalyticsEvents.ONBOARDING_STARTED, {
        entry_point: "relationship_map"
      });
    } catch {
      // Never block onboarding rendering on analytics failures.
    }
  }, []);

  const stepRef = useRef(0);

  const goTo = useCallback((next: number) => {
    startTransition(() => {
      setStep((prev) => {
        setPrevStep(prev);
        return next;
      });
      stepRef.current = next;
    });
  }, [startTransition]);

  const handleSkip = useCallback(() => {
    const currentStep = stepRef.current;
    const stepId = currentStep === 0 ? "noise" : currentStep === 1 ? "inventory" : currentStep === 2 ? "mapping" : "review";
    recordFlowEvent("onboarding_skipped", { atStep: stepId });
    markJourneyOnboardingDone();
    onComplete(true);
  }, [onComplete]);


  const handleInventoryNext = useCallback((items: { name: string; category: AdviceCategory }[]) => {
    recordFlowEvent("onboarding_phase_inventory_completed", {
      meta: { itemsCount: items.length }
    });
    setCollectedItems(items);
    goTo(2);
  }, [goTo]);

  const handleNoiseNext = useCallback(() => {
    recordFlowEvent("onboarding_phase_noise_completed");
    goTo(1);
  }, [goTo]);

  const handleMappingNext = useCallback((mapped: NameCard[]) => {
    recordFlowEvent("onboarding_phase_mapping_completed", {
      meta: { mappedCount: mapped.length }
    });
    // Add nodes to mapState
    for (const item of mapped) {
      if (item.name.trim()) {
        addNode(
          item.name.trim(),
          (item.ring ?? "yellow") as "green" | "yellow" | "red",
          undefined,
          item.category // goalId effectively
        );
      }
    }
    goTo(3);
  }, [addNode, goTo]);

  const handleComplete = useCallback(() => {
    const hasTrackedThisSession =
      completionTrackedRef.current ||
      (typeof window !== "undefined" &&
        window.sessionStorage.getItem(ONBOARDING_COMPLETION_SESSION_KEY) === "true");

    if (!hasTrackedThisSession) {
      recordFlowEvent("onboarding_completed", {
        meta: { itemsCount: collectedItems.length }
      });
      trackCompleteRegistration({
        items_count: collectedItems.length,
        flow: "relationship_onboarding"
      });
      completionTrackedRef.current = true;
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(ONBOARDING_COMPLETION_SESSION_KEY, "true");
      }
    }

    markJourneyOnboardingDone();
    onComplete(false);

    // Push Notification: best moment = right after completing the journey
    if (typeof window !== "undefined" && getNotificationPermission() === "default") {
      setTimeout(() => { void enableNotificationsWithPrompt(); }, 2000);
    }
  }, [collectedItems.length, onComplete]);

  const handleContactCapture = useCallback(async (email: string, whatsapp: string) => {
    recordFlowEvent("lead_form_submitted", {
      meta: { hasEmail: !!email, hasWhatsapp: !!whatsapp }
    });
    
    // Official trackLead service handles Meta Pixel 'Lead' and Gtag 'generate_lead'
    trackLead({
      method: email && whatsapp ? "both" : email ? "email" : "whatsapp",
      has_email: !!email,
      has_whatsapp: !!whatsapp
    });

    // Calculate metadata for the recovery plan
    const nodes = useMapState.getState().nodes;
    const redCount = nodes.filter(n => n.ring === "red").length;
    const yellowCount = nodes.filter(n => n.ring === "yellow").length;
    const greenCount = nodes.filter(n => n.ring === "green").length;

    // SILENT SIGNUP / MAGIC LINK
    if (email.trim()) {
      try {
        // First try to sign in/up via magic link
        await signInWithMagicLink(email.trim());
        
        // Then trigger the recovery plan email immediately
        const sendSuccess = await sendRecoveryPlanEmail(email.trim(), {
          userName: undefined, // Could fetch from profile if we had it
          relationshipCount: nodes.length,
          redCount,
          yellowCount,
          greenCount,
          magicLink: window.location.origin
        });

        if (sendSuccess) {
          console.log("[Onboarding] Recovery plan email successfully initiated");
        } else {
          console.error("[Onboarding] Recovery plan email failed to send (check EmailService logs)");
        }
      } catch (err: any) {
        console.warn("[Onboarding] Email trigger failed, but continuing flow:", err);
      }
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("dawayir-lead-email", email);
      window.sessionStorage.setItem("dawayir-lead-whatsapp", whatsapp);
    }
    
    // GO TO STEP 5 (RECOVERY PLAN PREVIEW)
    goTo(5);
  }, [goTo]);


  /* Progress dots */
  const dots = [0, 1, 2, 3, 4, 5];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 ob-dark-force"
      style={{ background: "var(--color-primary-soft)", backdropFilter: "blur(8px)" }}
      dir="rtl"
    >
      <style>{ONBOARDING_STYLES}</style>
      <div
        className="relative w-full max-w-sm rounded-[2rem] flex flex-col max-h-[90vh] overflow-hidden shadow-2xl"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(24px)",
          border: "1px solid var(--glass-border)",
        }}
      >
        {/* Progress dots — CSS transition only */}
        <div className="flex justify-center gap-2 pt-5 pb-1">
          {dots.map((d: number) => (
            <div
              key={d}
              className="rounded-full transition-all duration-300"
              style={{
                height: 6,
                width: d === step ? 20 : 6,
                background: d === step ? "var(--soft-teal)" : d < step ? "var(--soft-teal-glow)" : "var(--glass-border)",
              }}
            />
          ))}
        </div>

        {/* Content area — CSS transitions, no AnimatePresence blocking */}
        <div className="px-6 py-6 overflow-y-auto custom-scrollbar relative">
          {step === 0 && (
            <div key="stepN" className={prevStep < 0 ? "ob-step-enter" : "ob-step-enter"}>
              <FirstSparkOnboarding onComplete={handleNoiseNext} />
            </div>
          )}

          {step === 1 && (
            <div key="step0" className="ob-step-enter">
              <StepInventory onNext={handleInventoryNext} onSkip={handleSkip} />
            </div>
          )}
          {step === 2 && (
            <div key="mapping" className="ob-step-enter">
              <StepMapping items={collectedItems} onNext={handleMappingNext} onSkip={handleSkip} />
            </div>
          )}
          {step === 3 && (
            <div key="insight" className="ob-step-enter">
              <StepInsight items={collectedItems} onComplete={() => goTo(4)} onSkip={() => goTo(4)} />
            </div>
          )}
          {step === 4 && (
            <div key="contact" className="ob-step-enter">
              <StepContactCapture
                onComplete={handleContactCapture}
                onSkip={() => {
                  recordFlowEvent("onboarding_contact_skipped");
                  goTo(5); // Still show the plan preview even if they skip
                }}
              />
            </div>
          )}
          {step === 5 && (
            <div key="plan" className="ob-step-enter">
              <StepRecoveryPlanPreview
                collectedItems={collectedItems}
                onComplete={handleComplete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
(OnboardingFlow as unknown as { displayName: string }).displayName = "OnboardingFlow";
