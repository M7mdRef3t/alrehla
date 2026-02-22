/**
 * Diplomatic Cables UI — واجهة البرقيات الدبلوماسية ✉️
 * ==========================================
 * تتيح للقائد اختيار وتخصيص قوالب الرسائل الذكية.
 */

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Send, Copy, Info, Search, CheckCircle2 } from "lucide-react";
import { getCablesByCategory, type CableCategory } from "../services/diplomacyService";
import { trackEvent } from "../services/analytics";

export const DiplomaticCables: React.FC = () => {
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
        <div className="w-full max-w-2xl mx-auto p-6 space-y-8">
            <header>
                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                    <Send className="w-6 h-6 text-indigo-400 rotate-[320deg]" />
                    البرقيات الدبلوماسية
                </h1>
                <p className="text-slate-500 text-sm mt-1">ترسانة الردود الاستراتيجية للتواصل بوضوح وحزم.</p>
            </header>

            {/* Filter & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="بحث في البرقيات..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-10 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                                ? "bg-indigo-500 text-white"
                                : "bg-white/5 text-slate-400 border border-white/5 hover:border-white/20"
                                }`}
                        >
                            {cat === "all" ? "الكل" : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cables Grid */}
            <div className="space-y-4">
                {cables.map((cable) => (
                    <motion.div
                        key={cable.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-6 border-white/5 bg-slate-900/40 space-y-4 hover:border-white/10 transition-colors"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-white">{cable.title}</h3>
                                <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400/60">
                                    التصنيف: {cable.category}
                                </span>
                            </div>
                            <button
                                onClick={() => handleCopy(cable.id, cable.template)}
                                className={`p-2 rounded-lg transition-all ${copiedId === cable.id
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-white/5 text-slate-400 hover:text-white"
                                    }`}
                            >
                                {copiedId === cable.id ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 relative">
                            <p className="text-slate-300 leading-relaxed text-right dir-rtl">
                                {cable.template.replace("{name}", "[اسم العضو]")}
                            </p>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-indigo-300/70 leading-snug">
                                نصيحة جارفيس: {cable.jarvisNote}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
    const categories: Array<CableCategory | "all"> = ["all", "boundary", "distancing", "clarity", "de-escalation"];
