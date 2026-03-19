"use client";

import { Sparkles } from "lucide-react";
import { useMemo } from "react";
import type { LiveLanguage } from "../types";

const MIRROR_TEMPLATES = {
  ar: {
    "1->3_few": [
      "بدأت من الإحساس ووصلت إلى الوضوح بسرعة نادرة.",
      "من القلب إلى الحقيقة مباشرة، وده معناه إنك كنت شايفها من جوه.",
    ],
    "1->3_many": ["رحلة طويلة من الإحساس، وفي الآخر وصلت للحقيقة اللي كانت مستخبية من الأول."],
    "1->2->3_few": [
      "حسيت، فكرت، وقررت. الجلسة أخذت رحلتها كاملة.",
      "من اللخبطة إلى التفكير إلى الوضوح. ده كان مسارًا كاملًا فعلًا.",
    ],
    "1->2->3_many": ["رحلة غنية بدأت بمشاعر متشابكة وانتهت بقرار أوضح من الأول."],
    "1->1_few": ["كانت جلسة إحساس عميق، وده غالبًا أول باب للفهم."],
    "2->2_few": ["لفيت المشكلة من كل ناحية، وده قربك من الوضوح."],
    "2->3_few": ["من التحليل إلى اليقين. القرار هنا طالع من أرض ثابتة."],
    "3->3_few": ["وصلت للوضوح بسرعة، ودي لحظة قليلة بس قوية."],
    default: ["رحلة صادقة ناحية الوضوح، وكل خطوة فيها كان لها معنى."],
  },
  en: {
    "1->3_few": [
      "You moved from feeling directly to clarity. Rare and powerful.",
      "From the heart straight to truth.",
    ],
    "1->3_many": ["A long journey from emotion, and you arrived at what you always knew."],
    "1->2->3_few": [
      "You felt, thought, and decided. The full journey in one session.",
      "From chaos to thinking to clarity. The most beautiful arc.",
    ],
    "1->2->3_many": ["A rich journey: you started with tangled feelings and ended with a clear decision."],
    "1->1_few": ["A session of deep feeling. Emotional awareness is always the beginning."],
    "2->2_few": ["An analytical session. Your mind was working deeply."],
    "2->3_few": ["From analysis to certainty. Your decision stands on solid ground."],
    "3->3_few": ["You reached clarity quickly, and that is rare."],
    default: ["An honest journey toward clarity, and every step had meaning."],
  },
} as const;

function getMirrorKey(journeyPath: number[], transitionCount: number) {
  const bucket = transitionCount <= 2 ? "few" : "many";
  return `${journeyPath.join("->")}_${bucket}`;
}

export default function MirrorSentence({
  journeyPath,
  transitionCount,
  language,
  visible = true,
}: {
  journeyPath: number[];
  transitionCount: number;
  language: LiveLanguage;
  visible?: boolean;
}) {
  const sentence = useMemo(() => {
    if (!visible || journeyPath.length === 0) return "";
    const templates = MIRROR_TEMPLATES[language] ?? MIRROR_TEMPLATES.ar;
    const key = getMirrorKey(journeyPath, transitionCount);
    const choices = templates[key as keyof typeof templates] ?? templates.default;
    return choices[transitionCount % choices.length];
  }, [journeyPath, transitionCount, language, visible]);

  if (!visible || !sentence) return null;

  return (
    <div className="mirror-sentence-wrap">
      <div className="mirror-sentence-ornament" aria-hidden="true">
        <Sparkles size={16} />
      </div>
      <blockquote className="mirror-sentence-text">{sentence}</blockquote>
      <div className="mirror-sentence-label">{language === "ar" ? "مرآة رحلتك" : "Your journey mirror"}</div>
    </div>
  );
}
