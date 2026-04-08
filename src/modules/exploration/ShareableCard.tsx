import { logger } from "../services/logger";
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, CheckCircle2, Sparkles, X } from 'lucide-react';
import { trackEvent } from '@/services/analytics';
import { soundManager } from '@/services/soundManager';

export interface ShareableCardProps {
    title: string;
    description: string;
    metrics?: { label: string; value: string | number }[];
    type: 'achievement' | 'milestone' | 'pulse' | 'boundary';
    onClose?: () => void;
}

export const ShareableCard: React.FC<ShareableCardProps> = ({ title, description, metrics, type, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isShared, setIsShared] = useState(false);

    const getColors = () => {
        switch (type) {
            case 'achievement': return 'from-amber-500/20 to-orange-600/20 border-orange-500/30 text-orange-400';
            case 'boundary': return 'from-rose-500/20 to-pink-600/20 border-pink-500/30 text-pink-400';
            case 'pulse': return 'from-emerald-500/20 to-teal-600/20 border-teal-500/30 text-teal-400';
            default: return 'from-indigo-500/20 to-purple-600/20 border-purple-500/30 text-purple-400';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'achievement': return <Sparkles className="w-8 h-8 mx-auto mb-4 text-orange-400" />;
            case 'boundary': return <X className="w-8 h-8 mx-auto mb-4 text-rose-400" />;
            case 'pulse': return <CheckCircle2 className="w-8 h-8 mx-auto mb-4 text-emerald-400" />;
            default: return <Sparkles className="w-8 h-8 mx-auto mb-4 text-indigo-400" />;
        }
    };

    const handleShare = async () => {
        const shareText = `أنا استخدم تطبيق #دوائر لتحسين وعيي الذاتي وعلاقاتي.\n\n${title}\n${description}\n\nجرب التطبيق الآن: https://dawayir.app`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'انتصار تكتيكي في دوائر',
                    text: shareText,
                    url: 'https://dawayir.app',
                });
                trackShareSuccess();
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(shareText);
                trackShareSuccess();
            }
        } catch (err) {
            logger.error('Error sharing:', err);
        }
    };

    const trackShareSuccess = () => {
        setIsShared(true);
        soundManager.playSuccess();
        trackEvent('achievement_shared', { achievement_type: type });
        setTimeout(() => setIsShared(false), 3000);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="relative w-full max-w-sm flex flex-col items-center"
                    onClick={e => e.stopPropagation()}
                >
                    {/* The actual card that gets "shared/captured" */}
                    <div
                        ref={cardRef}
                        className={`w-full overflow-hidden rounded-3xl border bg-gradient-to-br bg-slate-900 shadow-2xl ${getColors()}`}
                        style={{ backdropFilter: 'blur(16px)' }}
                    >
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                        <div className="p-8 text-center relative z-10">
                            {getIcon()}
                            <h2 className="text-2xl font-black text-white mb-2 leading-tight">{title}</h2>
                            <p className="text-sm text-slate-300 leading-relaxed mb-6">{description}</p>

                            {metrics && metrics.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {metrics.map(m => (
                                        <div key={m.label} className="bg-black/30 rounded-xl p-3 border border-white/5">
                                            <p className="text-xs text-slate-400 mb-1">{m.label}</p>
                                            <p className="text-lg font-bold text-white tracking-widest">{m.value}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-2">
                                <span className="font-mono text-xs text-slate-400 tracking-widest">DAWAYIR.APP</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex items-center gap-4">
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={handleShare}
                            className={`flex-1 h-12 px-6 rounded-full flex items-center justify-center gap-2 font-bold transition-all shadow-lg ${isShared
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                    : 'bg-white text-slate-900 hover:bg-slate-100 shadow-white/10'
                                }`}
                        >
                            {isShared ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    تم النسخ/المشاركة!
                                </>
                            ) : (
                                <>
                                    <Share2 className="w-5 h-5" />
                                    شارك هذا الانتصار
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
