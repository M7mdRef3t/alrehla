import React from "react";
import { 
  Palette, 
  Layers, 
  Maximize, 
  Zap as Sparkles, 
  RotateCcw, 
  Sun, 
  Moon,
  Zap,
  Leaf,
  Wind,
  Type,
  MousePointer2,
  Box,
  Activity,
  CheckCircle2,
  Info,
  Table,
  List,
  Radar,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useThemeState, DesignTokens, injectTokens } from "@/domains/consciousness/store/theme.store";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { aiDesignService } from "@/ai/aiDesignService";
import { CommandOrchestrator } from "@/services/commandOrchestrator";

const DesignLab: React.FC = () => {
  const { customTokens, updateTokens, resetTokens, theme, setTheme, publishToCloud, fetchCloudTokens } = useThemeState();
  const resonanceScore = useAdminState(s => s.resonanceScore);
  const [activeState, setActiveState] = React.useState<"global" | "crisis" | "stable" | "flow">("global");
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [autoSensorySync, setAutoSensorySync] = React.useState(false);
  const [status, setStatus] = React.useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ─── Showcase Data Persistence (localStorage) ───────────────────
  const SHOWCASE_STORAGE_KEY = "design-lab-showcase-v1";

  const DEFAULT_TABLE = [
    { name: "محمد رسول", level: "Lvl 9", status: "نشط", val: "8.2", trend: "up" as const },
    { name: "أحمد علي", level: "Lvl 4", status: "انتظار", val: "4.1", trend: "down" as const },
    { name: "سارة محمود", level: "Lvl 7", status: "نشط", val: "9.5", trend: "up" as const },
    { name: "كريم جلال", level: "Lvl 2", status: "غير نشط", val: "1.0", trend: "flat" as const },
    { name: "نور الدمرداش", level: "Lvl 8", status: "نشط", val: "7.7", trend: "up" as const }
  ];
  const DEFAULT_LIST = [
    { label: "تحليل الارتباط العاطفي", score: 94, status: "stable" },
    { label: "مزامنة الوعي الجمعي", score: 72, status: "pending" },
    { label: "توجيه نداء الملاذ", score: 45, status: "low" },
    { label: "فك شفرة الانتباه", score: 100, status: "stable" },
    { label: "رصد فجوات الهدوء", score: 12, status: "warning" }
  ];
  const DEFAULT_STATS = [
    { label: "التناغم الحسي", value: "92", unit: "Reson", color: "teal" },
    { label: "زمن الاستجابة", value: "1.2", unit: "ms", color: "indigo" },
    { label: "كثافة الإشارات", value: "542", unit: "Hz", color: "amber" },
    { label: "نقاط الحضور", value: "12k", unit: "Presence", color: "purple" }
  ];

  const loadShowcaseData = () => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(SHOWCASE_STORAGE_KEY) : null;
      if (stored) return JSON.parse(stored);
    } catch { /* ignore parse errors */ }
    return null;
  };

  const savedData = loadShowcaseData();

  // Editable Showcase Data State — loaded from localStorage if available
  const [showcaseTable, setShowcaseTable] = React.useState(savedData?.table ?? DEFAULT_TABLE);
  const [showcaseList, setShowcaseList] = React.useState(savedData?.list ?? DEFAULT_LIST);
  const [showcaseStats, setShowcaseStats] = React.useState(savedData?.stats ?? DEFAULT_STATS);
  const [isEditingShowcase, setIsEditingShowcase] = React.useState(false);


  // Sensory Shift Effect: Inject tokens immediately on tab switch
  React.useEffect(() => {
    const tokens = activeState === "global" 
      ? customTokens 
      : { ...customTokens, ...(customTokens.states?.[activeState] || {}) };
    injectTokens(tokens as DesignTokens);
  }, [activeState, customTokens]);

  // Persist showcase data to localStorage whenever it changes
  React.useEffect(() => {
    try {
      window.localStorage.setItem(SHOWCASE_STORAGE_KEY, JSON.stringify({
        table: showcaseTable,
        list: showcaseList,
        stats: showcaseStats
      }));
    } catch { /* ignore storage errors */ }
  }, [showcaseTable, showcaseList, showcaseStats]);

  // Reset showcase data to defaults and clear localStorage
  const resetShowcaseData = () => {
    setShowcaseTable(DEFAULT_TABLE);
    setShowcaseList(DEFAULT_LIST);
    setShowcaseStats(DEFAULT_STATS);
    try { window.localStorage.removeItem(SHOWCASE_STORAGE_KEY); } catch { /* ignore */ }
    setStatus({ type: "success", msg: "تم إعادة ضبط بيانات المعرض للقيم الافتراضية" });
  };

  React.useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const currentLevel = activeState === "global" 
    ? customTokens 
    : { ...customTokens, ...(customTokens.states?.[activeState] || {}) };

  const handleUpdate = (updates: Partial<DesignTokens>) => {
    if (activeState === "global") {
      updateTokens(updates);
    } else {
      const existingStates = customTokens.states || {};
      const stateUpdates = { ...existingStates[activeState], ...updates };
      updateTokens({ 
        states: { ...existingStates, [activeState]: stateUpdates } 
      });
    }
  };

  React.useEffect(() => {
    if (!autoSensorySync) return;
    
    // Auto-override based on Resonance
    if (resonanceScore < 35 && activeState !== "crisis") {
       setActiveState("crisis");
       updateTokens({
          grainOpacity: 0.15,
          chromaticAberration: 0.08,
          ambientVolume: 0.3,
          primaryColor: "#f43f5e" // Rose
       });
       setStatus({ type: "success", msg: "تفعيل الخصائص الحسية الطارئة لانخفاض التناغم" });
    } else if (resonanceScore >= 75 && activeState !== "flow") {
       setActiveState("flow");
       updateTokens({
          grainOpacity: 0.0,
          chromaticAberration: 0.0,
          ambientVolume: 0.8,
          primaryColor: "#10b981" // Emerald
       });
       setStatus({ type: "success", msg: "تفعيل وضع التدفق الحسي للإيجابية العالية" });
    }
  }, [resonanceScore, autoSensorySync]);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const tokens = await aiDesignService.generateTokens(aiPrompt);
      if (tokens) {
        handleUpdate(tokens);
        setStatus({ type: "success", msg: "تم توليد التصميم بنجاح!" });
      }
    } catch (error) {
      setStatus({ type: "error", msg: "فشل توليد التصميم الذكي." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    setIsSyncing(true);
    const success = await publishToCloud();
    setIsSyncing(false);
    if (success) setStatus({ type: "success", msg: "تمت مزامنة الهوية مع السحابة بنجاح!" });
    else setStatus({ type: "error", msg: "فشلت المزامنة." });
  };

  const moods = [
    {
      name: "الملاذ الهادئ (Zen)",
      icon: <Leaf className="w-5 h-5 text-teal-400" />,
      tokens: {
        primaryColor: "#2dd4bf",
        accentColor: "#10b981",
        spaceVoid: "#064e3b",
        borderRadius: "24px",
        blur: "16px",
        spacing: "1.25rem"
      }
    },
    {
      name: "القيادة الإدراكية (Royal)",
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      tokens: {
        primaryColor: "#f5a623",
        accentColor: "#fbbf24",
        spaceVoid: "#0a0e1f",
        borderRadius: "8px",
        blur: "4px",
        spacing: "1rem"
      }
    },
    {
      name: "وعي البرق (Vibrant)",
      icon: <Zap className="w-5 h-5 text-indigo-400" />,
      tokens: {
        primaryColor: "#6366f1",
        accentColor: "#ec4899",
        spaceVoid: "#1e1b4b",
        borderRadius: "16px",
        blur: "12px",
        spacing: "1.1rem"
      }
    },
    {
      name: "الفضاء العميق (Nebula)",
      icon: <Wind className="w-5 h-5 text-cyan-400" />,
      tokens: {
        primaryColor: "#22d3ee",
        accentColor: "#38bdf8",
        spaceVoid: "#020617",
        borderRadius: "32px",
        blur: "20px",
        spacing: "1.5rem"
      }
    }
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Palette className="w-8 h-8 text-teal-400" />
            مختبر التصميم الإدراكي
          </h1>
          <p className="text-slate-400 text-lg">
            تحكم في الهوية البصرية والمشاعر التي تنقلها المنصة بضغطة زر.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {status && (
            <div className={`px-4 py-2 rounded-xl text-sm font-medium animate-in fade-in zoom-in duration-300 ${
              status.type === "success" ? "bg-teal-500/20 text-teal-400 border border-teal-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"
            }`}>
              {status.msg}
            </div>
          )}
          <button
            onClick={() => setAutoSensorySync(!autoSensorySync)}
            className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 ${
              autoSensorySync ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/20" : "bg-white/5 border-white/10 text-slate-300"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {autoSensorySync ? "الربط الحسي الآلي: نشط" : "تفعيل التناغم الحسي الآلي"}
          </button>
          <button 
            onClick={fetchCloudTokens}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all text-sm"
          >
            جلب المناخ الحالي
          </button>
          <button 
            onClick={handlePublish}
            disabled={isSyncing}
            className={`px-6 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-2 ${
              isSyncing ? "bg-slate-800 text-slate-500" : "bg-teal-500 text-slate-950 hover:bg-teal-400"
            }`}
          >
            {isSyncing && <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent animate-spin rounded-full" />}
            نشر السحابة الخاصة
          </button>
        </div>
      </header>

      {/* AI Orchestrator Zone */}
      <section className="bg-gradient-to-r from-indigo-900/40 to-teal-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] space-y-4">
        <div className="flex items-center gap-3 text-white">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold">مهندس التصميم الذكي (Generative AI)</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="مثال: اجعل التصميم يبدو كأنه غابة هادئة في الصباح..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
            className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
          />
          <button 
            onClick={handleAiGenerate}
            disabled={isGenerating || !aiPrompt.trim()}
            className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
          >
            {isGenerating ? "جاري التخيّل..." : "توليد بالذكاء الاصطناعي"}
            {!isGenerating && <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </section>

      {/* State Switcher */}
      <nav className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 w-fit">
        {(["global", "crisis", "stable", "flow"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveState(s)}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all text-sm capitalize ${
              activeState === s ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            {s === "global" ? "الهوية العامة" : 
             s === "crisis" ? "وضع الأزمة" :
             s === "stable" ? "الاستقرار" : "وضع التدفق (Flow)"}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Section 1: Core Colors */}
        <section className="bg-space-950/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-400" />
            باليتة الألوان
          </h2>
          
          <div className="space-y-4">
            <ColorInput 
              label="اللون الأساسي (Primary)" 
              value={currentLevel.primaryColor}
              onChange={(val) => handleUpdate({ primaryColor: val })}
            />
            <ColorInput 
              label="لون التميز (Accent)" 
              value={currentLevel.accentColor}
              onChange={(val) => handleUpdate({ accentColor: val })}
            />
            <ColorInput 
              label="فراغ الخلفية (Void)" 
              value={currentLevel.spaceVoid}
              onChange={(val) => handleUpdate({ spaceVoid: val })}
            />
          </div>
        </section>

        {/* Section 2: Structure & Atmosphere */}
        <section className="bg-space-950/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" />
            البنية والأجواء
          </h2>
          
          <div className="space-y-6">
            <SliderInput 
              label="انحناء الحواف (Border Radius)"
              value={parseInt(currentLevel.borderRadius || "16px") || 0}
              min={0}
              max={40}
              unit="px"
              onChange={(val) => handleUpdate({ borderRadius: `${val}px` })}
            />
            <SliderInput 
              label="شدة التمويه (Glass Blur)"
              value={parseInt(currentLevel.blur || "8px") || 0}
              min={0}
              max={30}
              unit="px"
              onChange={(val) => handleUpdate({ blur: `${val}px` })}
            />
            <SliderInput 
              label="توهج الحواف (Vignette)"
              value={(currentLevel.vignetteStrength ?? 0.2) * 100}
              min={0}
              max={100}
              unit="%"
              onChange={(val) => handleUpdate({ vignetteStrength: val / 100 })}
            />
            <SliderInput 
              label="تأثير الحبيبات (Grain)"
              value={(currentLevel.grainOpacity ?? 0.1) * 100}
              min={0}
              max={100}
              unit="%"
              onChange={(val) => handleUpdate({ grainOpacity: val / 100 })}
            />
            <SliderInput 
              label="تشويش لوني (Aberration)"
              value={(currentLevel.chromaticAberration ?? 0) * 100}
              min={0}
              max={100}
              unit="%"
              onChange={(val) => handleUpdate({ chromaticAberration: val / 100 })}
            />
            <SliderInput 
              label="حجم الصوت المحيطي (Soundscape)"
              value={(currentLevel.ambientVolume ?? 0.5) * 100}
              min={0}
              max={100}
              unit="%"
              onChange={(val) => handleUpdate({ ambientVolume: val / 100 })}
            />
            <div className="flex items-center justify-between pt-4">
              <span className="text-slate-300 font-medium">وضع المنصة</span>
              <div className="flex bg-slate-900/50 p-1 rounded-full border border-white/5">
                <button 
                  onClick={() => setTheme("light")}
                  className={`p-2 rounded-full transition-all ${theme === "light" ? "bg-white text-black" : "text-slate-400"}`}
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setTheme("dark")}
                  className={`p-2 rounded-full transition-all ${theme === "dark" ? "bg-white text-black" : "text-slate-400"}`}
                >
                  <Moon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Mood Presets */}
        <section className="bg-space-950/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              الأنماط الشعورية (Moods)
            </h2>
            <button 
              onClick={resetTokens}
              className="text-slate-500 hover:text-white transition-colors"
              title="إعادة التعيين"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {moods.map((mood) => (
              <button
                key={mood.name}
                onClick={() => updateTokens(mood.tokens)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-right group"
              >
                <div className="p-3 rounded-xl bg-slate-900 group-hover:scale-110 transition-transform">
                  {mood.icon}
                </div>
                <span className="text-slate-200 font-medium">{mood.name}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Showcase Section — معرض عناصر المنصة */}
      <section className="mt-16 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-r-4 border-[var(--teal-400)] pr-6">
          <div className="space-y-2">
            <h3 className="text-4xl font-black text-white tracking-tight">معرض عناصر المنصة (Showcase)</h3>
            <p className="text-slate-400 text-xl font-medium max-w-2xl leading-relaxed">
              هذا هو المختبر الحي. كل ما تراه هنا يتأثر مباشرة بباليتة الألوان، انحناء الحواف، وشدة التمويه التي حددتها أعلاه.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Persistence indicator */}
            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
              محفوظ تلقائياً
            </span>
            {/* Reset button — only visible when NOT in edit mode */}
            {!isEditingShowcase && (
              <button
                onClick={resetShowcaseData}
                title="إعادة تعيين البيانات للقيم الافتراضية"
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button 
              onClick={() => setIsEditingShowcase(!isEditingShowcase)}
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                isEditingShowcase 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {isEditingShowcase ? 'إيقاف التعديل ❌' : 'تعديل بيانات المعرض ✍️'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* 1. Typography & Hierarchy */}
          <div className="bg-white/[0.02] border border-white/5 rounded-[var(--consciousness-border-radius)] p-8 space-y-6 backdrop-blur-[var(--consciousness-blur)]">
            <div className="flex items-center gap-3 text-indigo-400 mb-2">
              <Type className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">تدرج النصوص</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white leading-tight">عنوان القيادة</h1>
              <h2 className="text-2xl font-bold text-[var(--teal-400)]">عنوان المرحلة القادمة</h2>
              <p className="text-slate-400 leading-relaxed text-sm font-medium">
                في رحلتنا نحو الوعي، نستخدم خطوطاً تتنفس مع المستخدم. النصوص هنا تعكس الوضوح والقوة في آن واحد.
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-mono text-slate-500">Normal</span>
                <span className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-mono font-bold text-slate-500">Bold</span>
                <span className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-mono italic text-slate-500">Italic</span>
              </div>
            </div>
          </div>

          {/* 2. Interactive Atoms */}
          <div className="bg-white/[0.02] border border-white/5 rounded-[var(--consciousness-border-radius)] p-8 space-y-8 backdrop-blur-[var(--consciousness-blur)]">
            <div className="flex items-center gap-3 text-amber-500 mb-2 justify-end">
              <span className="text-[10px] font-black uppercase tracking-widest">التفاعلات الحيوية</span>
              <MousePointer2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-4">
              <button className="w-full py-4 bg-[var(--teal-400)] text-slate-950 font-black rounded-[var(--consciousness-border-radius)] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[var(--teal-400)]/20 flex items-center justify-center gap-2 group">
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                بداية الرحلة الآن
              </button>
              <button className="w-full py-4 border-2 border-[var(--teal-400)]/20 text-[var(--teal-400)] font-bold rounded-[var(--consciousness-border-radius)] hover:bg-[var(--teal-400)]/5 transition-all flex items-center justify-center gap-2">
                استكشاف الخريطة
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-between gap-4 pt-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-12 h-6 bg-slate-800 rounded-full p-1 transition-colors group-hover:bg-slate-700 relative">
                     <div className="w-4 h-4 bg-white rounded-full translate-x-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">التزامن</span>
                </label>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <Info className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Status Containers */}
          <div className="bg-white/[0.02] border border-white/5 rounded-[var(--consciousness-border-radius)] p-8 space-y-6 relative overflow-hidden group backdrop-blur-[var(--consciousness-blur)]">
             <div className="absolute top-0 left-0 w-32 h-32 bg-[var(--teal-400)]/10 blur-[60px] -translate-x-16 -translate-y-16 group-hover:bg-[var(--teal-400)]/20 transition-all duration-700" />
             <div className="flex items-center gap-3 text-teal-400 mb-2">
              <Box className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">الحاويات الإدراكية</span>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="p-5 bg-white/5 border border-white/10 rounded-[var(--consciousness-border-radius)] hover:bg-white/10 transition-all group/card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="font-black text-white text-sm">إشارة نشطة</div>
                </div>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">هذا هو شكل البطاقات الصغيرة في لوحات التحكم الجانبية.</p>
              </div>
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-[var(--consciousness-border-radius)] flex items-center gap-3">
                 <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                 <span className="text-[10px] font-black text-rose-300 uppercase">تحذير حسي: اضطراب في التردد</span>
              </div>
            </div>
          </div>

          {/* Advanced Data Visualization Track */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-white/5">
            
            {/* 1. Universal Radar — رادار الوعي */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-purple-400">
                <Radar className="w-5 h-5" />
                <h4 className="text-lg font-black text-white">رادار التناغم (Radar)</h4>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-[var(--consciousness-border-radius)] p-8 flex flex-col items-center justify-center gap-6 group backdrop-blur-[var(--consciousness-blur)] h-[350px]">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                    {/* Background Circles */}
                    <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/5" />
                    <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/5" />
                    <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/5" />
                    
                    {/* Axes */}
                    {[0, 60, 120, 180, 240, 300].map(angle => {
                      const x2 = 100 + 80 * Math.cos((angle * Math.PI) / 180);
                      const y2 = 100 + 80 * Math.sin((angle * Math.PI) / 180);
                      return <line key={angle} x1="100" y1="100" x2={x2} y2={y2} stroke="currentColor" strokeWidth="1" className="text-white/10" />;
                    })}

                    {/* Dynamic Shape */}
                    <polygon 
                      points={
                        activeState === 'crisis' 
                          ? "100 60, 140 110, 90 160, 50 120, 70 80, 120 50" 
                          : "100 40, 160 80, 140 150, 70 160, 40 90, 80 45"
                      }
                      style={{ transition: 'all 1.5s ease-in-out' }}
                      fill="var(--teal-400)" 
                      fillOpacity="0.2" 
                      stroke="var(--teal-400)" 
                      strokeWidth="3" 
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-[var(--teal-400)] rounded-full animate-ping" />
                  </div>
                </div>
                <div className="grid grid-cols-2 w-full gap-2">
                   <div className="bg-slate-900/40 p-2 rounded-xl border border-white/5 text-center">
                      <span className="block text-[8px] text-slate-500 uppercase font-black">Resonance</span>
                      <span className="text-xs font-bold text-white">88%</span>
                   </div>
                   <div className="bg-slate-900/40 p-2 rounded-xl border border-white/5 text-center">
                      <span className="block text-[8px] text-slate-500 uppercase font-black">Stability</span>
                      <span className="text-xs font-bold text-emerald-400">Optimal</span>
                   </div>
                </div>
              </div>
            </div>

            {/* 2. Structured List — القوائم المخصصة */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-blue-400">
                <List className="w-5 h-5" />
                <h4 className="text-lg font-black text-white">قائمة المسارات (List)</h4>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-[var(--consciousness-border-radius)] p-6 space-y-3 backdrop-blur-[var(--consciousness-blur)] h-[350px] overflow-hidden overflow-y-auto custom-scrollbar">
                {showcaseList.map((item: any, i: number) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-[calc(var(--consciousness-border-radius)-8px)] group hover:bg-white/10 hover:border-[var(--teal-400)]/30 transition-all cursor-pointer relative"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-xl bg-slate-900 group-hover:scale-110 transition-transform ${item.status === 'low' ? 'text-amber-500' : 'text-[var(--teal-400)]'}`}>
                        {item.status === 'stable' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1">
                        {isEditingShowcase ? (
                          <input 
                            type="text" 
                            value={item.label}
                            onChange={(e) => {
                              const newList = [...showcaseList];
                              newList[i] = { ...newList[i], label: e.target.value };
                              setShowcaseList(newList);
                            }}
                            className="text-xs font-black text-white bg-white/5 border border-white/10 rounded px-2 w-full outline-none"
                          />
                        ) : (
                          <p className="text-xs font-black text-slate-200">{item.label}</p>
                        )}
                        <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Confidence Matrix: {item.score}%</p>
                      </div>
                    </div>
                    {isEditingShowcase ? (
                      <button 
                        onClick={() => setShowcaseList(showcaseList.filter((_: any, idx: number) => idx !== i))}
                        className="p-1 hover:text-rose-500 text-slate-700 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3 rotate-45" />
                      </button>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    )}
                  </motion.div>
                ))}
                {isEditingShowcase && (
                  <button 
                    onClick={() => setShowcaseList([...showcaseList, { label: "مسار جديد", score: 50, status: "pending" }])}
                    className="w-full py-2 border border-dashed border-white/10 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:text-white hover:border-white/20 transition-all"
                  >
                    + إضافة مسار
                  </button>
                )}
              </div>
            </div>

            {/* 3. Command Table — الجداول المعلوماتية */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-emerald-400">
                <Table className="w-5 h-5" />
                <h4 className="text-lg font-black text-white">سجل العمليات (Table)</h4>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-[var(--consciousness-border-radius)] p-4 overflow-hidden backdrop-blur-[var(--consciousness-blur)] h-[350px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-right" dir="rtl">
                  <thead className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="pb-4 px-2 text-right">المرسل</th>
                      <th className="pb-4 px-2 text-center">القوة</th>
                      <th className="pb-4 px-2 text-left">الحالة</th>
                      {isEditingShowcase && <th className="pb-4 px-2 w-8"></th>}
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-slate-300">
                    {showcaseTable.map((row: any, i: number) => (
                      <tr key={i} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors group">
                        <td className="py-4 px-2">
                           <div className="flex flex-col">
                              {isEditingShowcase ? (
                                <input 
                                  type="text" 
                                  value={row.name}
                                  onChange={(e) => {
                                    const newTable = [...showcaseTable];
                                    newTable[i] = { ...newTable[i], name: e.target.value };
                                    setShowcaseTable(newTable);
                                  }}
                                  className="text-white bg-white/5 border border-white/10 rounded px-1 outline-none w-full"
                                />
                              ) : (
                                <span className="text-white group-hover:text-[var(--teal-400)] transition-colors">{row.name}</span>
                              )}
                              <span className="text-[8px] text-slate-600 font-mono tracking-tighter">{row.level}</span>
                           </div>
                        </td>
                        <td className="py-4 px-2 text-center font-mono">
                           <div className="flex items-center justify-center gap-1">
                              {isEditingShowcase ? (
                                <input 
                                  type="text" 
                                  value={row.val}
                                  onChange={(e) => {
                                    const newTable = [...showcaseTable];
                                    newTable[i] = { ...newTable[i], val: e.target.value };
                                    setShowcaseTable(newTable);
                                  }}
                                  className="text-[var(--teal-400)] bg-white/5 border border-white/10 rounded px-1 outline-none w-10 text-center"
                                />
                              ) : (
                                <span className={row.trend === 'up' ? 'text-emerald-400' : row.trend === 'down' ? 'text-rose-400' : 'text-slate-400'}>{row.val}</span>
                              )}
                              {row.trend === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : row.trend === 'down' ? <TrendingUp className="w-2.5 h-2.5 rotate-180" /> : null}
                           </div>
                        </td>
                        <td className="py-4 px-2 text-left">
                           {isEditingShowcase ? (
                             <select 
                               value={row.status}
                               onChange={(e) => {
                                 const newTable = [...showcaseTable];
                                 newTable[i] = { ...newTable[i], status: e.target.value };
                                 setShowcaseTable(newTable);
                               }}
                               className="bg-slate-900 text-[8px] border border-white/10 rounded px-1 outline-none"
                             >
                               <option value="نشط">نشط</option>
                               <option value="انتظار">انتظار</option>
                               <option value="غير نشط">غير نشط</option>
                             </select>
                           ) : (
                             <span className={`px-2 py-1 rounded-full text-[8px] font-black tracking-tighter ${
                               row.status === 'نشط' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                               row.status === 'انتظار' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                               'bg-slate-800 text-slate-500 border border-white/5'
                             }`}>
                               {row.status}
                             </span>
                           )}
                        </td>
                        {isEditingShowcase && (
                          <td className="py-4 px-2">
                             <button 
                               onClick={() => setShowcaseTable(showcaseTable.filter((_: any, idx: number) => idx !== i))}
                               className="text-slate-700 hover:text-rose-500 transition-colors"
                             >
                               <RotateCcw className="w-3 h-3 rotate-45" />
                             </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {isEditingShowcase && (
                  <button 
                    onClick={() => setShowcaseTable([...showcaseTable, { name: "عضو جديد", level: "Lvl 1", status: "نشط", val: "5.0", trend: "flat" }])}
                    className="w-full py-2 mt-2 border border-dashed border-white/10 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:text-white hover:border-white/20 transition-all"
                  >
                    + إضافة عضو
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Vitals & Bio-Feedback */}
          <div className="lg:col-span-3 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-[calc(var(--consciousness-border-radius)+8px)] p-10 backdrop-blur-3xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.05)_0%,_transparent_60%)] pointer-events-none" />
             
             <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--teal-400)]/10 flex items-center justify-center border border-[var(--teal-400)]/20 shadow-2xl shadow-[var(--teal-400)]/20">
                    <Activity className="w-8 h-8 text-[var(--teal-400)]" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-white">القياسات الحيوية للرحلة</h4>
                    <p className="text-slate-500 text-sm font-medium">مراقبة استقرار النظام وعمق التفاعل في الوقت الفعلي.</p>
                  </div>
                </div>
                <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 h-fit">
                   <div className="px-5 py-2.5 bg-[var(--teal-400)] text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[var(--teal-400)]/20">
                      نظام مستقر ✅
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                {showcaseStats.map((stat: any, i: number) => (
                  <StatPreview 
                    key={i} 
                    {...stat} 
                    isEditing={isEditingShowcase}
                    onChange={(updates) => {
                      const newStats = [...showcaseStats];
                      newStats[i] = { ...newStats[i], ...updates };
                      setShowcaseStats(newStats);
                    }}
                  />
                ))}
             </div>

             <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">تغطية الخريطة</span>
                    <span className="text-xl font-black text-white">78%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '78%' }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-[var(--teal-400)] to-indigo-500 relative"
                    >
                      <div className="absolute inset-0 bg-white/20 blur-sm" />
                    </motion.div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 group cursor-help">
                   <Info className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                   <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
                      "التصميم ليس فقط ما نراه، بل ما نشعر به عند العبور من محطة إلى أخرى في رحلة الحياة."
                   </p>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Helper Components for Previews
const StatPreview: React.FC<{ 
  label: string; 
  value: string; 
  unit: string; 
  color: string;
  isEditing?: boolean;
  onChange?: (updates: { label?: string; value?: string; unit?: string }) => void;
}> = ({ label, value, unit, color, isEditing, onChange }) => (
  <div className="space-y-2 group">
    {isEditing ? (
      <input 
        type="text"
        value={label}
        onChange={(e) => onChange?.({ label: e.target.value })}
        className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] bg-white/5 border border-white/10 rounded px-1 w-full outline-none focus:border-[var(--teal-400)]"
      />
    ) : (
      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] group-hover:text-slate-400 transition-colors">{label}</span>
    )}
    
    <div className="flex items-baseline gap-2">
      {isEditing ? (
        <div className="flex items-baseline gap-1">
          <input 
            type="text"
            value={value}
            onChange={(e) => onChange?.({ value: e.target.value })}
            className="text-3xl font-black text-white tracking-tighter bg-white/5 border border-white/10 rounded px-1 w-20 outline-none"
          />
          <input 
            type="text"
            value={unit}
            onChange={(e) => onChange?.({ unit: e.target.value })}
            className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 border border-white/10 rounded px-1 w-12 outline-none"
          />
        </div>
      ) : (
        <>
          <span className="text-5xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-right">{value}</span>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{unit}</span>
        </>
      )}
    </div>
    <div className={`h-1 w-12 rounded-full transition-all group-hover:w-full ${
      color === 'teal' ? 'bg-[var(--teal-400)]' : 
      color === 'indigo' ? 'bg-indigo-500' : 
      color === 'amber' ? 'bg-amber-500' : 'bg-purple-500'
    }`} />
  </div>
);

// Helper Components
const ColorInput: React.FC<{ label: string; value: string; onChange: (val: string) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-slate-300 text-sm font-medium">{label}</span>
    <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-white/5">
      <span className="text-xs font-mono text-slate-500 uppercase">{value}</span>
      <input 
        type="color" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer outline-none overflow-hidden" 
      />
    </div>
  </div>
);

const SliderInput: React.FC<{ label: string; value: number; min: number; max: number; unit: string; onChange: (val: number) => void }> = ({ label, value, min, max, unit, onChange }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-300 font-medium">{label}</span>
      <span className="text-[var(--teal-400)] font-bold">{value}{unit}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--teal-400)]"
    />
  </div>
);

export default DesignLab;
