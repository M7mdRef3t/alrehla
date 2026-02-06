import type { Ring } from "../../modules/map/mapTypes";
import { getSymptomLabel } from "../../data/symptoms";

export function getPlanTitle(personLabel: string, ring: Ring): string {
  if (ring === "red") return `خطة حماية طاقتك مع (${personLabel})`;
  if (ring === "yellow") return `خطة توازن علاقتك مع (${personLabel})`;
  return `خطة تعزيز علاقتك مع (${personLabel})`;
}

export function buildInsightFromSymptoms(selectedSymptoms: string[]): string {
  if (selectedSymptoms.length === 0) return "";
  const labels = selectedSymptoms.map(getSymptomLabel).join(" و ");
  return `بناءً على مشكلة (${labels})، ركزنا في الأسبوع الأول على حماية ثقتك بنفسك والحدود بدون قسوة.`;
}
