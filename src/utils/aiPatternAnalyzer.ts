import { logger } from "@/services/logger";
import { geminiClient } from "@/services/geminiClient";
import { 
  type PatternType, 
  type DetectedPattern, 
  type PatternAnalysisResult,
  analyzeSituations,
  quickAnalyze,
  buildPatternAnalysisPrompt,
  buildQuickFeedbackPrompt
} from "@alrehla/masarat";

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
    return analyzeSituations(situations);
  }

  const allText = situations.join('\n---\n');
  const prompt = buildPatternAnalysisPrompt(allText);

  try {
    const result = await geminiClient.generateJSON<AIPatternResponse>(prompt);

    if (!result || !result.patterns) {
      console.warn('AI returned invalid response, using fallback');
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
    const result = quickAnalyze(text);
    return {
      type: result.hasPattern ? 'good' : 'needs-detail',
      title: result.hasPattern ? 'كويس!' : 'محتاج تفاصيل',
      feedback: result.feedback
    };
  }

  const prompt = buildQuickFeedbackPrompt(text);

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
