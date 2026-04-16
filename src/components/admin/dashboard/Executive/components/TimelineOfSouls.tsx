import type { FC } from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, HeartPulse, BrainCircuit } from "lucide-react";
import { supabase, isSupabaseReady } from "@/services/supabaseClient";

interface SoulEvent {
    id: string;
    userName: string;
    action: string;
    timeAgo: string;
    type: "healing" | "milestone" | "ai_insight" | "protection";
    details?: string;
    status?: string;
}

const EVENT_TEMPLATES = [
    { type: "healing", action: "أكمل جلسة تعافي عميقة", icon: HeartPulse, color: "emerald" },
    { type: "milestone", action: "أضاف شخص جديد لخريطة العلاقات", icon: ArrowRight, color: "teal" },
    { type: "ai_insight", action: "تلقى إدراك مفصلي من جارفيس", icon: BrainCircuit, color: "purple" },
    { type: "protection", action: "فعّل كبسولة حماية الحدود", icon: ShieldCheck, color: "sky" }
];

const NAMES = ["مُسافر صامت", "روح متحولة", "طالب سكينة", "صائد وعي", "نواة مضيئة"];

const formatTimeAgo = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "الآن";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "الآن";
    
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "الآن";
    if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
    if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
    if (seconds < 172800) return "منذ يوم";
    if (seconds < 259200) return "منذ يومين";
    return `منذ ${Math.floor(seconds / 86400)} يوم`;
};

const generateRandomEvent = (): SoulEvent => {
    const tpl = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    return {
        id: Math.random().toString(36).substring(7),
        userName: name,
        action: tpl.action,
        type: tpl.type as any,
        timeAgo: "الآن"
    };
};

const mapDatabaseRowToSoulEvent = (row: any): SoulEvent => {
    // للحفاظ على الخصوصية، نظهر أسماء مستعارة
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    let type: SoulEvent["type"] = "healing";
    let action = "نفّذ حدثاً في رحلته";

    const evtName = row.event_name?.toLowerCase() || "";
    
    if (evtName.includes('pulse') || evtName.includes('healing')) {
        type = "healing";
        action = "أتم جلسة تفريغ سريعة (Pulse)";
    } else if (evtName.includes('auth') || evtName.includes('login') || evtName.includes('signup')) {
        type = "milestone";
        action = "عبر البوابة وبدأ رحلته";
    } else if (evtName.includes('ai') || evtName.includes('chat') || evtName.includes('insight') || evtName.includes('interaction')) {
        type = "ai_insight";
        action = "تفاعل مع مستشار الرحلة العميق";
    } else if (evtName.includes('boundary') || evtName.includes('gate') || evtName.includes('protection') || evtName.includes('marketing')) {
        type = "protection";
        action = "خطا خطوة في حماية المساحة الشخصية";
    } else {
        type = "milestone";
        action = `سجل حدثاً: ${evtName.replace(/_/g, " ")}`;
    }

    return {
        id: row.id,
        userName: name,
        action,
        type,
        timeAgo: formatTimeAgo(row.created_at)
    };
};

const mapAiDecisionToSoulEvent = (row: any): SoulEvent => {
    const name = "جارفيس (النظام)";
    let type: SoulEvent["type"] = "ai_insight";
    let action = "تدخل ذكي واصدار إدراك فوري";

    const aiType = row.type?.toUpperCase() || "";
    if (aiType === "INJECT_WHISPER" || aiType === "PROPOSE_ACTION") {
        action = "إرسال همسة وتوجيه دقيق لمسار الرحلة";
    } else if (aiType === "OVERRIDE" || aiType === "FORCE_STOP") {
        type = "protection";
        action = "تدخل وقائي لحماية مسار الرحلة";
    } else if (aiType === "ANALYZE_PATTERN") {
        action = "التقاط نمط سلوكي شامل في المنصة";
    }

    return {
        id: row.id,
        userName: name,
        action,
        type,
        timeAgo: formatTimeAgo(row.created_at),
        details: row.reasoning,
        status: row.outcome
    };
};

export const TimelineOfSouls: FC = () => {
    const [events, setEvents] = useState<SoulEvent[]>([]);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        let analyticsSub: any;
        let aiSub: any;
        let isMounted = true;

        const loadInitialEvents = async () => {
            if (isSupabaseReady && supabase) {
                const [analyticsRes, aiRes] = await Promise.all([
                    supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(4),
                    supabase.from('dawayir_ai_decisions').select('*').order('created_at', { ascending: false }).limit(4)
                ]);
                
                let allEvents: SoulEvent[] = [];
                if (!analyticsRes.error && analyticsRes.data) {
                    allEvents = [...allEvents, ...analyticsRes.data.map(mapDatabaseRowToSoulEvent)];
                }
                if (!aiRes.error && aiRes.data) {
                    allEvents = [...allEvents, ...aiRes.data.map(mapAiDecisionToSoulEvent)];
                }
                
                if (allEvents.length > 0 && isMounted) {
                    // Mix and show up to 8
                    setEvents(allEvents.slice(0, 8));
                    setIsLive(true);
                } else if (isMounted) {
                    setEvents(Array.from({ length: 4 }).map(generateRandomEvent));
                }
            } else {
                setEvents(Array.from({ length: 4 }).map(generateRandomEvent));
            }
        };

        void loadInitialEvents();

        if (isSupabaseReady && supabase) {
            analyticsSub = supabase.channel('timeline-of-souls-analytics')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analytics_events' }, (payload) => {
                    if (isMounted) {
                        const newEvent = mapDatabaseRowToSoulEvent(payload.new);
                        setEvents(prev => [newEvent, ...prev].slice(0, 8));
                        setIsLive(true);
                    }
                })
                .subscribe();

            aiSub = supabase.channel('timeline-of-souls-ai')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dawayir_ai_decisions' }, (payload) => {
                    if (isMounted) {
                        const newEvent = mapAiDecisionToSoulEvent(payload.new);
                        setEvents(prev => [newEvent, ...prev].slice(0, 8));
                        setIsLive(true);
                    }
                })
                .subscribe();
        }

        // Sim fallback if no real events occur to keep it looking alive?
        // Let's only run sim interval if not live, or just keep it entirely real if configured to real
        // But local might be idle, so let's keep a slow sim heartbeat for aesthetics if not live
        const interval = setInterval(() => {
            if (!isLive) {
                setEvents(prev => {
                    const newEvent = generateRandomEvent();
                    return [newEvent, ...prev].slice(0, 8);
                });
            }
        }, 12000);

        return () => {
            isMounted = false;
            clearInterval(interval);
            if (analyticsSub && supabase) supabase.removeChannel(analyticsSub);
            if (aiSub && supabase) supabase.removeChannel(aiSub);
        };
    }, [isLive]);

    const getColorClass = (type: string) => {
        switch (type) {
            case "healing": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
            case "milestone": return "text-teal-400 bg-teal-500/10 border-teal-500/20";
            case "ai_insight": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
            case "protection": return "text-sky-400 bg-sky-500/10 border-sky-500/20";
            default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
        }
    };

    const getGlowClass = (type: string) => {
        switch (type) {
            case "healing": return "shadow-[0_0_15px_rgba(16,185,129,0.3)]";
            case "milestone": return "shadow-[0_0_15px_rgba(45,212,191,0.3)]";
            case "ai_insight": return "shadow-[0_0_15px_rgba(168,85,247,0.3)]";
            case "protection": return "shadow-[0_0_15px_rgba(56,189,248,0.3)]";
            default: return "";
        }
    };

    return (
        <div className="relative flex flex-col h-full bg-[#050814] rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden group">
            {/* Ambient Backgrounds */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-[50px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 blur-[50px] pointer-events-none" />
            
            <div className="p-5 border-b border-white/5 flex items-center justify-between relative z-10 bg-slate-900/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                        <Sparkles className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-3">
                            شريط الأرواح الموازي
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    const url = new URL(window.location.href);
                                    url.searchParams.set("tab", "flow-map");
                                    window.history.pushState({}, "", url.toString());
                                    window.dispatchEvent(new PopStateEvent("popstate"));
                                }}
                                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] lowercase tracking-normal text-teal-300 transition-all font-bold group-hover:bg-white/20"
                            >
                                خريطة المسارات
                            </button>
                        </h3>
                        <p className="text-[10px] text-teal-400 font-bold tracking-widest mt-0.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                            بث مباشر للإدراك
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative p-4 z-10">
                {/* Fade Mask at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#050814] to-transparent z-20 pointer-events-none" />
                
                <div className="space-y-4">
                    <AnimatePresence initial={false}>
                        {events.map((evt) => {
                            const TplIcon = EVENT_TEMPLATES.find(t => t.type === evt.type)?.icon || Sparkles;
                            const colors = getColorClass(evt.type);
                            const glow = getGlowClass(evt.type);

                            return (
                                <motion.div
                                    key={evt.id}
                                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    className={`relative p-3 rounded-xl border flex items-start gap-4 backdrop-blur-md ${colors} ${glow} group/item`}
                                >
                                    <div className="p-2 rounded-lg bg-slate-950/50 border border-white/5 shadow-inner">
                                        <TplIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-black text-white/90 truncate">{evt.userName}</span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 shrink-0">{evt.timeAgo}</span>
                                        </div>
                                        <p className="text-[11px] font-medium opacity-80 leading-relaxed truncate">{evt.action}</p>
                                        
                                        {evt.details && (
                                            <div className="mt-2 p-2 rounded bg-slate-900/50 border border-white/5">
                                                <p className="text-[9px] text-slate-300 leading-relaxed line-clamp-2" title={evt.details}>{evt.details}</p>
                                                {evt.status && (
                                                    <span className={`inline-block mt-1.5 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${evt.status === 'executed' ? 'bg-teal-500/10 text-teal-400' : evt.status === 'pending_approval' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                        {evt.status === 'executed' ? 'تم التنفيذ' : evt.status === 'pending_approval' ? 'مطلوب تصديق' : 'مرفوض/ملغى'}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
