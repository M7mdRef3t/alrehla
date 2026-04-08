import { logger } from "@/services/logger";
import { geminiClient } from "@/services/geminiClient";
import type { Ring } from "@/modules/map/mapTypes";
import type { DetectedPattern, PatternType } from "./patternAnalyzer";
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
صمم خطة تعافي مخصصة لمدة 4 أسابيع، تعتمد **بشكل حاسم** على الأعراض المكتشفة وتجعلها محور التركيز لكل أسبوع.
1. **الأولوية القصوى للأعراض**: كل عرض اختاره المستخدم يجب أن يتحول لتمرين عملي (CBT) في أحد الأسابيع.
2. استخدم النمط والمواقف الحقيقية كأمثلة تطبيقية داخل تمارين الأعراض.
3. اجعل اللغة هي "العامية المصرية المعاصرة" (مثل: "بتحس بإيه؟"، "قول لنفسك كذا"، "مش أنانية إنك تختار نفسك").
4. ** action types**: reflection, writing, practice, observation, challenge.

**المطلوب (JSON فقط):**
[BEGIN JSON]
{
  "totalWeeks": 4,
  "primaryPattern": "${primaryPattern?.type || 'emotional'}",
  "weeks": [
    {
      "week": 1,
      "title": "عنوان الأسبوع (يجب أن يعكس العرض الأكثر إيلاماً)",
      "goal": "الهدف الأساسي المرتبط بتجاوز العرض",
      "description": "شرح إيه اللي هنعمله وليه ده مفيد لمواجهة (العرض)",
      "actions": [
        {
          "id": "w1-action-1",
          "type": "reflection",
          "text": "خطوة عملية محددة جداً",
          "helpText": "نصيحة لتسهيل الخطوة",
          "requiresInput": false,
          "placeholder": "مثال للإدخال لو مطلوب"
        }
      ],
      "successCriteria": "إزاي نعرف إن الأسبوع ده نجح؟"
    }
  ],
  "insights": [
    "بصيرة عميقة مبنية على ربط الأعراض بالنمط"
  ]
}
[END JSON]

**إرشادات هامة:**
1. **Decisive Symptoms**: إذا كان أهم عرض هو (الذنب)، فالأسبوع الأول لازم يكون "تحدي الذنب المفتعل". إذا كان (إرهاق)، فالأسبوع الأول "حماية الطاقة".
2. **كلام حقيقي**: استخدم الجمل اللي اتقالت في المواقف عشان تخلّي التمارين "تلمس" المستخدم.
3. **لا تكرار**: التمارين لازم تكون متدرجة (من الوعي -> الحماية -> الممارسة).
4. **توارث الصدمات**: لو تم طلب التركيز عليه، اربط الأعراض باللي المستخدم شافه في عيلته.`;

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
