import type { FC } from "react";
import { useState, useEffect, useMemo } from "react";
import { MessageSquare, ThumbsUp, ThumbsDown, Search, Filter, Loader2, Calendar, User, Zap, AlertCircle } from "lucide-react";
import { isSupabaseReady, supabase } from "../../../../services/supabaseClient";

interface FeedbackItem {
    id: string;
    created_at: string;
    content: string;
    rating?: "up" | "down" | null;
    source?: string;
    user_id?: string;
    // potentially other fields like status, tags, etc.
}

export const FeedbackPanel: FC = () => {
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRating, setFilterRating] = useState<"all" | "up" | "down">("all");
    const [limit, setLimit] = useState(50);

    const loadFeedback = async () => {
        if (!isSupabaseReady || !supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("feedback")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error) throw error;
            setItems(data as FeedbackItem[]);
        } catch (err) {
            console.error("Failed to fetch feedback", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadFeedback();
    }, [limit]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.source || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRating = filterRating === "all" || item.rating === filterRating;
            return matchesSearch && matchesRating;
        });
    }, [items, searchTerm, filterRating]);

    const stats = useMemo(() => {
        const total = items.length;
        const positive = items.filter(i => i.rating === "up").length;
        const negative = items.filter(i => i.rating === "down").length;
        const positiveRate = total > 0 ? Math.round((positive / (positive + negative || 1)) * 100) : 0;
        return { total, positive, negative, positiveRate };
    }, [items]);

    const handleLoadMore = () => {
        setLimit(prev => prev + 50);
    };

    return (
        <div className="space-y-6 text-slate-200" dir="rtl">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="admin-glass-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">إجمالي الملاحظات</p>
                        <p className="text-xl font-black text-white">{stats.total}</p>
                    </div>
                </div>
                <div className="admin-glass-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <ThumbsUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">إيجابية</p>
                        <p className="text-xl font-black text-emerald-400">{stats.positive}</p>
                    </div>
                </div>
                <div className="admin-glass-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                        <ThumbsDown className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">سلبية</p>
                        <p className="text-xl font-black text-rose-400">{stats.negative}</p>
                    </div>
                </div>
                <div className="admin-glass-card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">نسبة الرضا</p>
                        <p className="text-xl font-black text-teal-400">{stats.positiveRate}%</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center admin-glass-card p-4 sticky top-4 z-10 backdrop-blur-xl bg-slate-950/80 border-slate-800">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="بحث في المحتوى..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pr-9 pl-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
                        <button
                            onClick={() => setFilterRating("all")}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${filterRating === "all" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-300"}`}
                        >
                            الكل
                        </button>
                        <button
                            onClick={() => setFilterRating("up")}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 ${filterRating === "up" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:text-emerald-400"}`}
                        >
                            <ThumbsUp className="w-3 h-3" />
                            مفيد
                        </button>
                        <button
                            onClick={() => setFilterRating("down")}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 ${filterRating === "down" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "text-slate-400 hover:text-rose-400"}`}
                        >
                            <ThumbsDown className="w-3 h-3" />
                            غير مفيد
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Filter className="w-3.5 h-3.5" />
                    <span>{filteredItems.length} نتيجة</span>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                    <div key={item.id} className="admin-glass-card p-5 group hover:border-slate-600 transition-all duration-300 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!item.rating ? 'bg-slate-800 text-slate-400' : item.rating === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                    {!item.rating ? <User className="w-4 h-4" /> : item.rating === 'up' ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-300">{item.source || "غير محدد"}</p>
                                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(item.created_at).toLocaleDateString('ar-EG')}
                                    </p>
                                </div>
                            </div>
                            {item.rating && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.rating === 'up' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                    {item.rating === 'up' ? 'إيجابي' : 'سلبي'}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 bg-slate-900/30 rounded-lg p-3 border border-slate-800 mb-3">
                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                                {item.content}
                            </p>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-800/50 mt-auto">
                            <span className="text-[10px] text-slate-600 font-mono">ID: {item.id.slice(0, 8)}</span>
                            <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">عرض التفاصيل</button>
                        </div>
                    </div>
                ))}
            </div>

            {items.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 admin-glass-card rounded-2xl border-dashed border-slate-800">
                    <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                    <p>لا توجد تغذية راجعة حتى الآن.</p>
                </div>
            )}

            {loading && (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                </div>
            )}

            {!loading && items.length >= limit && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={handleLoadMore}
                        className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all border border-slate-700 flex items-center gap-2"
                    >
                        تحميل المزيد
                    </button>
                </div>
            )}
        </div>
    );
};
