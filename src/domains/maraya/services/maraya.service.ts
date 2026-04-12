/**
 * Domain: Maraya (Mirror/Reflection) — Service
 *
 * يقود جلسات التأمل الذاتي والـ AI reflection.
 * يستخدم aiGateway للتوليد.
 */

import { aiGateway } from "@/infrastructure/ai/gateway";
import type { MirrrorSession, MirrrorSessionType, ReflectionPattern } from "../types";

const PROMPT_TEMPLATES: Record<MirrrorSessionType, string> = {
  daily_reflection: "أجب باختصار: ما أبرز شيء شعرت به اليوم؟ وما الذي تريد تحسينه غداً؟",
  deep_dive: "حلّل بعمق هذه الفكرة أو الموقف الذي يشغل تفكيري:\n",
  pattern_scan: "من خلال ما يلي، استخرج الأنماط المتكررة في تفكيري وسلوكي:\n",
  emotional_audit: "قيّم حالتي العاطفية الآن وحدد المحركات الجذرية:\n",
  decision_mirror: "ساعدني على رؤية هذا القرار من زوايا متعددة:\n",
};

export const marayaService = {
  /**
   * إنشاء جلسة تأمل جديدة
   */
  async createSession(
    userId: string,
    type: MirrrorSessionType,
    userInput: string,
    moodBefore?: number
  ): Promise<MirrrorSession> {
    const basePrompt = PROMPT_TEMPLATES[type];
    const fullPrompt = `${basePrompt}${userInput}\n\nقدّم إجابة عميقة ومتعاطفة بالعربية في 2-3 فقرات.`;

    const response = await aiGateway.generate({
      type: `maraya:${type}`,
      prompt: fullPrompt,
      generationConfig: { temperature: 0.6 },
    });

    if (!response.success || !response.data) {
      throw new Error(response.error ?? "فشل توليد انعكاس المرايا.");
    }

    // Extract insights (simple extraction — first sentences of each paragraph)
    const insights = response.data
      .split("\n\n")
      .map((p) => p.split(".")[0]?.trim())
      .filter(Boolean)
      .slice(0, 3) as string[];

    const session: MirrrorSession = {
      id: crypto.randomUUID(),
      userId,
      type,
      prompt: userInput,
      response: response.data,
      insights,
      moodBefore,
      createdAt: new Date().toISOString(),
    };

    return session;
  },

  /**
   * اقتراح نوع الجلسة بناءً على السياق
   */
  suggestSessionType(params: {
    timeOfDay: "morning" | "afternoon" | "evening";
    moodScore: number | null;
    hasPendingDecision: boolean;
  }): MirrrorSessionType {
    if (params.hasPendingDecision) return "decision_mirror";
    if (params.moodScore !== null && params.moodScore <= 4) return "emotional_audit";
    if (params.timeOfDay === "morning") return "daily_reflection";
    if (params.timeOfDay === "evening") return "pattern_scan";
    return "deep_dive";
  },

  /**
   * استخراج أنماط من تاريخ الجلسات
   */
  extractPatterns(sessions: MirrrorSession[]): ReflectionPattern[] {
    // Count recurring themes across sessions
    const themeCount = new Map<string, { count: number; firstSeen: string; lastSeen: string; emotions: Set<string> }>();

    for (const session of sessions) {
      const keywords = [
        ...(session.insights ?? []),
        session.prompt.toLowerCase(),
      ].join(" ").split(/\s+/);

      // Simple keyword frequency (production would use NLP)
      const COMMON_THEMES = ["خوف", "ضغط", "علاقة", "عمل", "قرار", "مستقبل", "ثقة", "حدود"];
      for (const theme of COMMON_THEMES) {
        if (keywords.some((w) => w.includes(theme))) {
          const existing = themeCount.get(theme);
          if (existing) {
            existing.count++;
            existing.lastSeen = session.createdAt;
          } else {
            themeCount.set(theme, {
              count: 1,
              firstSeen: session.createdAt,
              lastSeen: session.createdAt,
              emotions: new Set(),
            });
          }
        }
      }
    }

    return Array.from(themeCount.entries())
      .filter(([, v]) => v.count >= 2)
      .map(([pattern, v]) => ({
        id: crypto.randomUUID(),
        userId: sessions[0]?.userId ?? "",
        pattern,
        frequency: v.count,
        firstSeen: v.firstSeen,
        lastSeen: v.lastSeen,
        relatedEmotions: Array.from(v.emotions),
      }));
  },
};
