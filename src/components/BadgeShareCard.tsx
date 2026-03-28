/**
 * BadgeShareCard.tsx
 * ───────────────────
 * A shareable card shown when a badge is unlocked.
 * Features: Download as PNG + Share to X (Twitter) + LinkedIn.
 * Uses html2canvas to render the card as an image.
 */

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Download, Twitter, Linkedin, Share2 } from "lucide-react";
import type { Achievement } from "../data/achievements";

const BADGE_ICONS: Record<string, string> = {
  starter_click: "🚀", mirror_discovery: "🪞", installer_click: "📲",
  first_step: "🌱", writer: "✍️", plan_seeker: "🧭", trained: "🏋️",
  growing_map: "🗺️", boundary_keeper: "🛡️", measured: "📊", reader: "📚",
  breather: "🫁", mission_complete: "✅", streak_1: "🔥", streak_3: "⚡",
  streak_7: "💎", quiz_first: "🎯", quiz_double: "🎓", quiz_half: "🏆",
  quiz_master: "👑", pulse_saver: "💾", pulse_explainer: "💡",
  person_located_on_map: "📍", armory_visited: "⚔️", exit_scripts_visited: "🚪",
  grounding_visited: "🌿", quiz_hub_visited: "🧠", login_success: "🔑",
};

interface BadgeShareCardProps {
  achievement: Achievement;
  userName?: string;
  onClose: () => void;
}

export function BadgeShareCard({ achievement, userName, onClose }: BadgeShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const shareText = `🏆 حصلت على وسام "${achievement.title}" في منصة الرحلة!\n${achievement.hint}\n\n#الرحلة #selfgrowth`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://alrehla.app")}&summary=${encodeURIComponent(shareText)}`;

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Dynamic import to keep bundle small
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, { useCORS: true, backgroundColor: null, scale: 2 });
      const link = document.createElement("a");
      link.download = `alrehla-badge-${achievement.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Fallback: open native share
      if (navigator.share) void navigator.share({ title: achievement.title, text: shareText });
    } finally {
      setDownloading(false);
    }
  }

  const icon = BADGE_ICONS[achievement.id] ?? achievement.icon ?? "🏅";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 99100,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(16px)",
        fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        style={{ width: "100%", maxWidth: 380 }}
      >
        {/* Close */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer",
            display: "flex", alignItems: "center", padding: "6px",
          }}><X size={14} /></button>
        </div>

        {/* The card (this is what gets downloaded) */}
        <div ref={cardRef} style={{
          borderRadius: 24,
          background: "linear-gradient(135deg, #0d1022 0%, #08091a 100%)",
          border: "1px solid rgba(20,210,200,0.2)",
          padding: "36px 28px",
          textAlign: "center",
          direction: "rtl",
          boxShadow: "0 0 60px rgba(20,210,200,0.12)",
        }}>
          {/* Glow orb */}
          <div style={{
            width: 90, height: 90, borderRadius: "50%",
            margin: "0 auto 20px",
            background: "radial-gradient(circle, rgba(20,210,200,0.2) 0%, transparent 70%)",
            border: "1px solid rgba(20,210,200,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40,
            boxShadow: "0 0 40px rgba(20,210,200,0.2)",
          }}>{icon}</div>

          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 900, letterSpacing: "0.2em", color: "#14d2c8", textTransform: "uppercase" }}>
            ACHIEVEMENT UNLOCKED
          </p>
          <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#f1f5f9" }}>
            {achievement.title}
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
            {achievement.hint}
          </p>

          {userName && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 99, padding: "6px 14px",
            }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>حقق هذا</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>{userName}</span>
            </div>
          )}

          {/* Branding */}
          <p style={{ marginTop: 20, fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
            alrehla.app · منصة الرحلة
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            onClick={() => void handleDownload()}
            disabled={downloading}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "11px 0", borderRadius: 12, outline: "none", cursor: "pointer",
              background: "rgba(20,210,200,0.1)", border: "1px solid rgba(20,210,200,0.2)",
              color: "#14d2c8", fontSize: 13, fontWeight: 700,
              opacity: downloading ? 0.5 : 1,
            }}
          >
            <Download size={14} />
            {downloading ? "جارٍ..." : "تحميل"}
          </button>
          <a
            href={twitterUrl} target="_blank" rel="noreferrer"
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "11px 0", borderRadius: 12, textDecoration: "none",
              background: "rgba(29,161,242,0.08)", border: "1px solid rgba(29,161,242,0.2)",
              color: "#1da1f2", fontSize: 13, fontWeight: 700,
            }}
          >
            <Twitter size={14} />
            X
          </a>
          <a
            href={linkedinUrl} target="_blank" rel="noreferrer"
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "11px 0", borderRadius: 12, textDecoration: "none",
              background: "rgba(10,102,194,0.08)", border: "1px solid rgba(10,102,194,0.2)",
              color: "#0a66c2", fontSize: 13, fontWeight: 700,
            }}
          >
            <Linkedin size={14} />
            LinkedIn
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
