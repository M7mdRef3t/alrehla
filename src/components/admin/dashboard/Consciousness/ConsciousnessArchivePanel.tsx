import type { FC } from "react";
import { useState, useEffect, useMemo } from "react";
import {
    Brain,
    Search,
    Calendar,
    GitCommit,
    MessageCircle,
    Compass,
    Hash,
    Clock,
    Filter,
    Layers,
    Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type MemoryMatch } from "@/services/consciousnessService";
import { AdminTooltip } from "../Overview/components/AdminTooltip";

// Mock service if not fully implemented, or use existing
// Logic: reusing the existing fetch logic but enhancing UI
const MOCK_ARCHIVE_DATA: MemoryMatch[] = [
    // Fallback if API returns empty during dev
];

export const ConsciousnessArchivePanel: FC = () => {
    const [items, setItems] = useState<MemoryMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<"all" | "pulse" | "chat" | "note">("all");
    const [selectedMemory, setSelectedMemory] = useState<MemoryMatch | null>(null);

    // Initial Load
    useEffect(() => {
        // Simulating load for now, replacing with actual API call
        setLoading(true);
        // In real app: consciousnessService.fetchArchive().then(setItems)
        // For demo:
        setTimeout(() => {
            const demoData: MemoryMatch[] = Array.from({ length: 15 }).map((_, i) => ({
                id: `mem_${i}`,
                content: `تجربة وعي رقم ${i + 1}: ${[
                    "شعور بالهدوء بعد التأمل.",
                    "تساؤل حول معنى الرحلة.",
                    "اتصال عميق مع الذات.",
                    "لحظة إدراك مفاجئة.",
                    "رغبة في التغيير."
                ][i % 5]
                    }`,
                metadata: {
                    source: (["pulse", "chat", "note"][i % 3]) as any,
                    mood: (["calm", "anxious", "excited"][i % 3]),
                    tags: ["awareness", "journey"]
                },
                similarity: 0.8 + (Math.random() * 0.2),
                created_at: new Date(Date.now() - i * 86400000).toISOString() // Days ago
            }));
            setItems(demoData);
            setLoading(false);
        }, 1200);
    }, []);

    // Filtering & Searching
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.content.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = activeFilter === "all" || (item.source || "pulse") === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [items, searchQuery, activeFilter]);

    // Stats
    const stats = useMemo(() => ({
        total: items.length,
        pulseInfo: items.filter(i => (i.source || "pulse") === "pulse").length,
        chatInfo: items.filter(i => (i.source) === "chat").length,
        notes: items.filter(i => (i.source) === "note").length,
    }), [items]);

    return (
        <div className="space-y-6 text-slate-200" dir="rtl">

            {/* Header Area */}
            <div className="relative overflow-hidden rounded-3xl admin-glass-card border-purple-500/20 bg-gradient-to-br from-indigo-900/40 via-purple-900/10 to-slate-900 p-8">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-purple-500 to-indigo-500 opacity-50" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                <Brain className="w-6 h-6 text-purple-300" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                    أرشيف الوعي
                                    <AdminTooltip content="سجل دائم ومحرك بحث دلالي (Semantic Search) بيوصل لكل اللحظات، النبضات، والمحادثات المخزنة في ذاكرة النظام للاستدلال السريع." position="bottom" />
                                </h2>
                                <p className="text-xs font-mono text-purple-300/80 mt-1">Consciousness Archive v1.0</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
                            سجل حي لكل تفاعلات الوعي، الذكريات، ولحظات الإدراك. يتم هنا حفظ وتحليل الأنماط العقلية والشعورية للمسافرين.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="text-center px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">الذاكرة الكلية</div>
                            <div className="text-xl font-black text-white">{stats.total}</div>
                        </div>
                        <div className="hidden sm:block text-center px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">نبضات</div>
                            <div className="text-xl font-black text-emerald-400">{stats.pulseInfo}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Toolbar */}
            <div className="sticky top-4 z-20 admin-glass-card p-2 rounded-2xl bg-slate-950/80 backdrop-blur-xl border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                    {[
                        { id: "all", label: "الكل", icon: <Layers className="w-3.5 h-3.5" /> },
                        { id: "pulse", label: "البوصلة", icon: <Compass className="w-3.5 h-3.5" /> },
                        { id: "chat", label: "المحادثات", icon: <MessageCircle className="w-3.5 h-3.5" /> },
                        { id: "note", label: "الملاحظات", icon: <Hash className="w-3.5 h-3.5" /> }
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeFilter === filter.id
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                }`}
                        >
                            {filter.icon}
                            {filter.label}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="بحث في الذاكرة (Semantic Search)..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
            </div>

            {/* Timeline / Memory Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 relative min-h-[400px]">
                {loading ? (
                    <div className="col-span-full flex flex-col items-center justify-center pt-20">
                        <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mb-4" />
                        <p className="text-xs font-mono text-purple-400 animate-pulse">جاري استرجاع الأنماط العصبية...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center pt-20 text-slate-500 text-center">
                        <Brain className="w-16 h-16 opacity-20 mb-4" />
                        <p className="text-sm">لا توجد ذكريات تطابق البحث.</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item, index) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                key={item.id}
                                onClick={() => setSelectedMemory(item)}
                                className="group relative admin-glass-card p-5 cursor-pointer hover:border-purple-500/40 hover:bg-purple-500/5 transition-all"
                            >
                                {/* Connector Line (Visual only) */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full h-6 w-px bg-slate-800 group-hover:bg-purple-500/30 transition-colors" />

                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${(item.source || "pulse") === "chat" ? "bg-blue-500/10 text-blue-400" :
                                            (item.source || "pulse") === "pulse" ? "bg-emerald-500/10 text-emerald-400" :
                                                "bg-amber-500/10 text-amber-400"
                                            }`}>
                                            {(item.source || "pulse") === "chat" ? <MessageCircle className="w-3.5 h-3.5" /> :
                                                (item.source || "pulse") === "pulse" ? <Compass className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                            {(item.source || "pulse")}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-600 group-hover:text-purple-400 transition-colors flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(item.created_at || "").toLocaleDateString("en-GB")}
                                    </span>
                                </div>

                                <p className="text-sm text-slate-300 leading-relaxed line-clamp-3 mb-4 font-medium group-hover:text-white transition-colors">
                                    {item.content}
                                </p>

                                <div className="flex items-center gap-2 mt-auto">
                                    {/* Mock Tags */}
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                                        #awareness
                                    </span>
                                    {item.similarity && (
                                        <div className="ml-auto flex items-center gap-1 text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                                            <Activity className="w-3 h-3" />
                                            {Math.round(item.similarity * 100)}%
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedMemory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMemory(null)}>
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-2xl bg-[#0B0C15] border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-900/20 overflow-hidden"
                        >
                            <div className="h-32 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 relative p-6 flex flex-col justify-end">
                                <div className="absolute top-4 left-4 p-2 rounded-full bg-black/20 text-white/50 hover:bg-black/40 hover:text-white cursor-pointer transition-colors" onClick={() => setSelectedMemory(null)}>
                                    <span className="text-xl">×</span>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-1">تفاصيل الذكرى</h3>
                                <p className="text-xs text-purple-200 font-mono flex items-center gap-2">
                                    ID: {selectedMemory.id} <span className="opacity-50">•</span> {new Date(selectedMemory.created_at || "").toLocaleString("en-US")}
                                </p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <GitCommit className="w-4 h-4" />
                                        المحتوى الأساسي
                                    </h4>
                                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 leading-loose text-base">
                                        {selectedMemory.content}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                                        <h5 className="text-[10px] text-slate-500 uppercase mb-2">المصدر</h5>
                                        <div className="text-sm font-bold text-white capitalize flex items-center gap-2">
                                            {selectedMemory.source || "غير معروف"}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                                        <h5 className="text-[10px] text-slate-500 uppercase mb-2">الحالة الشعورية (Mood)</h5>
                                        <div className="text-sm font-bold text-white capitalize">
                                            {/* Mood logic removed as it's not in MemoryMatch */}
                                            غير متوفر
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-800/50">
                                    <button onClick={() => setSelectedMemory(null)} className="px-6 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors">
                                        إغلاق
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
