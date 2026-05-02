/**
 * platformIntelligence.ts
 * ══════════════════════════════════════════════════
 * الجهاز العصبي المركزي للمنصة.
 *
 * أي module في المنصة يقدر يستورد من هنا ويقرأ بيانات
 * أي module تاني — بدون imports مباشرة أو circular deps.
 *
 * Usage:
 *   import { platform } from "@/shared/platform";
 *
 *   const wird = platform.wird();
 *   const all  = platform.snapshot();
 */

// ═══════════════════════════════════════════════════════════
//                    LAZY STORE ACCESSORS
// ═══════════════════════════════════════════════════════════

// Each accessor uses try/catch so if a module doesn't exist
// or hasn't loaded yet, we gracefully return null.

function getStore(modulePath: string, hookName: string) {
  try {
    const mod = require(modulePath);
    return mod[hookName]?.getState?.() ?? null;
  } catch { return null; }
}

// ── Consciousness / Core ──
const stores = {
  pulse:     () => getStore("@/domains/consciousness/store/pulse.store", "usePulseState"),
  hafiz:     () => getStore("@/modules/hafiz/store/hafiz.store", "useHafizState"),
  // ── Tier 1 ──
  khalwa:    () => getStore("@/modules/khalwa/store/khalwa.store", "useKhalwaState"),
  yawmiyyat: () => getStore("@/modules/yawmiyyat/store/yawmiyyat.store", "useYawmiyyatState"),
  niyya:     () => getStore("@/modules/niyya/store/niyya.store", "useNiyyaState"),
  bawsala:   () => getStore("@/modules/bawsala/store/bawsala.store", "useBawsalaState"),
  // ── Tier 2 ──
  mithaq:    () => getStore("@/modules/mithaq/store/mithaq.store", "useMithaqState"),
  athar:     () => getStore("@/modules/athar/store/athar.store", "useAtharState"),
  raseed:    () => getStore("@/modules/raseed/store/raseed.store", "useRaseedState"),
  dawra:     () => getStore("@/modules/dawra/store/dawra.store", "useDawraState"),
  qinaa:     () => getStore("@/modules/qinaa/store/qinaa.store", "useQinaaState"),
  // ── Tier 3A ──
  wird:      () => getStore("@/modules/wird/store/wird.store", "useWirdState"),
  samt:      () => getStore("@/modules/samt/store/samt.store", "useSamtState"),
  tazkiya:   () => getStore("@/modules/tazkiya/store/tazkiya.store", "useTazkiyaState"),
  qalb:      () => getStore("@/modules/qalb/store/qalb.store", "useQalbState"),
  basma:     () => getStore("@/modules/basma/store/basma.store", "useBasmaState"),
  sijil:     () => getStore("@/modules/sijil/store/sijil.store", "useSijilState"),
  nadhir:    () => getStore("@/modules/nadhir/store/nadhir.store", "useNadhirState"),
  // ── Tier 3B ──
  zill:      () => getStore("@/modules/zill/store/zill.store", "useZillState"),
  qutb:      () => getStore("@/modules/qutb/store/qutb.store", "useQutbState"),
  kanz:      () => getStore("@/modules/kanz/store/kanz.store", "useKanzState"),
  raya:      () => getStore("@/modules/raya/store/raya.store", "useRayaState"),
  warsha:    () => getStore("@/modules/warsha/store/warsha.store", "useWarshaState"),
  // ── Tier 3C ──
  sila:      () => getStore("@/modules/sila/store/sila.store", "useSilaState"),
  jisr:      () => getStore("@/modules/jisr/store/jisr.store", "useJisrState"),
  jathr:     () => getStore("@/modules/jathr/store/jathr.store", "useJathrState"),
  // ── Extra ──
  masarat:   () => getStore("@/modules/masarat/store/masarat.store", "useMasaratStore"),
  nabd:      () => getStore("@/modules/nabd/store/nabd.store", "useNabdState"),
  mirah:     () => getStore("@/modules/mirah/store/mirah.store", "useMirahState"),
  shahada:   () => getStore("@/modules/shahada/store/shahada.store", "useShahadaState"),
  risala:    () => getStore("@/modules/risala/store/risala.store", "useRisalaState"),
  ruya:      () => getStore("@/modules/ruya/store/ruya.store", "useRuyaState"),
  wasiyya:   () => getStore("@/modules/wasiyya/store/wasiyya.store", "useWasiyyaState"),
  sullam:    () => getStore("@/modules/sullam/store/sullam.store", "useSullamState"),
  rafiq:     () => getStore("@/modules/rafiq/store/rafiq.store", "useRafiqState"),
  rifaq:     () => getStore("@/modules/rifaq/store/rifaq.store", "useRifaqState"),
  bathra:    () => getStore("@/modules/bathra/store/bathra.store", "useBathraState"),
  naba:      () => getStore("@/modules/naba/store/naba.store", "useNabaState"),
  observatory: () => getStore("@/modules/observatory/store/observatory.store", "useObservatoryState"),
} as const;

// ═══════════════════════════════════════════════════════════
//                    TYPED SNAPSHOT FUNCTIONS
// ═══════════════════════════════════════════════════════════

// Each function reads from its lazy store and returns a clean,
// typed snapshot. If the store doesn't exist → safe defaults.

// ── Pulse (الطاقة والمود) ────────────────────────────────

type PulseMood = string;
const DISTRESSED_MOODS: PulseMood[] = ["anxious", "overwhelmed", "sad", "angry"];

export function readPulse() {
  const s = stores.pulse();
  if (!s) return { available: false, energy: 0, mood: null as PulseMood | null, isLow: false, isDistressed: false };
  try {
    const energy = s.currentEnergy ?? 50;
    const mood = s.currentMood ?? null;
    return {
      available: true,
      energy,
      mood,
      isLow: energy < 30,
      isDistressed: mood ? DISTRESSED_MOODS.includes(mood) : false,
    };
  } catch { return { available: false, energy: 0, mood: null as PulseMood | null, isLow: false, isDistressed: false }; }
}

// ── Hafiz (الاتصال الروحي) ────────────────────────────────

export function readResonance() {
  const s = stores.hafiz();
  if (!s) return { available: false, level: null as string | null, strength: 0, label: null as string | null };
  try {
    const { getVerticalResonanceState } = require("@/modules/hafiz/store/hafiz.store");
    const res = getVerticalResonanceState(s.memories);
    return { available: true, level: res.level, strength: res.strength, label: res.label };
  } catch { return { available: false, level: null as string | null, strength: 0, label: null as string | null }; }
}

// ── Khalwa (الخلوة) ──────────────────────────────────────

export function readKhalwa() {
  const s = stores.khalwa();
  if (!s) return { available: false, isInSession: false };
  try {
    return { available: true, isInSession: s.activeSession != null };
  } catch { return { available: false, isInSession: false }; }
}

export function checkKhalwaNeed(context: { isDistressed: boolean; isLowEnergy: boolean; resonanceLevel: string | null }) {
  const khalwa = stores.khalwa();
  if (khalwa?.activeSession != null) return { suggested: false, reason: null, intention: null };

  if (context.isDistressed) return { suggested: true, reason: "حاسس بضغط — لحظة سكون ممكن تفرق", intention: "healing" };
  if (context.resonanceLevel === "disconnected") return { suggested: true, reason: "اتصالك بالمصدر ضعيف — الخلوة بتقوّيه", intention: "praying" };
  if (context.isLowEnergy) return { suggested: true, reason: "طاقتك منخفضة — استراحة واعية أفضل من المتابعة", intention: "resting" };

  return { suggested: false, reason: null, intention: null };
}

// ── Niyya (النية) ────────────────────────────────────────

export function readNiyya() {
  const s = stores.niyya();
  if (!s?.getToday) return { hasIntention: false, intention: null as string | null, category: null as string | null };
  try {
    const today = s.getToday();
    if (!today) return { hasIntention: false, intention: null, category: null };
    const relevant = ["relationship", "growth", "soul"].includes(today.category);
    return { hasIntention: relevant, intention: relevant ? today.intention : null, category: relevant ? today.category : null };
  } catch { return { hasIntention: false, intention: null as string | null, category: null as string | null }; }
}

// ── Mithaq (الميثاق) ─────────────────────────────────────

export function readMithaq() {
  const s = stores.mithaq();
  if (!s?.getActivePledges) return { hasPledges: false, pledges: [] as Array<{ id: string; title: string; category: string }> };
  try {
    const active = s.getActivePledges();
    const relevant = active
      .filter((p: { category: string }) => ["relationship", "mindset", "spiritual", "health"].includes(p.category))
      .map((p: { id: string; title: string; category: string }) => ({ id: p.id, title: p.title, category: p.category }));
    return { hasPledges: relevant.length > 0, pledges: relevant };
  } catch { return { hasPledges: false, pledges: [] }; }
}

// ── Dawra (الدورة) ───────────────────────────────────────

export function readDawra() {
  const s = stores.dawra();
  if (!s?.getPattern) return { hasData: false, energy: null, mood: null, bestDay: null as string | null };
  try {
    const ep = s.getPattern("energy");
    const mp = s.getPattern("mood");
    const hasData = s.getTotalEntries() > 0;
    return {
      hasData,
      energy: hasData ? { phase: ep.currentPhase, trend: ep.trend } : null,
      mood: hasData ? { phase: mp.currentPhase, trend: mp.trend } : null,
      bestDay: hasData ? s.getBestDay("energy") : null,
    };
  } catch { return { hasData: false, energy: null, mood: null, bestDay: null as string | null }; }
}

// ── Qinaa (القناع) ───────────────────────────────────────

export function readQinaa() {
  const s = stores.qinaa();
  if (!s?.getOverallAuthenticity) return { hasData: false, overallAuthenticity: 0, mostMasked: null as string | null, mostAuthentic: null as string | null, contrast: 0 };
  try {
    const auth = s.getOverallAuthenticity();
    const masked = s.getMostMasked();
    const authentic = s.getMostAuthentic();
    const hasData = s.getTotalMasks() > 0;
    let contrast = 0;
    if (masked && authentic) {
      const mp = s.getContextProfile(masked);
      const ap = s.getContextProfile(authentic);
      contrast = Math.abs(ap.authenticityScore - mp.authenticityScore);
    }
    return { hasData, overallAuthenticity: auth, mostMasked: masked, mostAuthentic: authentic, contrast };
  } catch { return { hasData: false, overallAuthenticity: 0, mostMasked: null as string | null, mostAuthentic: null as string | null, contrast: 0 }; }
}

// ── Wird (الورد) ─────────────────────────────────────────

export function readWird() {
  const s = stores.wird();
  if (!s) return { hasWird: false, completedToday: false, streak: 0, totalRituals: 0 };
  try {
    const p = s.todayProgress;
    const rituals = s.rituals ?? [];
    return {
      hasWird: true,
      completedToday: p ? p.completed >= p.total : false,
      streak: s.streak ?? 0,
      totalRituals: rituals.filter((r: { enabled?: boolean }) => r.enabled !== false).length,
    };
  } catch { return { hasWird: false, completedToday: false, streak: 0, totalRituals: 0 }; }
}

// ── Samt (الصمت) ─────────────────────────────────────────

export function readSamt() {
  const s = stores.samt();
  if (!s) return { isActive: false, lastSessionMinutes: null as number | null, totalSessions: 0 };
  try {
    return {
      isActive: s.phase !== "idle",
      lastSessionMinutes: s.lastDuration ? Math.round(s.lastDuration / 60) : null,
      totalSessions: s.totalSessions ?? 0,
    };
  } catch { return { isActive: false, lastSessionMinutes: null as number | null, totalSessions: 0 }; }
}

// ── Tazkiya (التزكية) ────────────────────────────────────

export function readTazkiya() {
  const s = stores.tazkiya();
  if (!s) return { hasActiveCycle: false, currentStep: null as string | null, totalCycles: 0 };
  try {
    const active = s.activeCycle;
    return { hasActiveCycle: !!active, currentStep: active?.currentStep ?? null, totalCycles: s.cycles?.length ?? 0 };
  } catch { return { hasActiveCycle: false, currentStep: null as string | null, totalCycles: 0 }; }
}

// ── Qalb (القلب) ─────────────────────────────────────────

export function readQalb() {
  const s = stores.qalb();
  if (!s) return { hasData: false, zone: null as string | null, overallHealth: 0 };
  try {
    return { hasData: true, zone: s.currentZone ?? null, overallHealth: s.overallHealth ?? 0 };
  } catch { return { hasData: false, zone: null as string | null, overallHealth: 0 }; }
}

// ── Basma (البصمة) ───────────────────────────────────────

export function readBasma() {
  const s = stores.basma();
  if (!s) return { hasProfile: false, topTraits: [] as Array<{ name: string; category: string; strength: number }>, coreValues: [] as string[] };
  try {
    const traits = (s.traits ?? []).slice(0, 3).map((t: { name: string; category: string; strength: number }) => ({
      name: t.name, category: t.category, strength: t.strength,
    }));
    const values = (s.coreValues ?? []).map((v: { label: string }) => v.label).slice(0, 3);
    return { hasProfile: traits.length > 0, topTraits: traits, coreValues: values };
  } catch { return { hasProfile: false, topTraits: [], coreValues: [] }; }
}

// ── Nadhir (النذير) ──────────────────────────────────────

export function readNadhir() {
  const s = stores.nadhir();
  if (!s) return { isInCrisis: false, hasSafeContacts: false };
  try {
    return { isInCrisis: s.isInCrisis ?? false, hasSafeContacts: (s.safeContacts?.length ?? 0) > 0 };
  } catch { return { isInCrisis: false, hasSafeContacts: false }; }
}

// ── Zill (الظل) ──────────────────────────────────────────

export function readZill() {
  const s = stores.zill();
  if (!s) return { hasData: false, totalShadows: 0, mostRepressed: null as string | null, avgIntegration: 0 };
  try {
    const entries = s.entries ?? [];
    if (entries.length === 0) return { hasData: false, totalShadows: 0, mostRepressed: null, avgIntegration: 0 };
    const avg = entries.reduce((a: number, e: { integrationLevel: number }) => a + e.integrationLevel, 0) / entries.length;
    const lowest = entries.reduce((m: { type: string; integrationLevel: number } | null, e: { type: string; integrationLevel: number }) =>
      !m || e.integrationLevel < m.integrationLevel ? e : m, null);
    return { hasData: true, totalShadows: entries.length, mostRepressed: lowest?.type ?? null, avgIntegration: Math.round(avg * 10) / 10 };
  } catch { return { hasData: false, totalShadows: 0, mostRepressed: null as string | null, avgIntegration: 0 }; }
}

// ── Qutb (القطب) ─────────────────────────────────────────

export function readQutb() {
  const s = stores.qutb();
  if (!s) return { hasNorthStar: false, northStar: null as string | null, alignmentScore: 0 };
  try {
    return { hasNorthStar: !!s.northStar, northStar: s.northStar?.statement ?? null, alignmentScore: s.overallAlignment ?? 0 };
  } catch { return { hasNorthStar: false, northStar: null as string | null, alignmentScore: 0 }; }
}

// ── Kanz (الكنز) ─────────────────────────────────────────

export function readKanz() {
  const s = stores.kanz();
  if (!s) return { totalGems: 0, lastGem: null as string | null };
  try {
    const gems = s.gems ?? [];
    return { totalGems: gems.length, lastGem: gems.length > 0 ? gems[0]?.content ?? null : null };
  } catch { return { totalGems: 0, lastGem: null as string | null }; }
}

// ── Raya (الراية) ────────────────────────────────────────

export function readRaya() {
  const s = stores.raya();
  if (!s) return { hasGoals: false, activeGoals: 0, topGoal: null as string | null };
  try {
    const goals = (s.goals ?? []).filter((g: { status: string }) => g.status === "active");
    return { hasGoals: goals.length > 0, activeGoals: goals.length, topGoal: goals[0]?.title ?? null };
  } catch { return { hasGoals: false, activeGoals: 0, topGoal: null as string | null }; }
}

// ── Warsha (الورشة) ──────────────────────────────────────

export function readWarsha() {
  const s = stores.warsha();
  if (!s) return { hasActiveChallenge: false, challengeName: null as string | null, progress: 0 };
  try {
    const active = s.activeChallenge;
    if (!active) return { hasActiveChallenge: false, challengeName: null, progress: 0 };
    const total = active.totalDays ?? 7;
    const done = active.completedDays ?? 0;
    return { hasActiveChallenge: true, challengeName: active.title ?? null, progress: Math.round((done / total) * 100) };
  } catch { return { hasActiveChallenge: false, challengeName: null as string | null, progress: 0 }; }
}

// ── Relationships (صلة + جسر + جذر) ──────────────────────

export function readRelationships() {
  let sila = null;
  let jisr = null;
  let jathr = null;

  try {
    const s = stores.sila();
    if (s?.people) {
      const people = s.people ?? [];
      const avgQ = people.length > 0 ? people.reduce((a: number, p: { connectionQuality: number }) => a + p.connectionQuality, 0) / people.length : 0;
      sila = { totalConnections: people.length, avgQuality: Math.round(avgQ * 10) / 10 };
    }
  } catch { /* */ }

  try {
    const s = stores.jisr();
    if (s?.fractures) {
      const all = s.fractures ?? [];
      jisr = {
        activeFractures: all.filter((f: { status: string }) => f.status === "active").length,
        repairedCount: all.filter((f: { status: string }) => f.status === "repaired").length,
      };
    }
  } catch { /* */ }

  try {
    const s = stores.jathr();
    if (s?.values) {
      const vals = s.values ?? [];
      const top = vals.slice(0, 3).map((v: { domain: string }) => v.domain);
      const avgA = vals.length > 0 ? vals.reduce((a: number, v: { alignment: number }) => a + v.alignment, 0) / vals.length : 0;
      jathr = { topValues: top, alignmentAvg: Math.round(avgA * 10) / 10 };
    }
  } catch { /* */ }

  return { sila, jisr, jathr };
}

// ── Masarat (المسار) ─────────────────────────────────────

export function readMasarat() {
  const s = stores.masarat();
  if (!s) return { isActive: false, currentPath: null as string | null, currentStage: null as string | null, progress: 0 };
  try {
    return {
      isActive: s.mode === "flow" || s.mode === "insight",
      currentPath: s.selectedPath ?? null,
      currentStage: s.currentStage ?? null,
      progress: s.currentStep ?? 0,
    };
  } catch { return { isActive: false, currentPath: null as string | null, currentStage: null as string | null, progress: 0 }; }
}

// ═══════════════════════════════════════════════════════════
//           REMAINING MODULES (Gap #1 — 12 modules)
// ═══════════════════════════════════════════════════════════

// ── Nabd (النبض) — مراقبة يومية ──────────────────────────

export function readNabd() {
  const s = stores.nabd();
  if (!s) return { hasEntries: false, latestMood: 0, latestEnergy: 0, totalEntries: 0 };
  try {
    const entries = s.entries ?? [];
    const latest = entries.length > 0 ? entries[entries.length - 1] : null;
    return {
      hasEntries: entries.length > 0,
      latestMood: (latest as { mood?: number } | null)?.mood ?? 0,
      latestEnergy: (latest as { energy?: number } | null)?.energy ?? 0,
      totalEntries: entries.length,
    };
  } catch { return { hasEntries: false, latestMood: 0, latestEnergy: 0, totalEntries: 0 }; }
}

// ── Mirah (المرآة) — رؤى ذاتية ──────────────────────────

export function readMirah() {
  const s = stores.mirah();
  if (!s) return { totalInsights: 0, totalMilestones: 0, latestInsight: null as string | null };
  try {
    const insights = s.insights ?? [];
    const milestones = s.milestones ?? [];
    return {
      totalInsights: insights.length,
      totalMilestones: milestones.length,
      latestInsight: insights.length > 0 ? (insights[0] as { content?: string })?.content ?? null : null,
    };
  } catch { return { totalInsights: 0, totalMilestones: 0, latestInsight: null as string | null }; }
}

// ── Shahada (الشهادة) — إنجازات ──────────────────────────

export function readShahada() {
  const s = stores.shahada();
  if (!s) return { totalCerts: 0, highestTier: null as string | null };
  try {
    const certs = s.certificates ?? [];
    const tiers = ["legendary", "gold", "silver", "bronze"];
    const highest = tiers.find(t => certs.some((c: { tier: string }) => c.tier === t)) ?? null;
    return { totalCerts: certs.length, highestTier: highest };
  } catch { return { totalCerts: 0, highestTier: null as string | null }; }
}

// ── Risala (الرسالة) — رسائل شخصية ──────────────────────

export function readRisala() {
  const s = stores.risala();
  if (!s) return { totalMessages: 0, latestTone: null as string | null };
  try {
    const msgs = s.messages ?? [];
    return {
      totalMessages: msgs.length,
      latestTone: msgs.length > 0 ? (msgs[0] as { tone?: string })?.tone ?? null : null,
    };
  } catch { return { totalMessages: 0, latestTone: null as string | null }; }
}

// ── Ruya (الرؤيا) — أحلام وتأملات ───────────────────────

export function readRuya() {
  const s = stores.ruya();
  if (!s) return { totalDreams: 0, totalReflections: 0, dominantMood: null as string | null };
  try {
    const dreams = s.dreams ?? [];
    const reflections = s.reflections ?? [];
    // Find most common dream mood
    const moods = dreams.map((d: { mood?: string }) => d.mood).filter(Boolean);
    const moodCount: Record<string, number> = {};
    moods.forEach((m: string) => { moodCount[m] = (moodCount[m] ?? 0) + 1; });
    const dominant = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return { totalDreams: dreams.length, totalReflections: reflections.length, dominantMood: dominant };
  } catch { return { totalDreams: 0, totalReflections: 0, dominantMood: null as string | null }; }
}

// ── Wasiyya (الوصية) — رسائل للمستقبل ────────────────────

export function readWasiyya() {
  const s = stores.wasiyya();
  if (!s) return { totalLetters: 0, latestMood: null as string | null };
  try {
    const letters = s.letters ?? [];
    return {
      totalLetters: letters.length,
      latestMood: letters.length > 0 ? (letters[0] as { mood?: string })?.mood ?? null : null,
    };
  } catch { return { totalLetters: 0, latestMood: null as string | null }; }
}

// ── Sullam (السُلّم) — سلم النمو ─────────────────────────

export function readSullam() {
  const s = stores.sullam();
  if (!s) return { totalGoals: 0, activeArea: null as string | null, totalRungs: 0 };
  try {
    const goals = s.goals ?? [];
    const active = goals.find((g: { status?: string }) => g.status === "active");
    const totalRungs = goals.reduce((sum: number, g: { rungs?: unknown[] }) => sum + (g.rungs?.length ?? 0), 0);
    return {
      totalGoals: goals.length,
      activeArea: active ? (active as { area?: string }).area ?? null : null,
      totalRungs,
    };
  } catch { return { totalGoals: 0, activeArea: null as string | null, totalRungs: 0 }; }
}

// ── Rafiq (الرفيق) — المرشد الذكي ───────────────────────

export function readRafiq() {
  const s = stores.rafiq();
  if (!s) return { hasSuggestions: false, topSuggestion: null as string | null, currentTone: null as string | null };
  try {
    const suggestions = s.suggestions ?? [];
    const top = suggestions.find((sg: { priority?: string }) => sg.priority === "high");
    return {
      hasSuggestions: suggestions.length > 0,
      topSuggestion: top ? (top as { content?: string }).content ?? null : null,
      currentTone: s.currentTone ?? null,
    };
  } catch { return { hasSuggestions: false, topSuggestion: null as string | null, currentTone: null as string | null }; }
}

// ── Rifaq (الرفاق) — نظام الصداقة ───────────────────────

export function readRifaq() {
  const s = stores.rifaq();
  if (!s) return { activeBuddies: 0, totalMessages: 0 };
  try {
    const buddies = (s.buddies ?? []).filter((b: { status: string }) => b.status === "active");
    const msgs = s.messages ?? [];
    return { activeBuddies: buddies.length, totalMessages: msgs.length };
  } catch { return { activeBuddies: 0, totalMessages: 0 }; }
}

// ── Bathra (البذرة) — العادات ────────────────────────────

export function readBathra() {
  const s = stores.bathra();
  if (!s) return { totalSeeds: 0, growthStage: null as string | null, streakDays: 0 };
  try {
    const seeds = s.seeds ?? [];
    const active = seeds.find((seed: { active?: boolean }) => seed.active);
    return {
      totalSeeds: seeds.length,
      growthStage: active ? (active as { stage?: string }).stage ?? null : null,
      streakDays: s.currentStreak ?? 0,
    };
  } catch { return { totalSeeds: 0, growthStage: null as string | null, streakDays: 0 }; }
}

// ── Naba (النبأ) — إلهام يومي ────────────────────────────

export function readNaba() {
  const s = stores.naba();
  if (!s) return { todayCard: null as string | null, kind: null as string | null };
  try {
    const card = s.todayCard;
    return {
      todayCard: card ? (card as { content?: string }).content ?? null : null,
      kind: card ? (card as { kind?: string }).kind ?? null : null,
    };
  } catch { return { todayCard: null as string | null, kind: null as string | null }; }
}

// ── Observatory (المرصد) — خيوط الرؤى ───────────────────

export function readObservatory() {
  const s = stores.observatory();
  if (!s) return { totalThreads: 0, latestThread: null as string | null };
  try {
    const threads = s.threads ?? [];
    return {
      totalThreads: threads.length,
      latestThread: threads.length > 0 ? (threads[0] as { title?: string }).title ?? null : null,
    };
  } catch { return { totalThreads: 0, latestThread: null as string | null }; }
}

// ── Bawsala (البوصلة) — قرارات ───────────────────────────

interface BawsalaDecisionRaw {
  id: string;
  question: string;
  status: string;
  options: Array<{ id: string; label: string }>;
  chosenOptionId: string | null;
  createdAt: number;
  decidedAt: number | null;
}

export function readBawsala() {
  const s = stores.bawsala();
  if (!s) return {
    totalDecisions: 0, activeDecisions: 0, decidedCount: 0,
    rawDecisions: [] as BawsalaDecisionRaw[],
  };
  try {
    const decisions = s.decisions ?? [];
    const active = decisions.filter((d: { status: string }) => d.status === "active").length;
    const decided = decisions.filter((d: { status: string }) => d.status === "decided").length;

    // Raw decisions — lightweight projection (no deep cloning of pros/cons)
    const rawDecisions: BawsalaDecisionRaw[] = decisions.map(
      (d: { id: string; question: string; status: string; options: Array<{ id: string; label: string }>; chosenOptionId: string | null; createdAt: number; decidedAt: number | null }) => ({
        id: d.id,
        question: d.question,
        status: d.status,
        options: (d.options ?? []).map((o) => ({ id: o.id, label: o.label })),
        chosenOptionId: d.chosenOptionId,
        createdAt: d.createdAt,
        decidedAt: d.decidedAt,
      })
    );

    return { totalDecisions: decisions.length, activeDecisions: active, decidedCount: decided, rawDecisions };
  } catch { return { totalDecisions: 0, activeDecisions: 0, decidedCount: 0, rawDecisions: [] as BawsalaDecisionRaw[] }; }
}

// ── Hafiz (الحافظ) — ذكريات ──────────────────────────────

export function readHafiz() {
  const s = stores.hafiz();
  if (!s) return { totalMemories: 0, gratitudeCount: 0, latestTag: null as string | null };
  try {
    const memories = s.memories ?? [];
    const gratitude = memories.filter((m: { tags?: string[] }) => (m.tags ?? []).includes("gratitude")).length;
    const latest = memories.length > 0 ? (memories[0] as { tags?: string[] })?.tags?.[0] ?? null : null;
    return { totalMemories: memories.length, gratitudeCount: gratitude, latestTag: latest };
  } catch { return { totalMemories: 0, gratitudeCount: 0, latestTag: null as string | null }; }
}

// ═══════════════════════════════════════════════════════════
//                    PLATFORM OBJECT (PUBLIC API)
// ═══════════════════════════════════════════════════════════

/**
 * الواجهة العامة — أي module يقدر يستورد ويستخدم:
 *
 *   import { platform } from "@/shared/platform";
 *   const wird = platform.wird();
 *   const all  = platform.snapshot();
 */
export const platform = {
  // ── Individual reads ──
  pulse:         readPulse,
  resonance:     readResonance,
  khalwa:        readKhalwa,
  khalwaNeed:    checkKhalwaNeed,
  niyya:         readNiyya,
  mithaq:        readMithaq,
  dawra:         readDawra,
  qinaa:         readQinaa,
  wird:          readWird,
  bawsala:       readBawsala,
  hafiz:         readHafiz,
  samt:          readSamt,
  tazkiya:       readTazkiya,
  qalb:          readQalb,
  basma:         readBasma,
  nadhir:        readNadhir,
  zill:          readZill,
  qutb:          readQutb,
  kanz:          readKanz,
  raya:          readRaya,
  warsha:        readWarsha,
  relationships: readRelationships,
  masarat:       readMasarat,
  // ── The 12 remaining ──
  nabd:          readNabd,
  mirah:         readMirah,
  shahada:       readShahada,
  risala:        readRisala,
  ruya:          readRuya,
  wasiyya:       readWasiyya,
  sullam:        readSullam,
  rafiq:         readRafiq,
  rifaq:         readRifaq,
  bathra:        readBathra,
  naba:          readNaba,
  observatory:   readObservatory,

  /**
   * 📸 لقطة شاملة لكل شيء في المنصة — 33 نقطة بيانات
   * أي module يقدر يشوف حالة أي module تاني
   */
  snapshot: () => ({
    pulse:         readPulse(),
    resonance:     readResonance(),
    khalwa:        readKhalwa(),
    niyya:         readNiyya(),
    mithaq:        readMithaq(),
    dawra:         readDawra(),
    qinaa:         readQinaa(),
    wird:          readWird(),
    bawsala:       readBawsala(),
    hafiz:         readHafiz(),
    samt:          readSamt(),
    tazkiya:       readTazkiya(),
    qalb:          readQalb(),
    basma:         readBasma(),
    nadhir:        readNadhir(),
    zill:          readZill(),
    qutb:          readQutb(),
    kanz:          readKanz(),
    raya:          readRaya(),
    warsha:        readWarsha(),
    relationships: readRelationships(),
    masarat:       readMasarat(),
    nabd:          readNabd(),
    mirah:         readMirah(),
    shahada:       readShahada(),
    risala:        readRisala(),
    ruya:          readRuya(),
    wasiyya:       readWasiyya(),
    sullam:        readSullam(),
    rafiq:         readRafiq(),
    rifaq:         readRifaq(),
    bathra:        readBathra(),
    naba:          readNaba(),
    observatory:   readObservatory(),
  }),
};

export type PlatformSnapshot = ReturnType<typeof platform.snapshot>;
