"use client";

import { PulseCheckModal } from "../../src/components/PulseCheckModal";
import { useState } from "react";
import { motion } from "framer-motion";

export default function DebugPulsePage() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Stars / Glow */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            {!isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 text-center"
                >
                    <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-500/30">
                        <span className="text-4xl">✨</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-200 to-blue-200 bg-clip-text text-transparent mb-6">
                        تم حفظ البوصلة!
                    </h1>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="px-8 py-3 bg-white text-[#050510] font-bold rounded-full hover:bg-teal-50 transition-all hover:scale-105 active:scale-95"
                    >
                        إعادة التجربة
                    </button>
                </motion.div>
            )}

            <PulseCheckModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onSubmit={() => setIsOpen(false)}
            />
        </div>
    );
}
