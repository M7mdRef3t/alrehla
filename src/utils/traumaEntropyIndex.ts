import type { MapNode } from "../modules/map/mapTypes";

export interface TEIResult {
  /** 0–100 — كلما ارتفع كلما زادت الفوضى العاطفية */
  score: number;
  /** عدد الدوائر المضطربة (red + yellow) */
  disturbedCount: number;
  /** إجمالي الدوائر النشطة */
  totalCount: number;
  /** متوسط عمر العلاقات الضاغطة (بالأيام) */
  avgAgeDays: number;
  /** رسالة تصف الحالة */
  message: string;
  /** مستوى الوضوح */
  clarityLevel: "chaotic" | "turbulent" | "settling" | "clear";
  /** العوامل المؤثرة على النتيجة */
  factors: {
    ageWeight: number;
    awarenessBonus: number;
    detachmentBonus: number;
  };
}

/** تاريخ الـ TEI — للمقارنة الشهرية */
export interface TEISnapshot {
  date: string;   // "YYYY-MM-DD"
  score: number;
  disturbedCount: number;
  totalCount: number;
  savedAt: number;
}

const TEI_HISTORY_KEY = "dawayir-tei-history";

function getHistory(): TEISnapshot[] {
  try {
    const raw = localStorage.getItem(TEI_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSnapshot(snapshot: TEISnapshot) {
  try {
    const history = getHistory();
    // نحفظ snapshot واحد لكل يوم بس
    const filtered = history.filter((s) => s.date !== snapshot.date);
    const updated = [...filtered, snapshot].slice(-90); // آخر 90 يوم
    localStorage.setItem(TEI_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

function getClarityMessage(score: number, disturbedCount: number, totalCount: number): string {
  if (totalCount === 0) return "ابدأ برسم دوايرك لترى مؤشر وعيك";

  if (score < 20) {
    return `دوايرك هادية.. ${disturbedCount === 0 ? "مفيش علاقات ضاغطة دلوقتي" : `${disturbedCount} علاقة بس محتاجة انتباه`}`;
  }
  if (score < 40) {
    return `في ${disturbedCount} علاقة محتاجة شغل.. الطريق واضح`;
  }
  if (score < 65) {
    return `في ${disturbedCount} من ${totalCount} علاقة بتاخد طاقة.. وعيك هيفرق`;
  }
  return `معظم دوايرك فيها حركة.. ده مش عيب، ده بداية التغيير`;
}

function getClarityLevel(score: number): TEIResult["clarityLevel"] {
  if (score < 20) return "clear";
  if (score < 40) return "settling";
  if (score < 65) return "turbulent";
  return "chaotic";
}

/**
 * حساب Trauma Entropy Index من nodes الحالية
 *
 * الصيغة:
 * TEI = (disturbedNodes/totalNodes) × avgAgeWeight × awarenessBonus
 *
 * - disturbedNodes = red + yellow (غير مرتاح)
 * - avgAgeWeight = كلما طالت العلاقة الضاغطة كلما زاد الـ weight
 * - awarenessBonus = تراجع الـ score لو في أشخاص انتقلوا لـ "محطات عدت"
 */
export function computeTEI(nodes: MapNode[]): TEIResult {
  const activeNodes = nodes.filter((n) => !n.isNodeArchived);
  const archivedNodes = nodes.filter((n) => n.isNodeArchived);

  if (activeNodes.length === 0) {
    return {
      score: 0,
      disturbedCount: 0,
      totalCount: 0,
      avgAgeDays: 0,
      message: "ابدأ برسم دوايرك لترى مؤشر وعيك",
      clarityLevel: "clear",
      factors: { ageWeight: 0, awarenessBonus: 0, detachmentBonus: 0 }
    };
  }

  const disturbedNodes = activeNodes.filter(
    (n) => (n.ring === "red" || n.ring === "yellow") && !n.isDetached
  );

  const detachedNodes = activeNodes.filter((n) => n.isDetached);
  const disturbedCount = disturbedNodes.length;
  const totalCount = activeNodes.length;

  // حساب متوسط عمر العلاقات الضاغطة
  const now = Date.now();
  const ages = disturbedNodes
    .map((n) => n.analysis?.timestamp ?? now)
    .map((t) => (now - t) / (1000 * 60 * 60 * 24)); // بالأيام
  const avgAgeDays = ages.length > 0
    ? ages.reduce((s, v) => s + v, 0) / ages.length
    : 0;

  // نسبة الاضطراب الأساسية (0–1)
  const disturbedRatio = disturbedCount / totalCount;

  // وزن العمر: علاقة ضاغطة قديمة = تأثير أعلى (max عند 180 يوم)
  const ageWeight = Math.min(avgAgeDays / 180, 1);

  // مكافأة الوعي: كل شخص أُرشف = تراجع 3 نقاط
  const awarenessBonus = Math.min(archivedNodes.length * 0.03, 0.3);

  // مكافأة فك الارتباط: كل شخص detached = تراجع 2 نقطة
  const detachmentBonus = Math.min(detachedNodes.length * 0.02, 0.2);

  // الحساب النهائي
  const rawScore = disturbedRatio * (0.6 + ageWeight * 0.4) - awarenessBonus - detachmentBonus;
  const score = Math.round(Math.max(0, Math.min(rawScore, 1)) * 100);

  const message = getClarityMessage(score, disturbedCount, totalCount);
  const clarityLevel = getClarityLevel(score);
  const factors = { ageWeight, awarenessBonus, detachmentBonus };

  return { score, disturbedCount, totalCount, avgAgeDays, message, clarityLevel, factors };
}

/** احفظ snapshot للتاريخ */
export function saveTEISnapshot(tei: TEIResult): void {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  saveSnapshot({
    date,
    score: tei.score,
    disturbedCount: tei.disturbedCount,
    totalCount: tei.totalCount,
    savedAt: Date.now(),
  });
}

/** رجوع تاريخ الـ TEI */
export function getTEIHistory(): TEISnapshot[] {
  return getHistory().sort((a, b) => a.savedAt - b.savedAt);
}

/** مقارنة بين شهرين */
export function getTEIComparison(): { older: TEISnapshot; newer: TEISnapshot; delta: number } | null {
  const history = getTEIHistory();
  if (history.length < 2) return null;
  const older = history[0];
  const newer = history[history.length - 1];
  return { older, newer, delta: older.score - newer.score };
}
