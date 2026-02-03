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

**النمط الرئيسي:** ${primaryPattern.type} (${primaryPattern.severity})

**المواقف الحقيقية:**
• ${allSituations}

**الرؤى من التحليل:**
${analysisInsights.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}
${traumaInheritanceBlock}

**المهمة:**
صمم خطة تعافي مخصصة لمدة 4 أسابيع، بناءً على:
1. النمط الرئيسي والأنماط الفرعية
2. المواقف الحقيقية اللي كتبها المستخدم
3. جمل وعبارات من مواقفه الفعلية

**المطلوب (JSON فقط):**
\`\`\`json
{
  "totalWeeks": 4,
  "primaryPattern": "${primaryPattern.type}",
  "weeks": [
    {
      "week": 1,
      "title": "عنوان الأسبوع (مثل: فهم السلاح)",
      "goal": "الهدف الأساسي للأسبوع",
      "description": "وصف تفصيلي لما هنعمله",
      "actions": [
        {
          "id": "w1-action-1",
          "type": "reflection",
          "text": "خطوة محددة وقابلة للتنفيذ",
          "helpText": "نصيحة إضافية (اختياري)",
          "requiresInput": false
        },
        {
          "id": "w1-action-2",
          "type": "writing",
          "text": "اكتب 3 مواقف إضافية...",
          "requiresInput": true,
          "placeholder": "مثال: لما اتصل بيا الساعة 12..."
        }
      ],
      "successCriteria": "إزاي أعرف إني نجحت؟",
      "warningMessage": "تحذير مهم (اختياري)"
    }
  ],
  "insights": [
    "رؤية عميقة عن الخطة",
    "نصيحة شاملة"
  ]
}
\`\`\`

**إرشادات مهمة:**
1. **استخدم العامية المصرية** في كل حاجة
2. **اقتبس من مواقفه الفعلية** في الأمثلة والجمل
3. **كل أسبوع يبني على اللي قبله**:
   - الأسبوع 1: فهم النمط
   - الأسبوع 2: بناء الحماية
   - الأسبوع 3: التطبيق الآمن
   - الأسبوع 4: التوسع والتعميم
4. **الخطوات تكون محددة وقابلة للتنفيذ**، مش نظرية
5. **استخدم جمل من مواقفه** في الأمثلة
6. **كل أسبوع 3-5 خطوات فقط**، متكترش
7. **action types**:
   - reflection: تأمل وفهم
   - writing: كتابة وتوثيق
   - practice: تدريب عملي
   - observation: ملاحظة ورصد
   - challenge: تحدي تدريجي`;

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
      totalWeeks: result.totalWeeks,
      primaryPattern: result.primaryPattern,
      steps,
      insights: result.insights,
      generatedAt: Date.now(),
      aiGenerated: true
    };

  } catch (error) {
    console.error('Error in AI plan generation:', error);
    // Fallback to template-based generation
    const { generateDynamicPlan } = await import('./dynamicPlanGenerator');
    return generateDynamicPlan(personLabel, ring, patterns, analysisInsights, [], focusTraumaInheritance);
  }
}
