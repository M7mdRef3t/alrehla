import { useState, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, Settings,
    TrendingUp, BookOpen, Zap,
    Share2, Heart,
    Lightbulb, Network, Grid, Archive
} from "lucide-react";
import { useDailyJournalState } from "../state/dailyJournalState";
import { HealingEchoModal } from "./HealingEchoModal";
import { BlindCapsuleCreator } from "./BlindCapsuleCreator";
import { calculateEntropy } from "../services/predictiveEngine";
import { useAppOverlayState } from "../state/appOverlayState";

export interface InsightsLibraryProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InsightsLibrary: FC<InsightsLibraryProps> = ({ isOpen, onClose }) => {
    const rawEntries = useDailyJournalState((s) => s.getSortedEntries());
    const [filter, setFilter] = useState("الكل");
    const [viewMode, setViewMode] = useState<"grid" | "constellation">("grid");
    const [isEchoModalOpen, setIsEchoModalOpen] = useState(false);
    const [isCapsuleModalOpen, setIsCapsuleModalOpen] = useState(false);
  
    const currentEntropy = calculateEntropy().entropyScore;
    const openOverlay = useAppOverlayState((s) => s.openOverlay);
    
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: "100%" }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="fixed inset-0 z-[100] min-h-screen bg-[#090f15] text-[#dae7f6] overflow-hidden flex flex-col" 
                dir="rtl"
            >
                {/* Top Navigation Bar */}
            <header className="bg-[#090f15]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-[#c3feff]/15">
                <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-[#c3feff] drop-shadow-[0_0_8px_rgba(195,254,255,0.5)]">
                        مكتبة الاستبصارات
                    </h1>
                    
                    <div className="hidden lg:flex items-center gap-8">
                        <button className="text-[#c3feff] border-b-2 border-[#c3feff] pb-1 font-medium transition-all">المكتبة</button>
                        <button className="text-[#dae7f6]/60 hover:text-[#c3feff] hover:bg-[#c3feff]/5 px-2 py-1 rounded transition-all">الاستبصارات</button>
                        <button className="text-[#dae7f6]/60 hover:text-[#c3feff] hover:bg-[#c3feff]/5 px-2 py-1 rounded transition-all">المؤلفون</button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden sm:block">
                            <input 
                                className="bg-slate-800/50 border-none outline-none rounded-full py-2 pr-10 pl-4 text-sm focus:ring-1 focus:ring-teal-400/50 w-64 placeholder:text-slate-500" 
                                placeholder="بحث في الملاحظات..." 
                                type="text"
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <Settings className="w-5 h-5 text-slate-400" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-red-400">
                            اغلاق
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 lg:p-10 max-w-screen-2xl mx-auto w-full">
                
                {/* Stats Grid */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                >
                    <div className="rounded-xl p-6 flex items-center justify-between group transition-all" style={{ background: "rgba(27,39,50,0.4)", backdropFilter: "blur(20px)", border: "1px solid rgba(195,254,255,0.1)" }}>
                        <div>
                            <p className="text-slate-400 text-sm mb-1">إجمالي الاستبصارات</p>
                            <h3 className="text-3xl font-extrabold text-[#c3feff]">{Math.max(128, rawEntries.length)}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-[#c3feff]/10 flex items-center justify-center text-[#c3feff] group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    
                    <div className="rounded-xl p-6 flex items-center justify-between group transition-all" style={{ background: "rgba(27,39,50,0.4)", backdropFilter: "blur(20px)", border: "1px solid rgba(195,254,255,0.1)" }}>
                        <div>
                            <p className="text-slate-400 text-sm mb-1">أكثر الكتب إلهاماً</p>
                            <h3 className="text-xl font-bold text-[#c9bfff]">فن الوجود العميق</h3>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-[#c9bfff]/10 flex items-center justify-center text-[#c9bfff] group-hover:scale-110 transition-transform">
                            <BookOpen className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="rounded-xl p-6 flex items-center justify-between group transition-all" style={{ background: "rgba(27,39,50,0.4)", backdropFilter: "blur(20px)", border: "1px solid rgba(195,254,255,0.1)" }}>
                        <div>
                            <p className="text-slate-400 text-sm mb-1">سلسلة التدوين</p>
                            <h3 className="text-3xl font-extrabold text-[#c0e6f4]">١٥ يوماً</h3>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-[#c0e6f4]/10 flex items-center justify-center text-[#c0e6f4] group-hover:scale-110 transition-transform">
                            <Zap className="w-6 h-6" />
                        </div>
                    </div>
                </motion.div>

                <div className="flex justify-end mb-6 gap-3">
                    {currentEntropy < 30 && (
                       <button
                           onClick={() => setIsCapsuleModalOpen(true)}
                           className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-950 border border-emerald-800 hover:bg-emerald-900 text-emerald-400 font-bold text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse hover:animate-none group"
                       >
                           <Archive className="w-4 h-4" />
                           <span>كبسولة العمياء للمستقبل</span>
                       </button>
                    )}
                    <button
                        onClick={() => openOverlay("ruthlessMirror")}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-950/40 border border-red-900/50 hover:bg-red-900/60 text-red-400 font-bold text-sm transition-all shadow-md group"
                    >
                        <span>اختبار التناقض (مرآة الحقيقة)</span>
                    </button>
                    <button
                        onClick={() => setIsEchoModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 border border-slate-700/50 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 font-bold text-sm transition-all shadow-md group"
                    >
                        <Share2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                        <span>صدى التعافي</span>
                    </button>
                </div>

                {/* Filters and View Mode */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
                        {['الكل', 'أفكار يومية', 'إسقاطات', 'وعي ذاتي'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${filter === f ? 'bg-[#c3feff] text-[#090f15] font-bold' : 'bg-slate-800/50 hover:bg-slate-800 border border-white/5'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* View Mode Toggle */}
                        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/5">
                            <button 
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-slate-700/80 text-teal-400" : "text-slate-500 hover:text-slate-300"}`}
                                title="عرض البطاقات"
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode("constellation")}
                                className={`p-2 rounded-md transition-all ${viewMode === "constellation" ? "bg-slate-700/80 text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.3)]" : "text-slate-500 hover:text-slate-300"}`}
                                title="الشبكة المترابطة للأفكار"
                            >
                                <Network className="w-4 h-4" />
                            </button>
                        </div>
                        <span className="text-sm text-slate-400">ترتيب حسب:</span>
                        <select id="insights-sort" name="insightsSort" className="bg-slate-800/50 outline-none border border-white/5 text-sm rounded-lg py-2 pl-4 pr-3 focus:ring-1 focus:ring-teal-400/50">
                            <option>الأحدث أولاً</option>
                            <option>الأقدم أولاً</option>
                        </select>
                    </div>
                </motion.div>

                {/* Dynamic Content Area */}
                {rawEntries.length === 0 ? (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-16 text-center border border-dashed border-white/20 rounded-2xl p-12 bg-[#c3feff]/5">
                       <Lightbulb className="w-12 h-12 text-[#c3feff]/30 mx-auto mb-4" />
                       <h4 className="text-lg font-bold mb-2 text-white">ابدأ رحلة الاستكشاف</h4>
                       <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">لم تسجل أي استبصارات في مذكراتك اليومية بعد. ابدأ بالتأمل اليومي لتكوين شبكة أفكارك.</p>
                       <button onClick={onClose} className="px-8 py-3 bg-gradient-to-r from-teal-400 to-indigo-500 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_rgba(45,212,191,0.3)]">
                           العودة للملاذ
                       </button>
                   </motion.div>
                ) : viewMode === "constellation" ? (
                   /* 🔭 CONSTELLATION GRAPH VIEW 🔭 */
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full h-[600px] border border-white/10 rounded-2xl overflow-hidden bg-[#0a0e14]">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0e14] to-[#0a0e14] z-0" />
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ stroke: 'rgba(217, 70, 239, 0.2)', strokeWidth: 1.5 }}>
                            {rawEntries.map((e, i) => {
                                if (i === rawEntries.length - 1) return null;
                                const x1 = 20 + ((i * 37) % 60);
                                const y1 = 20 + ((i * 43) % 60);
                                const x2 = 20 + (((i + 1) * 37) % 60);
                                const y2 = 20 + (((i + 1) * 43) % 60);
                                return (
                                    <line key={`line-${i}`} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} />
                                );
                            })}
                        </svg>
                        {rawEntries.map((entry, idx) => {
                            const left = 20 + ((idx * 37) % 60);
                            const top = 20 + ((idx * 43) % 60);
                            return (
                                <motion.div 
                                    key={entry.id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: idx * 0.1, type: "spring" }}
                                    style={{ left: `${left}%`, top: `${top}%` }}
                                    className="absolute z-20 group cursor-pointer"
                                >
                                    <div className="w-4 h-4 rounded-full bg-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.8)] animate-pulse" />
                                    <div className="absolute top-6 right-1/2 translate-x-1/2 w-48 p-3 rounded-lg bg-slate-900/90 border border-fuchsia-500/30 backdrop-blur-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                                        <p className="text-[10px] text-fuchsia-300 mb-1 font-bold">{entry.questionText}</p>
                                        <p className="text-xs text-white line-clamp-3 leading-relaxed">{entry.answer}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                   </motion.div>
                ) : (
                    /* 📱 DYNAMIC BENTO GRID VIEW 📱 */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rawEntries.map((entry, idx) => (
                            <motion.div 
                                key={entry.id}
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                transition={{ delay: idx * 0.1 }}
                                className="rounded-xl p-6 flex flex-col h-full hover:shadow-[0_0_30px_rgba(195,254,255,0.1)] transition-all group border-r-2 border-r-[#c3feff]"
                                style={{ background: "rgba(27,39,50,0.4)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(195,254,255,0.1)", borderBottom: "1px solid rgba(195,254,255,0.1)", borderLeft: "1px solid rgba(195,254,255,0.1)" }}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#c3feff]" />
                                        <span className="text-[10px] font-bold text-[#c3feff] uppercase tracking-wider">استبصار إدراكي</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">{entry.date}</span>
                                </div>
                                <h4 className="text-sm font-bold text-[#c3feff] mb-2">{entry.questionText}</h4>
                                <p className="text-lg font-medium italic mb-4 opacity-90 leading-relaxed text-slate-100">"{entry.answer}"</p>
                                
                                <div className="mt-auto pt-4 flex justify-between items-center border-t border-white/10">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400">المرجع:</span>
                                        <span className="text-sm font-bold text-[#c9bfff]">تأملات الملاذ</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"><Share2 className="w-4 h-4" /></button>
                                        <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"><Heart className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
                <HealingEchoModal isOpen={isEchoModalOpen} onClose={() => setIsEchoModalOpen(false)} />
            <BlindCapsuleCreator isOpen={isCapsuleModalOpen} onClose={() => setIsCapsuleModalOpen(false)} />
            </main>
            </motion.div>
        </AnimatePresence>
    );
};
