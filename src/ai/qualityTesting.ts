/**
 * QUALITY_TESTING.ts — نظام اختبار جودة المحتوى المُولّد
 * ===========================================================
 * يختبر الأسئلة والمحتوى المُولّد من الـ AI ويقيّمها على أساس:
 * - Voice Alignment (صوت محمد)
 * - Depth (العمق النفسي)
 * - Alignment with Principles (التوافق مع المبادئ)
 * - Uniqueness (الأصالة)
 */

import {
  isAlignedWithPrinciples,
  calculateVoiceAlignment,
  QUALITY_THRESHOLDS,
  DAWAYIR_DNA,
} from "./CORE_PRINCIPLES";
import { DAILY_QUESTIONS } from "../data/dailyQuestions";
import type { DailyQuestion } from "../data/dailyQuestions";

// ═══════════════════════════════════════════════════════════════════════════
// 📊 نتيجة التقييم
// ═══════════════════════════════════════════════════════════════════════════

export interface QualityTestResult {
  /** الـ Pass/Fail */
  passed: boolean;
  /** النتيجة الإجمالية (0-100) */
  overallScore: number;
  /** تفاصيل التقييم */
  details: {
    voiceAlignment: { score: number; passed: boolean };
    principlesAlignment: { passed: boolean; violations: string[] };
    depth: { score: number; passed: boolean };
    uniqueness: { score: number; passed: boolean };
    length: { passed: boolean; wordCount: number };
  };
  /** ملاحظات للتحسين */
  suggestions: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 Quality Tester Class
// ═══════════════════════════════════════════════════════════════════════════

export class QualityTester {
  /**
   * ─────────────────────────────────────────────────────────────────
   * اختبار سؤال يومي
   * ─────────────────────────────────────────────────────────────────
   */
  async testDailyQuestion(question: DailyQuestion): Promise<QualityTestResult> {
    const suggestions: string[] = [];

    // 1. Voice Alignment
    const voiceScore = calculateVoiceAlignment(question.text);
    const voicePassed = voiceScore >= QUALITY_THRESHOLDS.minVoiceScore;
    if (!voicePassed) {
      suggestions.push(
        `الصوت مش متطابق كفاية (${voiceScore}/10). استخدم المفردات: ${DAWAYIR_DNA.aiRules.useMetaphors.join(", ")}`
      );
    }

    // 2. Principles Alignment
    const principlesCheck = isAlignedWithPrinciples(question.text);
    if (!principlesCheck.aligned) {
      principlesCheck.violations.forEach((v) => {
        suggestions.push(`مخالفة للمبادئ: ${v}`);
      });
    }

    // 3. Depth Score
    const depthScore = this.calculateDepthScore(question.text);
    const depthPassed = depthScore >= QUALITY_THRESHOLDS.minDepthScore;
    if (!depthPassed) {
      suggestions.push(
        `العمق النفسي قليل (${depthScore}/10). حاول تخلي السؤال أعمق.`
      );
    }

    // 4. Uniqueness (مقارنة بالـ 30 سؤال الأصلية)
    const uniquenessScore = this.calculateUniqueness(question.text);
    const uniquenessPassed = uniquenessScore >= (1 - QUALITY_THRESHOLDS.maxSimilarity);
    if (!uniquenessPassed) {
      suggestions.push(
        `السؤال شبيه جداً بسؤال موجود (${Math.round((1 - uniquenessScore) * 100)}% similarity). حاول تخليه أكتر أصالة.`
      );
    }

    // 5. Length
    const words = question.text.split(" ").length;
    const { min, max } = QUALITY_THRESHOLDS.questionWordLimit;
    const lengthPassed = words >= min && words <= max;
    if (!lengthPassed) {
      if (words < min) suggestions.push(`السؤال قصير جداً (${words} كلمة، المطلوب ≥ ${min})`);
      if (words > max) suggestions.push(`السؤال طويل جداً (${words} كلمة، المطلوب ≤ ${max})`);
    }

    // Overall Score
    const overallScore = Math.round(
      (voiceScore / 10) * 30 + // 30%
        (depthScore / 10) * 30 + // 30%
        (principlesCheck.aligned ? 20 : 0) + // 20%
        uniquenessScore * 10 + // 10%
        (lengthPassed ? 10 : 0) // 10%
    );

    const passed =
      voicePassed &&
      principlesCheck.aligned &&
      depthPassed &&
      uniquenessPassed &&
      lengthPassed;

    return {
      passed,
      overallScore,
      details: {
        voiceAlignment: { score: voiceScore, passed: voicePassed },
        principlesAlignment: {
          passed: principlesCheck.aligned,
          violations: principlesCheck.violations,
        },
        depth: { score: depthScore, passed: depthPassed },
        uniqueness: { score: uniquenessScore, passed: uniquenessPassed },
        length: { passed: lengthPassed, wordCount: words },
      },
      suggestions,
    };
  }

  /**
   * حساب العمق النفسي (Depth Score)
   */
  private calculateDepthScore(text: string): number {
    let score = 5; // البداية من النص

    // +1 لو فيه سؤال عن المشاعر
    const emotionalWords = ["حاسس", "شاعر", "حسيت", "إحساس", "شعور"];
    if (emotionalWords.some((w) => text.includes(w))) {
      score += 1;
    }

    // +1 لو فيه استكشاف للدوافع ("ليه"، "إيه السبب")
    if (text.includes("ليه") || text.includes("السبب") || text.includes("إزاي")) {
      score += 1;
    }

    // +1 لو فيه metaphor (استعارة)
    const metaphors = ["رحلة", "محطة", "دائرة", "خريطة", "مساحة", "حدود"];
    if (metaphors.some((m) => text.includes(m))) {
      score += 1;
    }

    // +1 لو فيه تأمل ذاتي ("لو شايف نفسك"، "لو تقدر")
    if (text.includes("لو") && (text.includes("شايف") || text.includes("تقدر"))) {
      score += 1;
    }

    // +1 لو مفيش كلمات سطحية
    const shallowWords = ["سعيد", "حزين", "ممتاز", "سيئ"];
    if (!shallowWords.some((w) => text.includes(w))) {
      score += 1;
    }

    return Math.max(0, Math.min(score, 10));
  }

  /**
   * حساب الأصالة (Uniqueness)
   */
  private calculateUniqueness(text: string): number {
    // حساب Jaccard Similarity مع كل سؤال من الـ 30
    const similarities = DAILY_QUESTIONS.map((q) =>
      this.jaccardSimilarity(text, q.text)
    );

    // أعلى similarity (أقرب سؤال)
    const maxSimilarity = Math.max(...similarities);

    // نرجع 1 - similarity (كل ما كان أقل تشابه، كل ما كان أكتر أصالة)
    return 1 - maxSimilarity;
  }

  /**
   * Jaccard Similarity بين نصين
   */
  private jaccardSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(" "));
    const words2 = new Set(text2.toLowerCase().split(" "));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * Batch Testing — اختبار عدة أسئلة مرة واحدة
   * ─────────────────────────────────────────────────────────────────
   */
  async batchTest(questions: DailyQuestion[]): Promise<{
    results: QualityTestResult[];
    summary: {
      totalTested: number;
      passed: number;
      failed: number;
      averageScore: number;
    };
  }> {
    const results: QualityTestResult[] = [];

    for (const q of questions) {
      const result = await this.testDailyQuestion(q);
      results.push(result);
    }

    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;
    const averageScore =
      results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;

    return {
      results,
      summary: {
        totalTested: results.length,
        passed,
        failed,
        averageScore: Math.round(averageScore),
      },
    };
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * Generate Report — توليد تقرير مفصّل
   * ─────────────────────────────────────────────────────────────────
   */
  generateReport(results: QualityTestResult[]): string {
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;
    const avgScore = results.reduce((s, r) => s + r.overallScore, 0) / results.length;

    let report = `
# تقرير جودة المحتوى المُولّد
═══════════════════════════════════════

## الملخص
- إجمالي الأسئلة: ${results.length}
- نجح: ${passed} (${Math.round((passed / results.length) * 100)}%)
- فشل: ${failed} (${Math.round((failed / results.length) * 100)}%)
- المتوسط: ${Math.round(avgScore)}/100

## التفاصيل
`;

    results.forEach((r, i) => {
      const status = r.passed ? "✅ نجح" : "❌ فشل";
      report += `\n### السؤال ${i + 1} — ${status} (${r.overallScore}/100)\n`;
      report += `- Voice Alignment: ${r.details.voiceAlignment.score}/10 ${r.details.voiceAlignment.passed ? "✅" : "❌"}\n`;
      report += `- Depth: ${r.details.depth.score}/10 ${r.details.depth.passed ? "✅" : "❌"}\n`;
      report += `- Principles: ${r.details.principlesAlignment.passed ? "✅" : "❌"}\n`;
      report += `- Uniqueness: ${Math.round(r.details.uniqueness.score * 100)}% ${r.details.uniqueness.passed ? "✅" : "❌"}\n`;
      report += `- Length: ${r.details.length.wordCount} كلمة ${r.details.length.passed ? "✅" : "❌"}\n`;

      if (r.suggestions.length > 0) {
        report += `\n**ملاحظات للتحسين:**\n`;
        r.suggestions.forEach((s) => {
          report += `- ${s}\n`;
        });
      }
    });

    return report;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 Singleton Instance
// ═══════════════════════════════════════════════════════════════════════════

export const qualityTester = new QualityTester();

/**
 * دالة مساعدة: اختبار سؤال سريع
 */
export async function quickTest(questionText: string): Promise<QualityTestResult> {
  const question: DailyQuestion = {
    id: Date.now(),
    week: 1,
    theme: "test",
    text: questionText,
  };
  return qualityTester.testDailyQuestion(question);
}

/**
 * مثال استخدام
 */
export async function exampleBatchTest(): Promise<void> {
  // توليد 10 أسئلة من الـ AI
  const generatedQuestions: DailyQuestion[] = [
    {
      id: 1,
      week: 1,
      theme: "الوعي بالذات",
      text: "النهاردة.. إيه اللي خلاك تحس إنك موجود فعلاً؟",
    },
    {
      id: 2,
      week: 2,
      theme: "دواير القرب",
      text: "مين الشخص اللي لما تسمعه، قلبك بيهدى؟",
    },
    // ... المزيد
  ];

  const { results, summary } = await qualityTester.batchTest(generatedQuestions);

  console.warn("📊 نتيجة الاختبار:");
  console.warn(`- نجح: ${summary.passed}/${summary.totalTested}`);
  console.warn(`- المتوسط: ${summary.averageScore}/100`);

  // طباعة التقرير الكامل
  const report = qualityTester.generateReport(results);
  console.warn(report);
}

