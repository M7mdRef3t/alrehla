/**
 * comprehensiveAssessmentData.ts
 * بيانات التحليل الشامل — 5 أبعاد × 4 أسئلة = 20 سؤال
 */

export interface CAQuestion {
  question: string;
  options: { text: string; value: number }[];
}

export interface CADimension {
  id: string;
  title: string;
  emoji: string;
  color: string;
  questions: CAQuestion[];
  interpret: (score: number) => { label: string; description: string; emoji: string };
}

const OPT4 = [
  { text: "دائماً", value: 3 },
  { text: "غالباً", value: 2 },
  { text: "أحياناً", value: 1 },
  { text: "نادراً", value: 0 },
];

const OPT4_AGR = [
  { text: "أوافق بشدة", value: 3 },
  { text: "أوافق", value: 2 },
  { text: "لا أوافق", value: 1 },
  { text: "لا أوافق أبداً", value: 0 },
];

const OPT4_REV = [
  { text: "أوافق بشدة", value: 0 },
  { text: "أوافق", value: 1 },
  { text: "لا أوافق", value: 2 },
  { text: "لا أوافق أبداً", value: 3 },
];

function interpret3(score: number, max: number, labels: [string, string, string], descs: [string, string, string], emojis: [string, string, string]) {
  const pct = score / max;
  const i = pct >= 0.66 ? 0 : pct >= 0.33 ? 1 : 2;
  return { label: labels[i], description: descs[i], emoji: emojis[i] };
}

export const CA_DIMENSIONS: CADimension[] = [
  /* ─── 1. نمط التعلق ─── */
  {
    id: "attachment",
    title: "نمط التعلق",
    emoji: "🔗",
    color: "#A78BFA",
    questions: [
      { question: "أشعر بالراحة لما أكون قريب عاطفياً من حد", options: OPT4 },
      { question: "أقلق إن الناس اللي بحبهم ممكن يسيبوني", options: OPT4_REV },
      { question: "أثق بسهولة في نوايا الآخرين", options: OPT4 },
      { question: "أفضل الاعتماد على نفسي بدل ما أطلب مساعدة", options: OPT4_REV },
    ],
    interpret: (score) => interpret3(score, 12,
      ["تعلق آمن", "تعلق حذر", "تعلق قلق"],
      [
        "أنت مرتاح في العلاقات القريبة وعندك قدرة صحية على الثقة والتعبير عن احتياجاتك.",
        "عندك بعض التحفظات في القرب العاطفي. ممكن تتردد في الثقة أو تطلب مساحة أكتر مما تحتاج.",
        "بتميل للقلق أو الانسحاب في العلاقات. فهم نمط تعلقك هو الخطوة الأولى للتغيير.",
      ],
      ["🌿", "💛", "⚡"]
    ),
  },

  /* ─── 2. الحدود الشخصية ─── */
  {
    id: "boundaries",
    title: "الحدود الشخصية",
    emoji: "🚧",
    color: "#14B8A6",
    questions: [
      { question: "أقدر أقول 'لا' بدون ما أحس بذنب كبير", options: OPT4_AGR },
      { question: "أعرف الفرق الواضح بين مسؤوليتي ومسؤولية غيري", options: OPT4_AGR },
      { question: "لما حد يتخطى حدودي، أقدر أواجهه بهدوء واحترام", options: OPT4_AGR },
      { question: "أحمي وقتي وطاقتي حتى لو الطرف الآخر زعل", options: OPT4_AGR },
    ],
    interpret: (score) => interpret3(score, 12,
      ["حدود صحية", "حدود تحتاج تقوية", "حدود ضعيفة"],
      [
        "أنت واعي بحدودك وبتقدر تحددها وتحميها بثقة. ده يعكس نضج عاطفي.",
        "عندك وعي بحدودك لكن بتلاقي صعوبة أحياناً في تطبيقها خصوصاً مع المقربين.",
        "بتسمح للآخرين يتخطوا مساحتك باستمرار. التعرف على حقك في الرفض هو البداية.",
      ],
      ["✅", "🔧", "🔓"]
    ),
  },

  /* ─── 3. التبعية العاطفية ─── */
  {
    id: "codependency",
    title: "الاستقلال العاطفي",
    emoji: "⛓️",
    color: "#F472B6",
    questions: [
      { question: "سعادتي مربوطة بسعادة شخص معين", options: OPT4_REV },
      { question: "أقدر أحس بالرضا وأنا لوحدي", options: OPT4 },
      { question: "بأهمل نفسي عشان أهتم بحد تاني", options: OPT4_REV },
      { question: "أتخذ قراراتي بشكل مستقل حتى لو حد اعترض", options: OPT4 },
    ],
    interpret: (score) => interpret3(score, 12,
      ["استقلال صحي", "ميل للتبعية", "تبعية عاطفية"],
      [
        "عندك توازن جيد بين الاهتمام بنفسك والاهتمام بغيرك. ده مؤشر لعلاقات صحية.",
        "أحياناً بتضع نفسك في المرتبة الثانية أكتر من اللازم. خصص وقت لاحتياجاتك الخاصة.",
        "حياتك العاطفية متمركزة بشكل كبير حول شخص آخر. الوعي بده هو بداية التحرر.",
      ],
      ["🌟", "⚠️", "🔗"]
    ),
  },

  /* ─── 4. جودة التواصل ─── */
  {
    id: "communication",
    title: "جودة التواصل",
    emoji: "💬",
    color: "#38BDF8",
    questions: [
      { question: "أعبّر عن مشاعري بوضوح بدون تلميحات", options: OPT4 },
      { question: "أسمع الطرف الآخر فعلاً قبل ما أرد", options: OPT4 },
      { question: "لما بنختلف، بنقدر نحل الخلاف بهدوء واحترام", options: OPT4 },
      { question: "أقدر أتكلم عن احتياجاتي العاطفية بدون خجل أو خوف", options: OPT4 },
    ],
    interpret: (score) => interpret3(score, 12,
      ["تواصل ممتاز", "تواصل مقبول", "تواصل يحتاج تطوير"],
      [
        "أنت تتواصل بصراحة ووضوح وتسمع بانتباه. ده مهارة ثمينة.",
        "تواصلك جيد بس فيه مجال كبير للتحسين خصوصاً في لحظات الخلاف.",
        "بتلاقي صعوبة في التعبير عن مشاعرك أو في السمع الفعلي. ده مهارة بتتعلم بالتدريب.",
      ],
      ["🎙️", "💛", "🔇"]
    ),
  },

  /* ─── 5. الوعي الذاتي ─── */
  {
    id: "selfawareness",
    title: "الوعي الذاتي",
    emoji: "🧠",
    color: "#FBBF24",
    questions: [
      { question: "أقدر أحدد مشاعري بدقة وأسميها", options: OPT4 },
      { question: "أفهم ليه بتصرف بطريقة معينة في مواقف بعينها", options: OPT4 },
      { question: "أقدر أميّز بين رد فعلي الفوري والرد المناسب فعلاً", options: OPT4 },
      { question: "أراجع نفسي دورياً وأعترف بأخطائي بدون دفاع مبالغ", options: OPT4 },
    ],
    interpret: (score) => interpret3(score, 12,
      ["وعي عالي", "وعي متوسط", "وعي يحتاج تطوير"],
      [
        "عندك مستوى عالي من الفهم لنفسك ومشاعرك — ده أساس كل نمو حقيقي.",
        "عندك وعي جيد لكن فيه زوايا عمياء ممكن تكتشفها بالتعمق أكتر.",
        "فيه فرصة كبيرة تتعرف على نفسك بشكل أعمق. الاختبارات دي هي البداية.",
      ],
      ["🔮", "💛", "🌱"]
    ),
  },
];

/* ─── Recommendations ─── */

interface Recommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export function generateRecommendations(scores: Record<string, number>): Recommendation[] {
  const recs: Recommendation[] = [];
  const max = 12;

  // Weakest dimensions first
  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);

  for (const [dimId, score] of sorted) {
    const pct = score / max;
    if (pct < 0.33) {
      const dim = CA_DIMENSIONS.find((d) => d.id === dimId);
      recs.push({
        title: `ركّز على ${dim?.title ?? dimId}`,
        description: dim?.interpret(score).description ?? "",
        priority: "high",
      });
    } else if (pct < 0.66) {
      const dim = CA_DIMENSIONS.find((d) => d.id === dimId);
      recs.push({
        title: `طوّر ${dim?.title ?? dimId}`,
        description: dim?.interpret(score).description ?? "",
        priority: "medium",
      });
    }
  }

  if (recs.length === 0) {
    recs.push({
      title: "استمر على نفس المنوال 🌟",
      description: "علاقاتك في حالة صحية ممتازة. حافظ على وعيك وتواصلك.",
      priority: "low",
    });
  }

  return recs.slice(0, 3);
}
