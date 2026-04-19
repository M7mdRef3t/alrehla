import { geminiClient } from "./geminiClient";
import type { MapNode } from "@/modules/map/mapTypes";

export interface DailySovereignState {
  insight: string;
  action: string;
  focusNodeId?: string;
  focusNodeLabel?: string;
}

const FALLBACK_STATES: DailySovereignState[] = [
  {
    insight: "الرحلة بتحتاج تقف عشان تعرف تتحرك تاني. خريطتك محتاجة بيانات أكتر عشان تتفهم.",
    action: "حدد شخص واحد في حياتك النهاردة بيسحب طاقتك وضيفه للخريطة."
  },
  {
    insight: "الدواير الفاضية بتدي مساحة لدواير مزيفة تتملي. لازم تحدد موقعك الاستراتيجي.",
    action: "قيم مستوى طاقتك دلوقتي (Body, Energy, Time) في لوحة النبض."
  }
];

export async function generateDailySovereignState(nodes: MapNode[]): Promise<DailySovereignState> {
  const activeNodes = nodes.filter(n => !n.isNodeArchived);

  if (activeNodes.length === 0) {
    return FALLBACK_STATES[Math.floor(Math.random() * FALLBACK_STATES.length)];
  }

  // State Compression for Gemini (To save input tokens)
  const compressedMap = activeNodes.map(n => {
    // Calculate net energy if transactions exist
    let drain = 0;
    if (n.energyBalance) {
       drain = n.energyBalance.totalDrain || 0;
    }
    
    return {
      id: n.id,
      label: n.label,
      ring: n.ring,
      isPowerBank: n.isPowerBank || false,
      drainAmount: drain,
      pathStage: n.recoveryProgress?.pathStage || "awareness"
    };
  });

  const prompt = `
أنت "الوكيل الاستراتيجي (Journey Agent)" الخاص بمسافر في منصة "الرحلة".
مهمتك: تقديم تقرير استخباراتي يومي (Daily State) يقوّي سيادته النفسية بناءً على شكل خريطته.

حالة الخريطة المختصرة للمسافر (بناءً على مداراته وحسابات استنزاف الطاقة):
${JSON.stringify(compressedMap, null, 2)}

الرجاء تحليل هذه البيانات والخروج بنصيحة واستبصار يومي.
شروط الرد:
1. استبصار (insight): جملتين بالعامية المصرية العميقة الحادة (First Principles) تلخص الوضع العام لخريطته (مثلاً: ملاحظة تجمع كبير في المدار الأحمر، أو استنزاف عالي من شخص، أو استقرار).
2. فعل (action): خطوة واحدة صغيرة جداً جداً ياخدها النهاردة (مثلاً بخصوص شخص محدد أو تأمين حدود).
3. (اختياري) focusNodeId: إذا كان هناك شخص معين يمثل "أكبر استنزاف" أو "يحتاج قرار عاجل"، أعده مع اسمه focusNodeLabel.

المخرجات يجب أن تكون بصيغة JSON حصراً بهذا الشكل:
{
  "insight": "...",
  "action": "...",
  "focusNodeId": "id",
  "focusNodeLabel": "اسم الشخص"
}
لا تضف أي نص آخر، فقط كائن JSON صريح.
`;

  try {
    const result = await geminiClient.generateJSON<DailySovereignState>(prompt, "journey_daily_state");
    if (result && result.insight && result.action) {
      return result;
    }
    return FALLBACK_STATES[0];
  } catch (error) {
    console.error("[JourneyAgent] Failed to generate state:", error);
    return FALLBACK_STATES[0];
  }
}
