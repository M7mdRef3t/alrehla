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

const templates: Record<EditorTemplatePath, Data> = {
  "/": {
    root,
    content: [
      block("HeroBlock", "home-hero", {
        headline: "ابدأ رحلتك من هنا",
        description: "تمبلت مبني على الصفحة الأساسية الحالية، عشان تعدّل نفس التجربة بدل لوحة فاضية.",
        ctaText: "ابدأ الرحلة",
        ctaLink: "/onboarding",
        imageUrl: "",
        padding: "xl",
        visibility: "all",
      }),
      block("FeatureListBlock", "home-features", {
        features: [
          { title: "وضوح فوري", description: "تبدأ من نسخة موجودة بدل صفحة بيضا.", icon: "🧭" },
          { title: "تعديل أسرع", description: "تقدر تعيد ترتيب الرسائل الأساسية بسرعة.", icon: "⚡" },
          { title: "بداية عملية", description: "كل صفحة أساسية لها نقطة انطلاق مفهومة.", icon: "🛠️" },
        ],
        padding: "lg",
        visibility: "all",
      }),
    ],
  },
  "/about": {
    root,
    content: [
      block("HeadingBlock", "about-heading", {
        title: "عن دواير",
        subtitle: "دعاية مختصرة لتجربة المنصة ومسارها.",
        align: "right",
        padding: "md",
        visibility: "all",
      }),
      block("TextBlock", "about-text", {
        content: "الصفحة دي بتشبه الـ About route الحالية: تمهيد بسيط، نبرة هادئة، وتركيز على معنى الرحلة.",
        align: "right",
        size: "md",
        padding: "md",
        visibility: "all",
      }),
      block("ButtonBlock", "about-cta", {
        text: "ابدأ من الصفحة الرئيسية",
        url: "/",
        variant: "default",
        size: "default",
        align: "right",
        padding: "md",
        visibility: "all",
      }),
    ],
  },
  "/pricing": {
    root,
    content: [
      block("HeadingBlock", "pricing-heading", {
        title: "باقات الرحلة",
        subtitle: "نسخة مسودة مبنية على صفحة التسعير الحالية.",
        align: "right",
        padding: "md",
        visibility: "all",
      }),
      block("CardBlock", "pricing-card", {
        title: "Coach License",
        description: "بطاقة التسعير الأساسية مع مكان واضح لتعديل السعر والمزايا.",
        icon: "💳",
        glowColor: "primary",
        align: "right",
        variant: "glass",
        padding: "md",
        visibility: "all",
      }),
      block("FeatureListBlock", "pricing-features", {
        features: [
          { title: "حتى 25 عميل نشط", description: "الحد الأعلى الحالي المعروض في الصفحة.", icon: "👥" },
          { title: "AI Triage", description: "الأولويات والتحذيرات التنبؤية للمدرب.", icon: "🧠" },
          { title: "تصدير PDF", description: "تقارير جاهزة كعنصر مستقل قابل للتعديل.", icon: "📄" },
        ],
        padding: "lg",
        visibility: "all",
      }),
    ],
  },
  "/onboarding": {
    root,
    content: [
      block("HeroBlock", "onboarding-hero", {
        headline: "ابدأ التهيئة",
        description: "الرحلة هنا تبدأ بتهيئة واضحة قبل الدخول في التحويل أو الاستكمال.",
        ctaText: "اكمل",
        ctaLink: "#",
        imageUrl: "",
        padding: "xl",
        visibility: "all",
      }),
      block("TextBlock", "onboarding-text", {
        content: "الصفحة الفعلية فيها flow ديناميكي، فالقالب هنا بيحطك على نفس المزاج البصري والنصي بدل نقطة البداية الفارغة.",
        align: "right",
        size: "md",
        padding: "md",
        visibility: "all",
      }),
      block("ButtonBlock", "onboarding-cta", {
        text: "رجوع",
        url: "/",
        variant: "outline",
        size: "default",
        align: "right",
        padding: "md",
        visibility: "all",
      }),
    ],
  },
  "/dawayir": {
    root,
    content: [
      block("HeadingBlock", "dawayir-heading", {
        title: "دواير",
        subtitle: "واجهة السيادة الحية والخريطة التفاعلية.",
        align: "right",
        padding: "md",
        visibility: "all",
      }),
      block("MapBlock", "dawayir-map", {
        mapId: "الخريطة الرئيسية",
        showLegend: true,
        particles: true,
        bgTheme: "dark",
        height: "normal",
        padding: "md",
        visibility: "all",
      }),
      block("FeatureListBlock", "dawayir-features", {
        features: [
          { title: "الوعي", description: "تشريح الحالة بدل الاستهلاك الأعمى.", icon: "🌱" },
          { title: "الاتجاه", description: "خريطة واضحة لما هو قادم.", icon: "➡️" },
          { title: "التنفيذ", description: "نقطة انطلاق عملية للتعديل والبناء.", icon: "🧱" },
        ],
        padding: "lg",
        visibility: "all",
      }),
    ],
  },
  "/coach": {
    root,
    content: [
      block("HeroBlock", "coach-hero", {
        headline: "لوحة تحكم المدربين",
        description: "نسخة تمبلت مستخرجة من صفحة coach الحالية: إدارة عملاء، أولويات، وتدخلات AI.",
        ctaText: "افتح لوحة التحكم",
        ctaLink: "/coach",
        imageUrl: "",
        padding: "xl",
        visibility: "all",
      }),
      block("FeatureListBlock", "coach-features", {
        features: [
          { title: "إدارة العملاء", description: "مكان واضح للـ roster والمتابعة.", icon: "👥" },
          { title: "AI Triage", description: "أولوية ذكية للحالات الأهم.", icon: "🧠" },
          { title: "تنبيهات", description: "مساحة للـ alerting والاشتباك السريع.", icon: "🔔" },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("CardBlock", "coach-card", {
        title: "Coach License",
        description: "مكان مناسب لنسخة التسعير/التفعيل الخاصة بالمدرب.",
        icon: "🪪",
        glowColor: "tertiary",
        align: "right",
        variant: "glass",
        padding: "md",
        visibility: "all",
      }),
    ],
  },
  "/coach/landing": {
    root,
    content: [
      block("HeroBlock", "coach-landing-hero", {
        headline: "أدر عملاءك بدقة تحليلية",
        description: "نسخة أقرب جدًا للـ landing الحقيقي: hero، مزايا، وتسعير.",
        ctaText: "تواصل بخصوص المسار المتقدم",
        ctaLink: "https://wa.me/201023050092",
        imageUrl: "",
        padding: "xl",
        visibility: "all",
      }),
      block("FeatureListBlock", "coach-landing-features", {
        features: [
          { title: "إدارة العملاء من مكان واحد", description: "تجميع الرؤية داخل لوحة موحدة.", icon: "👥" },
          { title: "AI Triage", description: "ترتيب ذكي حسب الأولوية.", icon: "🧠" },
          { title: "Trajectory Tracking", description: "متابعة التقدّم بصريًا.", icon: "📈" },
          { title: "تنبيهات استباقية", description: "إشعارات تغير الحالة أو وجود أزمة.", icon: "⚠️" },
        ],
        padding: "lg",
        visibility: "all",
      }),
      block("CardBlock", "coach-landing-card", {
        title: "Coach License",
        description: "بطاقة تسعير واضحة مع CTA للتواصل عبر واتساب.",
        icon: "💳",
        glowColor: "primary",
        align: "center",
        variant: "glass",
        padding: "md",
        visibility: "all",
      }),
    ],
  },
  "/activation": {
    root,
    content: [
      block("HeroBlock", "activation-hero", {
        headline: "خطوة واحدة بينك وبين التفعيل",
        description: "قالب مبني على صفحة activation: توتر أقل، CTA أوضح، ومساحة تفعيل مباشرة.",
        ctaText: "اكمل التفعيل",
        ctaLink: "#",
        imageUrl: "",
        padding: "xl",
        visibility: "all",
      }),
      block("FeatureListBlock", "activation-features", {
        features: [
          { title: "أمان", description: "الرحلة محمية ومقفولة على السياق الصحيح.", icon: "🔒" },
          { title: "استكمال", description: "منطقة واضحة للخطوة التالية بعد التفعيل.", icon: "➡️" },
          { title: "تذكير", description: "مكان مناسب لرسالة استرجاع/استكمال.", icon: "⏰" },
        ],
        padding: "lg",
        visibility: "all",
      }),
    ],
  },
  "/privacy": {
    root,
    content: [
      block("HeadingBlock", "privacy-heading", {
        title: "الخصوصية",
        subtitle: "نصوص قانونية/أمنية منظمة داخل نفس نظام البلوكات.",
        align: "right",
        padding: "md",
        visibility: "all",
      }),
      block("TextBlock", "privacy-text", {
        content: "القالب ده مخصص لوضع سياسة الخصوصية وصياغة الثقة في الصفحة الحالية بدون فتح editor جديد من الصفر.",
        align: "right",
        size: "md",
        padding: "md",
        visibility: "all",
      }),
    ],
  },
  "/terms": {
    root,
    content: [
      block("HeadingBlock", "terms-heading", {
        title: "الشروط",
        subtitle: "مساحة لقواعد الاستخدام والاتفاقية.",
        align: "right",
        padding: "md",
        visibility: "all",
      }),
      block("TextBlock", "terms-text", {
        content: "صفحة الشروط هنا بتشتغل كمسودة واضحة وسهلة التعديل، بدل ما تكون خارج editor.",
        align: "right",
        size: "md",
        padding: "md",
        visibility: "all",
      }),
    ],
  },
  "/stories": {
    root,
    content: [
      block("HeroBlock", "stories-hero", {
        headline: "قصص الرحلة",
        description: "تمبلت لعرض الحكايات والتجارب الاجتماعية/النفسية بشكل بصري.",
        ctaText: "استعرض القصص",
        ctaLink: "#",
        imageUrl: "",
        padding: "xl",
        visibility: "all",
      }),
      block("CardBlock", "stories-card", {
        title: "قصة 1",
        description: "بطاقة أولى لعرض قصة أو تجربة ملهمة.",
        icon: "✨",
        glowColor: "tertiary",
        align: "right",
        variant: "glass",
        padding: "md",
        visibility: "all",
      }),
    ],
  },
  "/sessions/intake": {
    root,
    content: [
      block("HeadingBlock", "sessions-intake-heading", {
        title: "استقبال الجلسة",
        subtitle: "تمبلت لصفحة intake العملية.",
        align: "right",
        padding: "md",
        visibility: "all",
      }),
      block("TextBlock", "sessions-intake-text", {
        content: "هنا نعرض الحقول الأساسية أو الـ guide العام قبل بدء جلسة الاستقبال.",
        align: "right",
        size: "md",
        padding: "md",
        visibility: "all",
      }),
      block("ButtonBlock", "sessions-intake-cta", {
        text: "ابدأ الاستقبال",
        url: "#",
        variant: "default",
        size: "default",
        align: "right",
        padding: "md",
        visibility: "all",
      }),
    ],
  },
  "/weather": {
    root,
    content: [
      block("MapBlock", "weather-map", {
        mapId: "Weather Canvas",
        showLegend: true,
        particles: true,
        bgTheme: "primary",
        height: "tall",
        padding: "md",
        visibility: "all",
      }),
    ],
  },
};

export const editorTemplateOptions: EditorTemplateOption[] = [
  { path: "/", label: "Home / الرئيسية", note: "أقرب لقالب الهوم الحالي." },
  { path: "/about", label: "About", note: "نسخة تمهيدية من صفحة عن دواير." },
  { path: "/pricing", label: "Pricing", note: "قالب الباقات والتسعير." },
  { path: "/onboarding", label: "Onboarding", note: "مسودة بدء الرحلة." },
  { path: "/dawayir", label: "Dawayir", note: "الواجهة الرئيسية الحية." },
  { path: "/coach", label: "Coach", note: "لوحة التحكم للمدربين." },
  { path: "/coach/landing", label: "Coach Landing", note: "Landing page الحالية للمدربين." },
  { path: "/activation", label: "Activation", note: "خطوة التفعيل والاستكمال." },
  { path: "/privacy", label: "Privacy", note: "سياسة الخصوصية." },
  { path: "/terms", label: "Terms", note: "الشروط والاتفاقية." },
  { path: "/stories", label: "Stories", note: "صفحة القصص." },
  { path: "/sessions/intake", label: "Sessions Intake", note: "استقبال الجلسة." },
  { path: "/weather", label: "Weather", note: "صفحة weather التجريبية." },
];

export function getEditorTemplate(path: string): Data {
  return templates[(path as EditorTemplatePath) || "/"] || templates["/"];
}
