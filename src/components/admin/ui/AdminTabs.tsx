import React from "react";
import { motion } from "framer-motion";

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface AdminTabsProps {
  tabs: readonly TabItem[];
  activeTab: string;
  onChange: (id: any) => void;
  className?: string;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ tabs, activeTab, onChange, className = "" }) => {
  return (
    <div className={`relative flex p-1 bg-slate-950/20 dark:bg-black/40 backdrop-blur-3xl rounded-2xl border border-white/5 shadow-inner overflow-x-auto no-scrollbar ${className}`} dir="rtl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-3 px-6 py-3 rounded-xl text-[11px] font-black tracking-widest transition-all duration-300 whitespace-nowrap z-10 ${
              isActive 
                ? "text-slate-950" 
                : "text-slate-500 hover:text-slate-200"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabBackground"
                className="absolute inset-0 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            
            <span className="relative z-20 flex items-center gap-2">
              {tab.icon && (
                <span className={`transition-transform duration-500 ${isActive ? "scale-125 rotate-3" : "opacity-50 grayscale group-hover:grayscale-0"}`}>
                  {tab.icon}
                </span>
              )}
              <span className={`uppercase tracking-tighter transition-all duration-300 ${isActive ? "font-black" : "font-bold"}`}>
                {tab.label}
              </span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
