import React, { useState } from "react";
import { motion } from "framer-motion";
import { Camera, CheckCircle2, Lock, Sparkles, User, Palette, ShieldCheck, Paintbrush } from "lucide-react";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { useAchievementState } from "@/domains/gamification/store/achievement.store";
import { loadUserMemory, saveUserMemory, updatePreferredName, updateBio } from "@/services/userMemory";
import { ACHIEVEMENTS } from "@/data/achievements";

export const ProfileAppearanceSettings: React.FC = () => {
    const memory = loadUserMemory();
    const { level } = useGamificationState();
    const unlockedIds = useAchievementState((s) => s.unlockedIds);
    
    const [displayName, setDisplayName] = useState(memory.preferredName || "المسافر");
    const [bio, setBio] = useState(memory.bio || "أبحث عن النقاء الإدراكي والسيادة المعرفية في الفضاء الرقمي.");
    
    const [activeTheme, setActiveTheme] = useState("nebula");
    const [badges, setBadges] = useState(unlockedIds.slice(0, 2));

    const [toggles, setToggles] = useState({
        showLevel: true,
        publicProfile: false,
        allowInquiries: true
    });

    const ALL_THEMES = [
        { id: "nebula", name: "الوهج الكوني (Nebula Aura)", bg: "from-slate-900 via-indigo-950 to-purple-900", ring: "from-teal-400", minLevel: 1 },
        { id: "solar", name: "توهج شمسي (Solar Flare)", bg: "from-orange-950 via-red-900 to-yellow-900", ring: "from-amber-400", minLevel: 5 },
        { id: "obsidian", name: "ظلام بركاني (Obsidian Dark)", bg: "from-slate-950 via-black to-slate-900", ring: "from-slate-600", minLevel: 10 },
        { id: "singularity", name: "التفرد العميق (Deep Singularity)", bg: "from-black via-fuchsia-950 to-slate-950", ring: "from-fuchsia-500", minLevel: 15 },
        { id: "golden_ratio", name: "النسبة الذهبية (Golden Ratio)", bg: "from-slate-900 via-slate-800 to-yellow-900/50", ring: "from-yellow-400", minLevel: 25 }
    ];

    const toggleBadge = (id: string) => {
        if (badges.includes(id)) {
            setBadges(badges.filter(b => b !== id));
        } else if (badges.length < 4) {
            setBadges([...badges, id]);
        }
    };

    const handleSave = () => {
        updatePreferredName(displayName);
        updateBio(bio);
        alert("تم تحديث هويتك المدارية بنجاح ✔️");
    };

    return (
        <div className="space-y-6 pb-6" dir="rtl">
            <div className="space-y-1 mb-6">
                <h2 className="text-xl font-black text-white">الهوية والمظهر</h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                    خصّص حضورك في الملاذ. اختر كيف ينعكس ترددك الإدراكي على الآخرين.
                </p>
            </div>

            {/* Section 1: Profile Appearance */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-[40px] rounded-full pointer-events-none" />
                
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-teal-400 via-indigo-500 to-teal-400">
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-950 bg-slate-800 flex items-center justify-center">
                                <User size={40} className="text-teal-500" />
                            </div>
                        </div>
                        <button className="absolute bottom-0 right-0 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-slate-950 shadow-lg hover:scale-110 transition-transform">
                            <Camera size={14} />
                        </button>
                    </div>

                    <div className="flex-1 w-full space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-teal-400 uppercase tracking-widest px-1">اسم العرض</label>
                            <input
                                id="profile-display-name"
                                name="profileDisplayName"
                                className="w-full bg-slate-950/50 border-0 border-b-2 border-teal-500/20 focus:border-teal-400 focus:ring-0 text-white rounded-t-lg px-4 py-2.5 text-sm transition-colors outline-none" 
                                type="text" 
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-teal-400 uppercase tracking-widest px-1">النبذة العميقة (Deep Bio)</label>
                            <textarea
                                id="profile-bio"
                                name="profileBio"
                                className="w-full bg-slate-950/50 border-0 border-b-2 border-teal-500/20 focus:border-teal-400 focus:ring-0 text-white rounded-t-lg px-4 py-2.5 text-sm min-h-[80px] outline-none resize-none transition-colors"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Section 2: Theme Selection */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Palette size={16} className="text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">السمة البصرية (Theme)</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {ALL_THEMES.map((theme) => {
                        const isUnlocked = level >= theme.minLevel;
                        return (
                            <div 
                                key={theme.id}
                                onClick={() => isUnlocked && setActiveTheme(theme.id)}
                                className={`relative rounded-xl overflow-hidden shadow-lg transition-all border-2 
                                ${isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed grayscale'} 
                                ${activeTheme === theme.id ? "border-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.2)]" : "border-white/10 opacity-70 hover:opacity-100"}`}
                            >
                                <div className={`h-20 bg-gradient-to-br ${theme.bg} flex items-center justify-center relative`}>
                                    <div className={`absolute inset-0 opacity-40 bg-gradient-to-t from-transparent ${theme.ring}`} />
                                    <span className="relative z-10 text-[10px] font-black text-white/90 drop-shadow-md">
                                        {theme.name}
                                    </span>
                                </div>
                                {!isUnlocked && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                        <div className="flex flex-col items-center gap-1">
                                            <Lock size={16} className="text-slate-400" />
                                            <span className="text-[8px] font-bold text-slate-300">يفتح بالمستوى {theme.minLevel}</span>
                                        </div>
                                    </div>
                                )}
                                {activeTheme === theme.id && isUnlocked && (
                                    <div className="absolute top-2 right-2 bg-teal-400 text-slate-950 p-0.5 rounded-full z-20">
                                        <CheckCircle2 size={12} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Section 3: Badge Showcase */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md space-y-4">
                <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-400" />
                        <div>
                            <h3 className="text-sm font-bold text-white">واجهة البصائر</h3>
                            <p className="text-[10px] text-slate-400">اعرض أهم 4 بصائر في ملفك العلني</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-1 rounded">
                        {badges.length} / 4
                    </span>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide py-1">
                    {ACHIEVEMENTS.slice(0, 8).map((a) => {
                        const isUnlocked = unlockedIds.includes(a.id);
                        const isSelected = badges.includes(a.id);

                        return (
                            <div 
                                key={a.id} 
                                onClick={() => isUnlocked && toggleBadge(a.id)}
                                className={`shrink-0 w-24 p-3 rounded-xl flex flex-col items-center gap-2 text-center transition-all ${
                                    isSelected 
                                        ? "bg-slate-800 border-2 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]" 
                                        : isUnlocked 
                                            ? "bg-slate-900 border border-white/10 hover:border-white/30 cursor-pointer" 
                                            : "bg-slate-950/50 border border-white/5 opacity-40 grayscale"
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isSelected ? "bg-purple-500/20" : "bg-white/5"}`}>
                                    {isUnlocked ? a.icon : <Lock size={16} className="text-slate-500" />}
                                </div>
                                <span className="text-[9px] font-bold text-slate-300 leading-tight">{a.title}</span>
                                {isSelected && (
                                    <div className="absolute top-1 right-1 opacity-80">
                                        <CheckCircle2 size={12} className="text-purple-400" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Section 4: Identity & Privacy */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-5 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md space-y-5">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">هوية الوصول والخصوصية</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-200">إظهار المرتبة (Level)</p>
                            <p className="text-[10px] text-slate-400">السماح للمراقبين برؤية مستوى تقدمك</p>
                        </div>
                        <button 
                            onClick={() => setToggles({...toggles, showLevel: !toggles.showLevel})}
                            className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${toggles.showLevel ? 'bg-teal-500' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${toggles.showLevel ? 'left-0.5 translate-x-0' : 'left-5 translate-x-0'}`}/>
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-200">الرادار العلني</p>
                            <p className="text-[10px] text-slate-400">جعل الملاذ متاحاً لاستكشاف الآخرين</p>
                        </div>
                        <button 
                            onClick={() => setToggles({...toggles, publicProfile: !toggles.publicProfile})}
                            className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${toggles.publicProfile ? 'bg-teal-500' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${toggles.publicProfile ? 'left-0.5 translate-x-0' : 'left-5 translate-x-0'}`}/>
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-200">قبول الملتمسين</p>
                            <p className="text-[10px] text-slate-400">استلام طلبات تواصل من رحالة آخرين</p>
                        </div>
                        <button 
                            onClick={() => setToggles({...toggles, allowInquiries: !toggles.allowInquiries})}
                            className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${toggles.allowInquiries ? 'bg-teal-500' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${toggles.allowInquiries ? 'left-0.5 translate-x-0' : 'left-5 translate-x-0'}`}/>
                        </button>
                    </div>
                </div>
            </motion.div>

            <motion.button
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                onClick={handleSave}
                className="w-full mt-6 py-3.5 rounded-xl font-bold text-slate-950 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #2dd4bf, #0ea5e9)", boxShadow: "0 0 20px rgba(45,212,191,0.2)" }}
                whileTap={{ scale: 0.98 }}
            >
                <Paintbrush className="w-5 h-5" />
                تحديث الهوية الكونية
            </motion.button>
        </div>
    );
};
