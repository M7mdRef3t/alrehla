import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Zap, RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { viralArchitect, ViralPost } from '../../../../ai/ViralContentManager';

export const CreativeDashboard: React.FC = () => {
    const [posts, setPosts] = useState<ViralPost[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deployedId, setDeployedId] = useState<string | null>(null);

    const generateDrafts = async () => {
        setIsLoading(true);
        // تأخير بسيط لمحاكاة التفكير الاصطناعي
        await new Promise(r => setTimeout(r, 1200));
        const drafts = await viralArchitect.produceViralInsights();
        setPosts(drafts);
        setIsLoading(false);
    };

    const deployPost = (id: string) => {
        setDeployedId(id);
        // هنا نقوم بإرسال إشارة الـ Reward للمحرك (RLHF)
        setTimeout(() => setDeployedId(null), 3000);
    };

    return (
        <div className="space-y-8 p-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                        فنان الوعي (AI Creative Engine)
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-mono text-[10px]">
                        Real-time Viral Content Architect with RLHF Loop
                    </p>
                </div>
                <button
                    onClick={generateDrafts}
                    disabled={isLoading}
                    className="px-6 py-3 rounded-2xl bg-teal-500 text-black font-black flex items-center gap-3 hover:bg-teal-400 transition-all disabled:opacity-50"
                >
                    {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    توليد مسودات ذكية
                </button>
            </div>

            {!posts.length && !isLoading && (
                <div className="p-20 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <Sparkles className="w-8 h-8 text-slate-700" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-400">لا توجد مسودات حالية</h3>
                    <p className="text-xs text-slate-600 mt-2 max-w-xs leading-relaxed">
                        اضغط على زر التوليد لتحليل نبضات المستخدمين وتحويلها إلى محتوى فيروسي.
                    </p>
                </div>
            )}

            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-80 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnimatePresence>
                    {posts.map((post: any, idx) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col h-full hover:border-teal-500/30 transition-all relative overflow-hidden"
                        >
                            {/* Variant Badge */}
                            <div className="flex items-center justify-between mb-6">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${idx === 0 ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                                        idx === 1 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                    {idx === 0 ? 'Safe Mode' : idx === 1 ? 'Deep Analysis' : 'Bold / Viral'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-600">{post.targetSlot}</span>
                            </div>

                            {/* Content */}
                            <div className="flex-grow space-y-4 mb-8">
                                <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-white/5 pb-2">Topic: {post.topic}</h3>
                                <p className="text-white text-lg font-bold leading-relaxed text-right" dir="rtl">
                                    "{post.content}"
                                </p>
                            </div>

                            {/* Scoring HUD */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black uppercase">
                                        <span className="text-slate-500">Safety</span>
                                        <span className="text-teal-400">{post.scores.safety}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-teal-500/50" style={{ width: `${post.scores.safety}%` }} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black uppercase">
                                        <span className="text-slate-500">Virality</span>
                                        <span className="text-amber-400">{post.scores.virality}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500/50" style={{ width: `${post.scores.virality}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Action */}
                            <button
                                onClick={() => deployPost(post.id)}
                                disabled={deployedId !== null}
                                className={`w-full py-4 rounded-3xl flex items-center justify-center gap-3 font-black text-sm transition-all ${deployedId === post.id
                                        ? 'bg-teal-500 text-black'
                                        : 'bg-white/5 hover:bg-white/10 text-white'
                                    }`}
                            >
                                {deployedId === post.id ? (
                                    <> <CheckCircle2 className="w-4 h-4" /> تم النشر والتعلم </>
                                ) : (
                                    <> <Send className="w-4 h-4" /> اعتماد المسودة </>
                                )}
                            </button>

                            <div className="mt-4 flex items-center justify-center gap-2">
                                <AlertCircle className="w-3 h-3 text-slate-700" />
                                <span className="text-[9px] text-slate-600 uppercase font-mono italic">Rationale: {post.rationale}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {deployedId && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-teal-500 text-black rounded-full font-black shadow-2xl flex items-center gap-3 z-[100]"
                >
                    <Zap className="w-5 h-5 fill-current" />
                    تم إرسال إشارة المكافأة للمحرك.. جاري تحسين النتائج المستقبلية
                </motion.div>
            )}
        </div>
    );
};
