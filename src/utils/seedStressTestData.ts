/**
 * Stress Test Seed — توليد بيانات تجريبية للاختبار
 * للاستخدام: استدعِ من لوحة الأدمن أو من Console عبر window.__seedStressTest
 */

import { useMapState } from "@/state/mapState";
import type { JourneyEvent, JourneyEventPayload } from "@/services/journeyTracking";
import { getFromLocalStorage, setInLocalStorage } from "@/services/browserStorage";
import { runtimeEnv } from "@/config/runtimeEnv";

const KEY_EVENTS = "dawayir-journey-events";
const MAX_EVENTS = 2000;

const MOCK_LABELS = [
  "أمي", "أبوي", "أختي", "أخوي", "جدتي", "جدي", "عمي", "خالتي",
  "مدير", "زميل", "صديق قديم", "صديقة", "جار", "زوجتي", "خطيبي",
  "مدير سابق", "عميل", "مدرس", "دكتور", "محامي", "محاسب",
  "صاحبي", "صاحبتي", "ابن عمي", "ابنة خالتي", "صديق المكتب",
  "العم أحمد", "الخالة فاطمة", "زميل الجامعة", "الجار الجديد",
  "الرئيس المباشر", "موظف الاستقبال", "سائق التاكسي", "بائع المحل",
  "مدير", "شخص مؤثر", "معلم", "محتاج مسافة", "استنزاف قديم"
];

const TASK_LABELS = [
  "الرد البارد", "قفل الإشعارات", "قول لا للالتزام", "رسم حد واضح",
  "تجاهل الرسالة", "الصيام الشعوري", "بلوك مؤقت", "تأجيل الرد",
  "تمرين التنفس", "كتابة المشاعر", "مراجعة الحدود", "خطوة صغيرة"
];

function loadEvents(): JourneyEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = getFromLocalStorage(KEY_EVENTS);
    if (!raw) return [];
    const arr = JSON.parse(raw) as JourneyEvent[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveEvents(events: JourneyEvent[]): void {
  if (typeof window === "undefined") return;
  const trimmed = events.slice(-MAX_EVENTS);
  try {
    setInLocalStorage(KEY_EVENTS, JSON.stringify(trimmed));
  } catch (e) {
    if (runtimeEnv.isDev) console.warn("seedStressTest: save failed", e);
  }
}

/** إضافة عُقد للخريطة */
export function seedMapNodes(count: number): string[] {
  const addNode = useMapState.getState().addNode;
  const rings: Array<"green" | "yellow" | "red"> = ["green", "yellow", "red"];
  const nodeIds: string[] = [];
  const labels = [...MOCK_LABELS];

  for (let i = 0; i < count; i++) {
    const label = labels[i % labels.length] + (i >= labels.length ? ` ${Math.floor(i / labels.length) + 1}` : "");
    const ring = rings[i % 3];
    const analysis = {
      score: ring === "red" ? 5 : ring === "yellow" ? 3 : 1,
      answers: { q1: "sometimes", q2: "sometimes", q3: "rarely" } as const
    };
    const nodeId = addNode(label, ring, analysis, "general");
    nodeIds.push(nodeId);
  }

  return nodeIds;
}

/** إضافة أحداث للسجل */
export function seedJourneyEvents(nodeIds: string[], count: number): void {
  const events = loadEvents();
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const nodeId = nodeIds[i % nodeIds.length]!;
    const ts = now - (count - i) * 3600000 * 2; // توزيع على أسابيع

    if (i % 3 === 0) {
      events.push({
        type: "task_completed",
        payload: {
          pathId: "path_protection",
          taskId: `t-${i}`,
          date: new Date(ts).toISOString().slice(0, 10),
          taskLabel: TASK_LABELS[i % TASK_LABELS.length],
          personLabel: `شخص ${(i % 10) + 1}`,
          nodeId
        } as JourneyEventPayload["task_completed"],
        timestamp: ts
      });
    } else if (i % 3 === 1) {
      events.push({
        type: "node_added",
        payload: {
          ring: ["red", "yellow", "green"][i % 3] as "red" | "yellow" | "green",
          personLabel: `شخص ${(i % 10) + 1}`,
          nodeId
        } as JourneyEventPayload["node_added"],
        timestamp: ts
      });
    } else {
      events.push({
        type: "path_started",
        payload: {
          pathId: "path_protection",
          zone: "red"
        } as JourneyEventPayload["path_started"],
        timestamp: ts
      });
    }
  }

  events.sort((a, b) => b.timestamp - a.timestamp);
  saveEvents(events);
}

/** تشغيل Stress Test كامل */
export function seedStressTestData(): { nodeCount: number; eventCount: number } {
  const nodeCount = 48;
  const eventCount = 120;

  const nodeIds = seedMapNodes(nodeCount);
  seedJourneyEvents(nodeIds, eventCount);

  return { nodeCount, eventCount };
}
