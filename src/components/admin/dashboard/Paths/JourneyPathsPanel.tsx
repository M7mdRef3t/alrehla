import React, { useState, useMemo, useEffect } from "react";
import { 
  Save, 
  Plus, 
  Trash2, 
  Route, 
  Sparkles, 
  Loader2, 
  History,
  Workflow,
  Activity,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import {
  useAdminState,
  type JourneyPath,
  type JourneyPathStep,
  type JourneyPathStepKind
} from "@/state/adminState";
import { generateJourneyPath, updateJourneyPaths, auditJourneyPath, getRevenueMetrics } from "@/services/adminApi";
import {
  RELATIONSHIP_WEATHER_PATH_SLUG,
  getRelationshipWeatherEntryHref,
  getRelationshipWeatherInitialStage,
  getRelationshipWeatherNextStage
} from "@/utils/relationshipWeatherJourney";
import {
  DAWAYIR_LIVE_PATH_SLUG,
  getDawayirLiveInitialStage,
  getDawayirLiveLaunchHref,
  getDawayirLiveNextStage,
  getDawayirLiveReturnHref
} from "@/utils/dawayirLiveJourney";
import {
  MARAYA_STORY_PATH_SLUG,
  getMarayaStoryInitialStage,
  getMarayaStoryLaunchHref,
  getMarayaStoryNextStage,
  getMarayaStoryReturnHref
} from "@/utils/marayaStoryJourney";
import { PathArchitect } from "./components/PathArchitect";
import { TelemetryPulse } from "./components/TelemetryPulse";
import { FrictionHealer } from "./components/FrictionHealer";
import { GhostMirror } from "./GhostMirror";

interface AuditResult {
  scores: {
    emotionalResonance: number;
    cognitiveEfficiency: number;
    growthAlignment: number;
  };
  verdict: string;
  findings: Array<{ type: "warning" | "success" | "opportunity"; message: string; stepId?: string }>;
  architectAdvice: string;
  suggestedIntervention: string;
}

// Types
type SaveState = "idle" | "saving" | "saved" | "error";
type OperationLogAction = "import-ready" | "import-confirmed" | "import-cancelled" | "backup-restored";
type OperationLogEntry = {
  action: OperationLogAction;
  fileName?: string;
  details: string;
  createdAt: number;
};
type OperationLogFilter = "all" | OperationLogAction;

interface JourneyPathsBackup {
  paths: JourneyPath[];
  createdAt: number;
}

function toStableToken(value: string | undefined, fallback: string): string {
  const normalized = (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");

  return normalized || fallback;
}

function normalizeJourneyPathStep(step: JourneyPathStep, index: number): JourneyPathStep {
  const stableStepId = [
    "step",
    toStableToken(step?.kind, "kind"),
    toStableToken(step?.screen, "screen"),
    toStableToken(step?.title, `index-${index}`)
  ].join("-");

  return {
    ...step,
    id: step?.id && String(step.id).trim().length > 0 ? step.id : stableStepId,
    title: step?.title ?? "خطوة بدون اسم",
    screen: step?.screen ?? "landing",
    description: step?.description ?? "",
    enabled: typeof step?.enabled === "boolean" ? step.enabled : true
  };
}

function normalizeJourneyPath(path: JourneyPath, index: number): JourneyPath {
  const stablePathId = [
    "path",
    toStableToken(path?.slug, "slug"),
    toStableToken(path?.title, `index-${index}`)
  ].join("-");

  return {
    ...path,
    id: path?.id && String(path.id).trim().length > 0 ? path.id : stablePathId,
    title: path?.title ?? `مسار ${index + 1}`,
    slug: path?.slug && String(path.slug).trim().length > 0 ? path.slug : `path-${index + 1}`,
    description: path?.description ?? "",
    ownerNote: path?.ownerNote ?? "",
    entryScreen: path?.entryScreen ?? "landing",
    targetScreen: path?.targetScreen ?? "map",
    autoTriggerMaxEnergy: typeof path?.autoTriggerMaxEnergy === "number" ? path.autoTriggerMaxEnergy : 5,
    primaryActionLabel: path?.primaryActionLabel ?? "إجراء رئيسي",
    primaryActionScreen: path?.primaryActionScreen ?? "map",
    secondaryActionLabel: path?.secondaryActionLabel ?? "إجراء ثانوي",
    secondaryActionScreen: path?.secondaryActionScreen ?? "tools",
    tertiaryActionLabel: path?.tertiaryActionLabel ?? "إجراء إضافي",
    tertiaryActionScreen: path?.tertiaryActionScreen ?? "insights",
    isActive: Boolean(path?.isActive),
    steps: Array.isArray(path?.steps) ? path.steps.map(normalizeJourneyPathStep) : []
  };
}

function normalizeJourneyPaths(paths: JourneyPath[]): JourneyPath[] {
  return paths.map(normalizeJourneyPath);
}

function getSafePathKey(path: JourneyPath | undefined, index: number): string {
  if (path?.id && String(path.id).trim()) return path.id;
  if (path?.slug && String(path.slug).trim()) return `slug:${path.slug}`;
  if (path?.title && String(path.title).trim()) return `title:${path.title}:${index}`;
  return `path:${index}`;
}

function getSafeStepKey(step: JourneyPathStep | undefined, index: number): string {
  if (step?.id && String(step.id).trim()) return step.id;
  if (step?.title && String(step.title).trim()) return `step-title:${step.title}:${index}`;
  return `step:${index}`;
}

// Helper Components
function ScreenSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="admin-input bg-slate-900/50"
      placeholder="اسم الشاشة..."
    />
  );
}

export function JourneyPathsPanel() {
  const { journeyPaths, setJourneyPaths } = useAdminState();
  const [selectedPathId, setSelectedPathId] = useState<string>(journeyPaths[0]?.id || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [operationLog, setOperationLog] = useState<OperationLogEntry[]>([]);
  const [operationLogFilter, setOperationLogFilter] = useState<OperationLogFilter>("all");
  const [importBackup, setImportBackup] = useState<JourneyPathsBackup | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<Record<string, AuditResult>>({});
  const [revenueMetrics, setRevenueMetrics] = useState<any | null>(null);

  const handleRunAudit = async () => {
    if (!selectedPath) return;
    setIsAuditing(true);
    try {
      const result = await auditJourneyPath(selectedPath);
      if (result) {
        setAuditResults(prev => ({ ...prev, [selectedPath.id]: result }));
      }
    } catch (err) {
      console.error("Audit failed", err);
    } finally {
      setIsAuditing(false);
    }
  };

  const fetchRevenue = async () => {
    try {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      const metrics = await getRevenueMetrics();
      if (metrics) setRevenueMetrics(metrics);
    } catch (err) {
      console.error("Failed to fetch revenue metrics", err);
    }
  };

  useEffect(() => {
    fetchRevenue();
    const interval = setInterval(fetchRevenue, 60000); // Pulse refresh every minute
    return () => clearInterval(interval);
  }, []);

  const selectedPath = journeyPaths.find((p) => p.id === selectedPathId) || journeyPaths[0];
  const activePaths = journeyPaths.filter(p => p.isActive);

  // Persistence helpers
  const saveJourneyPathsBackup = (backup: JourneyPathsBackup) => {
    localStorage.setItem("journeyPaths_backup", JSON.stringify(backup));
  };
  
  const loadJourneyPathsBackup = (): JourneyPathsBackup | null => {
    const saved = localStorage.getItem("journeyPaths_backup");
    if (!saved) return null;
    const parsed = JSON.parse(saved) as JourneyPathsBackup;
    return {
      ...parsed,
      paths: normalizeJourneyPaths(Array.isArray(parsed?.paths) ? parsed.paths : [])
    };
  };

  useEffect(() => {
    const backup = loadJourneyPathsBackup();
    if (backup) {
      setImportBackup({
        ...backup,
        paths: normalizeJourneyPaths(backup.paths)
      });
    }
  }, []);

  useEffect(() => {
    const normalized = normalizeJourneyPaths(journeyPaths);
    const hasMissingIds =
      normalized.length !== journeyPaths.length ||
      normalized.some((path, index) => {
        const current = journeyPaths[index];
        if (!current) return true;
        if (path.id !== current.id) return true;
        if (path.steps.length !== current.steps.length) return true;
        return path.steps.some((step, stepIndex) => step.id !== current.steps[stepIndex]?.id);
      });

    if (hasMissingIds) {
      setJourneyPaths(normalized);
      if (!selectedPathId && normalized[0]?.id) {
        setSelectedPathId(normalized[0].id);
      }
    }
  }, [journeyPaths, selectedPathId, setJourneyPaths]);

  // Handlers
  const handleSave = async () => {
    setIsSaving(true);
    setSaveState("idle");
    try {
      await updateJourneyPaths(journeyPaths);
      setSaveState("saved");
    } catch (error) {
      console.error("Failed to save journey paths", error);
      setSaveState("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPath = () => {
    const newPath: JourneyPath = normalizeJourneyPath({
      id: Math.random().toString(36).substr(2, 9),
      title: "مسار جديد",
      slug: "new-path-slug",
      description: "وصف المسار...",
      ownerNote: "",
      isActive: false,
      steps: [],
      entryScreen: "Welcome",
      targetScreen: "Home",
      autoTriggerMaxEnergy: 5,
      primaryActionLabel: "إجراء رئيسي",
      primaryActionScreen: "map",
      secondaryActionLabel: "إجراء ثانوي",
      secondaryActionScreen: "tools",
      tertiaryActionLabel: "إجراء إضافي",
      tertiaryActionScreen: "insights",
      version: 1
    } as JourneyPath, journeyPaths.length);
    setJourneyPaths([...journeyPaths, newPath]);
    setSelectedPathId(newPath.id);
  };

  const handleGeneratePath = async (intention: string) => {
    if (!intention.trim()) return;
    setIsGenerating(true);
    try {
      const generated = await generateJourneyPath(intention);
      if (selectedPath && generated) {
        const updated = { ...selectedPath, steps: generated.map(normalizeJourneyPathStep) };
        setJourneyPaths(journeyPaths.map(p => p.id === selectedPath.id ? updated : p));
      }
    } catch (err) {
      console.error("Path generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPaths = () => {
    const blob = new Blob([JSON.stringify(journeyPaths, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `alrehla-paths-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreImportBackup = () => {
    if (!importBackup) return;
    const normalizedPaths = normalizeJourneyPaths(importBackup.paths);
    setJourneyPaths(normalizedPaths);
    setSelectedPathId(normalizedPaths[0]?.id || "");
    appendOperationLog({
      action: "backup-restored",
      details: "تمت استعادة نسخة احتياطية سابقة للمسارات."
    });
  };

  const appendOperationLog = (entry: Omit<OperationLogEntry, "createdAt">) => {
    setOperationLog(prev => [{ ...entry, createdAt: Date.now() }, ...prev]);
  };

  const handleClearOperationLog = () => setOperationLog([]);

  const handleRunPathNow = () => {
    if (!selectedPath || typeof window === "undefined") return;

    if (selectedPath.slug === RELATIONSHIP_WEATHER_PATH_SLUG) {
      window.location.assign(getRelationshipWeatherEntryHref(selectedPath));
      return;
    }

    if (selectedPath.slug === DAWAYIR_LIVE_PATH_SLUG) {
      window.location.assign(
        getDawayirLiveLaunchHref(selectedPath, {
          surface: "admin-preview"
        })
      );
      return;
    }

    if (selectedPath.slug === MARAYA_STORY_PATH_SLUG) {
      window.location.assign(
        getMarayaStoryLaunchHref(selectedPath, {
          surface: "admin-preview"
        })
      );
      return;
    }

    console.log("Simulating path execution for:", selectedPath.title);
  };

  const patchPath = (id: string, updater: (p: JourneyPath) => JourneyPath) => {
    setJourneyPaths(journeyPaths.map(p => p.id === id ? updater(p) : p));
  };

  const handleApplyHealing = (warning: string) => {
    if (!selectedPath) return;
    
    // Create a healing step based on the warning type
    const healingStep: JourneyPathStep = {
      id: `healing-${Date.now()}`,
      title: "وقفة استرجاع (AI Healing)",
      kind: "intervention",
      screen: "grounding",
      description: `تمت إضافة هذه الخطوة تلقائياً لعلاج: ${warning}`,
      enabled: true
    };

    patchPath(selectedPath.id, p => ({
      ...p,
      steps: [...p.steps, healingStep]
    }));
  };

  // Derived Values
  const selectedPathWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (!selectedPath) return warnings;
    if (selectedPath.steps.length === 0) warnings.push("المسار لا يحتوي على أي خطوات.");
    if (!selectedPath.steps.some(s => s.kind === "entry")) warnings.push("المسار يفتقر لنقطة دخول (Entry Step).");
    if (selectedPath.steps.length > 15) warnings.push("المسار طويل جداً، قد يزيد العبء المعرفي.");
    return warnings;
  }, [selectedPath]);

  const globalWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (journeyPaths.length === 0) warnings.push("لا يوجد أي مسارات معرفة في النظام.");
    return warnings;
  }, [journeyPaths]);

  const runtimePreview = useMemo(() => {
    if (!selectedPath) return null;

    const isRelationshipWeather = selectedPath.slug === RELATIONSHIP_WEATHER_PATH_SLUG;
    const isDawayirLive = selectedPath.slug === DAWAYIR_LIVE_PATH_SLUG;
    const isMarayaStory = selectedPath.slug === MARAYA_STORY_PATH_SLUG;
    const weatherInitialStage = isRelationshipWeather
      ? getRelationshipWeatherInitialStage(selectedPath)
      : null;
    const weatherAfterQuestions = isRelationshipWeather
      ? getRelationshipWeatherNextStage(selectedPath, "questions")
      : null;
    const weatherAfterAnalyzing = isRelationshipWeather
      ? getRelationshipWeatherNextStage(selectedPath, "analyzing")
      : null;
    const liveInitialStage = isDawayirLive
      ? getDawayirLiveInitialStage(selectedPath)
      : null;
    const liveAfterSetup = isDawayirLive
      ? getDawayirLiveNextStage(selectedPath, "setup")
      : null;
    const liveAfterSession = isDawayirLive
      ? getDawayirLiveNextStage(selectedPath, "live")
      : null;
    const marayaInitialStage = isMarayaStory
      ? getMarayaStoryInitialStage(selectedPath)
      : null;
    const marayaAfterLanding = isMarayaStory
      ? getMarayaStoryNextStage(selectedPath, "landing")
      : null;
    const marayaAfterStory = isMarayaStory
      ? getMarayaStoryNextStage(selectedPath, "story")
      : null;

    return {
      startsFrom: selectedPath.entryScreen,
      finalScreen: selectedPath.targetScreen,
      stepsCount: selectedPath.steps.length,
      activeSteps: selectedPath.steps.filter(s => s.enabled).length,
      isRelationshipWeather,
      isDawayirLive,
      isMarayaStory,
      weatherInitialStage,
      weatherAfterQuestions,
      weatherAfterAnalyzing,
      liveInitialStage,
      liveAfterSetup,
      liveAfterSession,
      liveReturnHref: isDawayirLive ? getDawayirLiveReturnHref(selectedPath) : null,
      marayaInitialStage,
      marayaAfterLanding,
      marayaAfterStory,
      marayaReturnHref: isMarayaStory ? getMarayaStoryReturnHref(selectedPath) : null
    };
  }, [selectedPath]);

  const formatWeatherStageLabel = (stage: "questions" | "analyzing" | "result" | "complete" | null) => {
    switch (stage) {
      case "questions":
        return "الأسئلة";
      case "analyzing":
        return "التحليل";
      case "result":
        return "شاشة النتيجة";
      case "complete":
        return "الخروج المباشر";
      default:
        return "غير محدد";
    }
  };

  const formatLiveStageLabel = (stage: "setup" | "live" | "complete" | "return" | null) => {
    switch (stage) {
      case "setup":
        return "التهيئة";
      case "live":
        return "الجلسة الحية";
      case "complete":
        return "شاشة الإكمال";
      case "return":
        return "العودة النهائية";
      default:
        return "غير محدد";
    }
  };

  const formatMarayaStageLabel = (stage: "landing" | "story" | "ending" | "return" | null) => {
    switch (stage) {
      case "landing":
        return "التهيئة / اختيار البداية";
      case "story":
        return "القصة الحية";
      case "ending":
        return "الخاتمة";
      case "return":
        return "العودة النهائية";
      default:
        return "غير محدد";
    }
  };

  const filteredOperationLog = operationLog.filter(log => 
    operationLogFilter === "all" || log.action === operationLogFilter
  );

  const getOperationLogMeta = (action: OperationLogAction) => {
    switch(action) {
      case "import-ready": return { label: "جاهز", badge: "text-amber-400" };
      case "import-confirmed": return { label: "مكتمل", badge: "text-emerald-400" };
      case "import-cancelled": return { label: "ملغى", badge: "text-rose-400" };
      case "backup-restored": return { label: "مسترجع", badge: "text-indigo-400" };
    }
  };

  if (!selectedPath) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-slate-800 rounded-[2.5rem] bg-slate-900/20 p-12 text-center space-y-4">
        <Route className="w-12 h-12 text-slate-700" />
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white">لا توجد مسارات نشطة</h3>
          <p className="text-sm text-slate-500 font-bold">ابدأ بإنشاء أول مسار لرحلة الوعي.</p>
        </div>
        <button onClick={handleAddPath} className="px-6 py-3 rounded-2xl bg-cyan-600 text-white font-black text-sm hover:bg-cyan-500 transition-all">إضافة مسار جديد</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir="rtl">
      {/* Header section — The Command Center Shell */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-cyan-500/20 bg-[#0B0F19] p-8 lg:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-indigo-500/5 to-transparent pointer-events-none" />
        
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-[11px] font-black uppercase tracking-[0.3em] text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <Route className="h-4 w-4" />
              Consciousness Control Room
            </div>
            <div>
              <div className="flex items-center gap-4">
                 <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter shadow-sm">غرفة التحكم</h2>
                 <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent hidden md:block" />
              </div>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-400 font-bold">
                أهلاً بك في فضاء القيادة. من هنا يمكنك هندسة وعي الرحلة، مراقبة النبض الحي للمستخدمين، وعلاج أي احتكاك معرفي أو عاطفي فور حدوثه.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <button
               type="button"
               onClick={handleSave}
               disabled={isSaving}
               className="group inline-flex items-center gap-3 rounded-2xl bg-cyan-600 px-8 py-4 text-sm font-black text-white hover:bg-cyan-500 transition-all shadow-[0_0_30px_rgba(8,145,178,0.3)] disabled:opacity-60 relative overflow-hidden"
             >
               <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />
               {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
             </button>
             
             <div className="flex gap-2 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={handleExportPaths}
                  className="p-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-300 hover:text-white hover:border-violet-500/50 transition-all"
                  title="تصدير المسارات"
                >
                  <Save className="h-4 w-4 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={handleRestoreImportBackup}
                  disabled={!importBackup}
                  className="p-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-300 hover:text-white hover:border-amber-500/50 transition-all disabled:opacity-50"
                  title="استعادة نسخة"
                >
                  <History className="h-4 w-4" />
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Main Grid — Spatial Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar: Path Selection */}
        <aside className="lg:col-span-3 space-y-4">
           <div className="flex items-center justify-between px-2">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">المسارات المسجلة</h3>
             <button onClick={handleAddPath} className="text-cyan-400 hover:text-cyan-300 transition-colors">
               <Plus className="w-4 h-4" />
             </button>
           </div>
           
           <div className="space-y-3">
             {journeyPaths.map((path, index) => {
               const isSelected = path.id === selectedPath.id;
               return (
                 <button
                   key={getSafePathKey(path, index)}
                   onClick={() => setSelectedPathId(path.id)}
                   className={`w-full group text-right rounded-[1.75rem] border p-5 transition-all duration-300 ${
                     isSelected
                       ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                       : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                   }`}
                 >
                   <div className="flex items-center justify-between gap-3 mb-2">
                     <span className={`text-[10px] font-black uppercase tracking-widest ${path.isActive ? "text-emerald-400" : "text-slate-500"}`}>
                       {path.isActive ? "ACTIVE" : "INACTIVE"}
                     </span>
                     {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_cyan]" />}
                   </div>
                   <div className="text-sm font-black text-white group-hover:text-cyan-200 transition-colors">{path.title}</div>
                   <div className="mt-1 text-[10px] text-slate-600 font-mono">{path.slug}</div>
                 </button>
               );
             })}
           </div>

           <div className="rounded-2xl border border-slate-800/50 bg-slate-900/20 p-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">الحالة العامة</h4>
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">المسارات الفعالة</span>
                    <span className="text-xs text-white font-black">{activePaths.length}</span>
                 </div>
                 <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500" style={{ width: `${journeyPaths.length > 0 ? (activePaths.length / journeyPaths.length) * 100 : 0}%` }} />
                 </div>
              </div>
           </div>
        </aside>

        {/* Focus Area: Path Architect & Telemetry */}
        <div className="lg:col-span-9 space-y-8">
           
           {/* Primary Control Zone */}
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              {/* Architect Deck */}
              <div className="space-y-6">
                 <section className="rounded-[2.5rem] border border-slate-800 bg-[#0B0F19] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-lg font-black text-white">بيانات الوعي (Core Metadata)</h3>
                       <button
                         type="button"
                         onClick={() => patchPath(selectedPath.id, p => ({ ...p, isActive: !p.isActive }))}
                         className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedPath.isActive ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-800 text-slate-500'}`}
                       >
                         {selectedPath.isActive ? 'تشغيل حي' : 'متوقف'}
                       </button>
                    </div>

                    <div className="grid gap-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Field label="اسم المسار">
                            <input
                              value={selectedPath.title}
                              onChange={(e) => patchPath(selectedPath.id, p => ({ ...p, title: e.target.value }))}
                              className="admin-input bg-slate-900/50"
                            />
                          </Field>
                          <Field label="Slug العبور">
                            <input
                              value={selectedPath.slug}
                              onChange={(e) => patchPath(selectedPath.id, p => ({ ...p, slug: e.target.value }))}
                              className="admin-input bg-slate-900/50"
                            />
                          </Field>
                       </div>
                       <Field label="وصف غرض المسار">
                          <textarea
                            value={selectedPath.description}
                            onChange={(e) => patchPath(selectedPath.id, p => ({ ...p, description: e.target.value }))}
                            className="admin-input bg-slate-900/50 min-h-[80px]"
                          />
                       </Field>
                    </div>
                 </section>

                 <PathArchitect 
                   path={selectedPath} 
                   onUpdate={(updater) => setJourneyPaths(journeyPaths.map(p => p.id === selectedPath.id ? updater(p) : p))}
                   onGenerate={handleGeneratePath}
                   isGenerating={isGenerating}
                 />
              </div>

              {/* Monitoring & Healing Deck */}
              <div className="space-y-8">
                 <section className="rounded-[2.5rem] border border-slate-800 bg-[#0B0F19] p-8 shadow-sm h-fit">
                    <TelemetryPulse path={selectedPath} revenueMetrics={revenueMetrics} />
                 </section>

                 <section className="rounded-[2.5rem] border border-slate-800 bg-[#0B0F19] p-8 shadow-sm h-fit">
                    <FrictionHealer 
                      path={selectedPath} 
                      warnings={[...selectedPathWarnings, ...globalWarnings]} 
                      onApplyHealing={handleApplyHealing}
                      auditData={auditResults[selectedPath.id]}
                      isAuditing={isAuditing}
                      onRunAudit={handleRunAudit}
                    />
                 </section>

                 {/* Simulated Logic Preview */}
                 <section className="rounded-[2.5rem] border border-cyan-500/10 bg-gradient-to-br from-cyan-500/5 to-transparent p-8">
                    <div className="flex items-center gap-3 mb-6">
                       <Workflow className="w-5 h-5 text-cyan-400" />
                       <h3 className="text-sm font-black text-white uppercase tracking-widest">محاكاة التشغيل (Simulation)</h3>
                    </div>
                    {runtimePreview && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <div className="text-[9px] font-black text-slate-500 uppercase">نقطة الدخول</div>
                           <div className="text-xs font-bold text-white">{runtimePreview.startsFrom}</div>
                        </div>
                        <div className="space-y-1">
                           <div className="text-[9px] font-black text-slate-500 uppercase">الوجهة المستهدفة</div>
                           <div className="text-xs font-bold text-white">{runtimePreview.finalScreen}</div>
                        </div>
                        <div className="space-y-1">
                           <div className="text-[9px] font-black text-slate-500 uppercase">Ø¹Ø¯Ø¯ Ø§Ù„Ø®Ø·ÙˆØ§Øª</div>
                           <div className="text-xs font-bold text-white">{runtimePreview.stepsCount}</div>
                        </div>
                        <div className="space-y-1">
                           <div className="text-[9px] font-black text-slate-500 uppercase">Ø§Ù„Ø®Ø·ÙˆØ§Øª Ø§Ù„Ù…ÙØ¹Ù„Ø©</div>
                           <div className="text-xs font-bold text-white">{runtimePreview.activeSteps}</div>
                        </div>
                        {runtimePreview.isRelationshipWeather && (
                          <div className="col-span-2 mt-2 rounded-2xl border border-cyan-500/10 bg-slate-950/30 p-4 space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">
                              <Activity className="h-4 w-4" />
                              Relationship Weather Runtime
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1">
                                <div className="text-[9px] font-black uppercase text-slate-500">ÙŠØ¨Ø¯Ø£ Ù…Ù†</div>
                                <div className="text-xs font-bold text-white">{formatWeatherStageLabel(runtimePreview.weatherInitialStage)}</div>
                              </div>
                              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1">
                                <div className="text-[9px] font-black uppercase text-slate-500">Ø¨Ø¹Ø¯ Ø§Ù„Ø£Ø³Ø¦Ù„Ø©</div>
                                <div className="text-xs font-bold text-white">{formatWeatherStageLabel(runtimePreview.weatherAfterQuestions)}</div>
                              </div>
                              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1">
                                <div className="text-[9px] font-black uppercase text-slate-500">Ø¨Ø¹Ø¯ Ø§Ù„ØªØ­Ù„ÙŠÙ„</div>
                                <div className="text-xs font-bold text-white">{formatWeatherStageLabel(runtimePreview.weatherAfterAnalyzing)}</div>
                              </div>
                            </div>
                            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 p-4 text-xs text-slate-300 leading-7 font-bold">
                              {runtimePreview.weatherInitialStage === "complete"
                                ? "Ù‡Ø°Ø§ Ø§Ù„Ù…Ø³Ø§Ø± Ø³ÙŠØªØ¬Ø§ÙˆØ² ÙÙ†Ù„ Ø§Ù„Ø·Ù‚Ø³ ÙƒØ§Ù…Ù„Ø§Ù‹ ÙˆÙŠØ®Ø±Ø¬ Ù…Ø¨Ø§Ø´Ø±Ø© Ø¥Ù„Ù‰ Ø§Ù„ÙˆØ¬Ù‡Ø© Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠØ©."
                                : runtimePreview.weatherAfterAnalyzing === "complete"
                                  ? "Ø¨Ø¹Ø¯ Ø§Ù„ØªØ­Ù„ÙŠÙ„ØŒ Ø§Ù„Ù…Ø³Ø§Ø± Ø³ÙŠÙ‚ÙØ² Ù…Ø¨Ø§Ø´Ø±Ø© Ø¥Ù„Ù‰ Ø§Ù„Ø®Ø±ÙˆØ¬ Ø¨Ø¯ÙˆÙ† Ø§Ù„ØªÙˆÙ‚Ù Ø¹Ù†Ø¯ Ø´Ø§Ø´Ø© Ø§Ù„Ù†ØªÙŠØ¬Ø©."
                                  : "Ø§Ù„Ù…Ø³Ø§Ø± Ø³ÙŠØ³Ù„Ùƒ ÙÙ†Ù„ Ø·Ù‚Ø³ Ø§Ù„Ø¹Ù„Ø§Ù‚Ø§Øª Ø­Ø³Ø¨ Ø§Ù„ØªØ±ØªÙŠØ¨ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ Ø§Ù„Ø­Ø§Ù„ÙŠ Ø¨Ø¯ÙˆÙ† Ø§ÙØªØ±Ø§Ø¶Ø§Øª Ø«Ø§Ø¨ØªØ© ÙÙŠ Ø§Ù„ÙƒÙˆØ¯."}
                            </div>
                          </div>
                        )}
                        {runtimePreview.isDawayirLive && (
                          <div className="col-span-2 mt-2 rounded-2xl border border-fuchsia-500/10 bg-slate-950/30 p-4 space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-300">
                              <Activity className="h-4 w-4" />
                              Dawayir Live Runtime
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1">
                                <div className="text-[9px] font-black uppercase text-slate-500">يبدأ من</div>
                                <div className="text-xs font-bold text-white">{formatLiveStageLabel(runtimePreview.liveInitialStage)}</div>
                              </div>
                              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1">
                                <div className="text-[9px] font-black uppercase text-slate-500">بعد التهيئة</div>
                                <div className="text-xs font-bold text-white">{formatLiveStageLabel(runtimePreview.liveAfterSetup)}</div>
                              </div>
                              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1">
                                <div className="text-[9px] font-black uppercase text-slate-500">بعد الجلسة</div>
                                <div className="text-xs font-bold text-white">{formatLiveStageLabel(runtimePreview.liveAfterSession)}</div>
                              </div>
                            </div>
                            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 p-4 text-xs text-slate-300 leading-7 font-bold space-y-2">
                              <div>
                                المسار سيطلق اللايف عبر route الدخول الفعلية، ثم ينتقل إلى شاشة الإكمال، ثم يخرج إلى:
                                <span className="text-fuchsia-300"> {runtimePreview.liveReturnHref || runtimePreview.finalScreen}</span>
                              </div>
                              <div>
                                {runtimePreview.liveAfterSession === "return"
                                  ? "هذا يعني أن المسار سيتجاوز شاشة الإكمال ويعود مباشرة بعد نهاية الجلسة."
                                  : "هذا يعني أن الجلسة ستمر على شاشة الإكمال أولًا قبل العودة النهائية."}
                              </div>
                            </div>
                          </div>
                        )}
                        {runtimePreview.isMarayaStory && (
                          <div className="col-span-2 mt-2 rounded-2xl border border-amber-500/10 bg-slate-950/30 p-4 space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">
                              <Activity className="h-4 w-4" />
                              Maraya Story Runtime
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1">
                                <div className="text-[9px] font-black uppercase text-slate-500">يبدأ من</div>
                                <div className="text-xs font-bold text-white">{formatMarayaStageLabel(runtimePreview.marayaInitialStage)}</div>
                              </div>
                              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1">
                                <div className="text-[9px] font-black uppercase text-slate-500">بعد التهيئة</div>
                                <div className="text-xs font-bold text-white">{formatMarayaStageLabel(runtimePreview.marayaAfterLanding)}</div>
                              </div>
                              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 space-y-1">
                                <div className="text-[9px] font-black uppercase text-slate-500">بعد القصة</div>
                                <div className="text-xs font-bold text-white">{formatMarayaStageLabel(runtimePreview.marayaAfterStory)}</div>
                              </div>
                            </div>
                            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 p-4 text-xs text-slate-300 leading-7 font-bold space-y-2">
                              <div>
                                المسار سيطلق تجربة مرايا عبر route الدخول الفعلية، ثم يمر على الخاتمة، ثم يخرج إلى:
                                <span className="text-amber-300"> {runtimePreview.marayaReturnHref || runtimePreview.finalScreen}</span>
                              </div>
                              <div>
                                {runtimePreview.marayaAfterStory === "return"
                                  ? "هذا يعني أن المسار سيتجاوز شاشة الخاتمة ويخرج مباشرة بعد اكتمال القصة."
                                  : "هذا يعني أن مرايا ستمر على شاشة الخاتمة أولًا قبل حمل أثرها إلى الوجهة التالية."}
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="col-span-2 pt-2">
                           <button 
                             onClick={handleRunPathNow}
                             className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 hover:text-white hover:border-cyan-500/40 transition-all font-black text-[10px] uppercase tracking-widest"
                           >
                             بدء تجربة المستخدم
                           </button>
                        </div>
                      </div>
                    )}
                 </section>
              </div>

           </div>
        </div>

      </div>

      {/* Operation Logs (Condensed at bottom) */}
      {operationLog.length > 0 && (
         <div className="mt-12 rounded-[2.5rem] border border-white/5 bg-slate-950/20 p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">سجل العمليات (System Logs)</h4>
                <div className="mt-2 text-[10px] text-slate-600 uppercase font-black tracking-widest">{filteredOperationLog.length} سجل من أصل {operationLog.length}</div>
              </div>
              <div className="flex gap-4">
                <select
                  value={operationLogFilter}
                  onChange={(e) => setOperationLogFilter(e.target.value as OperationLogFilter)}
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-400 focus:ring-0 cursor-pointer"
                >
                  <option value="all">الكل</option>
                  <option value="import-ready">الجاهزة</option>
                  <option value="import-confirmed">المعتمدة</option>
                  <option value="import-cancelled">الملغاة</option>
                  <option value="backup-restored">المسترجعة</option>
                </select>
                <button
                  onClick={handleClearOperationLog}
                  className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors"
                >
                  مسح السجل
                </button>
              </div>
            </div>
            
            <div className="mt-6 space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
               {filteredOperationLog.map((entry, index) => (
                 <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                       <span className={`w-2 h-2 rounded-full ${getOperationLogMeta(entry.action)?.badge.includes('emerald') ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                       <div className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{entry.details}</div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 tracking-tighter">{new Date(entry.createdAt).toLocaleTimeString('ar-EG')}</div>
                 </div>
               ))}
            </div>
         </div>
      )}

      {/* Psychological Layer: Ghost Mirror */}
      <section className="mt-12 rounded-[2.5rem] border border-slate-800 bg-[#0B0F19] p-8 lg:p-12 shadow-sm">
         <GhostMirror />
      </section>

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-30 select-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}

// Global Helper Components
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
