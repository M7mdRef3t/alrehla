import type { Data } from "@measured/puck";

export type EditorTemplatePath =
  | "/"
  | "/about"
  | "/pricing"
  | "/onboarding"
  | "/dawayir"
  | "/coach"
  | "/coach/landing"
  | "/activation"
  | "/privacy"
  | "/terms"
  | "/stories"
  | "/sessions/intake"
  | "/weather";

export type EditorTemplateOption = {
  path: EditorTemplatePath;
  label: string;
  note: string;
};

const root = { props: { title: "Page" } };

const block = (type: string, id: string, props: Record<string, unknown>) => ({ type, id, props });

// ═══════════════════════════════════════════════════
// Real Platform Templates — built from actual page content
// ═══════════════════════════════════════════════════

const templates: Record<EditorTemplatePath, Data> = {
  // ─── الصفحة الرئيسية ─────────────────────────────
  "/": {
    root,
    content: [
      block("HeroBlock", "home-hero", {
        headline: "افهم علاقتك بوضوح أكبر",
        description: "خذ خطوة واضحة اليوم. خلال دقائق قليلة، تتحول الفوضى إلى خريطة بسيطة تساعدك ترى ما يستنزفك وما يسندك.",
        ctaText: "شغّل مرآة الوعي",
        ctaLink: "/onboarding",
        imageUrl: "",
        padding: "xl",
        visibility: "all",
      }),
      block("SocialProofBlock", "home-stats", {
        stats: [
          { value: "١٠+", label: "شخص استعادوا هدوءهم", icon: "🫂" },
          { value: "٣", label: "دقائق لأول خريطة", icon: "⏱️" },
          { value: "١٠٠٪", label: "خصوصية مشفرة", icon: "🔒" },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("DividerBlock", "home-divider-1", {
        style: "gradient",
        padding: "md",
        visibility: "all",
      }),
      block("HeadingBlock", "home-principles-heading", {
        title: "إحنا مش بنخمّن. إحنا بنحلل الـ Logic.",
<<<<<<< HEAD
        subtitle: "الرحلة بتستخدم \"نظام تشغيل سيادي\" بيشوف علاقاتك كداوئر طاقة ومسارات تدفق. مفيش أحكام، بس فيه بيانات بتساعدك تاخد قراراتك من مركز قوتك.",
=======
        subtitle: "الرحلة بتستخدم \"نظام تشغيل خاص\" بيشوف علاقاتك كداوئر طاقة ومسارات تدفق. مفيش أحكام، بس فيه بيانات بتساعدك تاخد قراراتك من مركز قوتك.",
>>>>>>> feat/sovereign-final-stabilization
        align: "center",
        padding: "lg",
        visibility: "all",
      }),
      block("MahatatBlock", "home-features", {
        features: [
          { title: "رصد الاستنزاف", description: "تحديد النقط اللي طاقتك بتتسرب منها بدقة جراحية.", icon: "⚡" },
          { title: "خرائط النبض", description: "رسم بياني حقيقي لمين بيزودك ومين بيسحب منك.", icon: "📈" },
          { title: "تحصين الحدود", description: "أدوات عملية لبناء جدار حماية لسلامك النفسي.", icon: "🛡️" },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("DividerBlock", "home-divider-2", {
        style: "dots",
        padding: "md",
        visibility: "all",
      }),
      block("HeadingBlock", "home-how-heading", {
        title: "كيف تبدأ؟",
        subtitle: "3 خطوات بسيطة، بدون تعقيد زائد",
        align: "center",
        padding: "md",
        visibility: "all",
      }),
      block("MahatatBlock", "home-steps", {
        features: [
          { title: "١. حدّد الصورة", description: "3 أسئلة بسيطة توضح لك أين الضغط الحقيقي ومن يؤثر على اتزانك.", icon: "🎯" },
          { title: "٢. خريطة العلاقات", description: "تصور بصري يساعدك تشوف العلاقات بوضوح وتحدد أين تحتاج حدودًا أو حضورًا أكبر.", icon: "🗺️" },
          { title: "٣. خطوة عملية", description: "بياناتك تتحول إلى خطوة واحدة قابلة للتنفيذ تساعدك تسترجع التوازن تدريجيًا.", icon: "🚀" },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("HekayatBlock", "home-testimonial-1", {
        quote: "لأول مرة أشوف بوضوح إيه اللي بيسحب طاقتي. تجربة بسيطة ومريحة جداً.",
        author: "مستخدم",
        role: "استعاد هدوءه",
        avatarEmoji: "🌟",
        accentColor: "teal",
        padding: "md",
        visibility: "all",
      }),
      block("HekayatBlock", "home-testimonial-2", {
        quote: "بطلت أسأل نفسي أسئلة كتير محيرة. الرحلة دي ادتني خطوة واحدة بدأت بيها أرتاح.",
        author: "مستخدمة",
        role: "استعادت راحتها",
        avatarEmoji: "💫",
        accentColor: "amber",
        padding: "md",
        visibility: "all",
      }),
      block("CTABannerBlock", "home-final-cta", {
        headline: "الوضوح موجود — هو بس محتاج خريطة.",
        description: "بدون تسجيل. بدون حكم. بدون ضغط. بس خطوة واحدة تقول فيها: \"جاهز أشوف الحقيقة.\"",
        ctaText: "اسمح للرحلة بالبدء",
        ctaLink: "/onboarding",
        variant: "glow",
        padding: "lg",
        visibility: "all",
      }),
      block("FooterBlock", "home-footer", {
        brandName: "الرحلة",
        tagline: "بوصلة الوعي الذاتي وخريطة العلاقات",
        links: [
          { label: "الرئيسية", url: "/" },
          { label: "قصص النجاح", url: "/stories" },
          { label: "لماذا الرحلة؟", url: "/about" },
          { label: "ابدأ رحلتك", url: "/onboarding" },
          { label: "سياسة الخصوصية", url: "/privacy" },
          { label: "شروط الاستخدام", url: "/terms" },
        ],
        trustBadges: ["🔒 بياناتك آمنة ومشفرة", "👁️ لا مشاركة مع طرف ثالث", "🗑️ يمكنك الحذف في أي وقت"],
        padding: "lg",
        visibility: "all",
      }),
    ],
  },

  // ─── عن الرحلة ────────────────────────────────────
  "/about": {
    root,
    content: [
      block("HeadingBlock", "about-heading", {
        title: "عن الرحلة",
        subtitle: "ابدأ من مساحة أوضح.. بدون ضجيج أو تعقيد.",
        align: "center",
        padding: "xl",
        visibility: "all",
      }),
      block("TextBlock", "about-intro", {
<<<<<<< HEAD
        content: "الرحلة بتستخدم نظام تشغيل سيادي بيشوف علاقاتك كدوائر طاقة ومسارات تدفق. مفيش أحكام، بس فيه بيانات بتساعدك تاخد قراراتك من مركز قوتك.",
=======
        content: "الرحلة بتستخدم نظام تشغيل خاص بيشوف علاقاتك كدوائر طاقة ومسارات تدفق. مفيش أحكام، بس فيه بيانات بتساعدك تاخد قراراتك من مركز قوتك.",
>>>>>>> feat/sovereign-final-stabilization
        align: "center",
        size: "lg",
        padding: "md",
        visibility: "all",
      }),
      block("DividerBlock", "about-divider", {
        style: "gradient",
        padding: "md",
        visibility: "all",
      }),
      block("HeadingBlock", "about-problem-heading", {
        title: "بتحس إن الصورة مش كاملة؟",
        subtitle: "",
        align: "right",
        padding: "md",
        visibility: "all",
      }),
      block("MahatatBlock", "about-problems", {
        features: [
          { title: "استنزاف خفي", description: "علاقات ظاهرها هدوء لكن جواها استنزاف", icon: "😶" },
          { title: "عطاء زايد", description: "بتعطي أكتر من اللازم وبعدها تحس بتعب وذنب", icon: "💔" },
          { title: "كلام بدون فعل", description: "كلام كتير، فعل قليل، وقرارات متأخرة", icon: "🔇" },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("TextBlock", "about-closing", {
        content: "المشكلة مش فيك. المشكلة إن الصورة محتاجة تتشاف بوضوح قبل ما نتصرف.",
        align: "center",
        size: "lg",
        padding: "md",
        visibility: "all",
      }),
      block("HeadingBlock", "about-what-heading", {
        title: "محطاتك في الرحلة",
        subtitle: "",
        align: "center",
        padding: "md",
        visibility: "all",
      }),
      block("MahatatBlock", "about-what", {
        features: [
          { title: "الخريطة", description: "شوف كل علاقاتك في نظرة واحدة", icon: "🗺️" },
          { title: "المسافات", description: "اعرف فين تحط حدودك بوضوح", icon: "📐" },
          { title: "الرفيق", description: "خطوات عملية كل يوم بتساعدك ترتاح", icon: "🤝" },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("CTABannerBlock", "about-cta", {
        headline: "طريقك للوضوح",
        description: "افهم خريطتك وأول خطوة في أقل من 3 دقائق",
        ctaText: "ابدأ رحلتك دلوقتي",
        ctaLink: "/onboarding",
        variant: "glow",
        padding: "lg",
        visibility: "all",
      }),
      block("FooterBlock", "about-footer", {
        brandName: "الرحلة",
        tagline: "بوصلة الوعي الذاتي وخريطة العلاقات",
        links: [
          { label: "الرئيسية", url: "/" },
          { label: "قصص النجاح", url: "/stories" },
          { label: "سياسة الخصوصية", url: "/privacy" },
          { label: "شروط الاستخدام", url: "/terms" },
        ],
        trustBadges: ["🔒 بياناتك آمنة ومشفرة", "👁️ لا مشاركة مع طرف ثالث"],
        padding: "lg",
        visibility: "all",
      }),
    ],
  },

  // ─── الباقات والتسعير ─────────────────────────────
  "/pricing": {
    root,
    content: [
      block("HeadingBlock", "pricing-heading", {
        title: "باقات الرحلة",
        subtitle: "عضوية حصرية للمشتركين الأوائل — وصول كامل ودائم لكافة الممزيات",
        align: "center",
        padding: "xl",
        visibility: "all",
      }),
      block("ZadElTariqBlock", "pricing-card", {
        planName: "العضوية التأسيسية",
        price: "٢٩٩",
        currency: "ج.م",
        period: "مدى الحياة",
        features: [
          { text: "وصول كامل ودائم لكافة الممزيات", included: true },
          { text: "تحديثات تلقائية مشمولة دائماً", included: true },
          { text: "خريطة العلاقات التفاعلية", included: true },
          { text: "AI Triage والتحليل الذكي", included: true },
          { text: "دعم أولوية على واتساب", included: true },
        ],
        ctaText: "فعّل حسابك الآن",
        ctaLink: "/activation",
        highlighted: true,
        padding: "lg",
        visibility: "all",
      }),
      block("DividerBlock", "pricing-divider", {
        style: "gradient",
        padding: "lg",
        visibility: "all",
      }),
      block("AselatElMosaferBlock", "pricing-faq", {
        title: "أسئلة عن الاشتراك",
        subtitle: "كل اللي محتاج تعرفه قبل ما تبدأ",
        items: [
          { question: "هل فيه اشتراك شهري؟", answer: "لا، العضوية التأسيسية دفعة واحدة ومدى الحياة. مفيش رسوم متكررة.", tag: "howto" },
          { question: "لو مكنتش مرتاح أقدر أسترجع فلوسي؟", answer: "بنحاول نوصل لحل يرضيك. تواصل معانا على واتساب وهنشوف الموضوع سوا.", tag: "howto" },
          { question: "إيه طرق الدفع المتاحة؟", answer: "InstaPay، فودافون كاش، اتصالات كاش، تحويل بنكي، وPayPal للعملاء الدوليين.", tag: "howto" },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("FooterBlock", "pricing-footer", {
        brandName: "الرحلة",
        tagline: "",
        links: [
          { label: "الرئيسية", url: "/" },
          { label: "سياسة الخصوصية", url: "/privacy" },
          { label: "شروط الاستخدام", url: "/terms" },
        ],
        trustBadges: ["🔒 بياناتك آمنة ومشفرة"],
        padding: "lg",
        visibility: "all",
      }),
    ],
  },

  // ─── بدء الرحلة / Onboarding ─────────────────────
  "/onboarding": {
    root,
    content: [
      block("HeroBlock", "onboarding-hero", {
        headline: "ابدأ رحلتك من هنا",
        description: "٣ أسئلة بسيطة — بدون تفكير — وهتكشف النمط اللي ماسك دماغك دلوقتي.",
        ctaText: "ابدأ الآن",
        ctaLink: "#",
        imageUrl: "",
        padding: "xl",
        visibility: "all",
      }),
      block("MahatatBlock", "onboarding-steps", {
        features: [
          { title: "١. حدّد الصورة", description: "3 أسئلة بسيطة توضح لك أين الضغط الحقيقي.", icon: "🎯" },
          { title: "٢. ارسم خريطتك", description: "حط كل شخص في مكانه الصح على الخريطة.", icon: "🗺️" },
          { title: "٣. أول خطوة", description: "خطوة واحدة عملية تبدأ بيها فوراً.", icon: "✅" },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("SocialProofBlock", "onboarding-trust", {
        stats: [
          { value: "٣", label: "دقائق فقط", icon: "⏱️" },
          { value: "٠", label: "بيانات شخصية مطلوبة", icon: "🔒" },
          { value: "∞", label: "وصول بدون حدود", icon: "🌊" },
        ],
        padding: "md",
        visibility: "all",
      }),
      block("ButtonBlock", "onboarding-cta", {
        text: "ابدأ رحلتك",
        url: "/onboarding",
        variant: "default",
        size: "lg",
        align: "center",
        padding: "lg",
        visibility: "all",
      }),
    ],
  },

  // ─── خريطة العلاقات / دواير ───────────────────────
  "/dawayir": {
    root,
    content: [
      block("HeadingBlock", "dawayir-heading", {
        title: "دواير — خريطة علاقاتك الحية",
<<<<<<< HEAD
        subtitle: "نظام تشغيل سيادي بيشوف علاقاتك كدوائر طاقة ومسارات تدفق.",
=======
        subtitle: "نظام تشغيل خاص بيشوف علاقاتك كدوائر طاقة ومسارات تدفق.",
>>>>>>> feat/sovereign-final-stabilization
        align: "center",
        padding: "lg",
        visibility: "all",
      }),
      block("MapBlock", "dawayir-map", {
        mapId: "الخريطة الرئيسية",
        showLegend: true,
        particles: true,
        bgTheme: "dark",
        height: "tall",
        padding: "md",
        visibility: "all",
      }),
      block("MahatatBlock", "dawayir-features", {
        features: [
          { title: "رصد الاستنزاف", description: "تحديد النقط اللي طاقتك بتتسرب منها.", icon: "⚡" },
          { title: "خرائط النبض", description: "رسم بياني حقيقي لمين بيزودك ومين بيسحب منك.", icon: "📈" },
          { title: "تحصين الحدود", description: "أدوات عملية لبناء جدار حماية لسلامك النفسي.", icon: "🛡️" },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("CTABannerBlock", "dawayir-cta", {
        headline: "ارسم خريطتك النهارده",
        description: "بدون تسجيل. بدون حكم. خطوتك الأولى نحو الوضوح.",
        ctaText: "ابدأ الرسم",
        ctaLink: "/onboarding",
        variant: "glow",
        padding: "lg",
        visibility: "all",
      }),
    ],
  },

  // ─── لوحة المدرب ──────────────────────────────────
  "/coach": {
    root,
    content: [
      block("HeroBlock", "coach-hero", {
        headline: "لوحة تحكم المدربين",
        description: "إدارة عملاء، أولويات، وتدخلات AI — كل شيء في مكان واحد.",
        ctaText: "افتح لوحة التحكم",
        ctaLink: "/coach",
        imageUrl: "",
        padding: "xl",
        visibility: "all",
      }),
      block("MahatatBlock", "coach-features", {
        features: [
          { title: "إدارة العملاء", description: "لوحة موحدة لمتابعة كل عميل ومسار تقدمه.", icon: "👥" },
          { title: "AI Triage", description: "ترتيب ذكي حسب الأولوية — أي عميل يحتاج تدخل أسرع.", icon: "🧠" },
          { title: "Trajectory Tracking", description: "متابعة التقدّم بصرياً عبر رسومات بيانية واضحة.", icon: "📈" },
          { title: "تنبيهات استباقية", description: "إشعارات تغير الحالة أو وجود أزمة قبل ما تحصل.", icon: "⚠️" },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("ZadElTariqBlock", "coach-pricing", {
        planName: "Coach License",
        price: "$49",
        currency: "USD",
        period: "شهرياً",
        features: [
          { text: "حتى 25 عميل نشط", included: true },
          { text: "AI Triage + التحليل التنبؤي", included: true },
          { text: "تقارير PDF جاهزة", included: true },
          { text: "لوحة تحكم متقدمة", included: true },
        ],
        ctaText: "تواصل بخصوص الترخيص",
        ctaLink: "https://wa.me/201023050092",
        highlighted: true,
        padding: "lg",
        visibility: "all",
      }),
    ],
  },

  // ─── هبوط المدرب ──────────────────────────────────
  "/coach/landing": {
    root,
    content: [
      block("HeroBlock", "coach-landing-hero", {
        headline: "أدر عملاءك بدقة تحليلية",
        description: "لوحة تحكم متكاملة للمدربين: إدارة العملاء، التنبيه الاستباقي، والتحليل الذكي.",
        ctaText: "تواصل بخصوص المسار المتقدم",
        ctaLink: "https://wa.me/201023050092",
        imageUrl: "",
        padding: "xl",
        visibility: "all",
      }),
      block("MahatatBlock", "coach-landing-features", {
        features: [
          { title: "إدارة العملاء من مكان واحد", description: "تجميع الرؤية داخل لوحة موحدة.", icon: "👥" },
          { title: "AI Triage", description: "ترتيب ذكي حسب الأولوية.", icon: "🧠" },
          { title: "Trajectory Tracking", description: "متابعة التقدّم بصرياً.", icon: "📈" },
          { title: "تنبيهات استباقية", description: "إشعارات تغير الحالة أو وجود أزمة.", icon: "⚠️" },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("ZadElTariqBlock", "coach-landing-pricing", {
        planName: "Coach License",
        price: "$49",
        currency: "USD",
        period: "شهرياً",
        features: [
          { text: "حتى 25 عميل نشط", included: true },
          { text: "AI Triage", included: true },
          { text: "تقارير PDF جاهزة", included: true },
          { text: "لوحة متقدمة", included: true },
        ],
        ctaText: "تواصل عبر واتساب",
        ctaLink: "https://wa.me/201023050092",
        highlighted: true,
        padding: "lg",
        visibility: "all",
      }),
      block("FooterBlock", "coach-landing-footer", {
        brandName: "الرحلة — B2B",
        tagline: "منصة المدربين والمعالجين",
        links: [
          { label: "الرئيسية", url: "/" },
          { label: "سياسة الخصوصية", url: "/privacy" },
        ],
        trustBadges: ["🔒 بيانات العملاء آمنة", "🏥 HIPAA-compliant architecture"],
        padding: "lg",
        visibility: "all",
      }),
    ],
  },

  // ─── التفعيل ──────────────────────────────────────
  "/activation": {
    root,
    content: [
      block("HeroBlock", "activation-hero", {
        headline: "خطوة واحدة بينك وبين التفعيل",
        description: "فعّل حسابك الآن واحصل على وصول كامل ودائم لكافة ممزيات الرحلة.",
        ctaText: "فعّل الآن",
        ctaLink: "#payment",
        imageUrl: "",
        padding: "xl",
        visibility: "all",
      }),
      block("ZadElTariqBlock", "activation-pricing", {
        planName: "العضوية التأسيسية",
        price: "٢٩٩",
        currency: "ج.م",
        period: "مدى الحياة",
        features: [
          { text: "وصول كامل ودائم لكافة الممزيات", included: true },
          { text: "تحديثات تلقائية مشمولة", included: true },
          { text: "خريطة العلاقات التفاعلية", included: true },
          { text: "AI Triage والتحليل الذكي", included: true },
        ],
        ctaText: "فعّل حسابك",
        ctaLink: "/activation",
        highlighted: true,
        padding: "lg",
        visibility: "all",
      }),
      block("MahatatBlock", "activation-security", {
        features: [
          { title: "أمان", description: "الرحلة محمية ومقفولة على السياق الصحيح — بياناتك مشفرة.", icon: "🔒" },
          { title: "دعم مباشر", description: "تواصل معنا عبر واتساب في أي وقت.", icon: "💬" },
          { title: "ضمان", description: "لو مكنتش مرتاح، بنلاقي حل سوا.", icon: "✅" },
        ],
        padding: "lg",
        visibility: "all",
      }),
    ],
  },

  // ─── الخصوصية ─────────────────────────────────────
  "/privacy": {
    root,
    content: [
      block("HeadingBlock", "privacy-heading", {
        title: "سياسة الخصوصية",
        subtitle: "خصوصيتك هي أمان الرحلة — كل بياناتك ليك إنت وبس.",
        align: "center",
        padding: "xl",
        visibility: "all",
      }),
      block("AccordionBlock", "privacy-sections", {
        items: [
          { title: "ما البيانات التي نجمعها؟", content: "نجمع فقط البيانات الضرورية لتشغيل المنصة: البريد الإلكتروني (اختياري)، بيانات خريطة العلاقات، والتفضيلات. لا نجمع أي بيانات شخصية حساسة بدون موافقتك." },
          { title: "كيف نحمي بياناتك؟", content: "كل البيانات مشفرة أثناء النقل والتخزين. نستخدم بنية تحتية آمنة (Supabase + Row Level Security) لضمان أن بياناتك متاحة لك فقط." },
          { title: "هل نشارك بياناتك مع أطراف ثالثة؟", content: "لا نشارك بياناتك الشخصية مع أي طرف ثالث. نستخدم أدوات تحليلات مجهولة الهوية فقط لتحسين التجربة." },
          { title: "حقوقك", content: "لديك الحق في الوصول إلى بياناتك، تعديلها، تصديرها، أو حذفها في أي وقت من خلال إعدادات حسابك." },
          { title: "ملفات تعريف الارتباط (Cookies)", content: "نستخدم ملفات تعريف الارتباط الأساسية فقط للحفاظ على جلستك. لا نستخدم ملفات تتبع إعلانية." },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("DividerBlock", "privacy-divider", {
        style: "gradient",
        padding: "md",
        visibility: "all",
      }),
      block("SocialProofBlock", "privacy-trust", {
        stats: [
          { value: "🔒", label: "بياناتك آمنة ومشفرة", icon: "" },
          { value: "👁️", label: "لا مشاركة مع طرف ثالث", icon: "" },
          { value: "🗑️", label: "يمكنك الحذف في أي وقت", icon: "" },
        ],
        padding: "md",
        visibility: "all",
      }),
      block("FooterBlock", "privacy-footer", {
        brandName: "الرحلة",
        tagline: "",
        links: [
          { label: "الرئيسية", url: "/" },
          { label: "شروط الاستخدام", url: "/terms" },
        ],
        trustBadges: [],
        padding: "lg",
        visibility: "all",
      }),
    ],
  },

  // ─── الشروط ───────────────────────────────────────
  "/terms": {
    root,
    content: [
      block("HeadingBlock", "terms-heading", {
        title: "شروط الاستخدام",
        subtitle: "القواعد والاتفاقية لاستخدام منصة الرحلة",
        align: "center",
        padding: "xl",
        visibility: "all",
      }),
      block("AccordionBlock", "terms-sections", {
        items: [
          { title: "قبول الشروط", content: "باستخدامك لمنصة الرحلة، فإنك توافق على هذه الشروط. إذا لم تكن موافقاً، يرجى عدم استخدام المنصة." },
          { title: "طبيعة الخدمة", content: "منصة الرحلة هي أداة للوعي الذاتي وفهم العلاقات بصرياً. هي ليست بديلاً للعلاج النفسي أو المشورة الطبية المتخصصة." },
          { title: "حسابك ومسؤوليتك", content: "أنت مسؤول عن الحفاظ على أمان حسابك ومعلومات الدخول. أي نشاط يتم من خلال حسابك يعتبر مسؤوليتك." },
          { title: "سياسة الإلغاء والاسترداد", content: "العضوية التأسيسية هي دفعة واحدة. نسعى لحل أي مشكلة — تواصل معنا عبر واتساب إذا لم تكن مرتاحاً." },
          { title: "الملكية الفكرية", content: "جميع المحتوى والتصميم والكود الخاص بمنصة الرحلة محمي بحقوق الملكية الفكرية." },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("FooterBlock", "terms-footer", {
        brandName: "الرحلة",
        tagline: "",
        links: [
          { label: "الرئيسية", url: "/" },
          { label: "سياسة الخصوصية", url: "/privacy" },
        ],
        trustBadges: [],
        padding: "lg",
        visibility: "all",
      }),
    ],
  },

  // ─── القصص ────────────────────────────────────────
  "/stories": {
    root,
    content: [
      block("HeadingBlock", "stories-heading", {
        title: "قصص الرحلة",
        subtitle: "شهادات حقيقية من رواد الرحلة — كلمات من قلب التجربة.",
        align: "center",
        padding: "xl",
        visibility: "all",
      }),
      block("SocialProofBlock", "stories-stats", {
        stats: [
          { value: "١٠+", label: "رواد الرحلة", icon: "🫂" },
          { value: "٪٩٠", label: "شعروا بالوضوح بعد أول جلسة", icon: "✨" },
        ],
        padding: "md",
        visibility: "all",
      }),
      block("HekayatBlock", "stories-t1", {
        quote: "لأول مرة أشوف بوضوح إيه اللي بيسحب طاقتي. تجربة بسيطة ومريحة جداً.",
        author: "مستخدم",
        role: "استعاد هدوءه",
        avatarEmoji: "🌟",
        accentColor: "teal",
        padding: "md",
        visibility: "all",
      }),
      block("HekayatBlock", "stories-t2", {
        quote: "بطلت أسأل نفسي أسئلة كتير محيرة. الرحلة دي ادتني خطوة واحدة بدأت بيها أرتاح.",
        author: "مستخدمة",
        role: "استعادت راحتها",
        avatarEmoji: "💫",
        accentColor: "amber",
        padding: "md",
        visibility: "all",
      }),
      block("DividerBlock", "stories-divider", {
        style: "dots",
        padding: "md",
        visibility: "all",
      }),
      block("CTABannerBlock", "stories-cta", {
        headline: "رحلتك ممكن تكون القصة الجاية",
        description: "ابدأ النهارده واحكيلنا بعدين.",
        ctaText: "ابدأ رحلتك",
        ctaLink: "/onboarding",
        variant: "glow",
        padding: "lg",
        visibility: "all",
      }),
      block("FooterBlock", "stories-footer", {
        brandName: "الرحلة",
        tagline: "",
        links: [
          { label: "الرئيسية", url: "/" },
          { label: "لماذا الرحلة؟", url: "/about" },
        ],
        trustBadges: [],
        padding: "lg",
        visibility: "all",
      }),
    ],
  },

  // ─── استقبال الجلسة ───────────────────────────────
  "/sessions/intake": {
    root,
    content: [
      block("HeadingBlock", "sessions-intake-heading", {
        title: "استقبال الجلسة",
        subtitle: "قبل ما نبدأ، محتاجين نفهم وضعك الحالي عشان الجلسة تكون مخصصة ليك.",
        align: "center",
        padding: "xl",
        visibility: "all",
      }),
      block("MahatatBlock", "sessions-intake-steps", {
        features: [
          { title: "الحالة الحالية", description: "كيف حاسس دلوقتي؟ — تقييم سريع لمزاجك وطاقتك.", icon: "🌡️" },
          { title: "الهدف", description: "إيه اللي عايز تشتغل عليه النهارده؟", icon: "🎯" },
          { title: "السياق", description: "في حاجة مهمة حصلت من آخر جلسة؟", icon: "📝" },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("ButtonBlock", "sessions-intake-cta", {
        text: "ابدأ الاستقبال",
        url: "#",
        variant: "default",
        size: "lg",
        align: "center",
        padding: "lg",
        visibility: "all",
      }),
    ],
  },

  // ─── الطقس النفسي ─────────────────────────────────
  "/weather": {
    root,
    content: [
      block("HeadingBlock", "weather-heading", {
        title: "طقس علاقاتك",
        subtitle: "قيّم مناخ كل علاقة — هل هو صحو ولّا عاصف؟",
        align: "center",
        padding: "lg",
        visibility: "all",
      }),
      block("MapBlock", "weather-map", {
        mapId: "Weather Canvas",
        showLegend: true,
        particles: true,
        bgTheme: "primary",
        height: "tall",
        padding: "md",
        visibility: "all",
      }),
      block("MahatatBlock", "weather-indicators", {
        features: [
          { title: "صحو ☀️", description: "علاقة متوازنة ومستقرة — طاقة إيجابية.", icon: "☀️" },
          { title: "غائم جزئياً 🌤️", description: "فيه حاجات محتاجة انتباه بس الأساس سليم.", icon: "🌤️" },
          { title: "عاصف 🌧️", description: "علاقة فيها ضغط أو استنزاف — محتاجة تدخل.", icon: "🌧️" },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("CTABannerBlock", "weather-cta", {
        headline: "قيّم طقس علاقاتك النهارده",
        description: "في أقل من دقيقتين هتعرف مناخك الداخلي.",
        ctaText: "ابدأ التقييم",
        ctaLink: "/weather",
        variant: "glass",
        padding: "lg",
        visibility: "all",
      }),
    ],
  },
};

// ═══════════════════════════════════════════════════
// Template Options for Editor Sidebar
// ═══════════════════════════════════════════════════

export const editorTemplateOptions: EditorTemplateOption[] = [
  { path: "/", label: "الرئيسية — Home", note: "الصفحة الرئيسية الكاملة مع Hero و Features و Testimonials و CTA" },
  { path: "/about", label: "عن الرحلة — About", note: "صفحة التعريف بالمشكلة والحل والمحطات" },
  { path: "/pricing", label: "الباقات — Pricing", note: "العضوية التأسيسية + تسعير + أسئلة شائعة" },
  { path: "/onboarding", label: "بدء الرحلة — Onboarding", note: "الخطوات الثلاث لبدء الرحلة" },
  { path: "/dawayir", label: "دواير — خريطة العلاقات", note: "خريطة العلاقات التفاعلية الحية" },
  { path: "/coach", label: "لوحة المدرب — Coach", note: "لوحة تحكم المدربين + ترخيص" },
  { path: "/coach/landing", label: "هبوط المدرب — Coach Landing", note: "Landing page كاملة للمدربين" },
  { path: "/activation", label: "التفعيل — Activation", note: "صفحة التفعيل والدفع" },
  { path: "/privacy", label: "الخصوصية — Privacy", note: "سياسة الخصوصية كاملة" },
  { path: "/terms", label: "الشروط — Terms", note: "شروط الاستخدام والاتفاقية" },
  { path: "/stories", label: "القصص — Stories", note: "شهادات وتجارب رواد الرحلة" },
  { path: "/sessions/intake", label: "استقبال الجلسة — Intake", note: "صفحة استقبال عميل جديد" },
  { path: "/weather", label: "الطقس النفسي — Weather", note: "تقييم طقس العلاقات" },
];

export function getEditorTemplate(path: string): Data {
  return templates[(path as EditorTemplatePath) || "/"] || templates["/"];
}
