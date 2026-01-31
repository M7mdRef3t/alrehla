import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Monitor } from "lucide-react";
import { useThemeState } from "../state/themeState";

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSettings: FC<ThemeSettingsProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useThemeState();

  const themes = [
    { id: "light" as const, label: "فاتح", icon: Sun, description: "ألوان فاتحة دائماً" },
    { id: "dark" as const, label: "داكن", icon: Moon, description: "ألوان داكنة دائماً" },
    { id: "system" as const, label: "النظام", icon: Monitor, description: "حسب إعدادات جهازك" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <Sun className="w-5 h-5 text-amber-500 dark:hidden" />
                    <Moon className="w-5 h-5 text-indigo-400 hidden dark:block" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">المظهر</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                {themes.map((t) => {
                  const Icon = t.icon;
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-right ${
                        isSelected
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected 
                          ? "bg-teal-100 dark:bg-teal-800" 
                          : "bg-slate-100 dark:bg-slate-700"
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          isSelected 
                            ? "text-teal-600 dark:text-teal-400" 
                            : "text-slate-500 dark:text-slate-400"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${
                          isSelected 
                            ? "text-teal-900 dark:text-teal-100" 
                            : "text-slate-900 dark:text-white"
                        }`}>
                          {t.label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
