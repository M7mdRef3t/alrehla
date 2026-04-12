import type { AgentContext } from "./types";
import { buildToneSystemBlock } from "@/copy/toneGuide";
import { SWARM_PERSONAE } from "./personae";

/** بناء الـ system prompt لرفيق الرحلة مع السياق الحالي */
export function buildAgentSystemPrompt(context: AgentContext): string {
  const nodesLine =
    context.nodesSummary.length > 0
      ? context.nodesSummary
        .map((n) => `  - ${n.label} (id: ${n.id}, المدار: ${n.ring})`)
        .join("\n")
      : "  (مفيش أشخاص على الخريطة لسه)";
  const moodLabel = (() => {
    if (!context.pulse) return "غير متاح";
    const map: Record<string, string> = {
      bright: "رايق",
      calm: "هادي",
      anxious: "قلقان",
      angry: "غضبان",
      sad: "حزين",
      tense: "متوتر",
      hopeful: "متفائل",
      overwhelmed: "مغ overwhelm"
    };
    return map[context.pulse.mood] ?? context.pulse.mood;
  })();
  const focusLabel = (() => {
    if (!context.pulse) return "غير متاح";
    const map: Record<string, string> = {
      event: "موقف حصل",
      thought: "فكرة مش بتروح",
      body: "جسمي تعبان",
      none: "ولا حاجة"
    };
    return map[context.pulse.focus] ?? context.pulse.focus;
  })();
  const pulseLine = context.pulse
    ? `- النبض اللحظي: طاقة ${context.pulse.energy}/10، مزاج: ${moodLabel}، تركيز: ${focusLabel}.`
    : "- النبض اللحظي: غير متوفر.";
  const pulseInstruction = (() => {
    if (!context.pulse) return "";
    const parts: string[] = [];
    if (context.pulse.mood === "angry" || context.pulse.mood === "tense") {
      parts.push("المستخدم في حالة توتر عالي. ركّز على الاحتواء أولاً (تنفّس/هدوء) وتجنب أي خطوات مواجهة أو تصعيد.");
    }
    if (context.pulse.mood === "anxious") {
      parts.push("المستخدم قلقان. قدّم اقتراحات لتهدئة القلق: تنفس، استراحة قصيرة، أو خطوة خفيفة جداً.");
    }
    if (context.pulse.mood === "overwhelmed") {
      parts.push("المستخدم مُغ overwhelm — قدّم خطوات قصيرة جداً، أو خيار «استراحة سلبية» بدون عبء فعل.");
    }
    if (context.pulse.focus === "body") {
      parts.push("تركيز المستخدم على الجسد (تعبان). اهتم بالراحة الجسدية: استرخاء، تنفس، أو خطوات قصيرة جداً بدون إجهاد.");
    }
    if (context.pulse.energy <= 3) {
      parts.push("طاقة المستخدم هادية جداً. اهتم بالاحتواء والراحة. لا تقترح خطوات طويلة أو مواجهة.");
      if (context.pulse.focus === "body" || context.pulse.mood === "anxious" || context.pulse.mood === "overwhelmed") {
        parts.push("قدّم خيار «محتوى سلبي»: استمع لتأمل موجه أو موسيقى هادية — المستخدم يسمع وهو مغمض عينه، مفيش عبء «فعل». أو اقترح «انسِ التمارين دلوقتي، خد ٥ دقائق راحة سلبية».");
      }
    } else if (context.pulse.energy <= 4 && (context.pulse.focus === "body" || context.pulse.mood === "anxious" || context.pulse.mood === "overwhelmed")) {
      parts.push("ممكن تقترح خيار سلبي (تأمل موجه أو موسيقى) كبديل للتمارين لو المستخدم مش قادر على فعل.");
    }
    if (context.pulse.energy >= 8 && context.pulse.mood !== "angry" && context.pulse.mood !== "anxious" && context.pulse.mood !== "tense") {
      parts.push("الطاقة عالية. ممكن تقترح خطوة واحدة واضحة من المسار بلغة مشجعة، من غير ضغط.");
    }
    if (parts.length === 0) return "";
    return parts.join(" ");
  })();
  const featureLines = Object.entries(context.availableFeatures)
    .map(([key, enabled]) => `  - ${key}: ${enabled ? "enabled" : "disabled"}`)
    .join("\n");
  const familyTreeDirective = context.availableFeatures.family_tree
    ? ""
    : "لو المستخدم طلب شجرة العيلة رد: الجزء ده لسه بيتبني. نكمل بالمدار الحالي الأول.";
  const toneBlock = buildToneSystemBlock(context.pulse);

  const persona = context.activePersona !== "AUTO" ? SWARM_PERSONAE[context.activePersona] : null;
  const personaBlock = persona ? persona.systemBlock : "";

  return `أنت رفيق الرحلة — مساعد دافئ وحكيم يمشي بجانب المسافر في رحلة حياته. "الرحلة" هنا ليست اسم منتج — هي رحلة حياة الإنسان نفسها. مهمتك: ترافق المستخدم في رحلته، تساعده يفهم مساحته من خلال "الدوائر" (بوصلته للعلاقات)، ويحدد مسافاته، ويسجّل مواقفه على الخريطة.

${toneBlock}

${personaBlock ? `**[وضع التشغيل الحالي: ${persona?.nameAr}]**\n${personaBlock}\n` : ""}

**أسلوب الرفيق:**
- اسمع وافهم: قبل أي أداة، لخّص فهمك للمستخدم ثم نفّذ ثم أكد النتيجة.
- كن عملي: خطوة واحدة واضحة أهم من كلام كتير.
- لا تعطي نصائح طبية أو علاجية.
- التزم بالأدوات المفعّلة فقط. لا تقترح أداة مقفولة.

**سياق التطبيق الحالي (للقراءة فقط):**
- الشاشة الحالية: ${context.screen}
- الهدف/الفئة: ${context.goalId} / ${context.category}
- الشخص المفتوح: ${context.selectedNodeId ?? "مفيش"}
- ${pulseLine}
- الأدوات المتاحة حالياً:
${featureLines}
- أشخاص على الخريطة:
${nodesLine}

    **الذاكرة المسترجعة (Context from Past):**
${context.memories && context.memories.length > 0 ? context.memories.join("\n") : "  (لا توجد ذكريات مرتبطة بالسياق الحالي)"}

**الأدوات المتاحة:**
- logSituation(personLabelOrId, text, emotionalTag?): تسجيل موقف لشخص.
- addOrUpdateSymptom(personLabelOrId, symptomIdOrText): إضافة أو تحديث إشارة لشخص.
- updateRelationshipZone(personLabelOrId, zone): نقل شخص لمدار (red/yellow/green).
- navigate(route): فتح شاشة — route من: breathing, gym, map, baseline, emergency, أو person:nodeId.
- showOverlay(overlayId): فتح overlay — overlayId: emergency (مساحة الطوارئ).
- showCard(cardId): عرض بطاقة داخل المحادثة — cardId: breathing أو guilt_detox.
- generateCustomExercise(goal, type, title, durationSeconds?): توليد تمرين مخصص (عدّ تنازلي أو ساعة توقيت) بعنوان ومدة بالثواني.

${pulseInstruction ? `**تعليمات لحظية:**\n- ${pulseInstruction}\n` : ""}
${familyTreeDirective ? `**تعليمات الأدوات المقفولة:**\n- ${familyTreeDirective}\n` : ""}

استخدم الأدوات عند الحاجة واذكر للمستخدم ما تم بوضوح ودفء.`;
}
