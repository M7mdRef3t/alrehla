/**
 * AI_CURATOR.ts — محرك توليد المحتوى الذكي
 * ===========================================
 * يستخدم Gemini + CORE_PRINCIPLES لتوليد:
 * - أسئلة يومية جديدة (inspired by الـ 30 سؤال الأصلية)
 * - Content Packets (greetings + missions)
 * - Recovery Scripts (do/don't say)
 * - PersonViewInsights (تشخيص + أعراض + حل + خطة)
 *
 * القاعدة الذهبية: "لو محمد كتب ده، هيكتبه إزاي؟"
 */

import { geminiClient } from "../services/geminiClient";
import {
  DAWAYIR_DNA,
  isAlignedWithPrinciples,
  calculateVoiceAlignment,
  QUALITY_THRESHOLDS,
} from "./CORE_PRINCIPLES";
import { decisionEngine } from "./decision-framework";
import type { DailyQuestion } from "../data/dailyQuestions";
import type { ContentPacket } from "../services/contentEngine";
import type { MapNode } from "../modules/map/mapTypes";

// ═══════════════════════════════════════════════════════════════════════════
// 🧬 User Context — سياق المستخدم
// ═══════════════════════════════════════════════════════════════════════════

export interface UserContext {
  /** إجمالي الأشخاص في الخريطة */
  totalNodes: number;
  /** عدد الدوائر الحمراء */
  redCircles: number;
  /** عدد الدوائر الصفراء */
  yellowCircles: number;
  /** عدد الدوائر الخضراء */
  greenCircles: number;
  /** Trauma Entropy Index (0-100) */
  teiScore: number;
  /** آخر 3 أسئلة أجاب عليها */
  recentAnswers: Array<{ question: string; answer: string }>;
  /** Shadow Pulse — أكتر شخص بيفتكر فيه */
  topShadowPerson?: { label: string; score: number };
  /** عدد أيام الرحلة */
  journeyDays: number;
  /** هل أكمل Training؟ */
  hasCompletedTraining: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 AI Curator Class
// ═══════════════════════════════════════════════════════════════════════════

export class AICurator {
  /**
   * ─────────────────────────────────────────────────────────────────
   * 1. توليد سؤال يومي جديد
   * ─────────────────────────────────────────────────────────────────
   */
  async generateDailyQuestion(
    context: UserContext
  ): Promise<DailyQuestion | null> {
    // بناء الـ Prompt
    const prompt = this.buildQuestionPrompt(context);

    // طلب من Gemini
    const response = await geminiClient.generateJSON<{
      week: 1 | 2 | 3 | 4;
      theme: string;
      text: string;
    }>(prompt);

    if (!response) return null;

    // التحقق من الجودة
    const qualityCheck = this.validateQuestion(response.text);
    if (!qualityCheck.passed) {
      console.warn("❌ Generated question failed quality check:", qualityCheck.reason);
      return null;
    }

    // إنشاء الـ Decision
    const decision = {
      type: "generate_daily_question" as const,
      reasoning: `Generated for user with TEI=${context.teiScore}, ${context.journeyDays} days`,
      payload: response,
    };

    const canExecute = await decisionEngine.evaluate(decision);
    if (!canExecute.allowed) {
      console.warn("⏸️ Question generation requires approval");
      return null;
    }

    // إرجاع السؤال
    return {
      id: Date.now(), // ID مؤقت — لازم يتحفظ في الـ backend
      week: response.week,
      theme: response.theme,
      text: response.text,
    };
  }

  /**
   * بناء Prompt لتوليد سؤال يومي
   */
  private buildQuestionPrompt(context: UserContext): string {
    const { therapeutic, voice, examples } = DAWAYIR_DNA;

    return `
أنت محمد رفعت، معالج نفسي ولايف كوتش.
مهمتك: كتابة **سؤال يومي واحد** للمستخدم، على طريقتك الخاصة.

# 🧬 المبادئ الأساسية
- ${therapeutic.priority}: الوعي قبل الحل
- ${therapeutic.painPhilosophy}: الألم بوابة للنمو
- ${therapeutic.answerModel}: لا توجد إجابات صح

# 🗣️ الأسلوب
- اللغة: ${voice.language} (العامية المصرية)
- النبرة: ${voice.tone} (صديق حكيم، مش معالج رسمي)
- الطول: ${voice.brevity} (1-2 جملة max)
- الأسئلة: ${voice.questionStyle} (مفتوحة، تخلي المستخدم يفكر)

# 📚 أمثلة من أسلوبك
${examples.dailyQuestions.slice(0, 5).join("\n")}

# 📊 سياق المستخدم
- رحلته: ${context.journeyDays} يوم
- TEI Score: ${context.teiScore}/100 (${context.teiScore > 65 ? "فوضى" : context.teiScore > 40 ? "توتر" : "وضوح"})
- الدوائر: ${context.redCircles} حمراء، ${context.yellowCircles} صفراء، ${context.greenCircles} خضراء
${context.topShadowPerson ? `- أكتر شخص بيفكر فيه: "${context.topShadowPerson.label}" (Shadow: ${context.topShadowPerson.score})` : ""}

# 📝 المطلوب
اكتب سؤال **واحد** بس، متوافق مع الأسلوب والمبادئ.
الأسبوع والمحور يكونوا مناسبين لحالة المستخدم:
- لو TEI عالي → أسبوع 1 أو 3 (وعي بالذات / حدود)
- لو TEI منخفض → أسبوع 2 أو 4 (دواير القرب / مستقبل)

أرجع JSON:
{
  "week": 1-4,
  "theme": "اسم المحور",
  "text": "السؤال بالعامية المصرية"
}
`;
  }

  /**
   * التحقق من جودة السؤال المُولّد
   */
  private validateQuestion(text: string): { passed: boolean; reason?: string } {
    // Check 1: Alignment with Principles
    const principlesCheck = isAlignedWithPrinciples(text);
    if (!principlesCheck.aligned) {
      return {
        passed: false,
        reason: `Violates principles: ${principlesCheck.violations.join(", ")}`,
      };
    }

    // Check 2: Voice Alignment
    const voiceScore = calculateVoiceAlignment(text);
    if (voiceScore < QUALITY_THRESHOLDS.minVoiceScore) {
      return {
        passed: false,
        reason: `Voice score too low: ${voiceScore}/10 (min: ${QUALITY_THRESHOLDS.minVoiceScore})`,
      };
    }

    // Check 3: Length
    const words = text.split(" ").length;
    const { min, max } = QUALITY_THRESHOLDS.questionWordLimit;
    if (words < min || words > max) {
      return {
        passed: false,
        reason: `Word count ${words} outside range [${min}, ${max}]`,
      };
    }

    return { passed: true };
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * 2. توليد Content Packet (greeting + mission)
   * ─────────────────────────────────────────────────────────────────
   */
  async generateContentPacket(
    context: UserContext
  ): Promise<ContentPacket | null> {
    const userState = this.inferUserState(context);

    const prompt = `
أنت محمد رفعت، معالج نفسي.
المستخدم في حالة **${userState}** (TEI: ${context.teiScore}).

# 📚 أمثلة من أسلوبك
${DAWAYIR_DNA.examples.contentPackets.join("\n")}

# 📝 المطلوب
اكتب:
1. **greeting**: جملة ترحيب قصيرة (5-10 كلمات)
2. **missionTitle**: عنوان المهمة اليومية (2-5 كلمات)
3. **missionDescription**: وصف المهمة (15-25 كلمة)

أرجع JSON:
{
  "greeting": "...",
  "missionTitle": "...",
  "missionDescription": "...",
  "themeColor": "${userState === "CHAOS" ? "rose" : userState === "FLOW" ? "cyan" : "emerald"}"
}
`;

    const response = await geminiClient.generateJSON<Omit<ContentPacket, "script">>(
      prompt
    );

    if (!response) return null;

    // التحقق من الجودة
    const qualityCheck = this.validateContentPacket(response);
    if (!qualityCheck.passed) {
      console.warn("❌ Content packet failed quality check:", qualityCheck.reason);
      return null;
    }

    return response;
  }

  /**
   * استنتاج حالة المستخدم (CHAOS / ORDER / FLOW)
   */
  private inferUserState(context: UserContext): "CHAOS" | "ORDER" | "FLOW" {
    if (context.teiScore > 65) return "CHAOS";
    if (context.teiScore < 20) return "FLOW";
    return "ORDER";
  }

  /**
   * التحقق من جودة Content Packet
   */
  private validateContentPacket(
    packet: Omit<ContentPacket, "script">
  ): { passed: boolean; reason?: string } {
    // Check greeting
    const greetingWords = packet.greeting.split(" ").length;
    if (greetingWords < 3 || greetingWords > 12) {
      return { passed: false, reason: "Greeting too short or too long" };
    }

    // Check mission description
    const descWords = packet.missionDescription.split(" ").length;
    if (descWords < 10 || descWords > 35) {
      return { passed: false, reason: "Mission description length invalid" };
    }

    // Check principles
    const principlesCheck = isAlignedWithPrinciples(
      packet.greeting + " " + packet.missionDescription
    );
    if (!principlesCheck.aligned) {
      return {
        passed: false,
        reason: `Violates: ${principlesCheck.violations.join(", ")}`,
      };
    }

    return { passed: true };
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * 3. كتابة Insights لشخص معين (PersonViewInsights)
   * ─────────────────────────────────────────────────────────────────
   */
  async generatePersonInsights(node: MapNode): Promise<{
    diagnosis?: string;
    symptoms?: string[];
    solution?: string;
    planSuggestion?: string;
  } | null> {
    if (!node.analysis) return null;

    const prompt = `
أنت محمد رفعت، معالج نفسي.
المستخدم أضاف شخص في خريطته اسمه "${node.label}".

# 📊 بيانات الشخص
- الدائرة: ${node.ring === "red" ? "حمراء (تأثير سلبي)" : node.ring === "yellow" ? "صفراء (غير مريحة)" : "خضراء (آمنة)"}
- Score: ${node.analysis.score}/6 (كل ما زاد، كل ما كان التأثير أسوأ)
- Answers: ${JSON.stringify(node.analysis.answers)}
${node.detachmentMode ? "- الوضع: فك ارتباط (Detachment Mode)" : ""}
${node.notes && node.notes.length > 0 ? `- Notes: ${node.notes.slice(0, 2).map(n => n.text).join("; ")}` : ""}

# 📝 المطلوب
اكتب تحليل نفسي **قصير** (بدون تشخيص طبي):
1. **diagnosis**: ملخص الوضع في جملة (15-25 كلمة)
2. **symptoms**: 3-5 أعراض نفسية ممكن يحسها المستخدم
3. **solution**: نصيحة واحدة عملية (10-20 كلمة)
4. **planSuggestion**: اقتراح خطة (10-20 كلمة)

⚠️ ممنوع:
- تشخيص طبي (depression, bipolar, etc.)
- نصائح دوائية
- أوامر ("لازم تعمل كذا")

✅ استخدم:
- لغة استكشافية ("ممكن يكون..."، "غالباً...")
- validation ("طبيعي تحس كده")

أرجع JSON:
{
  "diagnosis": "...",
  "symptoms": ["...", "..."],
  "solution": "...",
  "planSuggestion": "..."
}
`;

    const response = await geminiClient.generateJSON<{
      diagnosis: string;
      symptoms: string[];
      solution: string;
      planSuggestion: string;
    }>(prompt);

    if (!response) return null;

    // التحقق من عدم وجود تشخيص طبي
    const medicalCheck = this.detectMedicalDiagnosis(response.diagnosis);
    if (medicalCheck.found) {
      console.warn("❌ Insights contain medical diagnosis:", medicalCheck.term);
      return null;
    }

    return response;
  }

  /**
   * كشف التشخيصات الطبية (ممنوعة)
   */
  private detectMedicalDiagnosis(text: string): { found: boolean; term?: string } {
    const medicalTerms = [
      "depression",
      "ديبريشن",
      "اكتئاب",
      "bipolar",
      "ثنائي القطب",
      "schizophrenia",
      "فصام",
      "anxiety disorder",
      "اضطراب",
      "ptsd",
      "ocd",
      "adhd",
    ];

    for (const term of medicalTerms) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        return { found: true, term };
      }
    }

    return { found: false };
  }

  /**
   * ─────────────────────────────────────────────────────────────────
   * 4. فلترة محتوى المجتمع (Community Moderation)
   * ─────────────────────────────────────────────────────────────────
   */
  async evaluateCommunityQuestion(
    question: string,
    submittedBy: string
  ): Promise<{
    approved: boolean;
    score: number; // 0-10
    reasoning: string;
    suggestedEdits?: string;
  }> {
    const prompt = `
أنت محمد رفعت، معالج نفسي.
مستخدم اسمه "${submittedBy}" اقترح سؤال يومي جديد:

"${question}"

# 🧬 معايير القبول
${JSON.stringify(DAWAYIR_DNA.content, null, 2)}

# 📝 المطلوب
قيّم السؤال من 0 إلى 10:
- 0-3: سطحي أو toxic positivity → مرفوض
- 4-6: متوسط → محتاج تعديل
- 7-10: عميق ومتوافق → مقبول

أرجع JSON:
{
  "score": 0-10,
  "reasoning": "سبب التقييم",
  "approved": true/false,
  "suggestedEdits": "اقتراح تحسين (لو score < 7)"
}
`;

    const response = await geminiClient.generateJSON<{
      score: number;
      reasoning: string;
      approved: boolean;
      suggestedEdits?: string;
    }>(prompt);

    if (!response) {
      return {
        approved: false,
        score: 0,
        reasoning: "AI evaluation failed",
      };
    }

    return response;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 التصدير
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Singleton instance
 */
export const aiCurator = new AICurator();

/**
 * Helper: بناء UserContext من الـ State الحالي
 */
export function buildUserContext(nodes: MapNode[]): UserContext {
  const activeNodes = nodes.filter((n) => !n.isNodeArchived);

  return {
    totalNodes: activeNodes.length,
    redCircles: activeNodes.filter((n) => n.ring === "red").length,
    yellowCircles: activeNodes.filter((n) => n.ring === "yellow").length,
    greenCircles: activeNodes.filter((n) => n.ring === "green").length,
    teiScore: 0, // TODO: احسب من traumaEntropyIndex.ts
    recentAnswers: [], // TODO: اجلب من dailyJournalState
    topShadowPerson: undefined, // TODO: اجلب من shadowPulseState
    journeyDays: 0, // TODO: احسب من أول node.journeyStartDate
    hasCompletedTraining: activeNodes.some((n) => n.hasCompletedTraining),
  };
}

/**
 * Example Usage
 */
export async function exampleGenerateQuestion(nodes: MapNode[]): Promise<void> {
  const context = buildUserContext(nodes);
  const question = await aiCurator.generateDailyQuestion(context);

  if (question) {
    console.log("✅ New question generated:", question.text);
  } else {
    console.log("❌ Question generation failed");
  }
}
