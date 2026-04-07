import { FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Check, Clock, ShieldCheck, X, LockKeyhole } from "lucide-react";
import { supabase } from "@/services/supabaseClient";

/**
 *  DOCUMENT ISSUANCE PANEL (إصدار ثة اتح)
 * 
 * Final Surgery: 'Decision Room' atmosphere.
 * Backdrop: Dim 0.25 | Blur 64px | Desaturate -10%.
 * Aesthetics: Authority through silence.
 */

export const ShareDialog: FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const createShare = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            const res = await fetch('/api/share/create', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setShareUrl(data.url);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            {/* Float Issuance Button (Neutral & Iconic) */}
            <div className="fixed bottom-32 right-6 z-[60]">
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-4 rounded-full bg-white text-black shadow-3xl flex items-center gap-3 transition-all active:scale-[0.98] group hover:bg-white/90 border border-white/10"
                >
                    <Share2 className="w-5 h-5" />
                    <span className="text-[12px] font-black uppercase tracking-tight hidden md:inline">إصدار ثة اتح</span>
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 backdrop-blur-[64px] backdrop-saturate-[0.9] bg-black/25 text-right">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.995, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.995, y: 5 }}
                            className="w-full max-w-md bg-[#050505] border border-white/[0.03] rounded-[2rem] p-12 shadow-3xl relative overflow-hidden"
                        >
                            {/* ️ System Processing Indicator (Top Progress) */}
                            {isLoading && (
                                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-white/[0.02] overflow-hidden">
                                    <motion.div
                                        className="h-full bg-white/40"
                                        initial={{ x: "-100%" }}
                                        animate={{ x: "100%" }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    />
                                </div>
                            )}

                            <button
                                onClick={() => { setIsOpen(false); setShareUrl(null); }}
                                className="absolute top-8 left-8 p-2 rounded-full hover:bg-white/5 text-white/[0.05] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex flex-col items-center text-center mb-12">
                                <div className="w-14 h-14 rounded-full bg-white/[0.01] border border-white/[0.03] flex items-center justify-center text-white/20 mb-8">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-[#FFFFFF] leading-tight tracking-tighter">إصدار ثة اتح</h3>
                                <p className="text-[10px] text-[#8A8A8A] mt-4 leading-relaxed max-w-[260px] opacity-60">
                                    ست استخراج ثة رسة شفرة تجد حظات تطر ف طة صفاة صاحة دة حددة تحت حاة اظا.
                                </p>
                            </div>

                            <div className="space-y-4 mb-12">
                                <div className="flex items-center justify-end gap-3 px-6 py-4 rounded-xl bg-white/[0.005] border border-white/[0.02]">
                                    <span className="text-[10px] font-bold text-[#8A8A8A] opacity-40">دة صاحة ااستصاء: ٧ أا</span>
                                    <Clock className="w-3.5 h-3.5 text-white/[0.05]" />
                                </div>
                                <div className="flex items-center justify-end gap-3 px-6 py-4 rounded-xl bg-white/[0.005] border border-white/[0.02]">
                                    <span className="text-[10px] font-bold text-[#8A8A8A] opacity-40">تشفر اة فع آا</span>
                                    <LockKeyhole className="w-3.5 h-3.5 text-white/[0.05]" />
                                </div>
                            </div>

                            {shareUrl ? (
                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-white/[0.01] border border-emerald-500/10 flex items-center justify-between group">
                                        <button
                                            onClick={copyToClipboard}
                                            className="px-5 py-2.5 rounded-xl bg-[#D6D6D6] text-black text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all transform active:scale-95"
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5" /> : "سخ ارابط"}
                                        </button>
                                        <span className="text-[9px] text-emerald-500/40 font-bold truncate max-w-[180px] text-left ml-4 font-mono">{shareUrl}</span>
                                    </div>
                                    <p className="text-[8px] text-emerald-500/20 font-black text-center tracking-[0.3em] uppercase">Security Clearance Granted.</p>
                                </div>
                            ) : (
                                <button
                                    onClick={createShare}
                                    disabled={isLoading}
                                    className="w-full py-5 rounded-xl bg-[#D6D6D6] text-black font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl disabled:opacity-20 active:scale-[0.99] transition-all hover:bg-white"
                                >
                                    {isLoading ? 'جار اإصدار اتشفر...' : 'إصدار اثة اآ'}
                                </button>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};


