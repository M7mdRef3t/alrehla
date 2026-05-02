/**
 * platformBridge.ts
 * ══════════════════════════════════════════════════
 * الجسر المركزي بين المسار وباقي أدوات المنصة.
 *
 * ⚠️ NOTE: الوظائف العامة (القراءة من أي module) انتقلت إلى:
 *    import { platform, actions } from "@/shared/platform";
 *
 * هذا الملف يحتفظ بالوظائف الخاصة بالمسار + يعيد تصدير
 * الوظائف العامة للتوافق مع الـ imports الموجودة.
 *
 * يستخدم eventBus لتجنب circular dependencies.
 */

import { eventBus } from "@/shared/events/bus";

// ─── Lazy imports (avoid circular deps) ─────────────────

function getYawmiyyat() {
  try {
    const { useYawmiyyatState } = require("@/modules/yawmiyyat/store/yawmiyyat.store");
    return useYawmiyyatState.getState();
  } catch { return null; }
}

function getNiyya() {
  try {
    const { useNiyyaState } = require("@/modules/niyya/store/niyya.store");
    return useNiyyaState.getState();
  } catch { return null; }
}

function getKhalwa() {
  try {
    const { useKhalwaState } = require("@/modules/khalwa/store/khalwa.store");
    return useKhalwaState.getState();
  } catch { return null; }
}

// ─── Tier 2 lazy imports ──────────────────────────────────

function getMithaq() {
  try {
    const { useMithaqState } = require("@/modules/mithaq/store/mithaq.store");
    return useMithaqState.getState();
  } catch { return null; }
}

function getAthar() {
  try {
    const { useAtharState } = require("@/modules/athar/store/athar.store");
    return useAtharState.getState();
  } catch { return null; }
}

function getRaseed() {
  try {
    const { useRaseedState } = require("@/modules/raseed/store/raseed.store");
    return useRaseedState.getState();
  } catch { return null; }
}

function getDawra() {
  try {
    const { useDawraState } = require("@/modules/dawra/store/dawra.store");
    return useDawraState.getState();
  } catch { return null; }
}

function getQinaa() {
  try {
    const { useQinaaState } = require("@/modules/qinaa/store/qinaa.store");
    return useQinaaState.getState();
  } catch { return null; }
}

// ─── Tier 3A lazy imports (journey-direct) ────────────────

function getWird() {
  try {
    const { useWirdState } = require("@/modules/wird/store/wird.store");
    return useWirdState.getState();
  } catch { return null; }
}

function getSamt() {
  try {
    const { useSamtState } = require("@/modules/samt/store/samt.store");
    return useSamtState.getState();
  } catch { return null; }
}

function getTazkiya() {
  try {
    const { useTazkiyaState } = require("@/modules/tazkiya/store/tazkiya.store");
    return useTazkiyaState.getState();
  } catch { return null; }
}

function getQalb() {
  try {
    const { useQalbState } = require("@/modules/qalb/store/qalb.store");
    return useQalbState.getState();
  } catch { return null; }
}

function getBasma() {
  try {
    const { useBasmaState } = require("@/modules/basma/store/basma.store");
    return useBasmaState.getState();
  } catch { return null; }
}

function getSijil() {
  try {
    const { useSijilState } = require("@/modules/sijil/store/sijil.store");
    return useSijilState.getState();
  } catch { return null; }
}

function getNadhir() {
  try {
    const { useNadhirState } = require("@/modules/nadhir/store/nadhir.store");
    return useNadhirState.getState();
  } catch { return null; }
}

// ─── Tier 3B lazy imports (read-only context) ─────────────

function getZill() {
  try {
    const { useZillState } = require("@/modules/zill/store/zill.store");
    return useZillState.getState();
  } catch { return null; }
}

function getQutb() {
  try {
    const { useQutbState } = require("@/modules/qutb/store/qutb.store");
    return useQutbState.getState();
  } catch { return null; }
}

function getKanz() {
  try {
    const { useKanzState } = require("@/modules/kanz/store/kanz.store");
    return useKanzState.getState();
  } catch { return null; }
}

function getRaya() {
  try {
    const { useRayaState } = require("@/modules/raya/store/raya.store");
    return useRayaState.getState();
  } catch { return null; }
}

function getWarsha() {
  try {
    const { useWarshaState } = require("@/modules/warsha/store/warsha.store");
    return useWarshaState.getState();
  } catch { return null; }
}

// ─── Tier 3C lazy imports (relationship modules) ──────────

function getSila() {
  try {
    const { useSilaState } = require("@/modules/sila/store/sila.store");
    return useSilaState.getState();
  } catch { return null; }
}

function getJisr() {
  try {
    const { useJisrState } = require("@/modules/jisr/store/jisr.store");
    return useJisrState.getState();
  } catch { return null; }
}

function getJathr() {
  try {
    const { useJathrState } = require("@/modules/jathr/store/jathr.store");
    return useJathrState.getState();
  } catch { return null; }
}

// ─── Types ──────────────────────────────────────────────

export interface JourneyEvent {
  type: "step_completed" | "stage_completed" | "journey_started" | "journey_completed";
  pathId: string;
  stepId?: string;
  stageId?: string;
  answer?: string;
  timestamp: number;
}

// ─── Bridge Functions ──────────────────────────────────

/**
 * 📔 يسجل تقدم المسار تلقائياً في اليوميات
 */
export function logJourneyToYawmiyyat(event: JourneyEvent): void {
  const yawmiyyat = getYawmiyyat();
  if (!yawmiyyat?.addEntry) return;

  const messages: Record<JourneyEvent["type"], string> = {
    journey_started:   `🚀 بدأت مسار جديد`,
    step_completed:    `📝 أكملت خطوة في المسار`,
    stage_completed:   `🎯 أنهيت مرحلة: ${event.stageId === "muwajaha" ? "المواجهة" : event.stageId === "tajalli" ? "التجلي" : "القيادة"}`,
    journey_completed: `🏆 أكملت المسار بالكامل!`,
  };

  try {
    yawmiyyat.addEntry({
      type: "milestone",
      content: messages[event.type],
      mood: null,
      tags: ["masarat", event.pathId],
    });
  } catch {
    // silent fail — يوميات مش critical
  }
}

/**
 * 🎯 يربط النية بالمسار — "إيه نيتك في الرحلة دي؟"
 */
export function syncNiyyaWithPath(pathId: string): {
  hasIntention: boolean;
  intention: string | null;
  category: string | null;
} {
  const niyya = getNiyya();
  if (!niyya) return { hasIntention: false, intention: null, category: null };

  const today = niyya.getToday();
  if (!today) return { hasIntention: false, intention: null, category: null };

  // لو النية من فئة "علاقة" أو "نمو" = مرتبطة بالمسار
  const relevant = today.category === "relationship" || today.category === "growth" || today.category === "soul";

  return {
    hasIntention: relevant,
    intention: relevant ? today.intention : null,
    category: relevant ? today.category : null,
  };
}

/**
 * 🧘 يتحقق هل المستخدم محتاج خلوة بناءً على حالته
 */
export function checkKhalwaNeed(context: {
  isDistressed: boolean;
  isLowEnergy: boolean;
  resonanceLevel: string | null;
}): {
  suggested: boolean;
  reason: string | null;
  intention: string | null;
} {
  const khalwa = getKhalwa();
  const isInKhalwa = khalwa?.activeSession != null;

  // لو في خلوة حالياً — مش محتاج اقتراح
  if (isInKhalwa) return { suggested: false, reason: null, intention: null };

  if (context.isDistressed) {
    return {
      suggested: true,
      reason: "حاسس بضغط — لحظة سكون ممكن تفرق",
      intention: "healing",
    };
  }

  if (context.resonanceLevel === "disconnected") {
    return {
      suggested: true,
      reason: "اتصالك بالمصدر ضعيف — الخلوة بتقوّيه",
      intention: "praying",
    };
  }

  if (context.isLowEnergy) {
    return {
      suggested: true,
      reason: "طاقتك منخفضة — استراحة واعية أفضل من المتابعة",
      intention: "resting",
    };
  }

  return { suggested: false, reason: null, intention: null };
}

// ─── Event Emission (for Bawsala + other tools) ────────

/**
 * 🧭 يبث أحداث المسار عبر eventBus — البوصلة وأي أداة تانية تقدر تسمع
 */
export function emitJourneyEvent(event: JourneyEvent): void {
  const payload = {
    pathId: event.pathId,
    stepId: event.stepId,
    stageId: event.stageId,
    timestamp: event.timestamp,
  };

  switch (event.type) {
    case "journey_started":
      eventBus.emit("masarat:journey_started", payload);
      break;
    case "step_completed":
      eventBus.emit("masarat:step_completed", payload);
      break;
    case "stage_completed":
      eventBus.emit("masarat:stage_completed", payload);
      break;
    case "journey_completed":
      eventBus.emit("masarat:journey_completed", payload);
      break;
  }

  // Auto-log to yawmiyyat
  logJourneyToYawmiyyat(event);

  // ── Tier 2 auto-actions ──
  if (event.type === "step_completed") {
    grantJourneyXp("step", event.pathId);
  }
  if (event.type === "stage_completed") {
    grantJourneyXp("stage", event.pathId);
    logJourneyImpact(event);
  }
  if (event.type === "journey_completed") {
    grantJourneyXp("journey", event.pathId);
    logJourneyImpact(event);
  }

  // ── Tier 3 auto-actions ──
  logToSijil(event);
}

// ═══════════════════════════════════════════════════════════
//                    TIER 2 BRIDGE FUNCTIONS
// ═══════════════════════════════════════════════════════════

// ─── Mithaq (الميثاق) — عقد مع النفس ──────────────────

/**
 * 📜 يقرأ المواثيق النشطة المرتبطة بالمسار
 */
export function getActivePledgesForJourney(): {
  hasPledges: boolean;
  pledges: Array<{ id: string; title: string; category: string }>;
} {
  const mithaq = getMithaq();
  if (!mithaq?.getActivePledges) return { hasPledges: false, pledges: [] };

  try {
    const active = mithaq.getActivePledges();
    // فلتر المواثيق المرتبطة بالعلاقات أو النمو أو الروحانية
    const relevant = active
      .filter((p: { category: string }) =>
        ["relationship", "mindset", "spiritual", "health"].includes(p.category)
      )
      .map((p: { id: string; title: string; category: string }) => ({
        id: p.id,
        title: p.title,
        category: p.category,
      }));

    return { hasPledges: relevant.length > 0, pledges: relevant };
  } catch { return { hasPledges: false, pledges: [] }; }
}

// ─── Athar (الأثر) — تتبع أثر المسار ──────────────────

/**
 * 📊 يسجل أثر حدث في المسار
 */
function logJourneyImpact(event: JourneyEvent): void {
  const athar = getAthar();
  if (!athar?.addEntry) return;

  const messages: Partial<Record<JourneyEvent["type"], string>> = {
    stage_completed:   `أنهيت مرحلة ${event.stageId === "muwajaha" ? "المواجهة" : event.stageId === "tajalli" ? "التجلي" : "القيادة"}`,
    journey_completed: "أكملت المسار بالكامل",
  };

  const msg = messages[event.type];
  if (!msg) return;

  try {
    athar.addEntry({
      content: msg,
      category: "awareness",
      emoji: event.type === "journey_completed" ? "🏆" : "🎯",
      meta: { source: "masarat", pathId: event.pathId, stageId: event.stageId },
    });
  } catch {
    // silent
  }
}

// ─── Raseed (الرصيد) — مكافآت التقدم ──────────────────

const XP_REWARDS: Record<string, { amount: number; label: string; dimension: string }> = {
  step:    { amount: 5,   label: "أكملت خطوة في المسار",     dimension: "awareness" },
  stage:   { amount: 25,  label: "أنهيت مرحلة في المسار",    dimension: "growth" },
  journey: { amount: 100, label: "أكملت المسار بالكامل!",    dimension: "resilience" },
};

/**
 * 💰 يمنح XP عند التقدم في المسار
 */
function grantJourneyXp(milestone: "step" | "stage" | "journey", pathId: string): void {
  const raseed = getRaseed();
  if (!raseed?.addXp) return;

  const reward = XP_REWARDS[milestone];
  if (!reward) return;

  try {
    raseed.addXp(
      `masarat:${pathId}`,
      reward.dimension as "awareness" | "resilience" | "growth",
      reward.amount,
      reward.label,
    );
  } catch {
    // silent
  }
}

// ─── Dawra (الدورة) — قراءة الأنماط الدورية ────────────

/**
 * 🔄 يقرأ الحالة الدورية الحالية (طاقة + مود + إنتاجية)
 */
export function getCurrentCycleSnapshot(): {
  hasData: boolean;
  energy: { phase: string; trend: string } | null;
  mood: { phase: string; trend: string } | null;
  bestDay: string | null;
} {
  const dawra = getDawra();
  if (!dawra?.getPattern) return { hasData: false, energy: null, mood: null, bestDay: null };

  try {
    const energyPattern = dawra.getPattern("energy");
    const moodPattern = dawra.getPattern("mood");
    const bestDay = dawra.getBestDay("energy");

    const hasData = dawra.getTotalEntries() > 0;

    return {
      hasData,
      energy: hasData ? { phase: energyPattern.currentPhase, trend: energyPattern.trend } : null,
      mood: hasData ? { phase: moodPattern.currentPhase, trend: moodPattern.trend } : null,
      bestDay: hasData ? bestDay : null,
    };
  } catch { return { hasData: false, energy: null, mood: null, bestDay: null }; }
}

// ─── Qinaa (القناع) — كشف التناقض ────────────────────

/**
 * 🎭 يقرأ مستوى الأصالة + السياق الأكثر تمثيلاً
 */
export function getMaskContrast(): {
  hasData: boolean;
  overallAuthenticity: number;     // 0-100
  mostMasked: string | null;      // LifeContext
  mostAuthentic: string | null;   // LifeContext
  contrast: number;               // فرق بين أعلى وأقل أصالة
} {
  const qinaa = getQinaa();
  if (!qinaa?.getOverallAuthenticity) {
    return { hasData: false, overallAuthenticity: 0, mostMasked: null, mostAuthentic: null, contrast: 0 };
  }

  try {
    const auth = qinaa.getOverallAuthenticity();
    const masked = qinaa.getMostMasked();
    const authentic = qinaa.getMostAuthentic();
    const hasData = qinaa.getTotalMasks() > 0;

    // حساب التناقض بين أعلى وأقل أصالة
    let contrast = 0;
    if (masked && authentic) {
      const maskedProfile = qinaa.getContextProfile(masked);
      const authProfile = qinaa.getContextProfile(authentic);
      contrast = Math.abs(authProfile.authenticityScore - maskedProfile.authenticityScore);
    }

    return {
      hasData,
      overallAuthenticity: auth,
      mostMasked: masked,
      mostAuthentic: authentic,
      contrast,
    };
  } catch {
    return { hasData: false, overallAuthenticity: 0, mostMasked: null, mostAuthentic: null, contrast: 0 };
  }
}

// ═══════════════════════════════════════════════════════════
//                    TIER 3A — JOURNEY-DIRECT
// ═══════════════════════════════════════════════════════════

// ─── Wird (الورد) — المحور الرأسي العملي ──────────────

/**
 * 📿 يقرأ حالة الورد اليومي — هل المستخدم عامل ورده؟
 */
export function getWirdStatus(): {
  hasWird: boolean;
  completedToday: boolean;
  streak: number;
} {
  const wird = getWird();
  if (!wird) return { hasWird: false, completedToday: false, streak: 0 };

  try {
    const progress = wird.todayProgress;
    const completed = progress ? progress.completed >= progress.total : false;
    return {
      hasWird: true,
      completedToday: completed,
      streak: wird.streak ?? 0,
    };
  } catch { return { hasWird: false, completedToday: false, streak: 0 }; }
}

// ─── Samt (الصمت) — حالة التنفس/التأمل ────────────────

/**
 * 🫁 يقرأ هل فيه جلسة تنفس نشطة أو آخر جلسة
 */
export function getSamtStatus(): {
  isActive: boolean;
  lastSessionMinutes: number | null;
  totalSessions: number;
} {
  const samt = getSamt();
  if (!samt) return { isActive: false, lastSessionMinutes: null, totalSessions: 0 };

  try {
    return {
      isActive: samt.phase !== "idle",
      lastSessionMinutes: samt.lastDuration ? Math.round(samt.lastDuration / 60) : null,
      totalSessions: samt.totalSessions ?? 0,
    };
  } catch { return { isActive: false, lastSessionMinutes: null, totalSessions: 0 }; }
}

// ─── Tazkiya (التزكية) — حالة التطهير ─────────────────

/**
 * 🧹 يقرأ دورات التزكية النشطة
 */
export function getTazkiyaStatus(): {
  hasActiveCycle: boolean;
  currentStep: string | null;
  totalCycles: number;
} {
  const tazkiya = getTazkiya();
  if (!tazkiya) return { hasActiveCycle: false, currentStep: null, totalCycles: 0 };

  try {
    const active = tazkiya.activeCycle;
    return {
      hasActiveCycle: !!active,
      currentStep: active?.currentStep ?? null,
      totalCycles: tazkiya.cycles?.length ?? 0,
    };
  } catch { return { hasActiveCycle: false, currentStep: null, totalCycles: 0 }; }
}

// ─── Qalb (القلب) — صحة القلب الروحي ─────────────────

/**
 * ❤️ يقرأ حالة القلب الحالية
 */
export function getQalbStatus(): {
  hasData: boolean;
  zone: string | null;         // critical → radiant
  overallHealth: number;        // 0-100
} {
  const qalb = getQalb();
  if (!qalb) return { hasData: false, zone: null, overallHealth: 0 };

  try {
    return {
      hasData: true,
      zone: qalb.currentZone ?? null,
      overallHealth: qalb.overallHealth ?? 0,
    };
  } catch { return { hasData: false, zone: null, overallHealth: 0 }; }
}

// ─── Basma (البصمة) — السمات الشخصية ─────────────────

/**
 * 🧬 يقرأ أبرز سمات الشخصية
 */
export function getBasmaSnapshot(): {
  hasProfile: boolean;
  topTraits: Array<{ name: string; category: string; strength: number }>;
  coreValues: string[];
} {
  const basma = getBasma();
  if (!basma) return { hasProfile: false, topTraits: [], coreValues: [] };

  try {
    const traits = (basma.traits ?? []).slice(0, 3).map((t: { name: string; category: string; strength: number }) => ({
      name: t.name,
      category: t.category,
      strength: t.strength,
    }));
    const values = (basma.coreValues ?? []).map((v: { label: string }) => v.label).slice(0, 3);
    return { hasProfile: traits.length > 0, topTraits: traits, coreValues: values };
  } catch { return { hasProfile: false, topTraits: [], coreValues: [] }; }
}

// ─── Sijil (السجل) — auto-log ─────────────────────────

/**
 * 📋 يسجل نشاط المسار في السجل المركزي
 */
export function logToSijil(event: JourneyEvent): void {
  const sijil = getSijil();
  if (!sijil?.addEvent) return;

  try {
    sijil.addEvent({
      source: "masarat",
      action: event.type,
      meta: { pathId: event.pathId, stageId: event.stageId },
    });
  } catch {
    // silent
  }
}

// ─── Nadhir (النذير) — شبكة الأمان ────────────────────

/**
 * 🚨 يتحقق هل المستخدم في حالة أزمة
 */
export function checkCrisisState(): {
  isInCrisis: boolean;
  hasSafeContacts: boolean;
} {
  const nadhir = getNadhir();
  if (!nadhir) return { isInCrisis: false, hasSafeContacts: false };

  try {
    return {
      isInCrisis: nadhir.isInCrisis ?? false,
      hasSafeContacts: (nadhir.safeContacts?.length ?? 0) > 0,
    };
  } catch { return { isInCrisis: false, hasSafeContacts: false }; }
}

// ═══════════════════════════════════════════════════════════
//                    TIER 3B — READ-ONLY CONTEXT
// ═══════════════════════════════════════════════════════════

// ─── Zill (الظل) — Shadow Work ────────────────────────

/**
 * 🌑 يقرأ حالة العمل على الظل
 */
export function getZillSnapshot(): {
  hasData: boolean;
  totalShadows: number;
  mostRepressed: string | null;
  avgIntegration: number;       // 1-5
} {
  const zill = getZill();
  if (!zill) return { hasData: false, totalShadows: 0, mostRepressed: null, avgIntegration: 0 };

  try {
    const entries = zill.entries ?? [];
    const total = entries.length;
    if (total === 0) return { hasData: false, totalShadows: 0, mostRepressed: null, avgIntegration: 0 };

    const avgInt = entries.reduce((s: number, e: { integrationLevel: number }) => s + e.integrationLevel, 0) / total;
    const lowest = entries.reduce((min: { type: string; integrationLevel: number } | null, e: { type: string; integrationLevel: number }) =>
      !min || e.integrationLevel < min.integrationLevel ? e : min, null);

    return {
      hasData: true,
      totalShadows: total,
      mostRepressed: lowest?.type ?? null,
      avgIntegration: Math.round(avgInt * 10) / 10,
    };
  } catch { return { hasData: false, totalShadows: 0, mostRepressed: null, avgIntegration: 0 }; }
}

// ─── Qutb (القطب) — النجم الشمالي ─────────────────────

/**
 * ⭐ يقرأ النجم الشمالي (الاتجاه الحياتي)
 */
export function getQutbSnapshot(): {
  hasNorthStar: boolean;
  northStar: string | null;
  alignmentScore: number;
} {
  const qutb = getQutb();
  if (!qutb) return { hasNorthStar: false, northStar: null, alignmentScore: 0 };

  try {
    return {
      hasNorthStar: !!qutb.northStar,
      northStar: qutb.northStar?.statement ?? null,
      alignmentScore: qutb.overallAlignment ?? 0,
    };
  } catch { return { hasNorthStar: false, northStar: null, alignmentScore: 0 }; }
}

// ─── Kanz (الكنز) — الجواهر المحفوظة ─────────────────

/**
 * 💎 يقرأ عدد الجواهر وآخرها
 */
export function getKanzSnapshot(): {
  totalGems: number;
  lastGem: string | null;
} {
  const kanz = getKanz();
  if (!kanz) return { totalGems: 0, lastGem: null };

  try {
    const gems = kanz.gems ?? [];
    return {
      totalGems: gems.length,
      lastGem: gems.length > 0 ? gems[0]?.content ?? null : null,
    };
  } catch { return { totalGems: 0, lastGem: null }; }
}

// ─── Raya (الراية) — الأهداف ──────────────────────────

/**
 * 🏁 يقرأ الأهداف النشطة
 */
export function getRayaSnapshot(): {
  hasGoals: boolean;
  activeGoals: number;
  topGoal: string | null;
} {
  const raya = getRaya();
  if (!raya) return { hasGoals: false, activeGoals: 0, topGoal: null };

  try {
    const goals = (raya.goals ?? []).filter((g: { status: string }) => g.status === "active");
    return {
      hasGoals: goals.length > 0,
      activeGoals: goals.length,
      topGoal: goals.length > 0 ? goals[0]?.title ?? null : null,
    };
  } catch { return { hasGoals: false, activeGoals: 0, topGoal: null }; }
}

// ─── Warsha (الورشة) — التحديات ───────────────────────

/**
 * 💪 يقرأ التحديات النشطة
 */
export function getWarshaSnapshot(): {
  hasActiveChallenge: boolean;
  challengeName: string | null;
  progress: number;   // 0-100
} {
  const warsha = getWarsha();
  if (!warsha) return { hasActiveChallenge: false, challengeName: null, progress: 0 };

  try {
    const active = warsha.activeChallenge;
    if (!active) return { hasActiveChallenge: false, challengeName: null, progress: 0 };

    const total = active.totalDays ?? 7;
    const completed = active.completedDays ?? 0;
    return {
      hasActiveChallenge: true,
      challengeName: active.title ?? null,
      progress: Math.round((completed / total) * 100),
    };
  } catch { return { hasActiveChallenge: false, challengeName: null, progress: 0 }; }
}

// ═══════════════════════════════════════════════════════════
//                    TIER 3C — RELATIONSHIP MODULES
// ═══════════════════════════════════════════════════════════

/**
 * 🤝 يقرأ ملخص العلاقات — صلة + جسر + جذر
 */
export function getRelationshipSnapshot(): {
  sila: { totalConnections: number; avgQuality: number } | null;
  jisr: { activeFractures: number; repairedCount: number } | null;
  jathr: { topValues: string[]; alignmentAvg: number } | null;
} {
  let silaData = null;
  let jisrData = null;
  let jathrData = null;

  // Sila — العلاقات
  try {
    const sila = getSila();
    if (sila?.people) {
      const people = sila.people ?? [];
      const avgQ = people.length > 0
        ? people.reduce((s: number, p: { connectionQuality: number }) => s + p.connectionQuality, 0) / people.length
        : 0;
      silaData = { totalConnections: people.length, avgQuality: Math.round(avgQ * 10) / 10 };
    }
  } catch { /* silent */ }

  // Jisr — إصلاح الكسور
  try {
    const jisr = getJisr();
    if (jisr?.fractures) {
      const all = jisr.fractures ?? [];
      const active = all.filter((f: { status: string }) => f.status === "active").length;
      const repaired = all.filter((f: { status: string }) => f.status === "repaired").length;
      jisrData = { activeFractures: active, repairedCount: repaired };
    }
  } catch { /* silent */ }

  // Jathr — القيم الجذرية
  try {
    const jathr = getJathr();
    if (jathr?.values) {
      const vals = jathr.values ?? [];
      const top = vals.slice(0, 3).map((v: { domain: string }) => v.domain);
      const avgA = vals.length > 0
        ? vals.reduce((s: number, v: { alignment: number }) => s + v.alignment, 0) / vals.length
        : 0;
      jathrData = { topValues: top, alignmentAvg: Math.round(avgA * 10) / 10 };
    }
  } catch { /* silent */ }

  return { sila: silaData, jisr: jisrData, jathr: jathrData };
}

// ═══════════════════════════════════════════════════════════
//  RE-EXPORTS FROM SHARED PLATFORM (backward compatibility)
// ═══════════════════════════════════════════════════════════

export { platform, type PlatformSnapshot } from "@/shared/platform";
export { actions } from "@/shared/platform";
