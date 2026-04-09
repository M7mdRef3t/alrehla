"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminTooltip } from "@/components/admin/dashboard/Overview/components/AdminTooltip";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`w-10 h-10 opacity-0 ${className}`} />;
  }

  const isDark = theme === "dark" || theme === "system"; // system is usually dark in alrehla

  return (
    <AdminTooltip content={isDark ? "تفعيل السمة الفاتحة" : "تفعيل السمة الداكنة"} position="bottom">
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl border transition-all active:scale-95 group shadow-lg ${
          isDark 
            ? "bg-[#111827] border-slate-700/80 text-amber-300 hover:text-amber-200 hover:bg-slate-800 hover:border-slate-600"
            : "bg-white border-slate-200 text-indigo-600 hover:bg-slate-50 hover:text-indigo-800"
        } ${className}`}
      >
        {isDark ? (
          <Sun className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        ) : (
          <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
        )}
      </button>
    </AdminTooltip>
  );
}
