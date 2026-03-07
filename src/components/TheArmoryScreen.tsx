import type { FC } from "react";
import { motion } from "framer-motion";
import {
    ShieldAlert,
    EarOff,
    Activity,
    Waves,
    Eye,
    Scale,
    Database,
    History,
    Lock,
    ChevronRight
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ProtectiveSystem {
    id: string;
    name: string;
    description: string;
    status: "active" | "standby" | "locked";
    icon: LucideIcon;
    colorClass: string;
    bgClass: string;
    actionLabel?: string;
    onActivate?: () => void;
    metrics?: string;
}

interface TheArmoryScreenProps {
    onBack: () => void;
    onOpenMuteProtocol: () => void;
    onOpenCocoon: () => void;
    onOpenMirror: () => void;
    onOpenGuiltCourt: () => void;
    onOpenConsciousnessArchive: () => void;
    onOpenTimeCapsule: () => void;
}

export const TheArmoryScreen: FC<TheArmoryScreenProps> = ({
    onBack,
    onOpenMuteProtocol,
    onOpenCocoon,
    onOpenMirror,
    onOpenGuiltCourt,
    onOpenConsciousnessArchive,
    onOpenTimeCapsule
}) => {
    const systems: ProtectiveSystem[] = [
        {
            id: "mute",
            name: "برت اعز (Mute Protocol)",
            description: "فص ضضاء اعا اخارج اضغطات تاا. (تخفض Cognitive Load)",
            status: "standby",
            icon: EarOff,
            colorClass: "text-emerald-400",
            bgClass: "bg-emerald-500/10 border-emerald-500/30",
            actionLabel: "تفع اعز",
            onActivate: onOpenMuteProtocol,
            metrics: "Load: 80%  0%"
        },
        {
            id: "cocoon",
            name: "ضع اشرة (Cocoon Mode)",
            description: "إغا افذ اتخاذ ارار ؤتا عد ااار اطا فرض Hard Reset.",
            status: "standby",
            icon: Waves,
            colorClass: "text-sky-400",
            bgClass: "bg-sky-500/10 border-sky-500/30",
            actionLabel: "دخ اشرة",
            onActivate: onOpenCocoon,
            metrics: "Energy Level < 15%"
        },
        {
            id: "mirror",
            name: "ظا اراا (Mirror Protocol)",
            description: "اجة اتاضات اشعرة اصاتة. (ااستا ضد ارغبة احة)",
            status: "standby",
            icon: Eye,
            colorClass: "text-rose-400",
            bgClass: "bg-rose-500/10 border-rose-500/30",
            actionLabel: "شف اتاض",
            onActivate: onOpenMirror,
            metrics: "Align: 42% (Low)"
        },
        {
            id: "guilt",
            name: "حة اذب (Guilt Court)",
            description: "تف شاعر اذب ابرجة جتعا باأدة اطة.",
            status: "standby",
            icon: Scale,
            colorClass: "text-orange-400",
            bgClass: "bg-orange-500/10 border-orange-500/30",
            actionLabel: "فتح اجسة",
            onActivate: onOpenGuiltCourt,
            metrics: "Queue: 2 Cases"
        },
        {
            id: "archive",
            name: "أرشف اع (Consciousness)",
            description: "سج تارخ ا  اتاعب ب تطر ع بظا ا Blockchain-ish.",
            status: "standby",
            icon: Database,
            colorClass: "text-indigo-400",
            bgClass: "bg-indigo-500/10 border-indigo-500/30",
            actionLabel: "استعراض اسج",
            onActivate: onOpenConsciousnessArchive,
            metrics: "Nodes: 1,204"
        },
        {
            id: "time",
            name: "بسة از (Time Vault)",
            description: "رسائ ت استبة ع اسا اعاطف ت ااتاسات.",
            status: "locked",
            icon: History,
            colorClass: "text-slate-400",
            bgClass: "bg-slate-500/10 border-slate-500/30",
            actionLabel: "برت ف",
            onActivate: onOpenTimeCapsule,
            metrics: "Phase 30 Req."
        }
    ];

    return (
        <div className="w-full flex-1 min-h-[100dvh] bg-slate-950 flex flex-col relative overflow-y-auto">
            {/* Tactical Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-widest text-slate-100 flex items-center gap-2 uppercase">
                            اترساة <ShieldAlert className="w-5 h-5 text-amber-500" />
                        </h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold mt-1">
                            Cognitive Defense Matrix // Active
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Shields Up</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 z-10 max-w-5xl mx-auto w-full">
                {/* Global Entropy Alert */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 rounded-2xl bg-amber-500/5 border border-amber-500/20 p-5 flex items-start gap-4"
                >
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Activity className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-sm font-bold text-amber-400 mb-1">تحذر ست افض (Entropy Alert)</h2>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                            ت رصد ارتفاع ف ست اتشتت خا آخر ساعت. باء ع اسات "حر اأثر" ُصح بتفع (ضع اشرة) أ (أرشف اع) إعادة ضبط اترز.
                        </p>
                    </div>
                    <div className="hidden sm:block text-right">
                        <div className="text-2xl font-black text-amber-400">68%</div>
                        <div className="text-[9px] text-amber-500/50 uppercase tracking-widest font-bold">Chaos Index</div>
                    </div>
                </motion.div>

                {/* Systems Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {systems.map((sys, idx) => (
                        <motion.div
                            key={sys.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`relative overflow-hidden rounded-3xl border p-6 flex flex-col ${sys.bgClass} ${sys.status === "locked" ? "opacity-50 grayscale" : ""}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl bg-slate-900 border flex items-center justify-center shadow-inner ${sys.colorClass} border-white/5`}>
                                    <sys.icon className="w-6 h-6" />
                                </div>
                                {sys.metrics && (
                                    <div className="px-2 py-1 rounded border border-white/5 bg-black/40 text-[9px] font-mono font-bold text-slate-300">
                                        {sys.metrics}
                                    </div>
                                )}
                            </div>
                            <h3 className="text-sm font-black text-white mb-2">{sys.name}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed flex-1 mb-6">
                                {sys.description}
                            </p>
                            <button
                                onClick={sys.status !== "locked" ? sys.onActivate : undefined}
                                disabled={sys.status === "locked"}
                                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                  ${sys.status === "locked"
                                        ? "bg-slate-800 text-slate-500 cursor-not-allowed flex items-center justify-center gap-2"
                                        : "bg-slate-900 border border-white/10 hover:bg-white/5 text-slate-200"}`}
                            >
                                {sys.status === "locked" ? <><Lock className="w-3 h-3" /> {sys.actionLabel}</> : sys.actionLabel}
                            </button>

                            {/* Background Watermark Icon */}
                            <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none rotate-12">
                                <sys.icon className={`w-36 h-36 ${sys.colorClass}`} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
};
