import type { FC } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Gift } from "lucide-react";
import {
    getMyReferralCode,
    getReferralShareText,
    getMyReferralLink,
    getReferralRewardStatus,
} from "../services/referralEngine";

/* 
   REFERRAL PANEL — لوحة الإحالة
   "ادعُ قائداً → اكسب ميدالية + أسبوع بريميوم"
    */

interface ReferralPanelProps {
    onClose?: () => void;
}

export const ReferralPanel: FC<ReferralPanelProps> = ({ onClose: _onClose }) => {
    const [copied, setCopied] = useState(false);
    const code = getMyReferralCode();
    const link = getMyReferralLink();
    const status = getReferralRewardStatus();
    const shareText = getReferralShareText();

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* noop */ }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: "ابدأ رحلتك في دواير",
                    text: shareText,
                    url: link,
                });
            } else {
                await navigator.clipboard.writeText(shareText);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch { /* noop */ }
    };

    return (
        <motion.div
            className="rounded-3xl overflow-hidden"
            style={{
                background: "linear-gradient(160deg, #0f172a 0%, #1a1040 100%)",
                border: "1px solid rgba(99,102,241,0.25)",
            }}
            dir="rtl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="p-5 pb-3">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--soft-teal)]/20 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-[var(--soft-teal)]" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white">ادعُ قائداً</h2>
                        <p className="text-xs text-slate-400">أسبوع بريميوم مجاني لكل إحالة</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-3 mb-4">
                    <div className="flex-1 p-3 rounded-xl text-center"
                        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                        <p className="text-2xl font-black text-[var(--soft-teal)]">{status.count}</p>
                        <p className="text-xs text-slate-500">إحالة ناجحة</p>
                    </div>
                    <div className="flex-1 p-3 rounded-xl text-center"
                        style={{ background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.2)" }}>
                        <p className="text-2xl font-black text-amber-400">{status.earnedWeeks}</p>
                        <p className="text-xs text-slate-500">أسابيع مكتسبة</p>
                    </div>
                </div>

                {/* Referral code */}
                <div className="p-4 rounded-2xl mb-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-xs text-slate-500 mb-2">كودك الشخصي</p>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-white tracking-widest font-mono">{code}</span>
                        <motion.button
                            onClick={handleCopyCode}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                            style={{
                                background: copied ? "rgba(52,211,153,0.2)" : "rgba(99,102,241,0.2)",
                                border: `1px solid ${copied ? "rgba(52,211,153,0.4)" : "rgba(99,102,241,0.3)"}`,
                                color: copied ? "#34d399" : "#818cf8",
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? "تم!" : "نسخ"}
                        </motion.button>
                    </div>
                </div>

                {/* Share button */}
                <motion.button
                    onClick={handleShare}
                    className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                    style={{
                        background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Share2 className="w-4 h-4" />
                    شارك الدعوة
                </motion.button>
            </div>

            {/* How it works */}
            <div className="px-5 pb-5">
                <p className="text-xs text-slate-500 mb-2 font-bold">كيف يشتغل؟</p>
                <div className="space-y-2">
                    {[
                        { step: "1", text: "شارك كودك مع صاحبك" },
                        { step: "2", text: "يسجل باستخدام كودك" },
                        { step: "3", text: "تكسب أسبوع بريميوم مجاني" },
                    ].map(({ step, text }) => (
                        <div key={step} className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-[var(--soft-teal)]/30 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-[var(--soft-teal)]">{step}</span>
                            </div>
                            <span className="text-xs text-slate-400">{text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};



