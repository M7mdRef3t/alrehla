import { logger } from "../services/logger";
import { geminiClient } from "../services/geminiClient";
import type { PatternType, DetectedPattern, PatternAnalysisResult } from "./patternAnalyzer";

/**
 * AI-Powered Pattern Analyzer using Gemini
 * Replaces regex-based detection with intelligent NLP
 */

interface AIPatternResponse {
  patterns: Array<{
    type: PatternType;
    severity: "low" | "medium" | "high" | "critical";
    confidence: number;
    description: string;
    examples: string[];
    triggers: string[];
  }>;
  emotionalState: string;
  insights: string[];
}

export async function analyzeWithAI(situations: string[]): Promise<PatternAnalysisResult> {
  // Fallback to regex-based analysis if AI is not available
  if (!geminiClient.isAvailable()) {
    console.warn('AI not available, using fallback pattern detection');
    const { analyzeSituations } = await import('./patternAnalyzer');
    return analyzeSituations(situations);
  }

  const allText = situations.join('\n---\n');

  const prompt = `أنت متخصص في تحليل العلاقات النفسية والسلوكية.

**المهمة:**
حلل المواقف التالية واستخرج الأنماط السلوكية الضارة:

**المواقف:**
${allText}

**الأنماط المحتملة:**
1. **timing**: انتهاك الحدود الزمنية (اتصالات في أوقات غير مناسبة، طلبات في أوقات حرجة)
2. **financial**: طلبات مالية متكررة، ضغط مالي، استغلال مادي
3. **emotional**: استخدام الذنب كسلاح، إثارة المشاعر للتحكم، التلاعب العاطفي
4. **behavioral**: سلوكيات متكررة ضاغطة، أنماط سامة، تصرفات استنزافية
5. **boundary**: تجاهل الحدود الشخصية، عدم احترام المساحة، انتهاك الخصوصية

**المطلوب (JSON فقط):**
\`\`\`json
{
  "patterns": [
    {
      "type": "النوع من القائمة أعلاه",
      "severity": "low | medium | high | critical",
      "confidence": 0.95,
      "description": "وصف دقيق للنمط بالعامية المصرية",
      "examples": ["مثال 1 من المواقف", "مثال 2"],
      "triggers": ["محفز 1", "محفز 2"]
    }
  ],
  "emotionalState": "الحالة العاطفية للشخص (مثل: ضغط، استنزاف، ذنب)",
  "insights": [
    "رؤية 1: ملاحظة عميقة عن العلاقة",
    "رؤية 2: نمط مخفي أو ربط بين المواقف"
  ]
}
\`\`\`

**ملاحظات:**
- ركز على الأنماط الواضحة فقط (confidence > 0.7)
- رتب الأنماط حسب الخطورة (critical أولاً)
- استخدم لغة عامية مصرية بسيطة وواضحة
- كن محدداً في الأمثلة والمحفزات`;

  try {
    const result = await geminiClient.generateJSON<AIPatternResponse>(prompt);

    if (!result || !result.patterns) {
      console.warn('AI returned invalid response, using fallback');
      const { analyzeSituations } = await import('./patternAnalyzer');
      return analyzeSituations(situations);
    }

    // Convert AI response to our format
    const patterns: DetectedPattern[] = result.patterns
      .filter(p => p.confidence >= 0.7)
      .map(p => ({
        type: p.type,
        pattern: p.description,
        frequency: p.examples.length,
        severity: p.severity,
        examples: p.examples,
        description: p.description,
        triggers: p.triggers
      }))
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

    const primaryPattern = patterns.length > 0 ? patterns[0] : null;

    return {
      patterns,
      primaryPattern,
      insights: result.insights,
      emotionalState: result.emotionalState,
      aiGenerated: true
    };

  } catch (error) {
    logger.error('Error in AI pattern analysis:', error);
    // Fallback to regex-based analysis
    const { analyzeSituations } = await import('./patternAnalyzer');
    return analyzeSituations(situations);
  }
}

/**
 * Quick AI feedback on single input (for real-time typing)
 */
export async function quickAIFeedback(text: string): Promise<{
  type: 'good' | 'needs-detail' | 'warning';
  title: string;
  feedback: string;
} | null> {
  if (!geminiClient.isAvailable()) {
    const { quickAnalyze } = await import('./patternAnalyzer');
    const result = quickAnalyze(text);
    return {
      type: result.hasPattern ? 'good' : 'needs-detail',
      title: result.hasPattern ? 'كويس!' : 'محتاج تفاصيل',
      feedback: result.feedback
    };
  }

  const prompt = `قيّم هذا الموقف المكتوب بسرعة:

"${text}"

**المطلوب (JSON فقط):**
\`\`\`json
{
  "type": "good | needs-detail | warning",
  "title": "عنوان قصير (3-5 كلمات)",
  "feedback": "ملاحظة سريعة ومفيدة"
}
\`\`\`

**معايير التقييم:**
- "good": الموقف واضح، محدد، فيه تفاصيل (متى، إيه اللي حصل، الإحساس)
- "needs-detail": الموقف عام أو ناقص تفاصيل
- "warning": الموقف مبهم جداً أو غير مفهوم

استخدم العامية المصرية.`;

  try {
    const result = await geminiClient.generateJSON<{
      type: 'good' | 'needs-detail' | 'warning';
      title: string;
      feedback: string;
    }>(prompt);

    return result;
  } catch (error) {
    logger.error('Error in quick AI feedback:', error);
    return null;
  }
}
