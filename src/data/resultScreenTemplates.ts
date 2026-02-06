export interface ResultScenarioCopy {
  title: string;
  state_label: string;
  goal_label: string;
  promise_label: string;
  promise_body: string;
  mission_label: string;
  mission_goal: string;
  requirements: Array<{ title: string; detail: string }>;
  steps: string[];
  obstacles: Array<{ title: string; solution: string }>;
  understanding_body: string;
  explanation_body: string;
  suggested_zone_label: string;
  suggested_zone_body: string;
}

export const RESULT_SCREEN_SECTION_TITLES = {
  understanding_title: "فهم الوضع",
  explanation_title: "توضيح الحالة",
  suggested_zone_title: "المكان الصحيح المقترح"
} as const;

export const RESULT_SCREEN_SCENARIOS = {
  emergency: {
    title: "⛔ خطر فوري",
    state_label: "منطقة حمراء (طوارئ)",
    goal_label: "الهروب الآمن / طلب مساعدة خارجية",
    promise_label: "النجاة",
    promise_body:
      "الحفاظ على سلامتك الجسدية والنفسية عشان تقدر تبدأ من جديد في بيئة آمنة.",
    mission_label: "الخروج الآمن",
    mission_goal: "النجاة",
    requirements: [
      { title: "شبكة دعم", detail: "صديق أو جهة تثق فيها." },
      { title: "حقيبة طوارئ", detail: "(أوراق مهمة، فلوس، مفاتيح)." }
    ],
    steps: [
      "السرية التامة: لا تلمح أبداً إنك ناوي تمشي.",
      "التوثيق: سجل أي تهديدات (سكرين شوت / تسجيل).",
      "القفزة: الخروج في وقت آمن وعدم النظر للخلف."
    ],
    obstacles: [
      {
        title: "شلل الخوف",
        solution: "الـ AI هنا دوره يوصلك بمتخصص فوراً."
      }
    ],
    understanding_body:
      "الوضع هنا مش محتاج تفاهم أو حدود. في إشارات خطر، وسلامتك هي الأولوية الوحيدة دلوقتي.",
    explanation_body:
      "إجابتك على سؤال الطوارئ بتقول إن في تهديد مباشر {{threatFrom}}. ده محتاج إجراءات حماية فورية مش نقاش.",
    suggested_zone_label: "بروتوكول SOS",
    suggested_zone_body:
      "لو تقدر، فعّل خطة أمان: تواصل مع شخص موثوق، وخد خطوات خروج آمنة، ولو في خطر مباشر اطلب نجدة."
  },
  emotional_prisoner: {
    title: "🧠 استنزاف عن بُعد",
    state_label: "منطقة رمادية (عزل صحي)",
    goal_label: "فك الارتباط الشعوري / إسكات الضجيج",
    promise_label: "استرداد المساحة العقلية",
    promise_body:
      "دماغك هيرجع ملكك تاني.. مفيش محاكمات وهمية، مفيش ذنب، وصوتك الداخلي هو اللي هيمشي.",
    mission_label: "تحرير السجين",
    mission_goal: "استرداد المساحة العقلية",
    requirements: [
      { title: "قائمة الواقع", detail: "ورقة مكتوب فيها \"ليه بعدت عنهم؟\" (تستخدم كمصل ضد الحنين)." },
      { title: "بديل الدوبامين", detail: "نشاط ممتع جاهز فوراً لما الفكرة تهاجمك." }
    ],
    steps: [
      "تفعيل الصيام الرقمي: إخفاء (Mute/Block) لمدة 7 أيام.",
      "تكتيك \"إشارة قف\": كل ما تفتكرهم، قول بصوت عالي \"مش وقته\" وغير مكانك.",
      "حرق الرسائل: اكتب كل اللي عايز تقوله في ورقة وقطعها (تفريغ من غير إرسال)."
    ],
    obstacles: [
      {
        title: "فخ الذكريات الوردية (Euphoric Recall)",
        solution: "اقرأ \"قائمة الواقع\" فوراً."
      }
    ],
    understanding_body:
      "إجاباتك بتقول إنك نجحت تبعد بجسمك (تواصل نادر)، لكن لسه بتدفع التمن من طاقتك. المشكلة مش في {{calls}}، لكن في {{contactVoice}} اللي لسه شغال جوه دماغك. أنت سجين للذنب أو الحنين.",
    explanation_body:
      "بمعنى إن الحدود الخارجية موجودة بالفعل، لكن الحدود الداخلية لسه مفتوحة. التفكير القهري هو اللي بيسحب الطاقة.",
    suggested_zone_label: "مسار الحدود الداخلية (الصيام الشعوري)",
    suggested_zone_body:
      "ركّز على وقف الاستحضار: قلّل الاجترار، ووقف المراقبة، وثبّت عادة تفصل بينك وبين الفكرة."
  },
  active_battlefield: {
    title: "🛡️ استنزاف نشط",
    state_label: "منطقة حمراء (نشطة)",
    goal_label: "تفعيل الدرع / وقف النزيف",
    promise_label: "السيادة الطاقية",
    promise_body:
      "هتقابل نفس الشخص، وهتسمع نفس الكلام، بس مش هتتوجع ولا طاقتك هتخلص. هتبقى زي الجبل.",
    mission_label: "القلعة الحصينة",
    mission_goal: "السيادة الطاقية",
    requirements: [
      { title: "سكريبت الرد البارد", detail: "جملة واحدة محفوظة (مثلاً: \"مش هقدر دلوقتي، خليني أشوف وأرد عليك\")." },
      { title: "ساعة توقيت", detail: "عشان تنهي اللقاء قبل الدقيقة 10." }
    ],
    steps: [
      "تقليل وقت التعرض: المقابلة ساعتين -> تبقى نص ساعة.",
      "تحييد المشاعر: الرد على المعلومات بس، وتجاهل النبرة أو التلميحات.",
      "الانسحاب التكتيكي: لو الصوت علي، انسحب فوراً بحجة (الحمام/مكالمة)."
    ],
    obstacles: [
      {
        title: "ثورة الانقراض (Extinction Burst)",
        solution: "الصمود (الثبات الانفعالي) وعدم التبرير."
      }
    ],
    understanding_body:
      "أنت حالياً في مرمى النيران. {{subjectPresenceInDay}}، وتأثير العلاقة عليك مُدمر (طاقة مهدودة، ذنب مستمر).",
    explanation_body:
      "ده وضع محتاج إجراءات دفاعية فورية مش مجرد تفاهم. كل احتكاك بيزود الاستنزاف.",
    suggested_zone_label: "مسار الحدود الخارجية (بروتوكول الدرع)",
    suggested_zone_body:
      "قلّل نقاط الاحتكاك، وحدد قواعد تواصل قصيرة وواضحة، واثبت عليها."
  },
  eggshells: {
    title: "🎭 علاقة مشروطة / موترة",
    state_label: "منطقة صفراء (حذر)",
    goal_label: "إدارة التوقعات / رسم مسافة آمنة",
    promise_label: "الاستقرار المتوقع",
    promise_body:
      "بدل المفاجآت والتوتر، العلاقة هتبقى روتينية ومملة (وده شيء صحي هنا). هتعرف تديرها بأقل مجهود.",
    mission_label: "مهندس الألغام",
    mission_goal: "الاستقرار المتوقع",
    requirements: [
      { title: "خريطة الألغام", detail: "قايمة بالمواضيع اللي بتعمل مشاكل (السياسة، الفلوس، الجواز)." },
      { title: "قناع الدبلوماسي", detail: "ابتسامة رسمية ومجاملات سطحية." }
    ],
    steps: [
      "رسمية التعامل: حول العلاقة لـ \"Business\" (صباح الخير / أخبار الشغل إيه / تمام).",
      "المناورة: لو فتح موضوع شائك، غير الموضوع فوراً لسؤال عنه هو (الناس بتحب تتكلم عن نفسها)."
    ],
    obstacles: [
      {
        title: "فخ الاستدراج",
        solution: "رد بكلمة واحدة: \"ممكن\"، \"وجهة نظر\"."
      }
    ],
    understanding_body:
      "العلاقة مش سامة بالكامل، بس مش مريحة. بتضطر تراقب كلامك وتصرفاتك عشان تتجنب المشاكل {{withPerson}}.",
    explanation_body:
      "إجاباتك بـ \"أحياناً\" بتدل على عدم استقرار. لو مفيش إدارة للمسافة، العلاقة ممكن تتزحلق للمنطقة الحمراء.",
    suggested_zone_label: "مسار الدبلوماسية (فن المسافة)",
    suggested_zone_body:
      "اتفق على حدود بسيطة، ووازن بين القرب والراحة النفسية."
  },
  fading_echo: {
    title: "🍂 علاقة باهتة / سطحية",
    state_label: "منطقة محايدة (بيضاء/خضراء باهتة)",
    goal_label: "القبول / تحديد المكانة",
    promise_label: "التحرر من التوقعات",
    promise_body:
      "هتبطل تستنى منهم حاجة مش هتيجي، وهترتاح من وجع الخذلان المستمر.",
    mission_label: "توديع الطيف",
    mission_goal: "التحرر من التوقعات",
    requirements: [
      { title: "مراية الحقيقة", detail: "الاعتراف إن \"الشخص ده مش هو الشخص اللي في خيالي\"." }
    ],
    steps: [
      "وقف المبادرة: بطل تكون أنت اللي بيبدأ الكلام دايماً.",
      "إعادة توجيه الاستثمار: الطاقة اللي كنت بتديها هنا، اديها لصديق جديد أو هواية."
    ],
    obstacles: [
      {
        title: "فراغ العادة",
        solution: "املأ الفراغ ده بنشاط اجتماعي تاني فوراً."
      }
    ],
    understanding_body:
      "{{fadingEffect}} في حياتك لا بالسلب ولا بالإيجاب. التواصل قليل والألم قليل.",
    explanation_body:
      "التحدي هنا هو القبول: إن ده حجم العلاقة الطبيعي دلوقتي ومنحاولش نكبرها بالعافية.",
    suggested_zone_label: "نصائح عامة (بدون مسار مكثف)",
    suggested_zone_body:
      "حافظ على الحد الأدنى المريح، واستثمر وقتك في العلاقات الأهم."
  },
  safe_harbor: {
    title: "🟢 مصدر أمان ودعم",
    state_label: "منطقة خضراء",
    goal_label: "الامتنان / الاستثمار",
    promise_label: "المخزون الاستراتيجي",
    promise_body:
      "في وقت أزماتك، هتلاقي رصيد كبير مسنود عليه يخليك تعدي أي محنة.",
    mission_label: "سقاية الجذور",
    mission_goal: "المخزون الاستراتيجي",
    requirements: [
      { title: "لغة الامتنان", detail: "القدرة إنك تقول \"شكراً إنك في حياتي\"." },
      { title: "وقت مخصص", detail: "ساعة في الأسبوع للشخص ده بدون موبايل." }
    ],
    steps: [
      "الإيداع في الرصيد: اعمل خدمة أو اسمعهم وهما متضايقين (من غير نصايح).",
      "المشاركة الآمنة: احكيلهم عن مشكلة عندك (الضعف بيقوي العلاقات دي)."
    ],
    obstacles: [
      {
        title: "الضمان (Taking for granted)",
        solution: "جدول زيارات ثابتة."
      }
    ],
    understanding_body:
      "إجاباتك بتقول إن العلاقة دي بتشحنك مش بتسحب منك. {{presence}} بيدّي إحساس بالأمان.",
    explanation_body:
      "ده نوع من العلاقات اللي بتوازن الضغط اليومي، و{{presence}} مهم لاستقرارك النفسي.",
    suggested_zone_label: "مسار الجذور (كيف تحافظ على الداعمين)",
    suggested_zone_body:
      "حافظ على القرب، واظهر تقديرك، وخلي التواصل ثابت ومريح."
  }
} as const satisfies Record<string, ResultScenarioCopy>;

export type ResultScenarioKey = keyof typeof RESULT_SCREEN_SCENARIOS;

export type ResultScoreLevel = "low" | "medium" | "high";

export interface ResultScenarioRule {
  id: string;
  when: {
    emergency?: boolean;
    symptomLevel?: ResultScoreLevel | ResultScoreLevel[];
    contactLevel?: ResultScoreLevel | ResultScoreLevel[];
    safetyHigh?: boolean;
  };
  scenario: ResultScenarioKey;
}

export const RESULT_SCREEN_RULES: ResultScenarioRule[] = [
  {
    id: "emergency_override",
    when: { emergency: true },
    scenario: "emergency"
  },
  {
    id: "high_low_contact",
    when: { symptomLevel: "high", contactLevel: "low" },
    scenario: "emotional_prisoner"
  },
  {
    id: "high_active",
    when: { symptomLevel: "high", contactLevel: ["medium", "high"] },
    scenario: "active_battlefield"
  },
  {
    id: "medium_any",
    when: { symptomLevel: "medium" },
    scenario: "eggshells"
  },
  {
    id: "low_safe",
    when: { symptomLevel: "low", safetyHigh: true },
    scenario: "safe_harbor"
  },
  {
    id: "low_low_contact",
    when: { symptomLevel: "low", contactLevel: "low" },
    scenario: "fading_echo"
  },
  {
    id: "default_safe",
    when: {},
    scenario: "safe_harbor"
  }
];
