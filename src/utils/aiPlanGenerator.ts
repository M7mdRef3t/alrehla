import { geminiClient } from "../services/geminiClient";
import type { Ring } from "../modules/map/mapTypes";
import type { DetectedPattern, PatternType } from "./patternAnalyzer";
import type { DynamicRecoveryPlan, DynamicStep } from "./dynamicPlanGenerator";
import type { SymptomExercise } from "../data/symptomExercises";

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

  const primaryPattern = patterns[0];
  const allSituations = situations.join('\n• ');
  const allPatterns = patterns.map(p => `- ${p.type} (${p.severity}): ${p.description}`).join('\n');
  const allSymptoms = symptomExercises.map(s => `- ${s.title}: ${s.description}`).join('\n');

  const traumaInheritanceBlock = focusTraumaInheritance
    ? `

**تركيز إلزامي — توارث الصدمات:**
المستخدم طلب التركيز على توارث الصدمات (نمط استنزاف متوارث في العيلة). الخطة لازم:
- تذكر صراحة فكرة توريث الأنماط أو الصدمات عبر الأجيال
- تدمج خطوات لفهم مصدر النمط (منين جاي؟ ليه بيتكرر؟)
- تقدم تمارين لتمييز اللي هو منك عن اللي متوارث من العلاقة العائلية
- تكون لغة الخطة داعمة بدون لوم، مع التركيز على الوعي والحدود`
    : '';

  const prompt = `أنت متخصص في التعافي النفسي وبناء الحدود الصحية.

**السياق:**
- الشخص: ${personLabel}
- الدائرة الحالية: ${ring === 'red' ? 'استنزاف (حمراء)' : ring === 'yellow' ? 'قلق (صفراء)' : 'أمان (خضراء)'}

**الأنماط المكتشفة:**
${allPatterns}

**الأعراض المكتشفة (حاسمة!):**
${allSymptoms || '(لا توجد أعراض محددة)'}

**النمط الرئيسي:** ${primaryPattern?.type || 'علاقة مستنزفة'} (${primaryPattern?.severity || '8'})

**المواقف الحقيقية:**
• ${allSituations}

**الرؤى من التحليل:**
${analysisInsights.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}
${traumaInheritanceBlock}

**المهمة:**
صمم خطة تعافي مخصصة لمدة 4 أسابيع.
يجب أن تركز الخطة بشكل أساسي على **الأعراض المكتشفة** وتقدم تمارين عملية لها.
1. استخدم النمط والمواقف الحقيقية كأمثلة.
2. اجعل التمارين مشابهة لتمارين العلاج السلوكي المعرفي (CBT).
3. استخدم لغة داعمة وقوية.

**المطلوب (JSON فقط):**
\`\`\`json
{
  "totalWeeks": 4,
  "primaryPattern": "${primaryPattern?.type || 'emotional'}",
  "weeks": [
    {
      "week": 1,
      "title": "عنوان الأسبوع (مرتبط بمواجهة الأعراض)",
      "goal": "الهدف الأساسي للأسبوع",
      "description": "وصف تفصيلي",
      "actions": [
        {
          "id": "w1-action-1",
          "type": "reflection",
          "text": "خطوة محددة",
          "helpText": "نصيحة",
          "requiresInput": false
        }
      ],
      "successCriteria": "معيار النجاح"
    }
  ],
  "insights": [
    "بصيرة مخصصة"
  ]
}
\`\`\`

**إرشادات مهمة:**
1. **استخدم العامية المصرية**
2. **اقتبس من مواقفه الفعلية**
3. **ركز على الأعراض**: إذا كان هناك (تعب جسدي)، ضع تمارين لحماية الطاقة، وإذا كان (ذنب)، ضع تمارين للتحرر من الذنب.
4. ** action types**: reflection, writing, practice, observation, challenge.`;

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
      targetPattern: primaryPattern.type,
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
    console.error('Error in AI plan generation:', error);
    // Fallback to template-based generation
    const { generateDynamicPlan } = await import('./dynamicPlanGenerator');
    return generateDynamicPlan(personLabel, ring, patterns, analysisInsights, [], focusTraumaInheritance);
  }
}
