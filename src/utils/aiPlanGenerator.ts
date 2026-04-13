import { logger } from "@/services/logger";
import { geminiClient } from "@/services/geminiClient";
import type { Ring } from "@/modules/map/mapTypes";
import type { DetectedPattern, PatternType } from "@alrehla/masarat";
import type { DynamicRecoveryPlan, DynamicStep } from "./dynamicPlanGenerator";
import type { SymptomExercise } from "@/data/symptomExercises";

/**
 * AI-Powered Dynamic Plan Generator using Gemini
 * Creates highly personalized recovery plans based on detected patterns
 */

interface AIPlanResponse {
  totalWeeks: number;
  primaryPattern: PatternType;
  weeks: Array<{
    week: number;
    title: string;
    goal: string;
    description: string;
    actions: Array<{
      id: string;
      type: "reflection" | "writing" | "practice" | "observation" | "challenge";
      text: string;
      helpText?: string;
      requiresInput?: boolean;
      placeholder?: string;
    }>;
    successCriteria: string;
    warningMessage?: string;
  }>;
  insights: string[];
}

export async function generateAIPlan(
  personLabel: string,
  ring: Ring,
  patterns: DetectedPattern[],
  situations: string[],
  analysisInsights: string[],
  symptomExercises: SymptomExercise[] = [],
  focusTraumaInheritance?: boolean
): Promise<DynamicRecoveryPlan> {
  // Fallback to template-based generation if AI is not available
  if (!geminiClient.isAvailable()) {
    console.warn('AI not available, using template-based plan generation');
    const { generateDynamicPlan } = await import('./dynamicPlanGenerator');
    return generateDynamicPlan(personLabel, ring, patterns, analysisInsights, symptomExercises, focusTraumaInheritance);
  }

  const { buildAIPlanPrompt } = await import('@alrehla/masarat');
  const prompt = buildAIPlanPrompt(
    personLabel,
    ring,
    patterns,
    situations,
    analysisInsights,
    symptomExercises,
    focusTraumaInheritance
  );

  const primaryPattern = patterns[0];

  try {
    const result = await geminiClient.generateJSON<AIPlanResponse>(prompt);

    if (!result || !result.weeks) {
      console.warn('AI returned invalid plan, using template fallback');
      const { generateDynamicPlan } = await import('./dynamicPlanGenerator');
      return generateDynamicPlan(personLabel, ring, patterns, analysisInsights, [], focusTraumaInheritance);
    }

    // Convert AI response to our format
    const steps: DynamicStep[] = result.weeks.map(week => ({
      id: `week-${week.week}`,
      week: week.week,
      title: week.title,
      goal: week.goal,
      targetPattern: primaryPattern?.type || 'emotional',
      description: week.description,
      actions: week.actions.map(action => ({
        id: action.id,
        type: action.type,
        text: action.text,
        helpText: action.helpText,
        requiresInput: action.requiresInput || false,
        placeholder: action.placeholder
      })),
      completed: false,
      successCriteria: week.successCriteria,
      warningMessage: week.warningMessage
    }));

    return {
      personLabel,
      ring,
      totalWeeks: result.totalWeeks,
      primaryPattern: result.primaryPattern,
      steps,
      insights: result.insights,
      generated: Date.now(),
      aiGenerated: true
    };

  } catch (error) {
    logger.error('Error in AI plan generation:', error);
    // Fallback to template-based generation
    const { generateDynamicPlan } = await import('./dynamicPlanGenerator');
    return generateDynamicPlan(personLabel, ring, patterns, analysisInsights, [], focusTraumaInheritance);
  }
}
