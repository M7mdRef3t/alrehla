import type { MapNode, OrbitHistoryEntry, Ring } from "@/modules/map/mapTypes";

type OrbitReplayTone = "green" | "yellow" | "red" | "archived";

export interface OrbitDriftReplayStep {
  id: string;
  title: string;
  caption: string;
  tone: OrbitReplayTone;
  timestamp: number;
}

export interface OrbitDriftReplaySnapshot {
  title: string;
  summary: string;
  steps: OrbitDriftReplayStep[];
}

const ringLabel: Record<Ring, string> = {
  green: "المدار الأخضر",
  yellow: "المدار الأصفر",
  red: "المدار الأحمر"
};

const ringRank: Record<Ring, number> = {
  green: 0,
  yellow: 1,
  red: 2
};

function eventToStep(entry: OrbitHistoryEntry): OrbitDriftReplayStep {
  if (entry.type === "created") {
    return {
      id: entry.id,
      title: "بداية القراءة",
      caption: `تم تثبيت العلاقة في ${ringLabel[entry.ring]}`,
      tone: entry.ring,
      timestamp: entry.timestamp
    };
  }

  if (entry.type === "archived") {
    return {
      id: entry.id,
      title: "الخروج إلى الأرشيف",
      caption: "تم تجميد العلاقة لحماية المساحة",
      tone: "archived",
      timestamp: entry.timestamp
    };
  }

  if (entry.type === "restored") {
    return {
      id: entry.id,
      title: "العودة إلى الخريطة",
      caption: `رجعت العلاقة إلى ${ringLabel[entry.ring]}`,
      tone: entry.ring,
      timestamp: entry.timestamp
    };
  }

  const movedOutward =
    entry.fromRing != null && ringRank[entry.ring] > ringRank[entry.fromRing];

  return {
    id: entry.id,
    title: movedOutward ? "ابتعدت خطوة" : "اقتربت خطوة",
    caption:
      entry.fromRing != null
        ? `${ringLabel[entry.fromRing]} ← ${ringLabel[entry.ring]}`
        : `انتقلت إلى ${ringLabel[entry.ring]}`,
    tone: entry.ring,
    timestamp: entry.timestamp
  };
}

export function deriveOrbitDriftReplay(
  node: Pick<MapNode, "orbitHistory" | "ring" | "isNodeArchived">,
  displayName: string
): OrbitDriftReplaySnapshot | null {
  const history = [...(node.orbitHistory ?? [])].sort((a, b) => a.timestamp - b.timestamp);
  if (history.length < 2) return null;

  let outwardMoves = 0;
  let inwardMoves = 0;
  let archiveCount = 0;

  for (const entry of history) {
    if (entry.type === "archived") archiveCount += 1;
    if (entry.type !== "ring_changed" || !entry.fromRing) continue;
    if (ringRank[entry.ring] > ringRank[entry.fromRing]) outwardMoves += 1;
    if (ringRank[entry.ring] < ringRank[entry.fromRing]) inwardMoves += 1;
  }

  const summary =
    archiveCount > 0
      ? `${displayName} خرجت من الخريطة ${archiveCount} مرة بعد ${outwardMoves} حركة ابتعاد واضحة.`
      : outwardMoves > inwardMoves
        ? `${displayName} انجرفت تدريجيًا إلى الخارج أكثر مما اقتربت، وهذا يشرح لماذا المسافة أصبحت ضرورية.`
        : `${displayName} تحركت بين المدارات أكثر من مرة؛ مشاهدة النمط تساعدك على تمييز التذبذب بدل الشك في نفسك.`;

  return {
    title: "إعادة تشغيل انجراف المدار",
    summary,
    steps: history.slice(-6).map(eventToStep)
  };
}
