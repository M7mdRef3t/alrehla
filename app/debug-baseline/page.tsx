"use client";

import { BaselineAssessment } from "../../src/components/BaselineAssessment";
import { useState } from "react";
import { motion } from "framer-motion";

export default function DebugBaselinePage() {
    const [completed, setCompleted] = useState(false);

    return (
        <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Stars / Glow */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-2xl glass-heavy p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl"
            >
                {!completed ? (
                    <BaselineAssessment onComplete={() => setCompleted(true)} />
                ) : (
                    <div className="text-center py-12">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-500/30"
                        >
                            <span className="text-4xl">✨</span>
                        </motion.div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-200 to-blue-200 bg-clip-text text-transparent mb-6">
                            تمت المعايرة بنجاح!
                        </h1>
                        <button
                            onClick={() => setCompleted(false)}
                            className="px-8 py-3 bg-white text-[#050510] font-bold rounded-full hover:bg-teal-50 transition-all hover:scale-105 active:scale-95"
                        >
                            إعادة التجربة
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
