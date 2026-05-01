import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScienceBehindFeelingProps {
  verdictAction: string;
  isFamilyRelation: boolean;
  displayName: string;
}

interface ScienceInsight {
  title: string;
  icon: string;
  explanation: string;
  science: string;
  truthText?: string; // Quranic truth-text — same conclusion as science
}

function getScienceInsights(
  verdictAction: string,
  isFamilyRelation: boolean,
  displayName: string
): ScienceInsight[] {
  const insights: ScienceInsight[] = [];

  // Family rescue pattern
  if (isFamilyRelation && (verdictAction === "protect" || verdictAction === "safe_distance")) {
    insights.push({
      title: "مثلث الإنقاذ",
      icon: "🔺",
      explanation: `أنت بتلعب دور "المُنقذ" — وده دور اتعلمته من صغرك. كل ما ${displayName} يقع في مشكلة، عقلك بيشغّل نفس البرنامج القديم: "لازم أحل أنا".`,
      science: "Karpman Drama Triangle (1968): المُنقذ بيفضل يلعب دوره مش عشان بيحب — عشان لو وقف هيحس إنه فقد هويته. الدور بيتحول لإدمان سلوكي.",
      truthText: "\"لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا\" — النص والعلم وصلوا لنفس النتيجة: أنت مش مطالب تشيل أكتر من طاقتك."
    });

    insights.push({
      title: "الذنب المبرمج",
      icon: "⚡",
      explanation: "كل ما تفكر توقف عن الإنقاذ، بتحس بذنب خانق. الذنب ده مش حقيقي — ده برمجة ثقافية وعائلية زُرعت فيك من صغرك.",
      science: "Internalized Guilt (Developmental Psychology): الأطفال اللي اتحمّلوا مسؤولية أكبر من سنهم بيكبروا وعندهم 'guilt reflex' تلقائي لما يحاولوا يحطوا حدود.",
      truthText: "\"وَلَا تَزِرُ وَازِرَةٌ وِزْرَ أُخْرَىٰ\" — كل نفس تتحمل وزرها. مسؤوليتك عن نفسك — مش عن أفعال غيرك."
    });

    insights.push({
      title: "إدمان الأدرينالين",
      icon: "🧪",
      explanation: "عقلك اتعوّد على القلق والطوارئ المستمرة. لما الأمور بتهدى — بتحس بفراغ غريب. فبترجع للأزمة عشان 'تحس بحاجة'.",
      science: "Cortisol Addiction (Neuroscience): التعرض المزمن للضغط بيعيد برمجة مستقبلات الكورتيزول في المخ. الجسم بيتعامل مع الهدوء كأنه 'خطر' — لأنه مش متعود عليه.",
    });

    insights.push({
      title: "مغالطة التكلفة الغارقة",
      icon: "🕳️",
      explanation: `"أنا صرفت سنين من عمري عشانه — مش هقدر أوقف دلوقتي". ده بالظبط اللي بيخليك مكمّل في طريق أنت عارف إنه مسدود.`,
      science: "Sunk Cost Fallacy (Behavioral Economics): البشر بيكملوا في استثمارات خاسرة عشان 'اللي راح' — مش عشان 'اللي جاي'. عقلك بيحسب اللي خسرته ومش بيحسب اللي ممكن تكسبه لو وقفت.",
    });

    insights.push({
      title: "مثلث الألم العائلي",
      icon: "💔",
      explanation: `أنت مش بتشيل ضغط من ${displayName} بس — بتشيل كمان ألم أمك وحزنها على عيالها. أنت في المنتصف بين اتنين بيتألموا — وأي قرار بتاخده هيأذي واحد منهم. ده بالظبط اللي بيشلّك.`,
      science: "Family Systems Theory (Murray Bowen): في الأنظمة العائلية المغلقة، الفرد 'الأكثر مسؤولية' بيتحمل ضغط كل أعضاء النظام. ألم الأم الحقيقي بيتحول لضغط غير مباشر على الابن المسؤول — مش بقصد، لكن ده بيحصل.",
      truthText: "ألم أمك حقيقي ومشروع — هي بتتألم على ابنها وحياتها. لكن إنقاذها من الألم ده مش في إيدك أنت. اللي في إيدك: إنك تكون موجود وتحبها — مش إنك تحل المشكلة اللي هي نفسها مش قادرة تحلها."
    });

    insights.push({
      title: "الرهينة العاطفية",
      icon: "🔐",
      explanation: "لما بتحس إن وقفك عن المساعدة هيكسر قلب أمك أو يزيد ألمها — أنت بقيت رهينة عاطفية. مش لأن أمك بتعمل كده بقصد — لكن لأن النظام العائلي كله اتبنى على إنك 'الإنسان اللي بيصلح الأمور'.",
      science: "Parentification & Emotional Hostage (Psychology): لما الطفل يتحمل المسؤولية العاطفية للأهل من صغره، بيكبر وعنده صعوبة في الفصل بين 'أحب أمي' و'مسؤول عن سعادتها'. الاتنين بيتداخلوا في عقله ويبانوا شيء واحد — وهما مش كده.",
      truthText: "\"وَبِالْوَالِدَيْنِ إِحْسَانًا\" — الإحسان للوالدين مش معناه إنك تبقى مسؤول عن كل ألمهم. الإحسان هو الحضور والحب — مش حل كل مشكلة بيشوفوها."
    });
  }

  // Non-family cut
  if (!isFamilyRelation && verdictAction === "cut") {
    insights.push({
      title: "الترابط الصدمي",
      icon: "🔗",
      explanation: `العلاقة مع ${displayName} فيها دورة: إيذاء → اعتذار → هدوء → إيذاء. الدورة دي بتنتج رابطة كيميائية أقوى من العلاقات العادية.`,
      science: "Trauma Bonding (Patrick Carnes, 1997): دورات الألم والمكافأة المتقطعة بتنتج ارتباط أقوى من العلاقات المستقرة — نفس ميكانيكية إدمان القمار.",
    });

    insights.push({
      title: "الخوف من الفراغ",
      icon: "🌀",
      explanation: "مش خايف تخسره — خايف من 'الفراغ' اللي هيسيبه. عقلك بيساوي بين 'وحدي' و'ضعيف' — وده مش حقيقي.",
      science: "Fear of Emptiness (Existential Psychology): البشر بيتحملوا ألم مألوف بدل ما يواجهوا مجهول مريح. المعروف — حتى لو مؤلم — بيحسسك بأمان زائف.",
    });
  }

  // Distance / emotional prisoner
  if (verdictAction === "distance") {
    insights.push({
      title: "الاجترار العقلي",
      icon: "🔄",
      explanation: `عقلك بيعيد نفس الأفكار عن ${displayName} في لوب لا نهائي. مش عشان فيه حل — عشان المخ بيفتكر إن التفكير = سيطرة.`,
      science: "Rumination (Nolen-Hoeksema, 2000): التفكير المتكرر مش بيحل المشكلة — بيعمقها. المخ بيخلط بين 'التحليل' و'القلق الإنتاجي' — والحقيقة إن الاتنين مختلفين.",
      truthText: "\"أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ\" — الاتصال بالمصدر هو اللي بيكسر لوب الاجترار — مش مزيد من التفكير."
    });
  }

  // Eggshells / negotiate
  if (verdictAction === "negotiate") {
    insights.push({
      title: "استجابة التجمّد",
      icon: "🧊",
      explanation: "لما بتحس بخطر مع شخص قريب، عقلك مش بيختار 'هروب أو مواجهة' — بيختار 'تجمّد'. بتسكت، بتوافق، بتتجنب — مش عشان ضعيف، عشان مخك بيحميك بأقدم طريقة ممكنة.",
      science: "Freeze Response (Polyvagal Theory — Stephen Porges): الجهاز العصبي بيختار التجمّد لما المواجهة والهروب مش متاحين. ده مش قرار واعي — ده بيولوجيا.",
    });
  }

  // Universal insight — always show
  insights.push({
    title: "أنت مش ضعيف — أنت مبرمج",
    icon: "🧬",
    explanation: "كل الأنماط دي — الذنب، الإنقاذ، التجمّد، التعلق — مش عيوب فيك. دي برامج عقلك اتعلمها عشان ينجو. المشكلة إنها لسه شغالة بعد ما الخطر الأصلي خلص.",
    science: "Neuroplasticity: المخ بيتغير بالتكرار الواعي. الأنماط القديمة ممكن تتكسر — بس محتاج وقت، وعي، وتكرار جديد. أول خطوة: إنك تشوفها. وأنت لسه هنا — يعني بدأت.",
    truthText: "\"إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ\" — التغيير يبدأ من جوه. النص والعلم وصلوا لنفس النتيجة."
  });

  return insights;
}

export const ScienceBehindFeeling: FC<ScienceBehindFeelingProps> = ({
  verdictAction,
  isFamilyRelation,
  displayName
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const insights = getScienceInsights(verdictAction, isFamilyRelation, displayName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 }}
      className="relative"
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full text-right p-5 sm:p-6 rounded-2xl border transition-all duration-300 ${
          isExpanded
            ? "bg-indigo-500/[0.04] border-indigo-500/20"
            : "bg-white/[0.02] border-white/8 hover:bg-white/[0.04] hover:border-white/12"
        }`}
      >
        <div className="flex items-center justify-between">
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-white/40 text-sm"
          >↓</motion.span>
          <div className="flex items-center gap-3">
            <span className="text-lg">🧠</span>
            <div>
              <h4 className="text-sm font-black text-white/90 font-tajawal">ليه بتحس كده — بالعلم</h4>
              <p className="text-[11px] text-white/40 font-tajawal">مش عشان تبرر — عشان تفهم وتتحرر</p>
            </div>
          </div>
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 mt-4">
              {insights.map((insight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.12 }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedCard(expandedCard === idx ? null : idx)}
                    className="w-full text-right"
                  >
                    <div className={`p-5 sm:p-6 rounded-xl border transition-all duration-300 ${
                      expandedCard === idx
                        ? "bg-indigo-500/[0.06] border-indigo-500/25"
                        : "bg-white/[0.02] border-white/8 hover:bg-white/[0.04]"
                    }`}>
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-xl shrink-0 mt-0.5">{insight.icon}</span>
                        <h5 className={`text-base font-black flex-1 ${
                          expandedCard === idx ? "text-white" : "text-white/80"
                        }`}>
                          {insight.title}
                        </h5>
                      </div>

                      {/* Explanation — always visible */}
                      <p className="text-sm text-white/60 leading-relaxed mr-9 font-medium">
                        {insight.explanation}
                      </p>

                      {/* Science + Truth Text — expanded */}
                      <AnimatePresence>
                        {expandedCard === idx && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.25 }}
                            className="mt-4 mr-9 space-y-3"
                          >
                            {/* Science Source */}
                            <div className="p-4 rounded-lg bg-indigo-500/[0.06] border-r-2 border-indigo-500/40">
                              <p className="text-[10px] font-black text-indigo-400 mb-1.5 font-tajawal tracking-wider">المصدر العلمي</p>
                              <p className="text-xs text-indigo-200/70 leading-relaxed">
                                {insight.science}
                              </p>
                            </div>

                            {/* Truth Text — if available */}
                            {insight.truthText && (
                              <div className="p-4 rounded-lg bg-amber-500/[0.04] border-r-2 border-amber-500/30">
                                <p className="text-[10px] font-black text-amber-400 mb-1.5 font-tajawal tracking-wider">النص والعلم وصلوا لنفس النتيجة</p>
                                <p className="text-xs text-amber-200/70 leading-relaxed">
                                  {insight.truthText}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* ═══ Seek Help Anchor ═══ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: insights.length * 0.12 + 0.4 }}
              className="mt-6 p-6 rounded-xl bg-gradient-to-br from-teal-500/[0.06] to-indigo-500/[0.04] border border-teal-500/15 text-right"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-xl shrink-0">🤝</span>
                <div>
                  <h5 className="text-sm font-black text-white/90 font-tajawal mb-1">محتاج حد يمشي معاك في ده؟</h5>
                  <p className="text-xs text-white/50 leading-relaxed font-tajawal">
                    الرحلة بتوريك الحقيقة وبتمشي جنبك — لكن بعض الطرق محتاجة رفيق بشري كمان.
                    المتخصص مش بديل عنك — هو حد بيشوف اللي أنت مش قادر تشوفه وأنت جواها.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4 mr-9">
                <a
                  href="https://wa.me/2001110795932"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.04] border border-white/8 hover:bg-white/[0.08] hover:border-teal-500/30 transition-all group"
                >
                  <span className="text-sm">💬</span>
                  <span className="text-xs font-bold text-white/60 group-hover:text-teal-300 transition-colors font-tajawal">
                    تواصل مع متخصص في العلاقات العائلية
                  </span>
                </a>

                <a
                  href="tel:08008880700"
                  className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.04] border border-white/8 hover:bg-white/[0.08] hover:border-teal-500/30 transition-all group"
                >
                  <span className="text-sm">📞</span>
                  <span className="text-xs font-bold text-white/60 group-hover:text-teal-300 transition-colors font-tajawal">
                    خط نجدة الصحة النفسية — 08008880700 (مجاني ٢٤ ساعة)
                  </span>
                </a>

                <a
                  href="tel:16328"
                  className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.04] border border-white/8 hover:bg-white/[0.08] hover:border-teal-500/30 transition-all group"
                >
                  <span className="text-sm">🏥</span>
                  <span className="text-xs font-bold text-white/60 group-hover:text-teal-300 transition-colors font-tajawal">
                    الأمانة العامة للصحة النفسية وعلاج الإدمان — 16328
                  </span>
                </a>
              </div>

              <p className="text-[11px] text-white/25 mt-4 mr-9 font-tajawal">
                طلب المساعدة مش ضعف — ده أشجع قرار ممكن تاخده.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
