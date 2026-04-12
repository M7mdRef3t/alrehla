export type LandingHeroVariantContent = {
  headlineLine1: string;
  headlineLine2: string;
  subtitle: string;
  cta: string;
};

export const landingHeroVariants: Record<"A" | "B", LandingHeroVariantContent> = {
  A: {
    headlineLine1: "كل ما تحتاجه الآن",
    headlineLine2: "رؤية أوضح وخطوة أهدأ.",
    subtitle:
      "الرحلة تمنحك خريطة بصرية لعلاقاتك: من يدعمك، من يستنزفك، وما الخطوة الأنسب لك الآن.",
    cta: "ابدأ بخطوة هادئة"
  },
  B: {
    headlineLine1: "من الكلام إلى المكان.",
    headlineLine2: "اجعل العلاقات واضحة.",
    subtitle:
      "نظام عملي يساعدك تفهم تأثير الناس عليك بسرعة، وتحوّل الفهم إلى قرار هادئ قابل للتنفيذ.",
    cta: "ابدأ رحلتك الآن"
  }
};

export const salesEnablementAssets = {
  oneLiner: "الرحلة: نظام وعي علاقاتي يحوّل الضباب العاطفي إلى قرارات واضحة.",
  problem:
    "معظم الإنهاك اليومي سببه علاقات غير متوازنة، بينما الأدوات الحالية لا تعطي رؤية قابلة للقياس.",
  solution:
    "خريطة دوائر + إشارات مبكرة + مسار تنفيذي يومي قصير يجعل المستخدم ينتقل من التشتت إلى الوضوح.",
  audience: [
    "الأفراد الذين يريدون حدودًا أوضح وهدوءًا داخليًا",
    "المدربون والمعالجون الباحثون عن بوصلة بصرية للعمل مع العملاء",
    "فرق الموارد البشرية والقيادة في بيئات الضغط العالي"
  ],
  talkingPoints: [
    "المشكلة: استنزاف غير مرئي داخل العلاقات",
    "الحل: تشخيص بصري سريع بدل التدوين الطويل",
    "القيمة: قرارات أوضح خلال دقائق وليس أسابيع",
    "النموذج: Free -> Premium -> Enterprise",
    "الميزة: تجربة عربية مباشرة بدون تعقيد نظري"
  ]
};

export type ContentTrack = {
  week: number;
  topic: string;
  channel: string;
  objective: "awareness" | "engagement" | "education" | "conversion" | "retention";
};

export const contentMarketingTracks: ContentTrack[] = [
  { week: 1, topic: "لماذا بعض العلاقات تستنزفك؟", channel: "Blog + LinkedIn", objective: "awareness" },
  { week: 2, topic: "كيف تحدد دوائرك في 10 دقائق", channel: "Instagram + TikTok", objective: "engagement" },
  { week: 3, topic: "الحدود ليست قسوة", channel: "YouTube + Email", objective: "education" },
  { week: 4, topic: "قصة مستخدم: أول حد صحي", channel: "Short Video", objective: "conversion" },
  { week: 5, topic: "الرحلة مقابل التطبيقات التقليدية", channel: "Blog SEO", objective: "conversion" },
  { week: 6, topic: "جلسة مباشرة: رسم خريطتك", channel: "Live Webinar", objective: "retention" }
];
