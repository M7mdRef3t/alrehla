import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Power } from 'lucide-react';

export const EmergencySOS: React.FC = () => {
    const [isLockdown, setIsLockdown] = useState(false);

    const handleActivate = () => {
        setIsLockdown(true);
        // soundManager.playEmergencySiren(); // Assume this exists
        // Trigger backend "Mute All" logic here
    };

    const handleDeactivate = () => {
        setIsLockdown(false);
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center space-y-4">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleActivate}
                    className="group relative w-24 h-24 rounded-full bg-slate-900 border-4 border-red-900/50 shadow-2xl flex items-center justify-center overflow-hidden"
                >
                    <div className="absolute inset-0 bg-red-900/20 group-hover:bg-red-900/30 transition-colors" />
                    <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping opacity-20" />
                    <Power className="w-10 h-10 text-red-500 group-hover:text-red-400 transition-colors" />
                </motion.button>
                <p className="text-xs text-red-500/60 font-mono tracking-widest uppercase">
                    بروتوكول الطوارئ
                </p>
            </div>

            <AnimatePresence>
                {isLockdown && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="max-w-md w-full text-center relative"
                        >
                            {/* Spinning Shield */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="w-32 h-32 border-4 border-red-500/30 border-t-red-500 rounded-full mx-auto mb-8 flex items-center justify-center"
                            >
                                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Shield className="w-12 h-12 text-red-500" />
                                </div>
                            </motion.div>

                            <h2 className="text-4xl font-black text-red-500 mb-4 tracking-tighter">
                                تم عزل المنطقة
                            </h2>

                            <p className="text-xl text-slate-300 font-light mb-8 leading-relaxed">
                                "يا قائد، إحنا في محطة الشحن.. <br />
                                ركز في النفس وبس. الرادار مطفي."
                            </p>

                            <div className="flex flex-col gap-4">
                                <button className="w-full py-4 bg-red-900/30 border border-red-500/30 text-red-200 rounded-xl hover:bg-red-900/50 transition-all font-medium">
                                    🌀 تمرين تنفس (3 دقائق)
                                </button>
                                <button className="w-full py-4 bg-slate-800/50 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-all font-medium">
                                    🔇 تشويش الإشارة
                                </button>

                                <button
                                    onClick={handleDeactivate}
                                    className="mt-8 text-slate-500 hover:text-white transition-colors text-sm"
                                >
                                    إلغاء الطوارئ والعودة للميدان
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
