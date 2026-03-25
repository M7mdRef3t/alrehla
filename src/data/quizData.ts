/**
 * quizData.ts — بيانات الاختبارات الأربعة
 * كل اختبار: عنوان + وصف + أسئلة (4 خيارات بقيمة 0-3) + نتائج حسب النطاق
 */

export interface QuizOption {
  text: string;
  value: number;
}

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

export interface QuizResultBand {
  min: number;
  max: number;
  title: string;
  description: string;
  emoji: string;
  color: string;
}

export interface QuizDef {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  questions: QuizQuestion[];
  results: QuizResultBand[];
}

/* ────────────────────────────────────────── */

const OPT_FREQ: QuizOption[] = [
  { text: "دائماً", value: 3 },
  { text: "غالباً", value: 2 },
  { text: "أحياناً", value: 1 },
  { text: "نادراً", value: 0 },
];

const OPT_AGREE: QuizOption[] = [
  { text: "أوافق بشدة", value: 3 },
  { text: "أوافق", value: 2 },
  { text: "لا أوافق", value: 1 },
  { text: "لا أوافق أبداً", value: 0 },
];

export const QUIZZES: QuizDef[] = [
  /* ═══ 1. نمط التعلق ═══ */
  {
    id: "attachment",
    title: "اختبار نمط التعلق",
    subtitle: "اكتشف كيف تتعامل مع القرب والبعد في علاقاتك",
    emoji: "🔗",
    color: "#A78BFA",
    questions: [
      { question: "أشعر بالقلق عندما لا يرد شخص مقرب على رسالتي بسرعة", options: OPT_FREQ },
      { question: "أحتاج تأكيد مستمر من الطرف الآخر أنه يحبني", options: OPT_FREQ },
      { question: "أفضل الاعتماد على نفسي بدل ما أطلب مساعدة", options: OPT_FREQ },
      { question: "أبتعد عن الناس لما أحس بضغط عاطفي", options: OPT_FREQ },
      { question: "أخاف إن الناس اللي بحبهم هيسيبوني", options: OPT_FREQ },
      { question: "أجد صعوبة في الثقة بالآخرين بسهولة", options: OPT_FREQ },
      { question: "أشعر بالراحة لما أكون قريب عاطفياً من حد", options: OPT_FREQ },
      { question: "لما حد يبعد عني بلجأ للتجاهل أو الانسحاب", options: OPT_FREQ },
    ],
    results: [
      { min: 0, max: 8, title: "تعلق آمن 🌿", description: "أنت مرتاح في القرب العاطفي وعندك توازن صحي بين الاستقلال والارتباط. تقدر تطلب احتياجاتك بوضوح.", emoji: "🌿", color: "#34D399" },
      { min: 9, max: 14, title: "تعلق قلق 💛", description: "بتحتاج تأكيد مستمر وممكن تقلق من الرفض أو الترك. الأمان الداخلي هو مفتاحك.", emoji: "💛", color: "#FBBF24" },
      { min: 15, max: 19, title: "تعلق تجنبي 🛡️", description: "بتفضل المسافة العاطفية وممكن تلاقي صعوبة في التعبير عن مشاعرك أو طلب المساعدة.", emoji: "🛡️", color: "#38BDF8" },
      { min: 20, max: 24, title: "تعلق مضطرب 🌪️", description: "بين القرب والبعد، مشاعرك مكثفة وردود فعلك قد تكون غير متوقعة. الوعي هو الخطوة الأولى.", emoji: "🌪️", color: "#F87171" },
    ],
  },

  /* ═══ 2. الحدود الصحية ═══ */
  {
    id: "boundaries",
    title: "مقياس الحدود الصحية",
    subtitle: "هل تقدر ترسم خطوط واضحة وتحميها؟",
    emoji: "🚧",
    color: "#14B8A6",
    questions: [
      { question: "أقدر أقول 'لا' بدون ما أحس بالذنب", options: OPT_AGREE },
      { question: "أسمح للآخرين يقرروا عني حاجات تخصني", options: [
        { text: "أوافق بشدة", value: 0 }, { text: "أوافق", value: 1 },
        { text: "لا أوافق", value: 2 }, { text: "لا أوافق أبداً", value: 3 },
      ]},
      { question: "لما حد يتخطى حدودي، أقدر أواجهه بهدوء", options: OPT_AGREE },
      { question: "أعرف الفرق بين مسؤوليتي ومسؤولية غيري", options: OPT_AGREE },
      { question: "أحس إن وقتي وطاقتي ملك ليا وأقدر أحميهم", options: OPT_AGREE },
      { question: "لما حد يزعل مني بسبب حدودي، أغيّر رأيي عشان أرضيه", options: [
        { text: "أوافق بشدة", value: 0 }, { text: "أوافق", value: 1 },
        { text: "لا أوافق", value: 2 }, { text: "لا أوافق أبداً", value: 3 },
      ]},
    ],
    results: [
      { min: 0, max: 6, title: "حدود ضعيفة 🔓", description: "بتسمح للناس تتخطى مساحتك بسهولة. الخطوة الأولى: تعرّف على حقك في الرفض.", emoji: "🔓", color: "#F87171" },
      { min: 7, max: 12, title: "حدود تحتاج تقوية 🔧", description: "عندك وعي بحدودك لكن بتلاقي صعوبة في تطبيقها. التدريب اليومي هيساعدك.", emoji: "🔧", color: "#FBBF24" },
      { min: 13, max: 18, title: "حدود صحية ✅", description: "أنت واعي بحدودك وبتقدر تحميها. استمر في تقويتها وتعليم غيرك بالقدوة.", emoji: "✅", color: "#34D399" },
    ],
  },

  /* ═══ 3. التبعية العاطفية ═══ */
  {
    id: "codependency",
    title: "مؤشر التبعية العاطفية",
    subtitle: "هل حياتك متمحورة حول شخص آخر؟",
    emoji: "⛓️",
    color: "#F472B6",
    questions: [
      { question: "أحس إن سعادتي مربوطة بسعادة شخص تاني", options: OPT_FREQ },
      { question: "بأهمل احتياجاتي عشان أخلي الطرف الآخر مبسوط", options: OPT_FREQ },
      { question: "بحاول أصلح أو أنقذ ناس حتى لو مش طالبين", options: OPT_FREQ },
      { question: "لما الشخص اللي بهتم بيه مش مبسوط، بحس إنه غلطتي", options: OPT_FREQ },
      { question: "بأحس بالفراغ أو القلق لما أكون لوحدي", options: OPT_FREQ },
      { question: "بأتنازل عن آرائي أو قيمي عشان أتجنب الخلاف", options: OPT_FREQ },
      { question: "بقضي وقت كبير بفكر في مشاكل غيري أكتر من مشاكلي", options: OPT_FREQ },
    ],
    results: [
      { min: 0, max: 7, title: "استقلال صحي 🌟", description: "عندك توازن جيد بين الاهتمام بغيرك والاهتمام بنفسك. استمر!", emoji: "🌟", color: "#34D399" },
      { min: 8, max: 14, title: "ميل للتبعية ⚠️", description: "بتميل أحياناً لتضع الآخرين قبل نفسك بشكل مفرط. ابدأ بتخصيص وقت لاحتياجاتك.", emoji: "⚠️", color: "#FBBF24" },
      { min: 15, max: 21, title: "تبعية عاطفية 🔗", description: "حياتك متمحورة بشكل كبير حول شخص آخر. الخطوة الأولى هي الوعي — وأنت بدأت.", emoji: "🔗", color: "#F87171" },
    ],
  },

  /* ═══ 4. جودة العلاقة ═══ */
  {
    id: "quality",
    title: "تقييم جودة العلاقة",
    subtitle: "قيّم أي علاقة في حياتك — عيلة، صداقة، أو حب",
    emoji: "💎",
    color: "#38BDF8",
    questions: [
      { question: "أحس بالأمان العاطفي مع هذا الشخص", options: OPT_AGREE },
      { question: "نقدر نتكلم بصراحة عن أي موضوع بدون خوف", options: OPT_AGREE },
      { question: "هذا الشخص يحترم حدودي ووقتي", options: OPT_AGREE },
      { question: "بعد ما أقابل هذا الشخص، أحس بطاقة إيجابية", options: OPT_AGREE },
      { question: "لما بنختلف، بنقدر نحلها بهدوء واحترام", options: OPT_AGREE },
      { question: "أشعر إن هذه العلاقة متوازنة — أعطي وآخذ بالتساوي", options: OPT_AGREE },
    ],
    results: [
      { min: 0, max: 6, title: "علاقة في خطر 🔴", description: "العلاقة تحتاج مراجعة جذرية. هل تستنزفك أكثر مما تبنيك؟", emoji: "🔴", color: "#F87171" },
      { min: 7, max: 12, title: "علاقة مقبولة 🟡", description: "فيه إيجابيات لكن فيه أماكن تحتاج عمل. حدد الأولويات.", emoji: "🟡", color: "#FBBF24" },
      { min: 13, max: 18, title: "علاقة صحية 🟢", description: "علاقة متوازنة وفيها أمان. حافظ عليها واستمر في تطويرها.", emoji: "🟢", color: "#34D399" },
    ],
  },

  /* ═══ 5. الذكاء العاطفي ═══ */
  {
    id: "eq",
    title: "اختبار الذكاء العاطفي",
    subtitle: "اكتشف قدرتك على فهم مشاعرك والتعبير عنها بدقة",
    emoji: "🧠",
    color: "#F59E0B",
    questions: [
      { question: "أقدر أحدد بالضبط إيه اللي حاسس بيه في أي لحظة", options: OPT_FREQ },
      { question: "لما حد يزعل، أقدر أفهم سبب زعله حتى لو ما قال", options: OPT_FREQ },
      { question: "أقدر أتحكم في ردود فعلي حتى لو كنت غضبان", options: OPT_FREQ },
      { question: "أتأثر بمشاعر الناس اللي حواليا بسهولة", options: OPT_FREQ },
      { question: "أعرف الفرق بين الحزن والإحباط والقلق عند نفسي", options: OPT_FREQ },
      { question: "أقدر أعبّر عن مشاعري بالكلام من غير ما أنفجر", options: OPT_FREQ },
      { question: "لما أغلط، أقدر أتقبل الخطأ من غير ما أحطّم نفسي", options: OPT_AGREE },
      { question: "أستخدم مشاعري كبوصلة تساعدني أتخذ قرارات أفضل", options: OPT_AGREE },
    ],
    results: [
      { min: 0, max: 8, title: "ذكاء عاطفي منخفض 🔴", description: "التواصل مع مشاعرك يحتاج عمل. ابدأ بتمرين 'ماذا أشعر الآن؟' كل مساء — الوعي هو البداية.", emoji: "🔴", color: "#F87171" },
      { min: 9, max: 14, title: "ذكاء عاطفي نامٍ 🌱", description: "عندك أساس جيد لكن تحتاج تطوير. جرّب تسمية 3 مشاعر يومياً بدقة — الدقة ترفع الذكاء.", emoji: "🌱", color: "#FBBF24" },
      { min: 15, max: 19, title: "ذكاء عاطفي جيد 💡", description: "أنت واعي بمشاعرك وتقدر توظّفها. استمر في تطوير التعاطف مع الآخرين.", emoji: "💡", color: "#38BDF8" },
      { min: 20, max: 24, title: "ذكاء عاطفي عالي ✨", description: "مشاعرك بوصلتك — تقرأ نفسك والآخرين بعمق. هذه قوة نادرة، وظّفها في علاقاتك.", emoji: "✨", color: "#34D399" },
    ],
  },

  /* ═══ 6. التوافق الاجتماعي ═══ */
  {
    id: "social",
    title: "اختبار التوافق الاجتماعي",
    subtitle: "قيّم انسجامك مع دوائرك الاجتماعية المحيطة",
    emoji: "🌐",
    color: "#8B5CF6",
    questions: [
      { question: "أشعر بالانتماء الحقيقي في مجموعة أصدقائي", options: OPT_AGREE },
      { question: "أقدر أكون اجتماعي من غير ما أفقد هويتي الشخصية", options: OPT_AGREE },
      { question: "علاقاتي الاجتماعية تضيف لحياتي أكثر مما تستنزفها", options: OPT_AGREE },
      { question: "أقدر أدخل مجموعة جديدة وأندمج بسرعة", options: OPT_FREQ },
      { question: "عندي أشخاص أقدر أتصل بيهم في أي وقت بدون إحراج", options: OPT_AGREE },
      { question: "أحافظ على علاقاتي القديمة حتى مع بُعد المسافة", options: OPT_FREQ },
      { question: "أفرّق بوضوح بين دوائري: عائلة، أصدقاء مقربين، معارف", options: OPT_AGREE },
    ],
    results: [
      { min: 0, max: 7, title: "عزلة اجتماعية 🏝️", description: "دائرتك ضيقة وفيه فجوة بينك وبين الناس. ابدأ بخطوة صغيرة: تواصل مع شخص واحد هذا الأسبوع.", emoji: "🏝️", color: "#F87171" },
      { min: 8, max: 14, title: "توافق متوسط 🌤️", description: "عندك علاقات لكنها تحتاج تغذية أكثر. خصّص وقت ثابت أسبوعياً للتواصل الاجتماعي.", emoji: "🌤️", color: "#FBBF24" },
      { min: 15, max: 21, title: "توافق اجتماعي عالي 🎯", description: "أنت متناغم مع دوائرك وتحافظ على توازن صحي. علاقاتك مصدر قوة حقيقية.", emoji: "🎯", color: "#34D399" },
    ],
  },

  /* ═══ 7. درجة التواصل ═══ */
  {
    id: "communication",
    title: "اختبار درجة التواصل",
    subtitle: "اكتشف جودة استماعك وتبادلك اللفظي مع الآخرين",
    emoji: "💬",
    color: "#EC4899",
    questions: [
      { question: "لما حد يتكلم، أسمع بتركيز كامل من غير ما أفكر في ردي", options: OPT_FREQ },
      { question: "أقدر أوصّل فكرتي بوضوح حتى في المواقف الصعبة", options: OPT_FREQ },
      { question: "لما أختلف مع حد، أقدر أعبّر عن رأيي بدون ما أهاجم", options: OPT_FREQ },
      { question: "أسأل أسئلة مفتوحة عشان أفهم الطرف الآخر أكثر", options: OPT_FREQ },
      { question: "ألاحظ لغة الجسد ونبرة الصوت مش بس الكلام", options: OPT_FREQ },
      { question: "أعتذر بصدق لما أغلط في التعبير أو أجرح حد", options: OPT_AGREE },
      { question: "أحس إن محادثاتي مع الناس المقربين عميقة وحقيقية", options: OPT_AGREE },
    ],
    results: [
      { min: 0, max: 7, title: "تواصل سطحي 📵", description: "التواصل العميق يحتاج تمرين. جرّب الاستماع الكامل: ركّز 100% على المتحدث بدون مقاطعة.", emoji: "📵", color: "#F87171" },
      { min: 8, max: 14, title: "تواصل جيد 📡", description: "أساسك قوي لكن فيه مجال للتطوير. درّب نفسك على 'عكس المشاعر' — كرر ما فهمته قبل ما ترد.", emoji: "📡", color: "#FBBF24" },
      { min: 15, max: 21, title: "تواصل عميق 🎙️", description: "أنت متواصل ممتاز — تسمع بعمق وتعبّر بوضوح. هذه مهارة نادرة تبني علاقات قوية.", emoji: "🎙️", color: "#34D399" },
    ],
  },
];
