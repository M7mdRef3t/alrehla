import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";
import { setLanguage, getLanguage, LANGUAGE_OPTIONS, type Language } from "../services/i18n";

/* ══════════════════════════════════════════
   LANGUAGE SWITCHER — محوّل اللغة
   ══════════════════════════════════════════ */

interface LanguageSwitcherProps {
    onLanguageChange?: (lang: Language) => void;
    compact?: boolean;
}

export const LanguageSwitcher: FC<LanguageSwitcherProps> = ({
    onLanguageChange,
    compact = false,
}) => {
    const [current, setCurrent] = useState<Language>(getLanguage());
    const [open, setOpen] = useState(false);

    const handleSelect = (lang: Language) => {
        setLanguage(lang);
        setCurrent(lang);
        setOpen(false);
        onLanguageChange?.(lang);
        // Reload to apply RTL/LTR changes
        window.location.reload();
    };

    const currentOption = LANGUAGE_OPTIONS.find((o) => o.code === current)!;

    if (compact) {
        return (
            <div className="relative">
                <motion.button
                    onClick={() => setOpen(!open)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold"
                    style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#94a3b8",
                    }}
                    whileHover={{ borderColor: "rgba(255,255,255,0.2)" }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{currentOption.flag}</span>
                </motion.button>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            className="absolute top-full mt-1 right-0 rounded-xl overflow-hidden z-50"
                            style={{
                                background: "#1e293b",
                                border: "1px solid rgba(255,255,255,0.1)",
                                minWidth: 120,
                            }}
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                        >
                            {LANGUAGE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.code}
                                    onClick={() => handleSelect(opt.code)}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors"
                                    style={{ color: opt.code === current ? "#818cf8" : "#94a3b8" }}
                                >
                                    <span>{opt.flag}</span>
                                    <span className="font-medium">{opt.label}</span>
                                    {opt.code === current && <span className="mr-auto text-indigo-400">✓</span>}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="flex gap-2">
            {LANGUAGE_OPTIONS.map((opt) => (
                <motion.button
                    key={opt.code}
                    onClick={() => handleSelect(opt.code)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm"
                    style={{
                        background: opt.code === current
                            ? "rgba(99,102,241,0.2)"
                            : "rgba(255,255,255,0.04)",
                        border: `1px solid ${opt.code === current ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                        color: opt.code === current ? "#818cf8" : "#64748b",
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                >
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                </motion.button>
            ))}
        </div>
    );
};
