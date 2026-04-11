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
  ArrowDown
} from "lucide-react";
import {
  useAdminState,
  type JourneyPath,
  type JourneyPathStep,
  type JourneyPathStepKind
} from "@/domains/admin/store/admin.store";
import { generateJourneyPath, updateJourneyPaths, auditJourneyPath, getRevenueMetrics, simulateJourneyPath } from "@/services/adminApi";
import type { CognitiveSimulationResult } from "@/services/adminApi";
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
        action: "audit-passed" as any, 
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
        completion.completed === 0
          ? "غير مراجع"
          : completion.completed === completion.total
            ? "مكتمل"
            : "قيد المراجعة";

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
    return {
      completed,
      total: items.length
    };
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
        completion.completed === 0
          ? "not-started"
          : completion.completed === completion.total
            ? "completed"
            : "in-progress";

      return {
        doc,
        completion,
        status
      };
    });

    const filtered =
      opsDocReviewFilter === "all"
        ? docsWithProgress
        : docsWithProgress.filter((item) => item.status === opsDocReviewFilter);

    return filtered.sort((a, b) => {
      const rank = {
        "not-started": 0,
        "in-progress": 1,
        "completed": 2
      } as const;

      return rank[a.status] - rank[b.status];
    });
  }, [pathOpsDocs, opsDocReviewFilter, docChecklistStore]);

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

                 <section className="rounded-[2.5rem] border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-8 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-6">
                       <div className="space-y-2">
                          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">
                             <BookOpen className="h-3.5 w-3.5" />
                             عناصر مكتبة التشغيل
                          </div>
                          <h3 className="text-lg font-black text-white">مراجع قابلة للاستخدام داخل هذا المسار</h3>
                          <p className="text-sm leading-7 text-slate-300">{pathOpsGuidance}</p>
                       </div>
                       <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-center min-w-[92px]">
                          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">مراجع مرتبطة</div>
                          <div className="mt-2 text-3xl font-black text-white">{pathOpsDocs.length}</div>
                       </div>
                    </div>

                    <div className="mb-6 rounded-[1.75rem] border border-emerald-500/10 bg-emerald-500/[0.04] p-5">
                       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-2">
                             <div className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">ملخص تقدم المسار</div>
                             <div className="text-sm font-bold text-white">
                                تم إنجاز {pathOpsProgressSummary.completed} من {pathOpsProgressSummary.total} عنصر مراجعة عبر {pathOpsProgressSummary.docsCount} مراجع.
                             </div>
                             <div className="text-xs leading-6 text-slate-300">
                                {pathOpsProgressSummary.warningCount > 0
                                  ? `لا يزال هناك ${pathOpsProgressSummary.warningCount} تحذير يحتاج انتباهًا داخل هذا المسار.`
                                  : "لا توجد تحذيرات حالية، ويمكنك استكمال المراجعة بهدوء."}
                             </div>
                          </div>
                          <div className="min-w-[220px] space-y-3">
                             <div className="flex items-center justify-between text-[11px] font-black text-slate-300">
                                <span>نسبة الإنجاز</span>
                                <span>{pathOpsProgressSummary.percent}%</span>
                             </div>
                             <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    pathOpsProgressSummary.percent >= 100
                                      ? "bg-emerald-400"
                                      : pathOpsProgressSummary.percent >= 50
                                        ? "bg-cyan-400"
                                        : "bg-amber-400"
                                  }`}
                                  style={{ width: `${pathOpsProgressSummary.percent}%` }}
                                />
                             </div>
                             <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>مراجع مكتملة بالكامل</span>
                                <span className="font-black text-white">{pathOpsProgressSummary.fullyReviewedDocs}/{pathOpsProgressSummary.docsCount}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                 <span>آخر مرجع تم لمسه</span>
                                 <span className="font-black text-white">
                                   {pathOpsProgressSummary.latestDocTitle ?? "لا يوجد بعد"}
                                 </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                 <span>آخر مراجعة</span>
                                 <span className="font-black text-white">
                                   {pathOpsProgressSummary.latestUpdatedAt
                                     ? new Date(pathOpsProgressSummary.latestUpdatedAt).toLocaleString("ar-EG")
                                     : "لم تبدأ بعد"}
                                 </span>
                              </div>
                              <div className="flex flex-wrap gap-2 pt-1">
                                 <button
                                   type="button"
                                   onClick={markAllChecklistItems}
                                   className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-black text-emerald-300 transition hover:bg-emerald-500/20"
                                 >
                                   تعليم الكل
                                 </button>
                                 <button
                                   type="button"
                                   onClick={resetChecklistItems}
                                   className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-[11px] font-black text-slate-300 transition hover:border-rose-500/30 hover:text-rose-300"
                                 >
                                   إعادة ضبط
                                 </button>
                                 <button
                                   type="button"
                                   onClick={exportChecklistReport}
                                   className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-black text-cyan-300 transition hover:bg-cyan-500/20"
                                 >
                                   تصدير التقرير
                                 </button>
                              </div>
                           </div>
                        </div>
                    </div>

                    <div className="mb-6 flex flex-wrap gap-2">
                       {[
                         { id: "all" as const, label: "كل المراجع" },
                         { id: "not-started" as const, label: "غير مراجع" },
                         { id: "in-progress" as const, label: "قيد المراجعة" },
                         { id: "completed" as const, label: "مكتمل" }
                       ].map((filter) => (
                         <button
                           key={filter.id}
                           type="button"
                           onClick={() => setOpsDocReviewFilter(filter.id)}
                           className={`rounded-xl border px-3 py-2 text-[11px] font-black transition ${
                             opsDocReviewFilter === filter.id
                               ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
                               : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-white"
                           }`}
                         >
                           {filter.label}
                         </button>
                       ))}
                    </div>

                    <div className="mb-6 rounded-[1.75rem] border border-slate-800 bg-slate-950/35 p-5">
                       <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                             <div className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-300">Timeline المراجعة</div>
                             <div className="text-sm font-bold text-white">
                                آخر 5 أفعال مراجعة مرتبطة بهذا المسار.
                             </div>
                             <div className="text-xs leading-6 text-slate-400">
                                يساعدك هذا الشريط على فهم آخر ما تم لمسه بسرعة قبل فتح السجل الكامل أو متابعة التعديل.
                             </div>
                          </div>
                          <div className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] font-black text-slate-300">
                             {reviewTimelineEntries.length}/5
                          </div>
                       </div>

                       <div className="mt-4 space-y-3">
                          {reviewTimelineEntries.length > 0 ? (
                            reviewTimelineEntries.map((entry) => {
                              const meta = getOperationLogMeta(entry.action);
                              const dotClass =
                                meta.badge.includes("emerald")
                                  ? "bg-emerald-400"
                                  : meta.badge.includes("rose")
                                    ? "bg-rose-400"
                                    : meta.badge.includes("violet")
                                      ? "bg-violet-400"
                                      : meta.badge.includes("cyan")
                                        ? "bg-cyan-400"
                                        : "bg-amber-400";

                              return (
                                <div
                                  key={`${entry.createdAt}-${entry.action}-${entry.docId ?? "doc"}-${entry.itemLabel ?? "item"}`}
                                  className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/45 px-4 py-3"
                                >
                                  <div className="flex items-start gap-3">
                                     <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${dotClass}`} />
                                     <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                           <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${meta.badge}`}>
                                              {meta.label}
                                           </span>
                                           {entry.docId ? (
                                             <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-black text-slate-300">
                                                {pathOpsDocs.find((doc) => doc.id === entry.docId)?.title ?? entry.docId}
                                             </span>
                                           ) : null}
                                        </div>
                                        <div className="text-xs font-bold leading-6 text-white">{entry.details}</div>
                                     </div>
                                  </div>
                                  <div className="shrink-0 text-[10px] font-mono text-slate-500">
                                     {new Date(entry.createdAt).toLocaleString("ar-EG")}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-4 py-5 text-xs leading-6 text-slate-400">
                               لا توجد أفعال مراجعة مسجلة لهذا المسار بعد. ابدأ بتعليم عنصر واحد على الأقل لتظهر الحركة هنا.
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                       {filteredPathOpsDocs.map(({ doc, completion, status }) => {
                          const Icon = doc.icon;
                          const widget = getDocWidgetMeta(doc.id);
                          const checklist = getDocChecklistItems(doc.id);
                          return (
                          <div
                            key={doc.id}
                           className="rounded-[1.5rem] border border-slate-800 bg-slate-950/40 p-5 space-y-4"
                         >
                            <div className="flex items-start justify-between gap-3">
                               <div className="space-y-2">
                                  <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
                                     {doc.badge}
                                  </div>
                                  <h4 className="text-base font-black text-white">{doc.title}</h4>
                               </div>
                               <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2 text-amber-300">
                                  <Icon className="h-4 w-4" />
                               </div>
                            </div>

                            <p className="text-xs leading-6 text-slate-400">{doc.purpose}</p>

                            <div className="space-y-2">
                               <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">استخدمه هنا عندما</div>
                               {doc.whenToUse.slice(0, 2).map((item) => (
                                 <div key={item} className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-200">
                                    {item}
                                 </div>
                               ))}
                            </div>

                              <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 px-3 py-2 text-[11px] font-mono text-cyan-300">
                                 {doc.docPath}
                              </div>
                              <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4 space-y-3">
                                 <div className="flex items-center justify-between gap-3">
                                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">نبضة تشغيلية</div>
                                    <div className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                                      widget.accent === "emerald"
                                        ? "bg-emerald-500/10 text-emerald-300"
                                        : widget.accent === "amber"
                                          ? "bg-amber-400/10 text-amber-300"
                                          : widget.accent === "rose"
                                            ? "bg-rose-500/10 text-rose-300"
                                            : widget.accent === "violet"
                                              ? "bg-violet-500/10 text-violet-300"
                                              : widget.accent === "cyan"
                                                ? "bg-cyan-500/10 text-cyan-300"
                                                : "bg-slate-800 text-slate-300"
                                    }`}>
                                      {widget.status}
                                    </div>
                                 </div>
                                 <div className="space-y-2">
                                    {widget.items.map((item) => (
                                      <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] leading-6 text-slate-300">
                                         {item}
                                      </div>
                                    ))}
                                 </div>
                              </div>
                               <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.04] p-4 space-y-3">
                                  <div className="flex items-center justify-between gap-3">
                                     <div className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Checklist تفاعلي</div>
                                     <div className="flex items-center gap-2">
                                       <div className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                                         status === "completed"
                                           ? "bg-emerald-500/10 text-emerald-300"
                                           : status === "in-progress"
                                             ? "bg-cyan-500/10 text-cyan-300"
                                             : "bg-amber-400/10 text-amber-300"
                                       }`}>
                                         {status === "completed" ? "مكتمل" : status === "in-progress" ? "قيد المراجعة" : "غير مراجع"}
                                       </div>
                                       <div className="rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-black text-white">
                                         {completion.completed}/{completion.total}
                                       </div>
                                     </div>
                                  </div>
                                 <div className="space-y-2">
                                    {checklist.map((item) => {
                                      const checked = isChecklistItemDone(doc.id, item);
                                      return (
                                        <button
                                          key={item}
                                          type="button"
                                          onClick={() => toggleChecklistItem(doc.id, item)}
                                          className={`w-full rounded-xl border px-3 py-2 text-right text-[11px] leading-6 transition ${
                                            checked
                                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                              : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                                          }`}
                                        >
                                          <span className="inline-flex items-center gap-2">
                                            <span className={`h-2.5 w-2.5 rounded-full ${checked ? "bg-emerald-400" : "bg-slate-600"}`} />
                                            {item}
                                          </span>
                                        </button>
                                      );
                                    })}
                                 </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 <button
                                   type="button"
                                  onClick={() => handleOpenOpsDoc(doc.id)}
                                  className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-black text-cyan-300 transition hover:bg-cyan-500/20"
                                >
                                  افتح المرجع
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRunOpsAction(doc.id)}
                                  className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[11px] font-black text-amber-300 transition hover:bg-amber-400/20"
                                >
                                  {getDocActionLabel(doc.id)}
                                </button>
                             </div>
                          </div>
                         );
                       })}
                    </div>
                 </section>

                 <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800 w-fit mb-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab("linear")}
                      className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "linear" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-white"}`}
                    >
                      التسلسل الخطي
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("constellation")}
                      className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "constellation" ? "bg-indigo-500/20 text-indigo-400" : "text-slate-500 hover:text-white"}`}
                    >
                      الشبكة البصرية
                    </button>
                 </div>

                 {activeTab === "linear" ? (
                   <PathArchitect 
                     path={selectedPath} 
                     onUpdate={(updater) => setJourneyPaths(journeyPaths.map(p => p.id === selectedPath.id ? updater(p) : p))}
                     onGenerate={handleGeneratePath}
                     isGenerating={isGenerating}
                   />
                 ) : (
                   <div className="animate-in fade-in zoom-in-95 duration-500">
                     <PathConstellationPreview steps={selectedPath.steps} />
                   </div>
                 )}
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
                    
                    <div className="mt-8 border-t border-cyan-500/10 pt-6">
                       <button
                         onClick={handleSimulatePath}
                         disabled={isSimulating || selectedPath.steps.length === 0}
                         className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500/10 py-3 text-sm font-black text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                       >
                         {isSimulating ? <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> : <Sparkles className="h-4 w-4" />}
                         {isSimulating ? "جاري استدعاء الشخصيات المحاكية..." : "تشغيل المحاكي الشعوري (Personas Playtest)"}
                       </button>

                       {simulationResults && (
                         <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            {simulationResults.map((sim, i) => (
                              <div key={i} className={`p-4 rounded-2xl border bg-slate-950/50 ${
                                sim.willComplete ? 'border-emerald-500/30' : 'border-rose-500/30'
                              }`}>
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-md ${
                                    sim.willComplete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                  }`}>
                                    {sim.persona}
                                  </div>
                                  <div className="text-xs text-slate-400 font-bold">
                                    {sim.willComplete ? 'سيكمل المسار' : 'قد ينسحب'}
                                  </div>
                                </div>
                                <p className="text-sm text-slate-300 italic leading-relaxed">"{sim.feedback}"</p>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
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
