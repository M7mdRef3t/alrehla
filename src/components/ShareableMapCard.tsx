import type { FC } from "react";
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Share2, Lock } from "lucide-react";
import { useMapState } from "../state/mapState";

/* ══════════════════════════════════════════
   SHAREABLE MAP CARD — بطاقة خريطة قابلة للمشاركة
   تصدير صورة آمنة (بدون أسماء — أيقونات فقط)
   ══════════════════════════════════════════ */

interface ShareableMapCardProps {
    onClose?: () => void;
}

const RING_COLORS = {
    green: { bg: "rgba(52,211,153,0.9)", glow: "rgba(52,211,153,0.4)" },
    yellow: { bg: "rgba(251,191,36,0.9)", glow: "rgba(251,191,36,0.4)" },
    red: { bg: "rgba(248,113,113,0.9)", glow: "rgba(248,113,113,0.4)" },
    grey: { bg: "rgba(148,163,184,0.6)", glow: "rgba(148,163,184,0.2)" },
};

export const ShareableMapCard: FC<ShareableMapCardProps> = ({ onClose }) => {
    const nodes = useMapState((s) => s.nodes);
    const cardRef = useRef<HTMLDivElement>(null);
    const [sharing, setSharing] = useState(false);
    const [copied, setCopied] = useState(false);

    const activeNodes = nodes.filter((n) => !n.isNodeArchived);
    const greenCount = activeNodes.filter((n) => n.ring === "green").length;
    const yellowCount = activeNodes.filter((n) => n.ring === "yellow").length;
    const redCount = activeNodes.filter((n) => n.ring === "red").length;

    const today = new Date().toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    /* ── Share via Web Share API ── */
    const handleShare = useCallback(async () => {
        setSharing(true);
        try {
            if (!cardRef.current) return;
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: "#0f172a",
                scale: 2,
            });

            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error("Canvas to Blob failed");
                const file = new File([blob], "dawayir-map.png", { type: "image/png" });
                const text = `🗺️ خريطتي في الرحلة\n\n✅ دائرة الأمان: ${greenCount} شخص\n⚠️ دائرة الحذر: ${yellowCount} شخص\n🚨 دائرة الخطر: ${redCount} شخص\n\nابدأ رحلتك: https://dawayir.app`;

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: "خريطتي في الرحلة",
                        text,
                        files: [file],
                    });
                } else {
                    // Fallback to clipboard or download
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.download = "dawayir-map.png";
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);

                    await navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }
            });
        } catch {
            // User cancelled or error
        } finally {
            setSharing(false);
        }
    }, [greenCount, yellowCount, redCount]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                className="relative w-full max-w-sm"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25 }}
            >
                {/* The shareable card */}
                <div
                    ref={cardRef}
                    className="rounded-3xl overflow-hidden"
                    style={{
                        background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
                        border: "1px solid rgba(139,92,246,0.3)",
                    }}
                >
                    {/* Card header */}
                    <div className="p-6 pb-4 text-center" dir="rtl">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                            <p className="text-xs font-bold text-teal-400 uppercase tracking-widest">الرحلة · دواير</p>
                        </div>
                        <h2 className="text-lg font-black text-white mt-2">خريطتي الآن</h2>
                        <p className="text-xs text-slate-500 mt-1">{today}</p>
                    </div>

                    {/* Visual map representation */}
                    <div className="relative flex items-center justify-center py-6">
                        {/* Concentric rings */}
                        <div className="relative w-48 h-48">
                            {/* Outer ring */}
                            <div className="absolute inset-0 rounded-full"
                                style={{ border: "1px solid rgba(248,113,113,0.3)" }} />
                            {/* Middle ring */}
                            <div className="absolute inset-8 rounded-full"
                                style={{ border: "1px solid rgba(251,191,36,0.3)" }} />
                            {/* Inner ring */}
                            <div className="absolute inset-16 rounded-full"
                                style={{ border: "1px solid rgba(52,211,153,0.4)" }} />
                            {/* Center */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                                    style={{ background: "rgba(13,148,136,0.3)", border: "2px solid rgba(13,148,136,0.6)" }}>
                                    أنا
                                </div>
                            </div>

                            {/* Anonymous dots for each person */}
                            {activeNodes.slice(0, 12).map((node, i) => {
                                const angle = (i / Math.min(activeNodes.length, 12)) * Math.PI * 2;
                                const ringRadius = node.ring === "green" ? 28 : node.ring === "yellow" ? 52 : 72;
                                const x = 50 + Math.cos(angle) * ringRadius;
                                const y = 50 + Math.sin(angle) * ringRadius;
                                const colors = RING_COLORS[node.ring as keyof typeof RING_COLORS] ?? RING_COLORS.grey;
                                return (
                                    <motion.div
                                        key={node.id}
                                        className="absolute w-3 h-3 rounded-full"
                                        style={{
                                            left: `${x}%`,
                                            top: `${y}%`,
                                            transform: "translate(-50%, -50%)",
                                            background: colors.bg,
                                            boxShadow: `0 0 8px ${colors.glow}`,
                                        }}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex justify-around px-6 pb-5" dir="rtl">
                        {[
                            { count: greenCount, label: "أمان", color: "#34d399" },
                            { count: yellowCount, label: "حذر", color: "#fbbf24" },
                            { count: redCount, label: "خطر", color: "#f87171" },
                        ].map(({ count, label, color }) => (
                            <div key={label} className="text-center">
                                <p className="text-2xl font-black" style={{ color }}>{count}</p>
                                <p className="text-xs text-slate-500">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Privacy badge */}
                    <div className="flex items-center justify-center gap-1.5 pb-4">
                        <Lock className="w-3 h-3 text-slate-600" />
                        <p className="text-[10px] text-slate-600">بدون أسماء — خصوصية كاملة</p>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-4">
                    <motion.button
                        onClick={handleShare}
                        disabled={sharing}
                        className="flex-1 py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                        style={{
                            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Share2 className="w-4 h-4" />
                        {copied ? "تم النسخ! ✓" : sharing ? "جاري..." : "شارك"}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

