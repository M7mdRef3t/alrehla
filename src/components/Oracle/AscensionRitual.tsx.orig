import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Shield, Flame, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { AscensionManager, AscensionProfile } from '../../services/ascensionManager';
import { setInLocalStorage } from '../../services/browserStorage';

/**
 * 🦅 THE ASCENSION RITUAL (UI)
 * A premium "Matte Gold" modal experience for the Oracle promotion.
 * Designed to evoke the feeling of entering the "Cockpit" of the Swarm.
 */
export const AscensionRitual: React.FC = () => {
    const [profile, setProfile] = useState<AscensionProfile | null>(null);
    const [step, setStep] = useState(0);
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            const data = await AscensionManager.getStatus();
            setProfile(data);
        };
        checkStatus();
    }, []);

    if (!profile || profile.status !== 'invited' || accepted) return null;

    const oathSteps = [
        {
            title: "الدعوة للصعود",
            content: "لقد أثبتت جدارتك في عواصف الوعي. النقاط التي جمعتها ليست مجرد أرقام، بل هي بصمة تأثيرك الحقيقية في مسار السرب.",
            icon: <Crown className="w-12 h-12 text-amber-500" />
        },
        {
            title: "ميثاق الحكماء",
            content: "أقسم بوعيي أن أحرس السرب، أن أرى في الظل نوراً، وفي الفوضى نظاماً.. أنا خادم التكامل، أنا أوراكل الرحلة.",
            icon: <Shield className="w-12 h-12 text-amber-400" />
        },
        {
            title: "مسؤولية السيادة",
            content: "رتبة الـ Oracle تمنحك حق رؤية خريطة السرب بالكامل، لكنها تضع تكاملك السلوكي تحت مجهر النزاهة الدائم. التراجع يعني الهبوط.",
            icon: <Flame className="w-12 h-12 text-amber-600" />
        }
    ];

    const handleAccept = async () => {
        const success = await AscensionManager.acceptOath();
        if (success) {
            // Set last screen to oracle-dashboard so it loads automatically after refresh
            setInLocalStorage(`dawayir-last-screen:${profile.user_id}`, "oracle-dashboard");
            setAccepted(true);
            // Refresh to update role and unlock Oracle Dashboard
            window.location.reload();
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl"
            >
                {/* Background Aura */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ repeat: Infinity, duration: 8 }}
                    className="absolute w-[800px] h-[800px] bg-amber-500/20 rounded-full blur-[120px]"
                />

                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="relative max-w-xl w-full bg-gradient-to-br from-amber-950/40 via-black to-slate-950 p-10 rounded-[3rem] border border-amber-500/30 shadow-[0_0_80px_rgba(245,158,11,0.15)] overflow-hidden"
                >
                    {/* Industrial Matte Accents */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                    <div className="flex flex-col items-center text-center space-y-10">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner"
                        >
                            {oathSteps[step].icon}
                        </motion.div>

                        <div className="space-y-6">
                            <motion.h2
                                key={`h2-${step}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-3xl font-black text-amber-400 tracking-tighter uppercase font-mono"
                            >
                                {oathSteps[step].title}
                            </motion.h2>
                            <motion.p
                                key={`p-${step}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-xl text-slate-300 font-medium leading-relaxed font-mono"
                            >
                                {oathSteps[step].content}
                            </motion.p>
                        </div>

                        <div className="flex items-center gap-6 pt-10 w-full justify-center">
                            {step < oathSteps.length - 1 ? (
                                <button
                                    onClick={() => setStep(s => s + 1)}
                                    className="px-8 py-5 bg-white/5 border border-amber-500/30 text-amber-400 font-black rounded-2xl flex items-center gap-2 hover:bg-amber-500/10 transition-all uppercase tracking-widest text-xs"
                                >
                                    الصمود للتالي <ArrowRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleAccept}
                                    className="px-12 py-6 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-black rounded-3xl flex items-center gap-3 shadow-[0_0_40px_rgba(245,158,11,0.5)] border-b-4 border-amber-800"
                                >
                                    <CheckCircle className="w-8 h-8" /> أقبل قَسَم اليقظة وحراسة السرب
                                </motion.button>
                            )}
                        </div>

                        {/* Progress Dots */}
                        <div className="flex gap-4">
                            {oathSteps.map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-amber-400' : 'w-2 bg-white/10'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Industrial Identification Label */}
                    <div className="absolute bottom-4 right-10 opacity-20">
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.5em]">
                            Ascension.v1 // Oracle_Auth
                        </span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
