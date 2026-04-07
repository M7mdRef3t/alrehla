import type { FC } from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { faqCopy, type FaqItem } from "@/copy/faq";
import { landingCopy } from "@/copy/landing";

/* ════════════════════════════════════════════════
   FAQ SCREEN — أسئلة شايفها كتير
   صوت البراند: الصاحب اللي فاهم
   ════════════════════════════════════════════════ */

interface FaqScreenProps {
  onClose: () => void;
}

/* ── Tag config ── */
const TAG_CONFIG: Record<
  NonNullable<FaqItem["tag"]> | "all",
  { label: string; color: string; border: string; bg: string }
> = {
  all: { label: "الكل", color: "rgba(45,212,191,0.9)", border: "rgba(45,212,191,0.35)", bg: "rgba(45,212,191,0.1)" },
  howto: { label: "إزاي تبدأ", color: "rgba(139,92,246,0.9)", border: "rgba(139,92,246,0.35)", bg: "rgba(139,92,246,0.1)" },
  philosophy: { label: "فلسفة", color: "rgba(251,191,36,0.9)", border: "rgba(251,191,36,0.35)", bg: "rgba(251,191,36,0.08)" },
  therapy: { label: "علاج؟", color: "rgba(248,113,113,0.9)", border: "rgba(248,113,113,0.35)", bg: "rgba(248,113,113,0.08)" },
  privacy: { label: "خصوصية", color: "rgba(52,211,153,0.9)", border: "rgba(52,211,153,0.35)", bg: "rgba(52,211,153,0.08)" },
};

/* ── Single accordion FAQ item ── */
const FaqItemCard: FC<{ item: FaqItem; index: number }> = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  const tag = item.tag ? TAG_CONFIG[item.tag] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${open ? "rgba(45,212,191,0.25)" : "rgba(255,255,255,0.07)"}`,
        background: open ? "rgba(45,212,191,0.03)" : "rgba(255,255,255,0.02)",
        transition: "border-color 0.25s, background 0.25s",
      }}
    >
      {/* Question row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-4 text-right"
        aria-expanded={open}
      >
        {/* Expand indicator */}
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.22 }}
          className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            background: open ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${open ? "rgba(45,212,191,0.35)" : "rgba(255,255,255,0.1)"}`,
            color: open ? "rgba(45,212,191,0.9)" : "rgba(148,163,184,0.6)",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.div>

        <div className="flex-1 min-w-0">
          {tag && (
            <span
              className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5"
              style={{ background: tag.bg, border: `1px solid ${tag.border}`, color: tag.color }}
            >
              {tag.label}
            </span>
          )}
          <p
            className="text-sm font-semibold leading-snug text-right"
            style={{ color: open ? "rgba(255,255,255,0.92)" : "rgba(203,213,225,0.8)" }}
          >
            {item.question}
          </p>
        </div>
      </button>

      {/* Answer — accordion */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="px-4 pb-4 pt-1 text-sm leading-relaxed text-right"
              style={{
                color: "rgba(148,163,184,0.85)",
                borderTop: "1px solid rgba(45,212,191,0.1)",
                paddingTop: "12px",
                marginTop: "-2px",
              }}
            >
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Main FaqScreen ── */
export const FaqScreen: FC<FaqScreenProps> = ({ onClose }) => {
  const [activeTag, setActiveTag] = useState<NonNullable<FaqItem["tag"]> | "all">("all");

  const filtered = useMemo(
    () =>
      activeTag === "all"
        ? faqCopy.items
        : faqCopy.items.filter((item) => item.tag === activeTag),
    [activeTag]
  );

  const tags = (["all", "howto", "philosophy", "therapy", "privacy"] as const);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
      dir="rtl"
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "rgba(8,12,24,0.7)", backdropFilter: "blur(8px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Sheet */}
      <motion.div
        className="relative w-full max-w-lg flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(13,19,36,0.99), rgba(10,15,30,0.99))",
          border: "1px solid rgba(45,212,191,0.15)",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.5)",
          maxHeight: "88dvh",
        }}
        initial={{ y: 80, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(45,212,191,0.1)" }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: "rgba(255,255,255,0.92)" }}>
              {faqCopy.title}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(45,212,191,0.65)" }}>
              {faqCopy.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ color: "rgba(148,163,184,0.6)", background: "rgba(255,255,255,0.04)" }}
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tag filters */}
        <div
          className="flex gap-2 px-5 py-3 overflow-x-auto shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          {tags.map((tag) => {
            const conf = TAG_CONFIG[tag];
            const active = activeTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag)}
                className="whitespace-nowrap text-[11px] font-bold px-3 py-1.5 rounded-full transition-all shrink-0"
                style={{
                  background: active ? conf.bg : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active ? conf.border : "rgba(255,255,255,0.08)"}`,
                  color: active ? conf.color : "rgba(148,163,184,0.55)",
                }}
              >
                {conf.label}
              </button>
            );
          })}
        </div>

        {/* FAQ list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <FaqItemCard key={item.id} item={item} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {/* Closing note + slogan footer */}
        <div
          className="px-5 py-4 shrink-0 text-center flex flex-col gap-2"
          style={{ borderTop: "1px solid rgba(45,212,191,0.08)" }}
        >
          <p className="text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>
            {faqCopy.closingNote}
          </p>
          <p
            className="text-[11px]"
            style={{
              color: "rgba(45,212,191,0.35)",
              fontFamily: "var(--font-display)",
            }}
          >
            {landingCopy.hook}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
