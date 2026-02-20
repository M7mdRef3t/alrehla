import { FC, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapState } from "../state/mapState";
import { calculateGravityMass, detectEchoPatterns, type GravityNode } from "../services/physicsEngine";
import { scanForVampires, identifyKeystones } from "../services/propheticEngine";
import { AlertTriangle, Zap, Box, Activity, Radar, GitMerge, BrainCircuit } from "lucide-react";
import { OutcomeSimulator } from "./OutcomeSimulator";

function classifyLabel(classification: string): string {
    if (classification === "Black Hole") return "ثقب أسود";
    if (classification === "Star") return "نجم";
    return "محايد";
}

export const CosmicDashboard: FC = () => {
    const nodes = useMapState((s) => s.nodes);

    const gravityData = useMemo(() => {
        return nodes.map(n => ({ ...calculateGravityMass(n), label: n.label }))
            .sort((a, b) => b.mass - a.mass);
    }, [nodes]);

    const echoes = useMemo(() => detectEchoPatterns(), [nodes]);

    const archiveNode = useMapState((s) => s.archiveNode);
    const moveNodeToRing = useMapState((s) => s.moveNodeToRing);

    // Phase 18: Prophetic Engine hooks
    const vampires = useMemo(() => scanForVampires(), [nodes]);
    const keystones = useMemo(() => identifyKeystones(), [nodes]);
    const [showSimulator, setShowSimulator] = useState(false);

    const suggestedActions = useMemo(() => {
        const actions: Array<{
            id: string;
            title: string;
            description: string;
            cta: string;
            tone: "rose" | "amber" | "emerald";
            onRun: () => void;
        }> = [];

        const topVampire = vampires[0];
        if (topVampire) {
            actions.push({
                id: "top-vampire",
                title: "احتواء أقوى مصدر استنزاف",
                description: `انقل ${nodes.find((n) => n.id === topVampire.nodeId)?.label ?? "العلاقة الأعلى استنزافًا"} إلى المدار الأحمر لتقليل النزيف اليومي.`,
                cta: "تحويل للمدار الأحمر",
                tone: "rose",
                onRun: () => moveNodeToRing(topVampire.nodeId, "red")
            });
        }

        const topBlackHole = gravityData.find((g) => g.classification === "Black Hole");
        if (topBlackHole) {
            actions.push({
                id: "black-hole-archive",
                title: "إخراج الثقب الأسود من المشهد",
                description: `أرشفة ${topBlackHole.label} لو العلاقة بتستنزفك بالكامل ومش قابلة للإصلاح الآن.`,
                cta: "أرشفة العلاقة",
                tone: "amber",
                onRun: () => archiveNode(topBlackHole.nodeId)
            });
        }

        const topKeystone = keystones[0];
        if (topKeystone) {
            actions.push({
                id: "keystone-focus",
                title: "ابدأ بالعلاقة المحورية",
                description: `ركّز هذا الأسبوع على ${nodes.find((n) => n.id === topKeystone.nodeId)?.label ?? "العلاقة المحورية"} لأن تأثيرها ممتد على باقي الشبكة.`,
                cta: "تمييز كأولوية",
                tone: "emerald",
                onRun: () => moveNodeToRing(topKeystone.nodeId, "yellow")
            });
        }

        return actions.slice(0, 3);
    }, [archiveNode, gravityData, keystones, moveNodeToRing, nodes, vampires]);

    if (nodes.length === 0) {
        return (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-700 rounded-xl">
                <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>النظام الكوني فارغ. أضف علاقات ليبدأ تحليل الفيزياء.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-4 space-y-8 pb-24">

            {/* 0. WHAT-IF SIMULATOR (Phase 18) - Top Action */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
            >
                {!showSimulator ? (
                    <button
                        onClick={() => setShowSimulator(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all transform hover:scale-105"
                    >
                        <BrainCircuit className="w-4 h-4" />
                        <span>تشغيل محاكي السيناريوهات</span>
                    </button>
                ) : (
                    <div className="w-full">
                        <div className="flex justify-end mb-2">
                            <button onClick={() => setShowSimulator(false)} className="text-xs text-slate-400 hover:text-white">إغلاق المحاكاة</button>
                        </div>
                        <OutcomeSimulator />
                    </div>
                )}
            </motion.div>

            {/* 1.a. Energy Drain Radar (Phase 18) */}
            {suggestedActions.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-slate-200 mb-4">إجراءات مقترحة الآن</h3>
                    <div className="space-y-3">
                        {suggestedActions.map((action) => (
                            <div key={action.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <p className="text-sm font-bold text-white mb-1">{action.title}</p>
                                <p className="text-xs text-slate-300 mb-3">{action.description}</p>
                                <button
                                    type="button"
                                    onClick={action.onRun}
                                    className={`text-xs font-bold rounded-lg px-3 py-1.5 border transition-colors ${action.tone === "rose"
                                        ? "bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25"
                                        : action.tone === "amber"
                                            ? "bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25"
                                            : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25"
                                        }`}
                                >
                                    {action.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {vampires.length > 0 && (
                <div className="bg-rose-950/10 border border-rose-500/20 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Radar className="w-16 h-16 text-rose-500 animate-spin-slow" />
                    </div>

                    <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Radar className="w-4 h-4" />
                        رادار الاستنزاف رصد {vampires.length} تهديدات
                    </h3>

                    <div className="grid gap-3">
                        {vampires.slice(0, 3).map(v => {
                            const node = nodes.find(n => n.id === v.nodeId);
                            return (
                                <div key={v.nodeId} className="flex items-center justify-between bg-rose-900/10 p-3 rounded border border-rose-500/10">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-200">{node?.label ?? "غير معروف"}</span>
                                        <span className="text-xs text-rose-300/60">{v.drainVelocity} استنزاف</span>
                                    </div>
                                    <div className="text-rose-400 font-mono font-bold">{Math.round(v.drainScore)}/100</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 1.b. Keystone Relations (Phase 18) */}
            {keystones.length > 0 && (
                <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <GitMerge className="w-4 h-4" />
                        العلاقات المحورية ذات الأثر المتسلسل
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                        إصلاح العلاقات المحورية غالبًا يصنع تأثيرًا إيجابيًا ممتدًا على باقي العلاقات.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {keystones.slice(0, 3).map(k => {
                            const node = nodes.find(n => n.id === k.nodeId);
                            return (
                                <div key={k.nodeId} className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full flex items-center gap-2">
                                    <span className="text-emerald-200 font-bold text-sm">{node?.label}</span>
                                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 rounded">تأثير ×{k.impactFactor}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 1. Echo Patterns (Warnings) */}
            {echoes.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-purple-900/10 border border-purple-500/20 rounded-2xl p-5"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-bold text-slate-200">رؤى أنماط التكرار</h3>
                    </div>
                    <div className="space-y-3">
                        {echoes.map((echo, idx) => (
                            <div key={idx} className="flex gap-3 bg-black/20 p-3 rounded-lg border border-purple-500/10">
                                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-sm font-bold text-purple-200">{echo.type} <span className="text-xs opacity-60">(ثقة {Math.round(echo.confidence * 100)}%)</span></div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{echo.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 2. Gravity Well (Top 3 High Mass Objects) */}
            <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    أعلى العلاقات تأثيرًا
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {gravityData.slice(0, 3).map((node, i) => (
                        <div
                            key={node.nodeId}
                            className={`relative overflow-hidden p-4 rounded-xl border backdrop-blur-md transition-all hover:scale-[1.02] group ${node.classification === "Black Hole"
                                ? "bg-rose-950/20 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                                : node.classification === "Star"
                                    ? "bg-amber-950/20 border-amber-500/30"
                                    : "bg-slate-800/40 border-slate-700"
                                }`}
                        >
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-xl" />

                            <div className="text-xs font-mono opacity-60 mb-1">الترتيب #{i + 1}</div>
                            <h4 className="text-lg font-bold text-white mb-2">{node.label}</h4>

                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-xs px-2 py-0.5 rounded border ${node.classification === "Black Hole" ? "bg-rose-500/20 border-rose-500/40 text-rose-300" :
                                    node.classification === "Star" ? "bg-amber-500/20 border-amber-500/40 text-amber-300" :
                                        "bg-slate-500/20 border-slate-500/40 text-slate-300"
                                    }`}>
                                    {classifyLabel(node.classification)}
                                </span>
                                <span className="text-xl font-black opacity-30">{Math.round(node.mass)}g</span>
                            </div>

                            {/* Wormhole Actions (Phase 17) */}
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-white/5">
                                {(node.classification === "Black Hole" || node.classification === "Star") && (
                                    <button
                                        onClick={() => moveNodeToRing(node.nodeId, "red")}
                                        className="flex-1 py-1.5 text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/20"
                                        title="نقل للمدار الأحمر"
                                    >
                                        تحويل للمدار الأحمر
                                    </button>
                                )}
                                {node.classification === "Black Hole" && (
                                    <button
                                        onClick={() => archiveNode(node.nodeId)}
                                        className="flex-1 py-1.5 text-[10px] font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded border border-rose-500/20"
                                        title="أرشفة العلاقة"
                                    >
                                        أرشفة
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};
