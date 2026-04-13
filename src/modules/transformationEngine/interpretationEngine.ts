import { DANGER_TOKENS, VIOLENCE_TOKENS } from "./safetyTokens";
import type { AdviceCategory } from "@/data/adviceScripts";

export type PoeticState = "توهة المدارات" | "نبض مشحون" | "نزيف طاقة" | "محطة انتظار" | "مستقر نسبياً";

export interface TransformationDiagnosis {
  state: PoeticState;
  rootTension: string;
  protocolKey: "clarity" | "grounding" | "boundary" | "momentum";
  firstStep: string;
  commitmentPledge: string;
  riskLevel: "low" | "medium" | "high" | "emergency";
}

export function safetyTriage(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return DANGER_TOKENS.some(token => lowerText.includes(token)) || 
         VIOLENCE_TOKENS.some(token => lowerText.includes(token));
}

export function classifyState(
  painDump: string, 
  itemCounts: { red: number; yellow: number; green: number },
  primaryCategory?: AdviceCategory
): TransformationDiagnosis {
  const { red, yellow, green } = itemCounts;

  // 1. High Tension / Crisis (Red dominant)
  if (red >= 2 || (red >= 1 && green === 0)) {
    return {
      state: "نزيف طاقة",
      rootTension: "استنزاف متبادل وفقدان للحدود",
      protocolKey: "boundary",
      firstStep: "قلل نقطة النزيف الأكبر",
      commitmentPledge: "ألتزم بتقليل الاحتكاك مع الشخص المستنزف لمدة أسبوع.",
      riskLevel: "high"
    };
  }

  // 2. Triggered / High Emotion (Keywords in Pain Dump)
  const emotionalKeywords = ["غليان", "مخنوق", "هفرقع", "مقهور", "مش قادر سكت"];
  const isTriggered = emotionalKeywords.some(w => painDump.includes(w));
  if (isTriggered || (red === 1 && yellow >= 1)) {
    return {
      state: "نبض مشحون",
      rootTension: "غضب أو حزن غير معبن عنه",
      protocolKey: "grounding",
      firstStep: "فرّغ النبض المشحون بالكتابة",
      commitmentPledge: "ألتزم بكتابة رسالة (لن تُرسل) أفرغ فيها كل غضبي اليوم.",
      riskLevel: "medium"
    };
  }

  // 3. Confused / Ambiguous (Yellow dominant)
  if (yellow >= 2 || (yellow >= 1 && green <= 1)) {
    return {
      state: "توهة المدارات",
      rootTension: "غياب الوضوح وضبابية في المسافات",
      protocolKey: "clarity",
      firstStep: "سمّي العلاقة الرمادية",
      commitmentPledge: "ألتزم بتحديد نوع شعوري الواضح تجاه أكثر علاقة محيرة.",
      riskLevel: "low"
    };
  }

  // 4. Stuck / Lack of Momentum (Inventory is sparse or static)
  if (red === 0 && yellow === 0 && green > 0) {
    return {
      state: "محطة انتظار",
      rootTension: "ركود مشاعري أو حذر زائد",
      protocolKey: "momentum",
      firstStep: "قوّي النواة بطلب دعم",
      commitmentPledge: "ألتزم بطلب دعم بسيط ومحدد من شخص في النواة.",
      riskLevel: "low"
    };
  }

  // Default Stable
  return {
    state: "مستقر نسبياً",
    rootTension: "توازن حالي مع وجود مساحات للتطوير",
    protocolKey: "clarity",
    firstStep: "راقب خريطة وعيك",
    commitmentPledge: "ألتزم بمراقبة مشاعري عند التعامل مع الدوائر غداً.",
    riskLevel: "low"
  };
}
