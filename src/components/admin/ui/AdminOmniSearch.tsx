import type { FC } from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, ArrowRight } from "lucide-react";
import { NAV_ITEMS, CLEAN_NAV_LABELS, NAV_TOOLTIPS, type AdminTab } from "../adminNavigation";
import { createCurrentUrl, pushUrl } from "@/services/navigation";
import { useAdminState } from "@/domains/admin/store/admin.store";

export const AdminOmniSearch: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
      
      // Hotkeys for Quick Actions
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            useAdminState.getState().setCopilotOpen(true);
            setIsOpen(false);
            break;
          case 'e':
            e.preventDefault();
            const state = useAdminState.getState();
            state.toggleContentEditing(!state.isContentEditingEnabled);
            setIsOpen(false);
            break;
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
    }
  }, [isOpen]);

  const filteredItems = NAV_ITEMS.filter((item) => {
    const label = CLEAN_NAV_LABELS[item.id] ?? item.label;
    const tooltip = NAV_TOOLTIPS[item.id] ?? "";
    const searchTerm = query.toLowerCase();
    return (
      label.toLowerCase().includes(searchTerm) || 
      item.id.toLowerCase().includes(searchTerm) ||
      tooltip.toLowerCase().includes(searchTerm)
    );
  });

  const handleSelect = (tab: AdminTab) => {
    setIsOpen(false);
    const url = createCurrentUrl();
    if (!url) return;
    url.searchParams.set("tab", tab);
    pushUrl(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl mx-4 bg-[#0B0F19] border border-slate-700/80 rounded-2xl shadow-[0_0_80px_rgba(20,184,166,0.15)] overflow-hidden flex flex-col"
            dir="rtl"
          >
            <div className="flex items-center gap-3 p-4 border-b border-slate-800 bg-[#080B14]">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن لوحة أو ميزة (مثال: مستخدمين, إعلانات)..."
                className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-600 font-bold"
              />
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono tracking-widest bg-slate-900 px-2 py-1 rounded-lg border border-white/5">
                <Command className="w-3 h-3" />
                <span>+</span>
                <span>K</span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm font-bold">
                  لا توجد نتائج مطابقة لبحثك عن "{query}"
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredItems.map((item) => {
                    const label = CLEAN_NAV_LABELS[item.id] ?? item.label;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/80 transition-colors group cursor-pointer text-right w-full"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 group-hover:bg-teal-500/20 transition-colors">
                            {item.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{label}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest">{item.id}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors group-hover:-translate-x-1" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-3 bg-[#080B14] border-t border-slate-800 text-[10px] font-bold text-slate-500 flex justify-between items-center tracking-widest uppercase">
              <span>ابحث وأنجز بسرعة (God Mode)</span>
              <span>السيادة الإدراكية</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
