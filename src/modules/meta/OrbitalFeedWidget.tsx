import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, ShieldCheck, Zap, Heart, Share2, Sparkles, TrendingUp, Users } from "lucide-react";
import { useMapState } from '@/modules/map/dawayirIndex';

interface FeedItem {
    id: string;
    orbitName: string;
    action: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
    timestamp: Date;
    likes: number;
}

const ORBIT_NAMES = ["زحل", "المريخ", "نبتون", "أندروميدا", "درب التبانة", "الجدي"];

const generateMockFeed = (): FeedItem[] => {
    return [
        {
            id: "f1",
            orbitName: "مدار زحل",
            action: "حافظ على حدوده ورفض استنزاف طاقته",
            value: "+150 طاقة",
            icon: <ShieldCheck className="w-4 h-4" />,
            colorClass: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20",
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            likes: 12
        },
        {
            id: "f2",
            orbitName: "مدار المريخ",
            action: "تخلص من علاقة سامة (Vampire) بنجاح",
            value: "درع التيتانيوم",
            icon: <Zap className="w-4 h-4" />,
            colorClass: "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-500/20",
            timestamp: new Date(Date.now() - 1000 * 60 * 25),
            likes: 45
        },
        {
            id: "f3",
            orbitName: "مدار أندروميدا",
            action: "أتم جلسة تفريغ ناجحة مع المعالج الذكي",
            value: "استقرار نفسي",
            icon: <Heart className="w-4 h-4" />,
            colorClass: "text-rose-400 bg-rose-400/10 border-rose-500/20",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            likes: 8
        }
    ];
};

export const OrbitalFeedWidget: React.FC = () => {
    const [feed, setFeed] = useState<FeedItem[]>(generateMockFeed());
    const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
    const nodes = useMapState((s) => s.nodes);

    // Simulate real-time mock incoming events
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.6) {
                const newOrbit = ORBIT_NAMES[Math.floor(Math.random() * ORBIT_NAMES.length)];
                const newItem: FeedItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    orbitName: `مدار ${newOrbit}`,
                    action: "أكمل تمرين رسم الحدود (Boundaries Simulator)",
                    value: "+200 XP",
                    icon: <Sparkles className="w-4 h-4" />,
                    colorClass: "text-violet-400 bg-violet-400/10 border-violet-500/20",
                    timestamp: new Date(),
                    likes: 0
                };
                setFeed(prev => [newItem, ...prev].slice(0, 10)); // Keep only max 10
            }
        }, 15000); // Check every 15 seconds

        return () => clearInterval(interval);
    }, []);

    const handleShareMyWin = () => {
        const newItem: FeedItem = {
            id: Math.random().toString(36).substr(2, 9),
            orbitName: "أنت (بشكل مجهول)",
            action: `تدير ${nodes.length} علاقة حالياً بوعي`,
            value: "مسار النضج",
            icon: <TrendingUp className="w-4 h-4" />,
            colorClass: "text-amber-400 bg-amber-400/10 border-amber-500/20",
            timestamp: new Date(),
            likes: 0
        };
        setFeed(prev => [newItem, ...prev].slice(0, 10));
    };

    const toggleLike = (id: string) => {
        setLikedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });

        setFeed(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, likes: item.likes + (likedItems.has(id) ? -1 : 1) };
            }
            return item;
        }));
    };

    const formatTime = (date: Date) => {
        const diffInMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
        if (diffInMinutes < 1) return "الآن";
        if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
        return date.toLocaleDateString("ar-EG");
    };

    return (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col h-[400px]">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-800/30">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
                        <Globe2 className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            المجتمع المداري <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live</span>
                        </h3>
                        <p className="text-[10px] text-slate-400">مشاركة مجهولة الهوية لانتصارات الوعي (Social Proof)</p>
                    </div>
                </div>
                <button
                    onClick={handleShareMyWin}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg transition-colors border border-sky-500/20 text-xs font-bold flex items-center gap-2"
                >
                    <Share2 className="w-3.5 h-3.5" />
                    انشر انتصاري
                </button>
            </div>

            {/* Feed Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {feed.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                            className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group hover:border-slate-700 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                                        <Users className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-300">مجهول من <span className="text-slate-100">{item.orbitName}</span></span>
                                </div>
                                <span className="text-[10px] text-slate-500">{formatTime(item.timestamp)}</span>
                            </div>

                            <p className="text-sm text-slate-300 pr-8">{item.action}</p>

                            <div className="flex items-center justify-between pr-8">
                                <span className={`text-xs font-bold px-2 py-1 rounded-md border flex items-center gap-1.5 w-max ${item.colorClass}`}>
                                    {item.icon} {item.value}
                                </span>

                                <button
                                    onClick={() => toggleLike(item.id)}
                                    className={`flex items-center gap-1.5 text-xs font-bold transition-all ${likedItems.has(item.id) ? "text-rose-400" : "text-slate-500 hover:text-rose-300"}`}
                                >
                                    <Heart className={`w-4 h-4 ${likedItems.has(item.id) ? "fill-current" : ""}`} />
                                    {item.likes}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
