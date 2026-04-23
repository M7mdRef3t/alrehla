import React, { useState, useMemo, useEffect } from "react";
import { 
  Save, 
  Plus, 
  Trash2, 
  Route, 
  BookOpen,
  Sparkles, 
  Loader2, 
  History,
  Workflow,
  Activity,
  ArrowUp,
  ArrowDown,
  Shield
} from "lucide-react";
import {
  useAdminState,
  type JourneyPath,
  type JourneyPathStep,
  type JourneyPathStepKind
} from "@/domains/admin/store/admin.store";
import { generateJourneyPath, auditJourneyPath, simulateJourneyPath } from "@/services/admin/adminJourneyPaths";
import { updateJourneyPaths } from "@/services/admin/adminSettings";
import { getRevenueMetrics } from "@/services/admin/adminRevenue";
import type { CognitiveSimulationResult } from "@/services/admin/adminTypes";
import { createCurrentUrl, pushUrl } from "@/services/navigation";
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
import { PathConstellationPreview } from "./PathConstellationPreview";
import { OPS_DOCS } from "../OpsDocs/OpsDocsPanel";

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
type OperationLogAction =
  | "import-ready"
  | "import-confirmed"
  | "import-cancelled"
  | "backup-restored"
  | "checklist-toggled"
  | "checklist-marked-all"
  | "checklist-reset"
  | "checklist-exported";
type OperationLogEntry = {
  action: OperationLogAction;
  fileName?: string;
  details: string;
  createdAt: number;
  pathId?: string;
  pathSlug?: string;
  docId?: string;
  itemLabel?: string;
};
type OperationLogFilter = "all" | OperationLogAction;

interface JourneyPathsBackup {
  paths: JourneyPath[];
  createdAt: number;
}

type ChecklistEntry = {
  checked: boolean;
  updatedAt?: number;
  docId?: string;
};
type ChecklistStore = Record<string, ChecklistEntry>;
type OpsDocReviewFilter = "all" | "not-started" | "in-progress" | "completed";

const REVIEW_TIMELINE_ACTIONS: OperationLogAction[] = [
  "checklist-toggled",
  "checklist-marked-all",
  "checklist-reset",
  "checklist-exported"
];

const DOC_CHECKLIST_STORAGE_KEY = "journey_paths_doc_checklists";

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
  const [docChecklistStore, setDocChecklistStore] = useState<ChecklistStore>({});
  const [opsDocReviewFilter, setOpsDocReviewFilter] = useState<OpsDocReviewFilter>("all");
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<CognitiveSimulationResult[] | null>(null);
  const [activeTab, setActiveTab] = useState<"linear" | "constellation">("linear");
  const [activePanelTab, setActivePanelTab] = useState<"design" | "analytics" | "ops">("design");

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
    try {
      const saved = localStorage.getItem(DOC_CHECKLIST_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as ChecklistStore;
      if (parsed && typeof parsed === "object") {
        setDocChecklistStore(parsed);
      }
    } catch (error) {
      console.error("Failed to load doc checklist state", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DOC_CHECKLIST_STORAGE_KEY, JSON.stringify(docChecklistStore));
    } catch (error) {
      console.error("Failed to persist doc checklist state", error);
    }
  }, [docChecklistStore]);

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

  const handleSimulatePath = async () => {
    if (!selectedPath) return;
    setIsSimulating(true);
    try {
      const results = await simulateJourneyPath(selectedPath.steps);
      setSimulationResults(results);
      appendOperationLog({
        action: "checklist-toggled" as any, 
        details: "تم تنفيذ المحاكاة الشعورية بنجاح."
      });
    } catch (err) {
      console.error("Simulation failed", err);
    } finally {
      setIsSimulating(false);
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
      case "questions": return "الأسئلة";
      case "analyzing": return "التحليل";
      case "result": return "شاشة النتيجة";
      case "complete": return "الخروج المباشر";
      default: return "غير محدد";
    }
  };

  const pathOpsDocs = useMemo(() => {
    if (!selectedPath) return [];

    const commonDocIds = ["route-matrix", "ownership", "feature-flags", "critical-flows"];
    const journeySpecificDocIds =
      selectedPath.slug === RELATIONSHIP_WEATHER_PATH_SLUG
        ? ["functional-map", "critical-flows", "release", "triage"]
        : selectedPath.slug === DAWAYIR_LIVE_PATH_SLUG
          ? ["functional-map", "critical-flows", "post-release", "triage"]
          : selectedPath.slug === MARAYA_STORY_PATH_SLUG
            ? ["functional-map", "critical-flows", "owner-manual", "triage"]
            : ["functional-map", "critical-flows", "owner-manual", "release"];

    const ids = Array.from(new Set([...commonDocIds, ...journeySpecificDocIds]));
    return OPS_DOCS.filter((doc) => ids.includes(doc.id));
  }, [selectedPath]);

  const pathOpsGuidance = useMemo(() => {
    if (!selectedPath) return null;

    if (selectedPath.slug === RELATIONSHIP_WEATHER_PATH_SLUG) {
      return "استخدم هذه المراجع عندما تعدل funnel طقس العلاقات، خاصة إذا كنت تغيّر الترتيب أو الـ CTA أو bridge إلى دواير.";
    }

    if (selectedPath.slug === DAWAYIR_LIVE_PATH_SLUG) {
      return "هذه المراجع مفيدة عندما تغيّر launch أو complete أو فروع history/couple/coach، لأن هذا المسار يعيش بين route مستقلة وعودة إلى المنصة.";
    }

    if (selectedPath.slug === MARAYA_STORY_PATH_SLUG) {
      return "هذه المراجع تساعدك عندما تريد إبقاء مرايا جزءًا من المنتج لا تجربة معزولة، خصوصًا في نقاط الدخول والعودة بعد النهاية.";
    }

    return "هذه المراجع هي الحزمة الأساسية لتعديل أي path حساسة داخل المنصة، خصوصًا عندما تغيّر entryScreen أو targetScreen أو ترتيب الخطوات.";
  }, [selectedPath]);

  const openAdminSurface = (tab: string, extraParams: Record<string, string> = {}) => {
    const url = createCurrentUrl();
    if (!url) return;
    url.searchParams.set("tab", tab);
    Object.entries(extraParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    pushUrl(url);
  };

  const handleOpenOpsDoc = (docId: string) => {
    if (!selectedPath) return;
    openAdminSurface("ops-docs", {
      opsDoc: docId,
      opsPath: selectedPath.slug
    });
  };

  const handleRunOpsAction = (docId: string) => {
    if (!selectedPath) return;

    if (docId === "feature-flags") {
      openAdminSurface("feature-flags", { opsPath: selectedPath.slug });
      return;
    }

    if (docId === "critical-flows" || docId === "release" || docId === "post-release") {
      openAdminSurface("ops-docs", {
        opsDoc: docId,
        opsPath: selectedPath.slug
      });
      return;
    }

    handleOpenOpsDoc(docId);
  };

  const getDocActionLabel = (docId: string) => {
    if (docId === "feature-flags") return "اذهب إلى الرايات";
    if (docId === "critical-flows") return "راجع التحقق";
    if (docId === "release") return "راجع الجاهزية";
    if (docId === "post-release") return "راجع ما بعد النشر";
    return "استخدم هذا المرجع";
  };

  const getDocChecklistItems = (docId: string) => {
    if (docId === "route-matrix") {
      return [
        "تأكد أن entryScreen يطابق بداية الرحلة الفعلية",
        "تأكد أن targetScreen يطابق الخروج المقصود",
        "راجع أن ترتيب الخطوات يخدم هذا الانتقال"
      ];
    }

    if (docId === "critical-flows") {
      return [
        "مرّ على happy path كاملًا",
        "راجع edge cases عند تعطيل خطوة",
        "تأكد أن CTA النهائية تقود للوجهة الصحيحة"
      ];
    }

    if (docId === "feature-flags") {
      return [
        "راجع flags المؤثرة على هذا المسار",
        "تأكد أن السلوك نفسه متسق بين user و owner",
        "افحص إن كانت ميزة مخفية تمنع خطوة من الظهور"
      ];
    }

    if (docId === "release") {
      return [
        "راجع المسار قبل النشر النهائي",
        "تأكد من عدم وجود تحذيرات حرجة",
        "اعبر نقطة الدخول والخروج مرة أخيرة"
      ];
    }

    if (docId === "post-release") {
      return [
        "افحص المسار بعد النشر مباشرة",
        "تأكد أن الوجهة النهائية تعمل حيًا",
        "راجع أي انحراف في behavior أو routing"
      ];
    }

    if (docId === "ownership") {
      return [
        "حدد هل هذا المسار user أم owner",
        "تأكد أن التعديل لا يضرب surface أخرى",
        "راجع من يملك قرار هذا المسار وظيفيًا"
      ];
    }

    if (docId === "triage") {
      return [
        "ابدأ من state ثم route ثم service",
        "راجع أين ينكسر الدخول أو الخروج",
        "حدد إن كان الخلل runtime أم config"
      ];
    }

    if (docId === "owner-manual") {
      return [
        "راجع تأثير المسار على التشغيل اليومي",
        "حدد القرار الذي يحتاج موافقة owner",
        "وثّق ما الذي تغيّر قبل الحفظ"
      ];
    }

    if (docId === "functional-map") {
      return [
        "راجع مكان المسار داخل المنصة ككل",
        "تأكد أنه متصل بالـ flow الصحيح",
        "افحص أثره على الرحلات المجاورة"
      ];
    }

    if (docId === "inventory") {
      return [
        "ابحث عن مكوّن موجود قبل إضافة جديد",
        "راجع services الحالية المرتبطة بالمسار",
        "تأكد من عدم خلق duplication"
      ];
    }

    return [
      "راجع هذا المرجع قبل التعديل",
      "أكد أن القرار الحالي موثق",
      "تحقق من عدم وجود أثر جانبي مخفي"
    ];
  };

  const getDocChecklistKey = (docId: string, item: string) => {
    return `${selectedPath?.slug ?? "unknown"}::${docId}::${item}`;
  };

  const isChecklistItemDone = (docId: string, item: string) => {
    return Boolean(docChecklistStore[getDocChecklistKey(docId, item)]?.checked);
  };

  const toggleChecklistItem = (docId: string, item: string) => {
    const key = getDocChecklistKey(docId, item);
    const nextChecked = !docChecklistStore[key]?.checked;
    const docTitle = pathOpsDocs.find((doc) => doc.id === docId)?.title ?? docId;

    setDocChecklistStore((current) => ({
      ...current,
      [key]: {
        checked: nextChecked,
        updatedAt: Date.now(),
        docId
      }
    }));

    appendOperationLog({
      action: "checklist-toggled",
      details: `${nextChecked ? "تم تعليم" : "تم إلغاء"} عنصر مراجعة داخل ${docTitle}: ${item}`,
      pathId: selectedPath?.id,
      pathSlug: selectedPath?.slug,
      docId,
      itemLabel: item
    });
  };

  const markAllChecklistItems = () => {
    if (!selectedPath) return;

    const nextEntries = pathOpsDocs.flatMap((doc) =>
      getDocChecklistItems(doc.id).map((item) => [
        getDocChecklistKey(doc.id, item),
        { checked: true, updatedAt: Date.now(), docId: doc.id }
      ] as const)
    );

    setDocChecklistStore((current) => ({
      ...current,
      ...Object.fromEntries(nextEntries)
    }));

    appendOperationLog({
      action: "checklist-marked-all",
      details: `تم تعليم كل عناصر المراجعة كمكتملة لمسار ${selectedPath.title}.`,
      pathId: selectedPath.id,
      pathSlug: selectedPath.slug
    });
  };

  const resetChecklistItems = () => {
    if (!selectedPath) return;

    const keysToRemove = new Set(
      pathOpsDocs.flatMap((doc) =>
        getDocChecklistItems(doc.id).map((item) => getDocChecklistKey(doc.id, item))
      )
    );

    setDocChecklistStore((current) =>
      Object.fromEntries(Object.entries(current).filter(([key]) => !keysToRemove.has(key)))
    );

    appendOperationLog({
      action: "checklist-reset",
      details: `تمت إعادة ضبط مراجعة المسار ${selectedPath.title}.`,
      pathId: selectedPath.id,
      pathSlug: selectedPath.slug
    });
  };

  const exportChecklistReport = () => {
    if (!selectedPath) return;

    const sections = pathOpsDocs.map((doc) => {
      const completion = getChecklistCompletion(doc.id);
      const checklist = getDocChecklistItems(doc.id);
      const status =
        completion.completed === 0 ? "غير مراجع" : completion.completed === completion.total ? "مكتمل" : "قيد المراجعة";

      const items = checklist
        .map((item) => `- [${isChecklistItemDone(doc.id, item) ? "x" : " "}] ${item}`)
        .join("\n");

      return [
        `## ${doc.title}`,
        `الحالة: ${status}`,
        `الإنجاز: ${completion.completed}/${completion.total}`,
        `المرجع: ${doc.docPath}`,
        items
      ].join("\n");
    });

    const report = [
      `# تقرير مراجعة المسار: ${selectedPath.title}`,
      ``,
      `Slug: ${selectedPath.slug}`,
      `Entry: ${selectedPath.entryScreen}`,
      `Target: ${selectedPath.targetScreen}`,
      `التحذيرات الحالية: ${selectedPathWarnings.length + globalWarnings.length}`,
      `إجمالي الإنجاز: ${pathOpsProgressSummary.completed}/${pathOpsProgressSummary.total} (${pathOpsProgressSummary.percent}%)`,
      ``,
      ...sections
    ].join("\n");

    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedPath.slug}-review-report.md`;
    anchor.click();
    URL.revokeObjectURL(url);

    appendOperationLog({
      action: "checklist-exported",
      fileName: `${selectedPath.slug}-review-report.md`,
      details: `تم تصدير تقرير مراجعة للمسار ${selectedPath.title}.`,
      pathId: selectedPath.id,
      pathSlug: selectedPath.slug
    });
  };

  const getChecklistCompletion = (docId: string) => {
    const items = getDocChecklistItems(docId);
    const completed = items.filter((item) => isChecklistItemDone(docId, item)).length;
    return { completed, total: items.length };
  };

  const getDocWidgetMeta = (docId: string) => {
    const activeStepsCount = selectedPath?.steps.filter((step) => step.enabled).length ?? 0;
    const totalWarnings = selectedPathWarnings.length + globalWarnings.length;

    if (docId === "route-matrix") {
      return {
        status: `الدخول: ${selectedPath?.entryScreen ?? "غير محدد"} -> الخروج: ${selectedPath?.targetScreen ?? "غير محدد"}`,
        accent: "cyan",
        items: [
          `الخطوات الفعالة الآن: ${activeStepsCount}`,
          `نقطة البدء الحالية: ${runtimePreview?.startsFrom ?? "غير محدد"}`,
          `الوجهة النهائية الحالية: ${runtimePreview?.finalScreen ?? "غير محدد"}`
        ]
      };
    }

    if (docId === "critical-flows") {
      return {
        status: totalWarnings > 0 ? `يحتاج مراجعة (${totalWarnings})` : "جاهز مبدئيًا",
        accent: totalWarnings > 0 ? "amber" : "emerald",
        items: [
          `عدد التحذيرات الحالية: ${totalWarnings}`,
          `إجمالي الخطوات: ${runtimePreview?.stepsCount ?? 0}`,
          `الخطوات الفعالة: ${runtimePreview?.activeSteps ?? 0}`
        ]
      };
    }

    if (docId === "feature-flags") {
      return {
        status: "افحص gating قبل أي نشر",
        accent: "violet",
        items: [
          "راجع ما إذا كان هذا المسار يتأثر بوضع user أو owner.",
          "تأكد أن أي feature hidden ليست سبب اختفاء خطوة.",
          "افتح الرايات عند الشك في اختلاف السلوك بين البيئات."
        ]
      };
    }

    if (docId === "release" || docId === "post-release") {
      return {
        status: selectedPath?.isActive ? "مسار مفعّل ويؤثر على التشغيل الحي" : "مسار غير مفعّل حاليًا",
        accent: selectedPath?.isActive ? "rose" : "slate",
        items: [
          `حالة المسار: ${selectedPath?.isActive ? "Active" : "Inactive"}`,
          `Slug المسار: ${selectedPath?.slug ?? "غير محدد"}`,
          "استخدم هذه البطاقة قبل وبعد أي تعديل مؤثر."
        ]
      };
    }

    return {
      status: "مرجع تشغيلي جاهز للاستخدام",
      accent: "slate",
      items: docId === "ownership"
        ? [
            "راجع هل هذا المسار يخص user أم owner.",
            "تأكد أن surface الصحيحة هي التي تتأثر بالتعديل.",
            `المسار الحالي: ${selectedPath?.slug ?? "غير محدد"}`
          ]
        : docId === "triage"
          ? [
              "استخدمه إذا انكسر entry أو target أو CTA.",
              "ابدأ من state ثم route ثم service.",
              `التحذيرات الحالية: ${totalWarnings}`
            ]
          : docId === "owner-manual"
            ? [
                "يفيد في اتخاذ قرار سريع على هذا المسار.",
                "ارجع له عند تغيير ترتيب الخطوات أو التفعيل.",
                `المسار الحالي: ${selectedPath?.title ?? "غير محدد"}`
              ]
            : docId === "functional-map"
              ? [
                  "راجع موقع هذا المسار داخل المنصة ككل.",
                  "يفيد قبل ربطه بمسار آخر أو surface إضافية.",
                  `الوجهة الحالية: ${selectedPath?.targetScreen ?? "غير محدد"}`
                ]
              : docId === "inventory"
                ? [
                    "استخدمه قبل إنشاء أي شاشة أو service جديدة.",
                    "ابحث أولًا عن المكونات الموجودة بالفعل.",
                    `إجمالي الخطوات الحالية: ${runtimePreview?.stepsCount ?? 0}`
                  ]
                : [
                    "مرجع مساعد مرتبط بهذا المسار.",
                    "يفيد أثناء التعديل والتحقق والتشغيل.",
                    `Slug: ${selectedPath?.slug ?? "غير محدد"}`
                  ]
    };
  };

  const pathOpsProgressSummary = useMemo(() => {
    const completionStats = pathOpsDocs.map((doc) => ({
      docId: doc.id,
      title: doc.title,
      ...getChecklistCompletion(doc.id)
    }));

    const completed = completionStats.reduce((sum, item) => sum + item.completed, 0);
    const total = completionStats.reduce((sum, item) => sum + item.total, 0);
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const warningCount = selectedPathWarnings.length + globalWarnings.length;
    const fullyReviewedDocs = completionStats.filter((item) => item.total > 0 && item.completed === item.total).length;
    const pathPrefix = `${selectedPath?.slug ?? "unknown"}::`;
    const latestEntry = Object.entries(docChecklistStore)
      .filter(([key, value]) => key.startsWith(pathPrefix) && typeof value?.updatedAt === "number")
      .sort((a, b) => (b[1].updatedAt ?? 0) - (a[1].updatedAt ?? 0))[0]?.[1];
    const latestDocTitle = latestEntry?.docId
      ? pathOpsDocs.find((doc) => doc.id === latestEntry.docId)?.title ?? latestEntry.docId
      : null;

    return {
      completed,
      total,
      percent,
      warningCount,
      fullyReviewedDocs,
      docsCount: completionStats.length,
      latestUpdatedAt: latestEntry?.updatedAt ?? null,
      latestDocTitle
    };
  }, [pathOpsDocs, selectedPathWarnings, globalWarnings, docChecklistStore, selectedPath]);

  const filteredPathOpsDocs = useMemo(() => {
    const docsWithProgress = pathOpsDocs.map((doc) => {
      const completion = getChecklistCompletion(doc.id);
      const status: Exclude<OpsDocReviewFilter, "all"> =
        completion.completed === 0 ? "not-started" : completion.completed === completion.total ? "completed" : "in-progress";

      return { doc, completion, status };
    });

    const filtered = opsDocReviewFilter === "all" ? docsWithProgress : docsWithProgress.filter((item) => item.status === opsDocReviewFilter);

    return filtered.sort((a, b) => {
      const rank = { "not-started": 0, "in-progress": 1, "completed": 2 } as const;
      return rank[a.status] - rank[b.status];
    });
  }, [pathOpsDocs, opsDocReviewFilter, docChecklistStore]);

  const formatLiveStageLabel = (stage: "setup" | "live" | "complete" | "return" | null) => {
    switch (stage) {
      case "setup": return "التهيئة";
      case "live": return "الجلسة الحية";
      case "complete": return "شاشة الإكمال";
      case "return": return "العودة النهائية";
      default: return "غير محدد";
    }
  };

  const formatMarayaStageLabel = (stage: "landing" | "story" | "ending" | "return" | null) => {
    switch (stage) {
      case "landing": return "التهيئة / اختيار البداية";
      case "story": return "القصة الحية";
      case "ending": return "الخاتمة";
      case "return": return "العودة النهائية";
      default: return "غير محدد";
    }
  };

  const filteredOperationLog = operationLog.filter(log => operationLogFilter === "all" || log.action === operationLogFilter);

  const reviewTimelineEntries = useMemo(() => {
    if (!selectedPath) return [];
    return operationLog
      .filter((entry) => {
        if (!REVIEW_TIMELINE_ACTIONS.includes(entry.action)) return false;
        if (entry.pathId) return entry.pathId === selectedPath.id;
        if (entry.pathSlug) return entry.pathSlug === selectedPath.slug;
        return entry.details.includes(selectedPath.title) || entry.details.includes(selectedPath.slug);
      })
      .slice(0, 5);
  }, [operationLog, selectedPath]);

  const getOperationLogMeta = (action: OperationLogAction) => {
    switch(action) {
      case "import-ready": return { label: "جاهز", badge: "text-amber-400" };
      case "import-confirmed": return { label: "مكتمل", badge: "text-emerald-400" };
      case "import-cancelled": return { label: "ملغى", badge: "text-rose-400" };
      case "backup-restored": return { label: "مسترجع", badge: "text-indigo-400" };
      case "checklist-toggled": return { label: "مراجعة", badge: "text-cyan-400" };
      case "checklist-marked-all": return { label: "تعليم جماعي", badge: "text-emerald-400" };
      case "checklist-reset": return { label: "إعادة ضبط", badge: "text-rose-400" };
      case "checklist-exported": return { label: "تصدير", badge: "text-violet-400" };
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

      {/* Premium Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0B0F19] p-2 rounded-[2rem] border border-slate-800 shadow-xl backdrop-blur-xl sticky top-0 z-30">
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800/50 w-full sm:w-auto">
          {[
            { id: "design", label: "التصميم الهندسي", icon: Workflow },
            { id: "analytics", label: "الرادار والنبض", icon: Activity },
            { id: "ops", label: "التشغيل والتعافي", icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activePanelTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActivePanelTab(tab.id as any)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  isActive 
                    ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)] border border-cyan-500/20" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 px-4">
           <div className="h-1 w-1 rounded-full bg-cyan-500 animate-ping" />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
             {activePanelTab === "design" ? "Architect Mode" : activePanelTab === "analytics" ? "Forensics Mode" : "Ops Mode"}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Mini-nav (Always visible or contextual) */}
        <div className="lg:col-span-3 space-y-6">
           {/* Path Pick Group */}
           <div className="space-y-2">
              <h4 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">اختيار المسار</h4>
              {journeyPaths.map((path, index) => (
                <button
                  key={getSafePathKey(path, index)}
                  onClick={() => setSelectedPathId(path.id)}
                  className={`w-full text-right p-4 rounded-[1.5rem] transition-all duration-300 group relative overflow-hidden ${
                    selectedPathId === path.id 
                      ? "bg-gradient-to-l from-cyan-500/10 to-transparent border border-cyan-500/20" 
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                     <span className={`text-[11px] font-black tracking-wide ${selectedPathId === path.id ? "text-white" : "text-slate-400"}`}>
                        {path.title}
                     </span>
                     {selectedPathId === path.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
                     )}
                  </div>
                </button>
              ))}
           </div>
        </div>

        {/* Focus Area Content */}
        <div className="lg:col-span-9">
           
           {/* Section 1: DESIGN */}
           {activePanelTab === "design" && (
             <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
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
                         <Field label="اسم المسار"><input value={selectedPath.title} onChange={(e) => patchPath(selectedPath.id, p => ({ ...p, title: e.target.value }))} className="admin-input bg-slate-900/50" /></Field>
                         <Field label="Slug العبور"><input value={selectedPath.slug} onChange={(e) => patchPath(selectedPath.id, p => ({ ...p, slug: e.target.value }))} className="admin-input bg-slate-900/50" /></Field>
                      </div>
                      <Field label="وصف غرض المسار"><textarea value={selectedPath.description} onChange={(e) => patchPath(selectedPath.id, p => ({ ...p, description: e.target.value }))} className="admin-input bg-slate-900/50 min-h-[80px]" /></Field>
                   </div>
                </section>

                <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800 w-fit mb-4">
                  <button onClick={() => setActiveTab("linear")} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "linear" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-white"}`}>التسلسل الخطي</button>
                  <button onClick={() => setActiveTab("constellation")} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "constellation" ? "bg-indigo-500/20 text-indigo-400" : "text-slate-500 hover:text-white"}`}>الشبكة البصرية</button>
                </div>

                {activeTab === "linear" ? (
                  <PathArchitect path={selectedPath} onUpdate={(updater) => setJourneyPaths(journeyPaths.map(p => p.id === selectedPath.id ? updater(p) : p))} onGenerate={handleGeneratePath} isGenerating={isGenerating} />
                ) : (
                  <div className="animate-in fade-in zoom-in-95 duration-500"><PathConstellationPreview steps={selectedPath.steps} /></div>
                )}
             </div>
           )}

           {/* Section 2: ANALYTICS */}
           {activePanelTab === "analytics" && (
             <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                   <section className="rounded-[2.5rem] border border-slate-800 bg-[#0B0F19] p-8 shadow-sm h-fit"><TelemetryPulse path={selectedPath} revenueMetrics={revenueMetrics} /></section>
                   <section className="rounded-[2.5rem] border border-cyan-500/10 bg-gradient-to-br from-cyan-500/5 to-transparent p-8">
                      <div className="flex items-center gap-3 mb-6"><Workflow className="w-5 h-5 text-cyan-400" /><h3 className="text-sm font-black text-white uppercase tracking-widest">محاكاة التشغيل (Simulation)</h3></div>
                      <button onClick={handleSimulatePath} disabled={isSimulating || selectedPath.steps.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500/10 py-3 text-sm font-black text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-50">
                        {isSimulating ? <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> : <Sparkles className="h-4 w-4" />}
                        {isSimulating ? "جاري استدعاء الشخصيات المحاكية..." : "تشغيل المحاكي الشعوري (Personas Playtest)"}
                      </button>
                   </section>
                </div>
                <section className="rounded-[2.5rem] border border-slate-800 bg-[#0B0F19] p-8 lg:p-12 shadow-sm"><GhostMirror /></section>
             </div>
           )}

           {/* Section 3: OPS */}
           {activePanelTab === "ops" && (
             <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                   <section className="rounded-[2.5rem] border border-slate-800 bg-[#0B0F19] p-8 shadow-sm h-fit">
                      <FrictionHealer path={selectedPath} warnings={[...selectedPathWarnings, ...globalWarnings]} onApplyHealing={handleApplyHealing} auditData={auditResults[selectedPath.id]} isAuditing={isAuditing} onRunAudit={handleRunAudit} />
                   </section>
                   <section className="rounded-[2.5rem] border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-8 shadow-sm">
                      <div className="flex items-center justify-between gap-4 mb-6"><div className="space-y-2"><div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-amber-300"><BookOpen className="h-3.5 w-3.5" />عناصر مكتبة التشغيل</div><h3 className="text-lg font-black text-white">مراجع قابلة للاستخدام</h3></div></div>
                      <div className="grid gap-4">
                         {filteredPathOpsDocs.slice(0, 4).map(({ doc }) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800"><div className="flex items-center gap-3"><doc.icon className="w-4 h-4 text-amber-500" /><span className="text-xs font-black text-white">{doc.title}</span></div><button onClick={() => handleOpenOpsDoc(doc.id)} className="text-[10px] font-black text-cyan-400">فتح</button></div>
                         ))}
                      </div>
                   </section>
                </div>
                {operationLog.length > 0 && (
                   <div className="rounded-[2.5rem] border border-slate-800 bg-[#0B0F19] p-8 shadow-inner overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[80px] pointer-events-none" />
                      <div className="flex items-center justify-between mb-8 relative z-10"><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">سجل العمليات التقنية (Engine Logs)</h4><button onClick={handleClearOperationLog} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400 transition-colors">مسح السجل</button></div>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar font-mono relative z-10">
                         {filteredOperationLog.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-cyan-500/30 transition-all"><div className="flex items-center gap-4"><div className={`w-1.5 h-1.5 rounded-full ${index === 0 ? "bg-cyan-400 animate-pulse" : "bg-slate-700"}`} /><div className="text-xs text-slate-300 leading-relaxed font-bold">{entry.details}</div></div><span className="text-[10px] text-slate-600 font-black">{new Date(entry.createdAt).toLocaleTimeString('ar-EG')}</span></div>
                         ))}
                      </div>
                   </div>
                )}
             </div>
           )}
        </div>
      </div>

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
