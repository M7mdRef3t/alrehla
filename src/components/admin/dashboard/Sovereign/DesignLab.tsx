import React from "react";
import { 
  Palette, 
  Layers, 
  Maximize, 
  Sparkles, 
  RotateCcw, 
  Sun, 
  Moon,
  Zap,
  Leaf,
  Wind
} from "lucide-react";
import { useThemeState, DesignTokens } from "@/domains/consciousness/store/theme.store";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { aiDesignService } from "@/ai/aiDesignService";
import { SovereignOrchestrator } from "@/services/sovereignOrchestrator";

const DesignLab: React.FC = () => {
  const { customTokens, updateTokens, resetTokens, theme, setTheme, publishToCloud, fetchCloudTokens } = useThemeState();
  const resonanceScore = useAdminState(s => s.resonanceScore);
  const [activeState, setActiveState] = React.useState<"global" | "crisis" | "stable" | "flow">("global");
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [autoSensorySync, setAutoSensorySync] = React.useState(false);
  const [status, setStatus] = React.useState<{ type: "success" | "error"; msg: string } | null>(null);

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
      name: "السيادة الإدراكية (Royal)",
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
            نشر السحابة السيادية
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

      {/* Preview Section */}
      <div className="mt-12 p-8 rounded-[var(--consciousness-border-radius)] bg-space-void border border-white/10 relative overflow-hidden group">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${currentLevel.primaryColor}, transparent)` }} />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md space-y-4">
            <h3 className="text-2xl font-bold text-white">معاينة الحيوية</h3>
            <p className="text-slate-400">
              هذا عرض حي لكيفية ظهور العناصر الأساسية في المنصة بعد تعديلاتك.
            </p>
            <div className="flex gap-4">
              <button className="px-6 py-2 bg-[var(--teal-400)] text-slate-950 font-bold rounded-full hover:scale-105 transition-transform">
                زر أساسي
              </button>
              <button className="px-6 py-2 border border-white/20 text-white rounded-full hover:bg-white/5">
                زر ثانوي
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center">
              <div className="text-[var(--teal-400)] text-2xl font-bold">85%</div>
              <div className="text-xs text-slate-500">الهدوء</div>
            </div>
            <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center">
              <div className="text-[var(--amber-500)] text-2xl font-bold">12</div>
              <div className="text-xs text-slate-500">تنبيهات</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
