import type { FC } from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
    FileText,
    ListTodo,
    Radio,
    Search,
    Save,
    Trash2,
    Plus,
    RefreshCw,
    AlertTriangle,
    Database,
    Cpu,
    Filter
} from "lucide-react";
import { useAdminState, getScoringWeights, getScoringThresholds } from "@/domains/admin/store/admin.store";
import { useAppContentState } from '@/modules/map/dawayirIndex';
import { useFleetState } from "@/domains/admin/store/fleet.store";
import { isSupabaseReady } from "@/services/supabaseClient";
import {
    saveMission,
    deleteMission,
    saveBroadcast,
    deleteBroadcast,
    fetchAppContentEntries,
    saveAppContentEntry,
    deleteAppContentEntry,
    type AdminContentEntry
} from "@/services/adminApi";
import { buildResultTemplateFromAnswers } from "@/utils/resultScreenTemplates";
import type { PersonGender } from "@/utils/resultScreenAI";
import type { QuickAnswer2 } from "@/utils/suggestInitialRing";
import type { BroadcastAudience } from "@/utils/broadcastAudience";
import { motion, AnimatePresence } from "framer-motion";

// Types & Constants
type ResultAnswerOption = "often" | "sometimes" | "rarely" | "never";
const RESULT_ANSWER_OPTIONS: ResultAnswerOption[] = ["often", "sometimes", "rarely", "never"];
const SAFETY_OPTIONS: QuickAnswer2[] = ["high", "medium", "low", "zero"];

// Tab Components could be extracted, but keeping inline for now for simplicity of the refactor
export const ContentPanel: FC = () => {
    // Global State
    const missions = useAdminState((s) => s.missions);
    const addMission = useAdminState((s) => s.addMission);
    const removeMission = useAdminState((s) => s.removeMission);
    const broadcasts = useAdminState((s) => s.broadcasts);
    const addBroadcast = useAdminState((s) => s.addBroadcast);
    const removeBroadcast = useAdminState((s) => s.removeBroadcast);
    const upsertContentInStore = useAppContentState((s) => s.upsert);
    const { isSandboxEnforced, activeVesselId, vessels } = useFleetState();

    const activeVessel = vessels.find(v => v.id === activeVesselId);

    // Local State - Tabs
    const [activeTab, setActiveTab] = useState<"cms" | "simulation" | "missions" | "broadcasts">("cms");

    // Local State - CMS
    const [contentEntries, setContentEntries] = useState<AdminContentEntry[]>([]);
    const [contentDrafts, setContentDrafts] = useState<Record<string, { content: string; page: string }>>({});
    const [contentLoading, setContentLoading] = useState(false);
    const [contentSearch, setContentSearch] = useState("");
    const [contentPageFilter, setContentPageFilter] = useState("");
    const [, setContentStatus] = useState("");
    const [savingContentKey, setSavingContentKey] = useState<string | null>(null);
    const [deletingContentKey, setDeletingContentKey] = useState<string | null>(null);
    const [newContentKey, setNewContentKey] = useState("");
    const [newContentPage, setNewContentPage] = useState("");
    const [newContentValue, setNewContentValue] = useState("");

    // Local State - Missions & Broadcasts
    const [missionTitle, setMissionTitle] = useState("");
    const [missionTrack, setMissionTrack] = useState("مسار الجذور");
    const [missionDifficulty] = useState<Parameters<typeof addMission>[0]["difficulty"]>("سهل");
    const [broadcastTitle, setBroadcastTitle] = useState("");
    const [broadcastBody, setBroadcastBody] = useState("");
    const [broadcastAudience] = useState<BroadcastAudience>("all");

    // Local State - Simulation
    const [resultPersonGender, setResultPersonGender] = useState<PersonGender>("unknown");
    const [resultSafety, setResultSafety] = useState<QuickAnswer2>("medium");
    const [resultEmergency, setResultEmergency] = useState(false);
    const [feelingAnswers, setFeelingAnswers] = useState<{ q1: ResultAnswerOption; q2: ResultAnswerOption; q3: ResultAnswerOption }>({
        q1: "sometimes", q2: "sometimes", q3: "sometimes"
    });
    const [realityAnswers] = useState<{ q1: ResultAnswerOption; q2: ResultAnswerOption; q3: ResultAnswerOption }>({
        q1: "sometimes", q2: "sometimes", q3: "sometimes"
    });

    // Scoring Logic
    const scoreWeights = getScoringWeights();
    const scoreThresholds = getScoringThresholds();

    const resultPoints = useCallback((value: ResultAnswerOption) => {
        if (value === "often") return scoreWeights.often;
        if (value === "sometimes") return scoreWeights.sometimes;
        if (value === "rarely") return scoreWeights.rarely;
        return scoreWeights.never;
    }, [scoreWeights]);

    const resultScoreLevel = useCallback((score: number): "low" | "medium" | "high" => {
        if (score > scoreThresholds.mediumMax) return "high";
        if (score > scoreThresholds.lowMax) return "medium";
        return "low";
    }, [scoreThresholds]);

    const symptomScore = resultPoints(feelingAnswers.q1) + resultPoints(feelingAnswers.q2) + resultPoints(feelingAnswers.q3);
    const contactScore = resultPoints(realityAnswers.q1) + resultPoints(realityAnswers.q2) + resultPoints(realityAnswers.q3);
    const symptomLevel = feelingAnswers.q3 === "often" ? "high" : resultScoreLevel(symptomScore);
    const contactLevel = resultScoreLevel(contactScore);

    const selectedResultTemplate = useMemo(() => buildResultTemplateFromAnswers({
        score: symptomScore,
        feelingAnswers,
        realityAnswers,
        isEmergency: resultEmergency,
        safetyAnswer: resultSafety,
        personGender: resultPersonGender
    }), [symptomScore, feelingAnswers, realityAnswers, resultEmergency, resultSafety, resultPersonGender]);

    // Data Loading
    const loadContentEntries = useCallback(async () => {
        setContentLoading(true);
        setContentStatus("");
        try {
            const data = await fetchAppContentEntries({
                page: contentPageFilter.trim() || undefined,
                limit: 300
            });
            if (!data) {
                setContentStatus("تعذر تحميل نصوص المنصة.");
                return;
            }
            setContentEntries(data);
            setContentDrafts(
                data.reduce<Record<string, { content: string; page: string }>>((acc, row) => {
                    acc[row.key] = { content: row.content, page: row.page ?? "" };
                    return acc;
                }, {})
            );
        } finally {
            setContentLoading(false);
        }
    }, [contentPageFilter]);

    useEffect(() => {
        void loadContentEntries();
    }, [loadContentEntries]);

    // Helpers
    const filteredContentEntries = useMemo(() => {
        const q = contentSearch.trim().toLowerCase();
        if (!q) return contentEntries;
        return contentEntries.filter((entry) =>
            `${entry.key} ${entry.page ?? ""} ${entry.content}`.toLowerCase().includes(q)
        );
    }, [contentEntries, contentSearch]);

    const updateContentDraft = (key: string, next: Partial<{ content: string; page: string }>) => {
        setContentDrafts((prev) => ({
            ...prev,
            [key]: {
                content: next.content ?? prev[key]?.content ?? "",
                page: next.page ?? prev[key]?.page ?? ""
            }
        }));
    };

    const handleSaveContent = async (key: string) => {
        const draft = contentDrafts[key];
        if (!draft) return;
        setSavingContentKey(key);
        const ok = await saveAppContentEntry({ key, content: draft.content, page: draft.page.trim() || null });
        if (ok) {
            await upsertContentInStore(key, draft.content, { page: draft.page.trim() || undefined });
            setContentEntries(p => p.map(e => e.key === key ? { ...e, ...draft, updatedAt: new Date().toISOString() } : e));
        }
        setSavingContentKey(null);
    };

    const handleCreateContent = async () => {
        if (!newContentKey.trim() || !newContentValue.trim()) return;
        const key = newContentKey.trim();
        const content = newContentValue.trim();
        setSavingContentKey("new");
        const ok = await saveAppContentEntry({ key, content, page: newContentPage.trim() || null });
        if (ok) {
            await upsertContentInStore(key, content, { page: newContentPage.trim() || undefined });
            const entry = { key, content, page: newContentPage.trim() || null, updatedAt: new Date().toISOString() };
            setContentEntries(prev => [entry, ...prev]);
            setContentDrafts(prev => ({ ...prev, [key]: { content, page: newContentPage.trim() } }));
            setNewContentKey(""); setNewContentValue(""); setNewContentPage("");
        }
        setSavingContentKey(null);
    };

    const handleDeleteContent = async (key: string) => {
        if (deletingContentKey !== key) {
            setDeletingContentKey(key);
            return;
        }
        setDeletingContentKey(null);
        setSavingContentKey(key);
        const ok = await deleteAppContentEntry(key);
        if (ok) {
            setContentEntries(p => p.filter(e => e.key !== key));
            setContentDrafts(p => { const next = { ...p }; delete next[key]; return next; });
        }
        setSavingContentKey(null);
    };

    const handleAddMission = async () => {
        if (!missionTitle.trim()) return;
        const mission: Parameters<typeof addMission>[0] = {
            id: `mission_${Date.now()}`,
            title: missionTitle.trim(),
            track: missionTrack,
            difficulty: missionDifficulty,
            createdAt: Date.now()
        };
        addMission(mission);
        if (isSupabaseReady) await saveMission(mission);
        setMissionTitle("");
    };

    const handleAddBroadcast = async () => {
        if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
        const broadcast = {
            id: `broadcast_${Date.now()}`,
            title: broadcastTitle.trim(),
            body: broadcastBody.trim(),
            audience: broadcastAudience,
            createdAt: Date.now()
        } as const;
        addBroadcast(broadcast);
        if (isSupabaseReady) await saveBroadcast(broadcast);
        setBroadcastTitle(""); setBroadcastBody("");
    };

    if (isSandboxEnforced) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 space-y-6">
                <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/30 animate-pulse">
                    <AlertTriangle className="w-10 h-10 text-rose-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tighter">PROTOCOL: SANDBOX ACTIVE</h2>
                    <p className="text-slate-400 max-w-md mx-auto">
                        تم تفعيل وضع العزل لمشروع: <span className="text-white font-bold">{activeVessel?.title}</span>.
                        تم حجب الوصول لبيانات الـ CMS الروتينية لمنع التشتت وضمان نزاهة البيانات.
                    </p>
                </div>
                <button
                    onClick={() => useFleetState.getState().toggleSandbox(false)}
                    className="px-8 py-3 bg-white text-slate-950 font-black rounded-xl hover:bg-slate-200 transition-all uppercase text-xs"
                >
                    تعطيل العزل (Exit Sandbox)
                </button>
            </div>
        );
    }


    return (
        <div className="space-y-6 text-slate-200" dir="rtl">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-slate-950/40 backdrop-blur-3xl rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-indigo-500/5 opacity-50" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-lg">
                        <Database className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">إدارة المحتوى</h3>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">CMS System v2.1 • {contentEntries.length} Records</p>
                    </div>
                </div>

                <div className="relative z-10 flex p-1 bg-slate-900/50 rounded-xl border border-white/5 overflow-x-auto">
                    {([
                        { id: "cms", label: "نصوص المنصة", icon: <FileText className="w-4 h-4" /> },
                        { id: "simulation", label: "محاكاة النتائج", icon: <Cpu className="w-4 h-4" /> },
                        { id: "missions", label: "المهمات", icon: <ListTodo className="w-4 h-4" /> },
                        { id: "broadcasts", label: "البث المباشر", icon: <Radio className="w-4 h-4" /> }
                    ] as const).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                ? "bg-teal-500 text-slate-950 shadow-lg"
                                : "text-slate-400 hover:text-teal-300"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">

                {/* CMS Tab */}
                {activeTab === "cms" && (
                    <motion.div
                        key="cms"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="admin-glass-card p-5 space-y-4 sticky top-4 z-10 bg-slate-950/80 backdrop-blur-xl border border-teal-500/20 shadow-2xl">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        value={contentSearch}
                                        onChange={(e) => setContentSearch(e.target.value)}
                                        placeholder="بحث في المفاتيح أو المحتوى..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-10 pl-4 py-3 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors"
                                    />
                                </div>
                                <div className="md:w-64 relative">
                                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        value={contentPageFilter}
                                        onChange={(e) => setContentPageFilter(e.target.value)}
                                        placeholder="فلترة حسب الصفحة (Page ID)..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-10 pl-4 py-3 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={() => void loadContentEntries()}
                                    disabled={contentLoading}
                                    className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
                                >
                                    <RefreshCw className={`w-4 h-4 ${contentLoading ? "animate-spin" : ""}`} />
                                </button>
                            </div>
                        </div>

                        {/* Add New */}
                        <div className="admin-glass-card p-5 border-dashed border-slate-700 bg-slate-900/20">
                            <div className="flex items-center gap-2 mb-4 text-slate-400">
                                <Plus className="w-4 h-4" />
                                <span className="text-xs font-bold">إضافة نص جديد</span>
                            </div>
                            <div className="grid md:grid-cols-4 gap-3 mb-3">
                                <input
                                    value={newContentKey}
                                    onChange={(e) => setNewContentKey(e.target.value)}
                                    placeholder="Key (e.g. landing_hero_title)"
                                    className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-teal-400 focus:outline-none focus:border-teal-500"
                                />
                                <input
                                    value={newContentPage}
                                    onChange={(e) => setNewContentPage(e.target.value)}
                                    placeholder="Page (Optional)"
                                    className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-400 focus:outline-none focus:border-teal-500"
                                />
                            </div>
                            <div className="flex gap-3">
                                <textarea
                                    value={newContentValue}
                                    onChange={(e) => setNewContentValue(e.target.value)}
                                    placeholder="المحتوى النصي..."
                                    rows={2}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 resize-none"
                                />
                                <button
                                    onClick={handleCreateContent}
                                    disabled={savingContentKey === "new"}
                                    className="px-6 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors flex flex-col items-center justify-center gap-1 min-w-[80px]"
                                >
                                    {savingContentKey === "new" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span>حفظ</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {filteredContentEntries.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">لا توجد نتائج مطابقة</div>
                            ) : filteredContentEntries.map((entry) => {
                                const draft = contentDrafts[entry.key] ?? { content: entry.content, page: entry.page ?? "" };
                                const isDirty = draft.content !== entry.content || (draft.page !== (entry.page ?? ""));
                                const isSaving = savingContentKey === entry.key;

                                return (
                                    <div key={entry.key} className={`admin-glass-card p-4 transition-all ${isDirty ? "border-amber-500/30 bg-amber-500/5" : "hover:border-slate-600"}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold font-mono text-teal-400 select-all">{entry.key}</span>
                                                    {entry.page && <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{entry.page}</span>}
                                                </div>
                                                <p className="text-[10px] text-slate-600 mt-0.5">Updated: {entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : "—"}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isDirty && (
                                                    <button
                                                        onClick={() => handleSaveContent(entry.key)}
                                                        disabled={isSaving}
                                                        className="p-2 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
                                                        title="حفظ التغييرات"
                                                    >
                                                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    </button>
                                                )}
                                                {deletingContentKey === entry.key ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-black text-rose-400">
                                                        <button onClick={() => handleDeleteContent(entry.key)} className="hover:text-rose-300 transition-colors">تأكيد</button>
                                                        <span className="text-slate-700 mx-0.5">|</span>
                                                        <button onClick={() => setDeletingContentKey(null)} className="text-slate-500 hover:text-slate-300 font-bold transition-colors">إلغاء</button>
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDeleteContent(entry.key)}
                                                        className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors"
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <textarea
                                            value={draft.content}
                                            onChange={(e) => updateContentDraft(entry.key, { content: e.target.value })}
                                            rows={draft.content.length > 100 ? 3 : 1}
                                            className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none transition-colors resize-y max-h-[200px]"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Simulation Tab */}
                {activeTab === "simulation" && (
                    <motion.div
                        key="simulation"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="grid lg:grid-cols-3 gap-6"
                    >
                        <div className="lg:col-span-1 space-y-6">
                            <div className="admin-glass-card p-5">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Cpu className="w-4 h-4" /> مدخلات المحاكاة</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1.5 block">الجنس</label>
                                        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                                            {(["unknown", "male", "female"] as const).map(g => (
                                                <button key={g} onClick={() => setResultPersonGender(g)} className={`flex-1 py-1.5 text-[10px] rounded-md transition-colors ${resultPersonGender === g ? "bg-indigo-500 text-white" : "text-slate-500"}`}>{g}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1.5 block">السؤال الأمني</label>
                                        <select value={resultSafety} onChange={(e) => {
                                            const value = e.target.value;
                                            if ((SAFETY_OPTIONS as readonly string[]).includes(value)) setResultSafety(value as QuickAnswer2);
                                        }} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none">
                                            {SAFETY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                    <label className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg cursor-pointer">
                                        <input type="checkbox" checked={resultEmergency} onChange={(e) => setResultEmergency(e.target.checked)} className="peer" />
                                        <span className="text-xs font-bold text-rose-400">حالة طوارئ قصوى (Override)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="admin-glass-card p-5">
                                <h3 className="text-sm font-bold text-white mb-4">إجابات المشاعر</h3>
                                <div className="space-y-3">
                                    {(Object.keys(feelingAnswers) as Array<keyof typeof feelingAnswers>).map((k) => (
                                        <div key={k} className="flex items-center justify-between">
                                            <span className="text-xs text-slate-400 uppercase">{k}</span>
                                            <div className="flex gap-1">
                                                {RESULT_ANSWER_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setFeelingAnswers(p => ({ ...p, [k]: opt }))}
                                                        className={`w-6 h-6 rounded flex items-center justify-center text-[10px] transition-colors ${feelingAnswers[k] === opt ? "bg-teal-500 text-slate-900 font-bold" : "bg-slate-800 text-slate-500"}`}
                                                        title={opt}
                                                    >
                                                        {opt[0].toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="admin-glass-card p-6 border-indigo-500/20 bg-indigo-500/5">
                                <h3 className="text-sm font-bold text-indigo-300 mb-6">النتيجة المتوقعة (Preview)</h3>

                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 mb-4">
                                            {selectedResultTemplate.state_label}
                                        </div>
                                        <h2 className="text-2xl font-black text-white">{selectedResultTemplate.title}</h2>
                                    </div>

                                    <div className="p-6 bg-slate-950/50 rounded-2xl border border-white/5 text-sm leading-8 text-slate-300 whitespace-pre-wrap">
                                        {selectedResultTemplate.promise_body}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                                            <div className="text-[10px] text-slate-500 uppercase">Symptom Score</div>
                                            <div className="text-lg font-bold text-white">{symptomScore}</div>
                                            <div className="text-[10px] text-indigo-400">{symptomLevel}</div>
                                        </div>
                                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                                            <div className="text-[10px] text-slate-500 uppercase">Contact Score</div>
                                            <div className="text-lg font-bold text-white">{contactScore}</div>
                                            <div className="text-[10px] text-indigo-400">{contactLevel}</div>
                                        </div>
                                        <div className="col-span-2 p-3 bg-emerald-950/30 rounded-xl border border-emerald-900/50">
                                            <div className="text-[10px] text-emerald-500 uppercase">Matched Scenario</div>
                                            <div className="text-sm font-bold text-emerald-300 overflow-hidden text-ellipsis whitespace-nowrap">{selectedResultTemplate.scenarioKey}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Missions Tab */}
                {activeTab === "missions" && (
                    <motion.div key="missions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="admin-glass-card p-5 border-l-4 border-l-purple-500">
                            <h3 className="text-sm font-bold text-white mb-4">إضافة مهمة جديدة</h3>
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs text-slate-400 mb-1">عنوان المهمة</label>
                                    <input value={missionTitle} onChange={e => setMissionTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs text-slate-400 mb-1">المسار</label>
                                    <select value={missionTrack} onChange={e => setMissionTrack(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white">
                                        <option>مسار الجذور</option>
                                        <option>مسار العلاقات</option>
                                    </select>
                                </div>
                                <button onClick={handleAddMission} className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition-colors">إضافة</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {missions.map(m => (
                                <div key={m.id} className="admin-glass-card p-4 hover:border-purple-500/30 transition-colors flex justify-between items-start">
                                    <div>
                                        <h4 className="text-sm font-bold text-white">{m.title}</h4>
                                        <div className="flex gap-2 mt-2">
                                            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">{m.track}</span>
                                            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">{m.difficulty}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => { removeMission(m.id); if (isSupabaseReady) deleteMission(m.id); }} className="text-slate-500 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Broadcasts Tab */}
                {activeTab === "broadcasts" && (
                    <motion.div key="broadcasts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="admin-glass-card p-5 border-l-4 border-l-amber-500 bg-amber-500/5">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Radio className="w-4 h-4 text-amber-500" />
                                إرسال بث مباشر (Emergency Broadcast)
                            </h3>
                            <div className="space-y-3">
                                <input value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} placeholder="عنوان الرسالة" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                                <textarea value={broadcastBody} onChange={e => setBroadcastBody(e.target.value)} placeholder="نص الرسالة..." rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white resize-none" />
                                <div className="flex justify-end">
                                    <button onClick={handleAddBroadcast} className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                                        <Radio className="w-4 h-4" />
                                        إرسال للجميع
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {broadcasts.map(b => (
                                <div key={b.id} className="admin-glass-card p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-white">{b.title}</h4>
                                        <p className="text-xs text-slate-400">{b.body}</p>
                                        <span className="text-[10px] text-slate-600 mt-1 block">{b.createdAt ? new Date(b.createdAt).toLocaleString("en-US") : "—"}</span>
                                    </div>
                                    <button onClick={() => { removeBroadcast(b.id); if (isSupabaseReady) deleteBroadcast(b.id); }} className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};





