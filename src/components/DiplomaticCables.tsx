/**
 * Diplomatic Cables — الكابلات الدبلوماسية 📡
 * مكتبة رسائل جاهزة للتواصل بوضوح وحزم
 */

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Send, Copy, Info, Search, CheckCircle2, ArrowLeft } from "lucide-react";
import { getCablesByCategory, type CableCategory } from "@/services/diplomacyService";
import { trackEvent } from "@/services/analytics";

interface DiplomaticCablesProps {
  onBack?: () => void;
}

const categories: Array<CableCategory | "all"> = ["all", "boundary", "distancing", "clarity", "de-escalation"];

const categoryLabels: Record<CableCategory | "all", string> = {
  all: "الكل",
  boundary: "حدود شخصية",
  distancing: "مسافة آمنة",
  clarity: "توضيح",
  "de-escalation": "تهدئة"
};

export const DiplomaticCables: React.FC<DiplomaticCablesProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<CableCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const cables = useMemo(() => {
    const filtered = getCablesByCategory(selectedCategory === "all" ? undefined : selectedCategory);
    if (!searchQuery) return filtered;
    return filtered.filter(c =>
      c.title.includes(searchQuery) || c.template.includes(searchQuery)
    );
  }, [selectedCategory, searchQuery]);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    trackEvent("cable_copied", { cableId: id });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full min-h-screen flex flex-col" style={{ background: "var(--space-void)" }} dir="rtl">
      {/* Header */}
      <header className="flex items-center gap-3 p-6 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md" style={{ background: "rgba(8,14,30,0.85)" }}>
        {onBack && (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="رجوع"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center border" style={{ background: "rgba(45,212,191,0.1)", borderColor: "rgba(45,212,191,0.3)" }}>
          <Send className="w-5 h-5 rotate-[320deg]" style={{ color: "var(--soft-teal)" }} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">الكابلات الدبلوماسية</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>رسائل استراتيجية جاهزة للتواصل بوضوح وحزم</p>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-6">
        {/* Filter & Search */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <input
              id="diplomatic-cables-search"
              name="diplomaticCablesSearch"
              type="text"
              placeholder="ابحث في الكابلات..."
              className="w-full rounded-xl py-2.5 pr-10 pl-4 text-sm outline-none transition-all text-right"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--text-primary)"
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = "var(--soft-teal)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                style={
                  selectedCategory === cat
                    ? { background: "var(--soft-teal)", color: "var(--space-void)" }
                    : { background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.06)" }
                }
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {cables.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg font-semibold" style={{ color: "var(--text-muted)" }}>لا توجد كابلات مطابقة</p>
          </div>
        )}

        {/* Cables Grid */}
        <div className="space-y-4">
          {cables.map((cable, i) => (
            <motion.div
              key={cable.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl p-6 space-y-4 transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
            >
              <div className="flex justify-between items-start">
                <div className="text-right flex-1 min-w-0 ml-3">
                  <h3 className="text-base font-bold text-white">{cable.title}</h3>
                  <span className="text-[10px] uppercase font-black tracking-widest" style={{ color: "var(--soft-teal)" }}>
                    {categoryLabels[cable.category as CableCategory] ?? cable.category}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(cable.id, cable.template)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0"
                  style={
                    copiedId === cable.id
                      ? { background: "rgba(52,211,153,0.15)", color: "#34d399" }
                      : { background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }
                  }
                  title={copiedId === cable.id ? "تم النسخ!" : "نسخ النص"}
                >
                  {copiedId === cable.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-4 rounded-xl text-right" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="leading-relaxed text-sm" style={{ color: "var(--text-secondary)" }}>
                  {cable.template.replace("{name}", "[اسم الشخص]")}
                </p>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "rgba(45,212,191,0.05)", border: "1px solid rgba(45,212,191,0.12)" }}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--soft-teal)" }} />
                <p className="text-[11px] leading-snug text-right" style={{ color: "var(--soft-teal)" }}>
                  ملاحظة: {cable.jarvisNote}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
