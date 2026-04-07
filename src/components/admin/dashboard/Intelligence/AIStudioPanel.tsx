import type { FC } from "react";
import { useState, useEffect, useRef } from "react";
import {
    Sparkles,
    Loader2,
    ThumbsUp,
    ThumbsDown,
    Brain,
    MessageSquare,
    Settings,
    Save,
    RotateCcw,
    Terminal,
    Activity,
    Cpu,
    Send,
    Eraser,
    History,
    Zap,
    ExternalLink,
    CheckCircle
} from "lucide-react";
import { AdminTooltip } from "../Overview/components/AdminTooltip";
import { julesService, JulesSession, JulesSource } from "@/services/julesService";

import { motion, AnimatePresence } from "framer-motion";
import { useAdminState } from "@/state/adminState";
import { isSupabaseReady } from "@/services/supabaseClient";
import { geminiClient } from "@/services/geminiClient";
import { saveSystemPrompt, saveScoring, saveAiLog, rateAiLog as rateAiLogRemote } from "@/services/adminApi";

export const AIStudioPanel: FC = () => {
    // Global State
    const systemPrompt = useAdminState((s) => s.systemPrompt);
    const setSystemPrompt = useAdminState((s) => s.setSystemPrompt);
    const scoringWeights = useAdminState((s) => s.scoringWeights);
    const scoringThresholds = useAdminState((s) => s.scoringThresholds);
    const setScoringWeights = useAdminState((s) => s.setScoringWeights);
    const setScoringThresholds = useAdminState((s) => s.setScoringThresholds);
    const aiLogs = useAdminState((s) => s.aiLogs);
    const addAiLog = useAdminState((s) => s.addAiLog);
    const rateAiLog = useAdminState((s) => s.rateAiLog);
    const clearAiLogs = useAdminState((s) => s.clearAiLogs);

    // Local State
    const [promptDraft, setPromptDraft] = useState(systemPrompt);
    const [weightsDraft, setWeightsDraft] = useState(scoringWeights);
    const [thresholdDraft, setThresholdDraft] = useState(scoringThresholds);
    const [playInput, setPlayInput] = useState("");
    const [playMessages, setPlayMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"editor" | "playground" | "logs" | "jules">("editor");

    // Jules Local State
    const [julesSessions, setJulesSessions] = useState<JulesSession[]>([]);
    const [julesSources, setJulesSources] = useState<JulesSource[]>([]);
    const [julesLoading, setJulesLoading] = useState(false);

    // Jules New Task State
    const [showTaskCreator, setShowTaskCreator] = useState(false);
    const [newTask, setNewTask] = useState({
        title: "",
        prompt: "",
        source: "",
        autoCreatePR: true
    });
    const [creatingTask, setCreatingTask] = useState(false);


    const chatEndRef = useRef<HTMLDivElement>(null);

    // Sync State
    useEffect(() => {
        setPromptDraft(systemPrompt);
    }, [systemPrompt]);

    useEffect(() => {
        if (activeTab === "playground") {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        if (activeTab === "jules") {
            loadJulesData();
        }
    }, [playMessages, activeTab]);

    const loadJulesData = async () => {
        setJulesLoading(true);
        const [sessions, sources] = await Promise.all([
            julesService.listSessions(),
            julesService.listSources()
        ]);
        setJulesSessions(sessions);
        setJulesSources(sources);
        setJulesLoading(false);
    };

    const handleApproveJulesPlan = async (sessionId: string) => {
        const success = await julesService.approvePlan(sessionId);
        if (success) {
            loadJulesData();
        }
    };

    const handleCreateJulesTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.source || !newTask.prompt || !newTask.title) return;

        setCreatingTask(true);
        const session = await julesService.createSession({
            title: newTask.title,
            prompt: newTask.prompt,
            source: newTask.source,
            autoCreatePR: newTask.autoCreatePR
        });

        if (session) {
            setNewTask({ title: "", prompt: "", source: "", autoCreatePR: true });
            setShowTaskCreator(false);
            loadJulesData();
        }
        setCreatingTask(false);
    };


    // Handlers
    const handleSavePrompt = async () => {
        const next = promptDraft.trim();
        setSystemPrompt(next);
        if (isSupabaseReady) {
            await saveSystemPrompt(next);
        }
    };

    const handleSaveScoring = async () => {
        setScoringWeights(weightsDraft);
        setScoringThresholds(thresholdDraft);
        if (isSupabaseReady) {
            await saveScoring(weightsDraft, thresholdDraft);
        }
    };

    const runPlayground = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!playInput.trim() || loading) return;

        const userText = playInput.trim();
        setPlayMessages((prev) => [...prev, { role: "user", content: userText }]);
        setPlayInput("");
        setLoading(true);

        try {
            const prompt = `${promptDraft.trim()}\n\nالمستخدم: ${userText}\nالمساعد:`;
            const response = await geminiClient.generate(prompt);
            const finalText = response ?? "تعذر الوصول للشبكة العصبية.";

            setPlayMessages((prev) => [...prev, { role: "assistant", content: finalText }]);

            const entry = {
                id: `ai_${Date.now()}`,
                createdAt: Date.now(),
                prompt: userText,
                response: finalText,
                source: "playground"
            } as const;

            addAiLog(entry);
            if (isSupabaseReady) {
                await saveAiLog(entry);
            }
        } catch (error) {
            setPlayMessages((prev) => [...prev, { role: "assistant", content: "حدث خطأ في الاتصال بالشبكة." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20 font-sans text-right" dir="rtl">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 bg-slate-950/40 backdrop-blur-3xl rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-50" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                        <Brain className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-2xl font-black text-white tracking-tight">مختبر الذكاء</h3>
                            <AdminTooltip content="غرفة تحكم مركزية للذكاء الاصطناعي لتجربة نماذج Gemini وتعديل سلوك الـ System Prompt ومراجعة الـ Logs الخاصة به." position="bottom" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
                            <p className="text-[10px] text-slate-500 font-bold">المحرك العصبي متصل • Gemini Pro</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="relative z-10 flex p-1 bg-slate-900/50 rounded-xl border border-white/5">
                    {[
                        { id: "editor", label: "التوجيه", icon: <Terminal className="w-4 h-4" /> },
                        { id: "playground", label: "المحاكاة", icon: <MessageSquare className="w-4 h-4" /> },
                        { id: "jules", label: "الأتمتة (Jules)", icon: <Zap className="w-4 h-4" /> },
                        { id: "logs", label: "السجلات", icon: <History className="w-4 h-4" /> }
                    ].map(tab => (

                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${activeTab === tab.id
                                ? "bg-indigo-500 text-white shadow-lg"
                                : "text-slate-400 hover:text-indigo-300"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence mode="wait">

                        {/* Editor Mode */}
                        {activeTab === "editor" && (
                            <motion.div
                                key="editor"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <div className="admin-glass-card p-6 border-indigo-500/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                            <Terminal className="w-4 h-4 text-indigo-400" />
                                            محرر التوجيه النظامي (System Prompt)
                                            <AdminTooltip content="هنا بنكتب الأوامر والنوايا العميقة اللي بتحدد شخصية وسلوك وأهداف جارفيس في كل التفاعلات." position="top" />
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setPromptDraft(systemPrompt)}
                                                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
                                                title="تراجع"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleSavePrompt}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
                                            >
                                                <Save className="w-4 h-4" />
                                                حفظ التعديلات
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        value={promptDraft}
                                        onChange={(e) => setPromptDraft(e.target.value)}
                                        className="w-full h-[500px] bg-slate-950/50 rounded-xl border border-white/5 p-4 text-sm font-mono text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none leading-relaxed selection:bg-indigo-500/30"
                                        style={{ direction: 'ltr' }}
                                    />
                                    <p className="mt-2 text-[10px] text-slate-500">
                                        * هذا النص يحدد شخصية وسلوك المساعد الذكي في جميع أنحاء النظام. كن حذراً في التعديل.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Playground Mode */}
                        {activeTab === "playground" && (
                            <motion.div
                                key="playground"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-[600px] flex flex-col admin-glass-card overflow-hidden border-teal-500/10"
                            >
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/30">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-teal-400" />
                                        ساحة المحاكاة الحية
                                        <AdminTooltip content="اختبار النظام قبل اعتماده. كلم جارفيس هنا وهو هيتصرف بناءً على الـ System Prompt الجديد." position="top" />
                                    </h3>
                                    <button
                                        onClick={() => setPlayMessages([])}
                                        className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1"
                                    >
                                        <Eraser className="w-3 h-3" />
                                        مسح الشاشة
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                    {playMessages.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-50">
                                            <Brain className="w-16 h-16 stroke-1" />
                                            <p className="text-sm">المحرك جاهز. ابدأ المحادثة لاختبار الاستجابة.</p>
                                        </div>
                                    )}
                                    {playMessages.map((msg, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={idx}
                                            className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                                        >
                                            <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${msg.role === "user"
                                                ? "bg-slate-800 text-slate-200 rounded-br-none"
                                                : "bg-teal-500/10 border border-teal-500/20 text-teal-100 rounded-bl-none"
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-end">
                                            <div className="bg-teal-500/5 border border-teal-500/10 rounded-2xl rounded-bl-none p-4 flex items-center gap-3">
                                                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                                                <span className="text-xs text-teal-400 animate-pulse">جاري المعالجة...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                <div className="p-4 bg-slate-950/50 border-t border-white/5">
                                    <form onSubmit={runPlayground} className="relative">
                                        <input
                                            value={playInput}
                                            onChange={(e) => setPlayInput(e.target.value)}
                                            placeholder="اكتب رسالة للتجربة..."
                                            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                                            disabled={loading}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!playInput.trim() || loading}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        )}

                        {/* Logs Mode (Expanded) */}
                        {activeTab === "logs" && (
                            <motion.div
                                key="logs"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="flex justify-between items-center bg-slate-950/30 p-4 rounded-xl border border-white/5">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <History className="w-5 h-5 text-indigo-400" />
                                        سجل العمليات الكامل
                                    </h3>
                                    <button
                                        onClick={clearAiLogs}
                                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                                    >
                                        <Eraser className="w-3 h-3" />
                                        مسح السجل
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {aiLogs.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500 admin-glass-card">
                                            لا توجد سجلات محفوظة
                                        </div>
                                    ) : (
                                        aiLogs.map((log) => (
                                            <div key={log.id} className="admin-glass-card p-4 group hover:border-indigo-500/30 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                                                        {new Date(log.createdAt).toLocaleTimeString("ar-EG")}
                                                    </span>
                                                    <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                        {(["up", "down"] as const).map(rate => (
                                                            <button
                                                                key={rate}
                                                                onClick={async () => {
                                                                    rateAiLog(log.id, rate);
                                                                    if (isSupabaseReady) await rateAiLogRemote(log.id, rate);
                                                                }}
                                                                className={`p-1.5 rounded-lg transition-colors ${log.rating === rate
                                                                    ? (rate === "up" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400")
                                                                    : "hover:bg-slate-800 text-slate-500"
                                                                    }`}
                                                            >
                                                                {rate === "up" ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-xs">
                                                    <div className="bg-slate-950/50 p-2 rounded-lg border border-white/5">
                                                        <span className="text-indigo-400 font-bold block mb-1 text-[10px]">USER</span>
                                                        <p className="text-slate-300">{log.prompt}</p>
                                                    </div>
                                                    <div className="bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                                                        <span className="text-teal-400 font-bold block mb-1 text-[10px]">AI</span>
                                                        <p className="text-slate-300 leading-relaxed">{log.response}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Jules Mode */}
                        {activeTab === "jules" && (
                            <motion.div
                                key="jules"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6 text-right"
                            >
                                <div className="flex justify-between items-center bg-slate-950/30 p-4 rounded-xl border border-white/5">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
                                        مركز عمليات Jules
                                        <AdminTooltip content="أداة أتمتة قوية بتخلي الذكاء الاصطناعي يدخل يعدل الكود ويعمل PR أوتوماتيك لخدمة أهداف المنصة." position="top" />
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowTaskCreator(!showTaskCreator)}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${showTaskCreator
                                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                                    : "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                                }`}
                                        >
                                            {showTaskCreator ? "إلغاء المأمورية" : "مأمورية جديدة"}
                                            {!showTaskCreator && <Sparkles className="w-3 h-3" />}
                                        </button>
                                        <button
                                            onClick={loadJulesData}
                                            disabled={julesLoading}
                                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
                                        >
                                            <RotateCcw className={`w-3 h-3 ${julesLoading ? "animate-spin" : ""}`} />
                                            تحديث
                                        </button>
                                    </div>
                                </div>

                                {/* Task Creator Form */}
                                <AnimatePresence>
                                    {showTaskCreator && (
                                        <motion.form
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            onSubmit={handleCreateJulesTask}
                                            className="admin-glass-card p-6 border-indigo-500/30 bg-indigo-500/5 space-y-4 overflow-hidden"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block pr-1">المستودع (Source)</label>
                                                    <select
                                                        value={newTask.source}
                                                        onChange={(e) => setNewTask({ ...newTask, source: e.target.value })}
                                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                                                        required
                                                    >
                                                        <option value="">اختار المستودع...</option>
                                                        {julesSources.map(s => (
                                                            <option key={s.name} value={s.name}>{s.id}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block pr-1">عنوان المهمة</label>
                                                    <input
                                                        type="text"
                                                        placeholder="مثلاً: إصلاح مشكلة الدفع..."
                                                        value={newTask.title}
                                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block pr-1">تعليمات المأمورية (Prompt)</label>
                                                <textarea
                                                    placeholder="اشرح لـ Jules هيعمل إيه بالظبط..."
                                                    value={newTask.prompt}
                                                    onChange={(e) => setNewTask({ ...newTask, prompt: e.target.value })}
                                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none h-24 resize-none"
                                                    required
                                                />
                                            </div>
                                            <div className="flex items-center justify-between pt-2">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={newTask.autoCreatePR}
                                                        onChange={(e) => setNewTask({ ...newTask, autoCreatePR: e.target.checked })}
                                                        className="w-4 h-4 rounded border-white/10 bg-slate-950 text-indigo-500 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors uppercase tracking-widest">إنشاء PR تلقائياً</span>
                                                </label>
                                                <button
                                                    type="submit"
                                                    disabled={creatingTask}
                                                    className="px-8 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                                                >
                                                    {creatingTask ? "جاري الإطلاق..." : "إطلاق المهمة (Launch)"}
                                                </button>
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>

                                {julesLoading && julesSessions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 admin-glass-card space-y-4">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                                        <p className="text-xs text-slate-500">جاري الاتصال بـ Jules API...</p>
                                    </div>
                                ) : julesSessions.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 admin-glass-card">
                                        لا توجد جلسات Jules نشطة حالياً.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {julesSessions.map((session) => (
                                            <div key={session.id} className="admin-glass-card p-6 group hover:border-indigo-500/30 transition-all">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="text-lg font-bold text-white mb-1">{session.title || "بدون عنوان"}</h4>
                                                        <p className="text-xs text-slate-500 font-mono tracking-tight">{session.name}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${session.status === 'Needs Approval'
                                                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                        : session.status === 'Completed'
                                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30"
                                                            : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                                        }`}>
                                                        {session.status || 'Active'}
                                                    </span>
                                                </div>

                                                <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 mb-4">
                                                    <p className="text-xs text-slate-300 line-clamp-2 italic text-right" dir="rtl">"{session.prompt}"</p>
                                                </div>

                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        {session.outputs?.map((output, idx) => output.pullRequest && (
                                                            <a
                                                                key={idx}
                                                                href={output.pullRequest.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                                View PR
                                                            </a>
                                                        ))}
                                                    </div>

                                                    {session.status === 'Needs Approval' && (
                                                        <button
                                                            onClick={() => handleApproveJulesPlan(session.id)}
                                                            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase transition-all shadow-lg shadow-amber-500/20"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Approve Plan
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sidebar (Configuration) */}
                <div className="space-y-6">
                    {/* Scoring Equation */}
                    <div className="admin-glass-card p-5 space-y-5 sticky top-6">
                        <div className="flex items-center gap-2 pb-4 border-b border-white/5">
                            <Activity className="w-5 h-5 text-amber-500" />
                            <h3 className="text-sm font-bold text-white">معادلة قياس الوعي</h3>
                            <AdminTooltip content="تحديد أوزان السلوكيات والحدود القصوى (Thresholds) اللي بتحدد معدل وعي أو إرهاق المستخدمين على النظام." position="top" />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-3">أوزان التكرار (Weights)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(["often", "sometimes", "rarely", "never"] as const).map((key) => (
                                        <div key={key} className="relative">
                                            <label className="text-[10px] text-slate-500 absolute -top-2 right-2 bg-slate-900 px-1 uppercase">{key}</label>
                                            <input
                                                type="number"
                                                value={weightsDraft[key]}
                                                onChange={(e) => setWeightsDraft((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                                                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200 focus:border-amber-500/50 outline-none text-center font-mono"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-3">حدود المستويات (Thresholds)</label>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 text-[10px] font-bold text-emerald-400">منخفض (Low)</div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={thresholdDraft.lowMax}
                                            onChange={(e) => setThresholdDraft((prev) => ({ ...prev, lowMax: Number(e.target.value) }))}
                                            className="flex-1 accent-emerald-500 h-1 bg-slate-800 rounded-full appearance-none"
                                        />
                                        <span className="w-8 text-center text-xs font-mono bg-slate-900 rounded p-1 text-emerald-400">≤{thresholdDraft.lowMax}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 text-[10px] font-bold text-amber-400">متوسط (Med)</div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={thresholdDraft.mediumMax}
                                            onChange={(e) => setThresholdDraft((prev) => ({ ...prev, mediumMax: Number(e.target.value) }))}
                                            className="flex-1 accent-amber-500 h-1 bg-slate-800 rounded-full appearance-none"
                                        />
                                        <span className="w-8 text-center text-xs font-mono bg-slate-900 rounded p-1 text-amber-400">≤{thresholdDraft.mediumMax}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveScoring}
                                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                تحديث المعايير
                            </button>
                        </div>
                    </div>

                    {/* Stats / Info */}
                    <div className="admin-glass-card p-5 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
                        <div className="flex items-center gap-3 mb-4">
                            <Cpu className="w-8 h-8 text-indigo-400 opacity-80" />
                            <div>
                                <h4 className="text-sm font-bold text-white">حالة الخادم</h4>
                                <p className="text-[10px] text-slate-400">Gemini 1.5 Pro • 98% Uptime</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Requests Today</span>
                                <span className="text-white font-mono">{aiLogs.length}</span>
                            </div>
                            <div className="w-full bg-slate-800/50 h-1 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full w-[45%]" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
