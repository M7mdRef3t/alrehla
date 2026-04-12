import type { ShadowScore } from "@/domains/consciousness/store/shadowPulse.store";
import type { MapNode } from "@/modules/map/mapTypes";

/** مستويات الـ Shadow Score */
export type ShadowLevel = "none" | "low" | "medium" | "high";

export function getShadowLevel(score: number): ShadowLevel {
  if (score < 20) return "none";
  if (score < 40) return "low";
  if (score < 65) return "medium";
  return "high";
}

/** رسالة مخصصة حسب الـ score والمعلومات */
export function getShadowMessage(shadowScore: ShadowScore, node: MapNode): string {
  const name = node.label;
  const { visitCount, cancelledEdits, lateNightVisits } = shadowScore;

  if (lateNightVisits >= 3) {
    return `لاحظنا إنك بتفتح صفحة "${name}" كتير في الليل.. ربما في حاجة لسه بتشتغل جوا.`;
  }

  if (cancelledEdits >= 2) {
    return `بدأت تعدل في دايرة "${name}" أكتر من مرة وما كملتش.. ربما في قرار لسه مش واضح.`;
  }

  if (visitCount >= 5) {
    return `لاحظنا إنك بتزور دايرة "${name}" كتير من غير ما تعمل حاجة.. ربما في حاجة محتاج وقت.`;
  }

  return `دايرة "${name}" فيها طاقة لسه مش اتعالجت.. هل جاهز تواجهها؟`;
}

/** ترتيب الأشخاص حسب الـ shadow score */
export function sortNodesByShadow(
  nodes: MapNode[],
  scores: Record<string, ShadowScore>
): Array<{ node: MapNode; shadow: ShadowScore }> {
  return nodes
    .filter((n) => !n.isNodeArchived && scores[n.id])
    .map((node) => ({ node, shadow: scores[node.id] }))
    .sort((a, b) => b.shadow.score - a.shadow.score);
}
