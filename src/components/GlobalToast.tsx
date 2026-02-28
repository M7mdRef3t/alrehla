import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToastState } from "../state/toastState";
import { Info, CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";

export const GlobalToast: React.FC = () => {
    const { message, isVisible, type, hideToast } = useToastState();

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                hideToast();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, hideToast]);

    const icons = {
        info: <Info className="w-5 h-5 text-blue-400" />,
        success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        error: <XCircle className="w-5 h-5 text-rose-400" />,
    };

    const colors = {
        info: "border-blue-500/30 bg-blue-500/10 shadow-blue-500/20",
        success: "border-emerald-500/30 bg-emerald-500/10 shadow-emerald-500/20",
        warning: "border-amber-500/30 bg-amber-500/10 shadow-amber-500/20",
        error: "border-rose-500/30 bg-rose-500/10 shadow-rose-500/20",
    };

    return (
        <AnimatePresence>
            {isVisible && message && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -20, scale: 0.95, filter: "blur(10px)" }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md"
                >
                    <div className={`
            relative overflow-hidden
            backdrop-blur-xl border-2 rounded-2xl p-4
            flex items-start gap-3 shadow-2xl
            ${colors[type]}
          `}>
                        {/* Ambient Glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

                        <div className="mt-0.5">
                            {icons[type]}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-slate-100 text-sm font-medium leading-relaxed">
                                {message}
                            </p>
                        </div>

                        <button
                            onClick={hideToast}
                            className="mt-0.5 p-1 hover:bg-white/10 rounded-lg transition-colors group"
                        >
                            <X className="w-4 h-4 text-slate-400 group-hover:text-white" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
