import type {
  CircleNode,
  CognitiveMetrics,
  LiveReplaySnapshot,
  LiveSessionDetail,
  LiveSessionSummary,
  LoopRecall,
  TruthContract,
} from '../types';

function latestUserText(detail: LiveSessionDetail) {
  return detail.events
    .filter((event) => event.event_type === "transcript" && event.actor === "user")
    .map((event) => String(event.payload.text ?? ""))
    .filter(Boolean);
}

function latestAgentText(detail: LiveSessionDetail) {
  return detail.events
    .filter((event) => event.event_type === "transcript" && event.actor === "agent")
    .map((event) => String(event.payload.text ?? ""))
    .filter(Boolean);
}

function latestSnapshot(detail: LiveSessionDetail): LiveReplaySnapshot | null {
  return detail.replayFrames.at(-1)?.frame ?? null;
}

function dominantCircle(circles: CircleNode[]) {
  return [...circles].sort((a, b) => b.radius - a.radius)[0] ?? null;
}

function buildHeadline(metrics: CognitiveMetrics | null | undefined, circles: CircleNode[]) {
  const dominant = dominantCircle(circles);
  if (!dominant) return "الجلسة كشفت مركز الثقل الحالي بوضوح.";
  if ((metrics?.clarityDelta ?? 0) > 0.2) {
    return `الوضوح بدأ يتشكل حول ${dominant.label}.`;
  }
  if ((metrics?.overloadIndex ?? 0) > 0.7) {
    return `الثقل ما زال مرتفعًا حول ${dominant.label} ويحتاج خطوة تهدئة مباشرة.`;
  }
  return `الدائرة الأوضح الآن هي ${dominant.label}، وهي المفتاح العملي للجلسة.`;
}

export function generateSummary(detail: LiveSessionDetail, requested?: LiveSessionSummary | null): LiveSessionSummary {
  if (requested) return requested;

  const snapshot = latestSnapshot(detail);
  const circles = snapshot?.circles ?? [];
  const metrics = detail.session.metrics ?? snapshot?.metrics ?? null;
  const userTexts = latestUserText(detail);
  const agentTexts = latestAgentText(detail);
  const recentTopics =
    snapshot?.spawnedTopics.map((topic) => topic.topic).slice(0, 3) ??
    circles.map((circle) => circle.topic).filter(Boolean).slice(0, 3);

  return {
    title: detail.session.title || "جلسة دواير لايف",
    headline: buildHeadline(metrics, circles),
    breakthroughs: [
      recentTopics[0] ? `ظهر محور واضح حول ${recentTopics[0]}.` : "ظهر محور واضح يمكن البناء عليه.",
      agentTexts[0] ? `أقوى انعكاس في الجلسة: ${agentTexts[0]}` : "الانعكاس الحي كشف ما يحتاج تسمية مباشرة.",
    ].filter(Boolean),
    tensions: [
      userTexts[0] ? `الضغط الحاضر: ${userTexts[0]}` : "ما زال هناك توتر يحتاج متابعة.",
      (metrics?.overloadIndex ?? 0) > 0.6 ? "مؤشر الثقل ما زال مرتفعًا نسبيًا." : "التوتر بدأ يهدأ داخل الجلسة.",
    ],
    nextMoves: [
      recentTopics[1] ? `خصّص خطوة عملية واحدة تخص ${recentTopics[1]}.` : "اختر خطوة واحدة قابلة للتنفيذ خلال 24 ساعة.",
      "ارجع إلى إعادة التشغيل عندما تحتاج تذكيرًا بلحظة الوضوح.",
    ],
    generatedAt: new Date().toISOString(),
  };
}

export function generateTruthContract(detail: LiveSessionDetail, summary: LiveSessionSummary): TruthContract {
  const snapshot = latestSnapshot(detail);
  const dominant = dominantCircle(snapshot?.circles ?? []);
  return {
    promises: [
      `سأسمّي ما يحدث حول ${dominant?.label ?? "مركز الثقل"} بدل الهروب منه.`,
      "سألتزم بخطوة واحدة صغيرة وواضحة بدل محاولة إصلاح كل شيء دفعة واحدة.",
      "سأراجع هذه الجلسة عندما يعود التشوش.",
    ],
    avoidPatterns: [
      "عدم تحويل الوضوح إلى جلد ذات.",
      "عدم جمع كل العلاقات والملفات في قرار واحد.",
      "عدم تجاهل الإشارة الأولى للثقل.",
    ],
    reminder: summary.headline,
  };
}

export function generateLoopRecall(detail: LiveSessionDetail, summary: LiveSessionSummary): LoopRecall {
  const snapshot = latestSnapshot(detail);
  const firstTopic = snapshot?.spawnedTopics[0]?.topic ?? "النمط المتكرر";
  return {
    title: `حلقة ${firstTopic}`,
    trigger: latestUserText(detail)[0] || "عندما يبدأ التشتت أو الثقل في التراكم.",
    interruption: summary.nextMoves[0] || "ارجع إلى خطوة واحدة فقط.",
    reward: "استعادة إحساس السيطرة والوضوح بسرعة أكبر.",
  };
}

export function buildExpertInsight(topic: string, detail: LiveSessionDetail) {
  const summary = detail.session.summary ?? generateSummary(detail, null);
  return {
    ok: true,
    topic,
    headline: `رحلتك ترى أن ${topic} ليس عرضًا منفصلًا، بل رحلة لفهم النمط الحاضر الآن.`,
    guidance: [
      "سمِّ التوتر بدقة قبل أن تحاول حله.",
      "اربط الموضوع بدائرة واحدة مهيمنة بدل نشره على كل المساحات.",
      `تذكير الجلسة: ${summary.headline}`,
    ],
  };
}

export function buildMentalMap(detail: LiveSessionDetail) {
  const snapshot = latestSnapshot(detail);
  return {
    ok: true,
    circles: snapshot?.circles ?? [],
    topics: snapshot?.spawnedTopics ?? [],
    connections: snapshot?.topicConnections ?? [],
    stage: snapshot?.journeyStage ?? detail.session.summary?.headline ?? "Overwhelmed",
    savedAt: new Date().toISOString(),
  };
}
