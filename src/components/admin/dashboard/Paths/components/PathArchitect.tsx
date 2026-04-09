import { useCallback, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layout,
  CheckCircle2,
  AlertCircle,
  Eye,
  GripVertical
} from "lucide-react";
import type { JourneyPath, JourneyPathStep, JourneyPathStepKind } from "@/state/adminState";
import type { AppScreen } from "@/navigation/navigationMachine";

const STEP_KIND_CONFIG: Record<
  JourneyPathStepKind,
  { label: string; icon: typeof Layout; color: string }
> = {
  entry: { label: "مدخل", icon: Layout, color: "text-emerald-400" },
  check: { label: "فحص", icon: Eye, color: "text-amber-400" },
  decision: { label: "قرار", icon: AlertCircle, color: "text-indigo-400" },
  intervention: { label: "تدخل", icon: Sparkles, color: "text-teal-400" },
  screen: { label: "شاشة", icon: Layout, color: "text-cyan-400" },
  outcome: { label: "مخرج", icon: CheckCircle2, color: "text-purple-400" }
};

const SCREEN_OPTIONS: AppScreen[] = [
  "landing",
  "goal",
  "map",
  "guided",
  "mission",
  "tools",
  "settings",
  "enterprise",
  "guilt-court",
  "diplomacy",
  "oracle-dashboard",
  "armory",
  "survey",
  "exit-scripts",
  "grounding",
  "stories",
  "about",
  "insights",
  "quizzes",
  "behavioral-analysis",
  "resources",
  "profile",
  "sanctuary",
  "life-os"
];

interface PathArchitectProps {
  path: JourneyPath;
  onUpdate: (updater: (p: JourneyPath) => JourneyPath) => void;
  onGenerate: (intention: string) => Promise<void>;
  isGenerating: boolean;
}

function getSafeStepKey(step: JourneyPathStep | undefined, index: number): string {
  if (step?.id && String(step.id).trim()) return step.id;
  if (step?.title && String(step.title).trim()) return `step-title:${step.title}:${index}`;
  return `step:${index}`;
}

export function PathArchitect({ path, onUpdate, onGenerate, isGenerating }: PathArchitectProps) {
  const [intention, setIntention] = useState("");

  const updateStep = useCallback(
    (stepId: string, updates: Partial<JourneyPathStep>) => {
      onUpdate((currentPath) => ({
        ...currentPath,
        steps: currentPath.steps.map((step) =>
          step.id === stepId ? { ...step, ...updates } : step
        )
      }));
    },
    [onUpdate]
  );

  const removeStep = useCallback(
    (stepId: string) => {
      onUpdate((currentPath) => ({
        ...currentPath,
        steps: currentPath.steps.filter((step) => step.id !== stepId)
      }));
    },
    [onUpdate]
  );

  const moveStep = useCallback(
    (index: number, direction: "up" | "down") => {
      onUpdate((currentPath) => {
        const nextSteps = [...currentPath.steps];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= nextSteps.length) return currentPath;
        [nextSteps[index], nextSteps[targetIndex]] = [nextSteps[targetIndex], nextSteps[index]];
        return { ...currentPath, steps: nextSteps };
      });
    },
    [onUpdate]
  );

  const stepKindOptions = useMemo(() => Object.entries(STEP_KIND_CONFIG), []);

  const handleGenerate = useCallback(() => {
    void onGenerate(intention);
  }, [intention, onGenerate]);

  const handleAddStep = useCallback(() => {
    const newStep: JourneyPathStep = {
      id: `step-screen-sanctuary-${path.steps.length + 1}`,
      title: "خطوة جديدة",
      kind: "screen",
      screen: "sanctuary",
      description: "",
      enabled: true
    };

    onUpdate((currentPath) => ({
      ...currentPath,
      steps: [...currentPath.steps, newStep]
    }));
  }, [onUpdate, path.steps.length]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative group overflow-hidden rounded-[2.5rem] border border-teal-500/30 bg-[#0F172A]/80 p-1 backdrop-blur-xl shadow-2xl transition-all hover:border-teal-500/50">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-indigo-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="relative p-6 px-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/20 to-indigo-600/20 border border-teal-500/40 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(20,184,166,0.3)] animate-pulse">
            <Sparkles className="w-8 h-8 text-teal-400" />
          </div>
          <div className="flex-1 space-y-2 text-center md:text-right">
            <h3 className="text-xl font-black text-white uppercase tracking-widest">مهندس المسارات (AI)</h3>
            <p className="text-sm text-slate-400 font-bold">
              بإمكانك وصف المسار الذي تتخيله، وسأقوم ببناء هيكل المسار لك فورًا.
            </p>
            <div className="mt-4 flex gap-3">
              <input
                value={intention}
                onChange={(event) => setIntention(event.target.value)}
                placeholder="مثلاً: 'مسار للاسترخاء يبدأ بفحص النبض وينتهي في الملاذ الآمن'"
                className="flex-1 bg-[#030712] border border-slate-800 rounded-2xl px-6 py-4 text-white placeholder-slate-600 hover:border-teal-500/30 focus:border-teal-500 focus:outline-none transition-all font-bold text-sm"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !intention.trim()}
                className="rounded-2xl bg-teal-600 px-8 py-4 font-black text-white hover:bg-teal-500 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group whitespace-nowrap"
              >
                {isGenerating ? "جاري البناء..." : "بناء المسار"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <header className="flex items-center justify-between px-4">
          <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">تسلسل الرحلة (Sequence)</h4>
          <button
            onClick={handleAddStep}
            className="flex items-center gap-2 text-teal-400 hover:text-teal-300 font-black text-xs uppercase tracking-widest transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة خطوة
          </button>
        </header>

        <div className="space-y-4 relative">
          <div className="absolute right-[43px] top-10 bottom-10 w-[2px] bg-gradient-to-b from-teal-500/50 via-indigo-500/50 to-teal-500/50 opacity-20 hidden md:block" />

          {path.steps.map((step, index) => {
            const config = STEP_KIND_CONFIG[step.kind];
            const Icon = config.icon;

            return (
              <div
                key={getSafeStepKey(step, index)}
                className={`relative group/step rounded-3xl border border-slate-800 bg-[#111827]/60 p-6 transition-all hover:bg-[#111827]/80 hover:border-teal-500/30 ${!step.enabled ? "opacity-50 grayscale-50" : ""}`}
              >
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                      <GripVertical className="w-5 h-5 opacity-30" />
                    </div>
                    <div className={`w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner ${config.color}`}>
                      <Icon className="w-7 h-7" />
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 px-1">عنوان الخطوة</label>
                      <input
                        value={step.title}
                        onChange={(event) => updateStep(step.id, { title: event.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 focus:outline-none transition-all font-bold text-sm"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 px-1">النوع</label>
                      <select
                        value={step.kind}
                        onChange={(event) => updateStep(step.id, { kind: event.target.value as JourneyPathStepKind })}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 focus:outline-none transition-all font-bold text-sm appearance-none"
                      >
                        {stepKindOptions.map(([kind, item]) => (
                          <option key={kind} value={kind}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 px-1">الشاشة</label>
                      <select
                        value={step.screen}
                        onChange={(event) => updateStep(step.id, { screen: event.target.value as AppScreen })}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-teal-500/50 focus:outline-none transition-all font-bold text-sm appearance-none"
                      >
                        {SCREEN_OPTIONS.map((screen) => (
                          <option key={screen} value={screen}>
                            {screen}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 flex items-end justify-center md:justify-end gap-2 pb-1">
                      <button
                        onClick={() => moveStep(index, "up")}
                        disabled={index === 0}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-teal-500/50 transition-all disabled:opacity-20"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveStep(index, "down")}
                        disabled={index === path.steps.length - 1}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-teal-500/50 transition-all disabled:opacity-20"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeStep(step.id)}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-400/70 hover:text-rose-400 hover:border-rose-500/50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
