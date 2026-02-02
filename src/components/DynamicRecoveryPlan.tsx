import React, { type FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, CheckCircle2, Circle, AlertTriangle, Sparkles, HelpCircle } from "lucide-react";
import type { Ring } from "../modules/map/mapTypes";
import { analyzeWithAI } from "../utils/aiPatternAnalyzer";
import { generateAIPlan } from "../utils/aiPlanGenerator";
import { geminiClient } from "../services/geminiClient";
import { getExercisesForSymptoms } from "../data/symptomExercises";
import { getSymptomLabel } from "../data/symptoms";
import { mapCopy } from "../copy/map";
import type { DynamicRecoveryPlan as Plan, DynamicStep } from "../utils/dynamicPlanGenerator";

interface DynamicRecoveryPlanProps {
  personLabel: string;
  ring: Ring;
  situations: string[];
  selectedSymptoms?: string[];
  completedSteps: string[];
  onToggleStep: (stepId: string) => void;
  onUpdateStepInput: (stepId: string, value: string) => void;
  stepInputs: Record<string, string>;
  stepFeedback?: Record<string, "hard" | "easy" | "unrealistic">;
  onStepFeedback?: (stepId: string, value: "hard" | "easy" | "unrealistic") => void;
}

function getPlanTitle(personLabel: string, ring: Ring): string {
  if (ring === "red") return `خطة حماية طاقتك مع (${personLabel})`;
  if (ring === "yellow") return `خطة توازن علاقتك مع (${personLabel})`;
  return `خطة تعزيز علاقتك مع (${personLabel})`;
}

function buildInsightFromSymptoms(selectedSymptoms: string[], personLabel: string): string {
  if (selectedSymptoms.length === 0) return "";
  const labels = selectedSymptoms.map(getSymptomLabel).join(" و ");
  return `بناءً على مشكلة (${labels})، ركزنا في الأسبوع الأول على حماية ثقتك بنفسك والحدود بدون قسوة.`;
}

export const DynamicRecoveryPlan: FC<DynamicRecoveryPlanProps> = ({
  personLabel,
  ring,
  situations,
  selectedSymptoms = [],
  completedSteps,
  onToggleStep,
  onUpdateStepInput,
  stepInputs,
  stepFeedback = {},
  onStepFeedback
}) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const [showInsights, setShowInsights] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isAIPowered, setIsAIPowered] = useState(false);

  // Generate plan when component mounts or situations change
  useEffect(() => {
    async function generatePlan() {
      if (situations.length < 2) return;

      setIsGenerating(true);
      try {
        // Try AI-powered analysis first
        const analysis = await analyzeWithAI(situations);
        setIsAIPowered(analysis.aiGenerated || false);

        // Get symptom-specific exercises
        const symptomExercises = selectedSymptoms.length > 0 
          ? getExercisesForSymptoms(selectedSymptoms)
          : [];

        // Generate AI-powered plan with symptom exercises integrated
        const generatedPlan = await generateAIPlan(
          personLabel,
          ring,
          analysis.patterns,
          situations,
          analysis.insights,
          symptomExercises // Pass symptom exercises to be integrated
        );
        setPlan(generatedPlan);
      } catch (error) {
        console.error('Error generating plan:', error);
      } finally {
        setIsGenerating(false);
      }
    }

    generatePlan();
  }, [situations.length, personLabel, ring, selectedSymptoms.length]);

  const toggleWeek = (week: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) {
        next.delete(week);
      } else {
        next.add(week);
      }
      return next;
    });
  };

  if (isGenerating) {
    return (
      <div className="p-6 bg-purple-50 border-2 border-purple-300 rounded-xl text-center">
        <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-3 animate-pulse" />
        <p className="text-sm font-semibold text-purple-900 mb-2">
          🧠 بنحلل المواقف...
        </p>
        <p className="text-xs text-purple-800">
          {geminiClient.isAvailable() 
            ? 'الذكاء الاصطناعي بيحلل مواقفك ويصمم خطة مخصصة ليك...' 
            : 'بنحلل المواقف وبنولد خطة مخصصة ليك...'}
        </p>
      </div>
    );
  }

  if (!plan || situations.length < 2) {
    return (
      <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-xl text-right">
        <p className="text-base font-bold text-amber-900 mb-2">
          ❓ {mapCopy.planRuleTitle}
        </p>
        <p className="text-sm text-amber-800 leading-relaxed">
          {mapCopy.planRuleBody}
        </p>
        <p className="text-sm font-bold text-amber-800 mt-3">
          {mapCopy.planRuleCounter(situations.length)}
        </p>
      </div>
    );
  }

  const completedWeeks = plan.steps.filter(step => 
    step.actions.every(action => 
      !action.requiresInput || completedSteps.includes(action.id)
    )
  ).length;

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Header - عنوان ديناميكي */}
      <div className="p-5 bg-linear-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl">🚀</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-purple-900">
                {getPlanTitle(personLabel, ring)}
              </h3>
              {isAIPowered && (
                <span className="flex items-center gap-1 px-2 py-1 bg-purple-200 text-purple-900 rounded-full text-xs font-semibold">
                  <Sparkles className="w-3 h-3" />
                  AI
                </span>
              )}
            </div>
            <p className="text-sm text-purple-800">
              بناءً على المواقف اللي كتبتها، صممنا خطة تعافي مخصصة ليك على مدار {plan.totalWeeks} أسابيع
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1 bg-purple-200 text-purple-900 rounded-full font-semibold">
            {completedWeeks} / {plan.totalWeeks} أسابيع
          </span>
          {plan.primaryPattern && (
            <span className="px-3 py-1 bg-pink-200 text-pink-900 rounded-full font-semibold">
              النمط الرئيسي: {getPatternEmoji(plan.primaryPattern)} {getPatternName(plan.primaryPattern)}
            </span>
          )}
        </div>
      </div>

      {/* رؤى من التحليل - مربوطة بالـ Tags */}
      {(plan.insights.length > 0 || selectedSymptoms.length > 0) && (
        <div className="border-2 border-blue-200 rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="w-full p-4 flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <span className="font-bold text-blue-900">رؤى من التحليل</span>
            </div>
            {showInsights ? (
              <ChevronUp className="w-5 h-5 text-blue-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-blue-700" />
            )}
          </button>
          {showInsights && (
            <div className="p-4 space-y-2 text-right">
              {selectedSymptoms.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-800">
                  • {buildInsightFromSymptoms(selectedSymptoms, personLabel)}
                </div>
              )}
              {plan.insights
                .filter((i) => !/محتاجين مواقف|مواقف أكثر/i.test(i))
                .map((insight, index) => (
                  <div
                    key={index}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-800"
                  >
                    • {insight}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Weekly Steps - يوم بيوم + Why Box */}
      <div className="space-y-3">
        {plan.steps.map((step) => (
          <WeekCard
            key={step.id}
            step={step}
            personLabel={personLabel}
            selectedSymptoms={selectedSymptoms}
            isExpanded={expandedWeeks.has(step.week)}
            onToggle={() => toggleWeek(step.week)}
            completedSteps={completedSteps}
            onToggleStep={onToggleStep}
            onUpdateInput={onUpdateStepInput}
            stepInputs={stepInputs}
            stepFeedback={stepFeedback}
            onStepFeedback={onStepFeedback}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Week Card - يوم بيوم + Why Box
interface WeekCardProps {
  step: DynamicStep;
  personLabel: string;
  selectedSymptoms: string[];
  isExpanded: boolean;
  onToggle: () => void;
  completedSteps: string[];
  onToggleStep: (stepId: string) => void;
  onUpdateInput: (stepId: string, value: string) => void;
  stepInputs: Record<string, string>;
  stepFeedback: Record<string, "hard" | "easy" | "unrealistic">;
  onStepFeedback?: (stepId: string, value: "hard" | "easy" | "unrealistic") => void;
}

const WeekCard: FC<WeekCardProps> = ({
  step,
  personLabel,
  selectedSymptoms,
  isExpanded,
  onToggle,
  completedSteps,
  onToggleStep,
  onUpdateInput,
  stepInputs,
  stepFeedback,
  onStepFeedback
}) => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);

  const totalActions = step.actions.length;
  const completedCount = step.actions.filter((a) => completedSteps.includes(a.id)).length;
  const progressPct = totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0;
  const isComplete = completedCount === totalActions;

  const currentAction = step.actions[selectedDay - 1];
  const isCurrentCompleted = currentAction ? completedSteps.includes(currentAction.id) : false;

  const handleMarkDone = () => {
    if (!currentAction) return;
    if (currentAction.requiresInput && !(stepInputs[currentAction.id] || "").trim()) return;
    onToggleStep(currentAction.id);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 1800);
  };

  const whyBoxText =
    selectedSymptoms.length > 0
      ? `لأن علاقتك بـ (${personLabel}) فيها ${selectedSymptoms.map(getSymptomLabel).join(" + ")}، فالتركيز هنا على الحدود بدون قسوة.`
      : `التركيز هنا على الحدود والوعي باحتياجاتك مع (${personLabel}).`;

  return (
    <div className="border-2 border-purple-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className={`w-full p-4 flex items-center justify-between transition-colors ${
          isComplete ? "bg-green-50 hover:bg-green-100" : "bg-purple-50 hover:bg-purple-100"
        }`}
      >
        <div className="flex items-center gap-3 flex-1 text-right">
          {isComplete ? (
            <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
          ) : (
            <Circle className="w-6 h-6 text-purple-400 shrink-0" />
          )}
          <div className="flex-1">
            <h4 className="font-bold text-purple-900">
              الأسبوع {step.week}: {step.title}
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">{step.goal}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${isComplete ? "bg-green-500" : "bg-purple-500"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700">
                {completedCount}/{totalActions}
              </span>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-purple-700 shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-700 shrink-0" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-5 space-y-4 text-right border-t-2 border-purple-200">
          {/* Why Box */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
            <p className="text-xs font-semibold text-amber-900 mb-1">💡 ليه التمارين دي؟</p>
            <p className="text-sm text-amber-800">{whyBoxText}</p>
          </div>

          {step.warningMessage && (
            <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">{step.warningMessage}</p>
            </div>
          )}

          <p className="text-sm text-gray-700 leading-relaxed">{step.description}</p>

          {/* Stepper يوم بيوم */}
          <div className="flex gap-1 flex-wrap justify-center">
            {step.actions.map((_, i) => {
              const dayNum = i + 1;
              const done = completedSteps.includes(step.actions[i].id);
              const active = selectedDay === dayNum;
              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => setSelectedDay(dayNum)}
                  className={`min-w-9 py-1.5 px-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-purple-600 text-white ring-2 ring-purple-400"
                      : done
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {done ? "✓ " : ""}اليوم {dayNum}
                </button>
              );
            })}
          </div>

          {/* مهمة اليوم فقط */}
          {currentAction && (
            <div className="relative">
              <AnimatePresence mode="wait">
                {showCelebration && (
                  <motion.div
                    key="celebration"
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                  >
                    <span className="text-4xl">🎉</span>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute text-xl font-bold text-green-600"
                    >
                      تم الإنجاز!
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
              <ActionItem
                key={currentAction.id}
                action={currentAction}
                index={selectedDay - 1}
                isCompleted={isCurrentCompleted}
                onMarkDone={handleMarkDone}
                value={stepInputs[currentAction.id] || ""}
                onUpdateInput={(v) => onUpdateInput(currentAction.id, v)}
                stepFeedbackValue={stepFeedback[currentAction.id]}
                onStepFeedback={
                  onStepFeedback
                    ? (value) => onStepFeedback(currentAction.id, value)
                    : undefined
                }
              />
            </div>
          )}

          <div className="pt-4 border-t border-purple-200">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">علامة النجاح:</span> {step.successCriteria}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Action Item - مهمة اليوم + تم الإنجاز + مش حاسس ده مناسب
interface ActionItemProps {
  action: DynamicStep["actions"][0];
  index: number;
  isCompleted: boolean;
  onMarkDone: () => void;
  value: string;
  onUpdateInput: (value: string) => void;
  stepFeedbackValue?: "hard" | "easy" | "unrealistic";
  onStepFeedback?: (value: "hard" | "easy" | "unrealistic") => void;
}

const ActionItem: FC<ActionItemProps> = ({
  action,
  isCompleted,
  onMarkDone,
  value,
  onUpdateInput,
  stepFeedbackValue,
  onStepFeedback
}) => {
  const [showFeedbackOptions, setShowFeedbackOptions] = useState(false);

  const getActionIcon = (type: string) => {
    const icons: Record<string, string> = {
      reflection: "🤔",
      writing: "✍️",
      practice: "🎯",
      observation: "👀",
      challenge: "⚡"
    };
    return icons[type] || "📝";
  };

  const canMarkDone = !action.requiresInput || value.trim().length > 0;

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        isCompleted ? "bg-green-50 border-green-300" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">{getActionIcon(action.type)}</span>
        <div className="flex-1">
          <p
            className={`text-sm font-medium ${
              isCompleted ? "text-green-800 line-through" : "text-gray-900"
            }`}
          >
            {action.text}
          </p>
          {action.helpText && (
            <p className="text-xs text-gray-600 mt-1">💡 {action.helpText}</p>
          )}

          {action.requiresInput && (
            <textarea
              value={value}
              onChange={(e) => onUpdateInput(e.target.value)}
              placeholder={action.placeholder}
              rows={3}
              className="w-full mt-2 border-2 border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          )}

          {/* زر تم الإنجاز */}
          {!isCompleted && (
            <button
              type="button"
              onClick={onMarkDone}
              disabled={!canMarkDone}
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              تم الإنجاز ✅
            </button>
          )}
          {isCompleted && (
            <p className="mt-2 text-sm text-green-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              تم إنجاز المهمة
            </p>
          )}

          {/* مش حاسس التمرين ده مناسب */}
          {onStepFeedback && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowFeedbackOptions(!showFeedbackOptions)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                مش حاسس التمرين ده مناسب؟
              </button>
              {showFeedbackOptions && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      { value: "hard" as const, label: "قاسي" },
                      { value: "easy" as const, label: "سهل" },
                      { value: "unrealistic" as const, label: "مش واقعي" }
                    ] as const
                  ).map(({ value: v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        onStepFeedback(v);
                        setShowFeedbackOptions(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        stepFeedbackValue === v
                          ? "bg-purple-100 text-purple-800 border border-purple-300"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {stepFeedbackValue && (
                <p className="mt-1 text-xs text-purple-600">
                  تم تسجيل ملاحظتك — هنراعيها في التمارين الجاية
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getPatternEmoji(pattern: string): string {
  const emojis: Record<string, string> = {
    timing: "🕐",
    financial: "💰",
    emotional: "💔",
    behavioral: "🎭",
    boundary: "🚫"
  };
  return emojis[pattern] || "📊";
}

function getPatternName(pattern: string): string {
  const names: Record<string, string> = {
    timing: "انتهاك الحدود الزمنية",
    financial: "الضغط المالي",
    emotional: "الذنب المفتعل",
    behavioral: "السلوك المتكرر",
    boundary: "تجاهل الحدود"
  };
  return names[pattern] || pattern;
}
