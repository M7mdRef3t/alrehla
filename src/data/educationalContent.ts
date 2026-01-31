/**
 * بنية البيانات للمحتوى التعليمي
 */

export type ContentCategory = 
  | "boundaries"      // الحدود الشخصية
  | "symptoms"        // الأعراض
  | "recovery"        // التعافي
  | "relationships"   // العلاقات
  | "communication";  // التواصل

export interface VideoContent {
  id: string;
  title: string;
  description: string;
  duration: string; // "2:30"
  category: ContentCategory;
  thumbnailUrl?: string;
  videoUrl?: string; // YouTube embed أو رابط مباشر
  relatedGoals?: string[];
  tags?: string[];
}

export interface SuccessStory {
  id: string;
  title: string;
  category: ContentCategory;
  summary: string;
  journey: {
    before: string;      // الوضع قبل
    challenge: string;   // التحدي
    action: string;      // الإجراء المتخذ
    after: string;       // الوضع بعد
  };
  duration: string; // "3 أشهر"
  anonymous: true;
  tags?: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: ContentCategory;
  relatedContent?: string[]; // IDs of related videos or stories
  tags?: string[];
}

/**
 * محتوى فيديوهات تعليمية (placeholder)
 */
export const videos: VideoContent[] = [
  {
    id: "vid-1",
    title: "ما هي الحدود الشخصية؟",
    description: "مقدمة بسيطة عن مفهوم الحدود وأهميتها في حياتنا",
    duration: "2:30",
    category: "boundaries",
    tags: ["مبتدئ", "أساسيات"]
  },
  {
    id: "vid-2",
    title: "كيف تعرف إذا كانت علاقتك صحية؟",
    description: "علامات العلاقة الصحية والعلاقة المستنزفة",
    duration: "3:15",
    category: "relationships",
    tags: ["تقييم", "علاقات"]
  },
  {
    id: "vid-3",
    title: "التعامل مع الشعور بالذنب",
    description: "كيف تتخلص من الذنب الزائف عند وضع حدود",
    duration: "4:00",
    category: "symptoms",
    tags: ["مشاعر", "ذنب"]
  },
  {
    id: "vid-4",
    title: "كيف تقول لا بطريقة صحية؟",
    description: "تقنيات عملية لرفض الطلبات بدون إيذاء الآخرين",
    duration: "3:30",
    category: "communication",
    tags: ["مهارات", "تواصل"]
  },
  {
    id: "vid-5",
    title: "التعافي من علاقة مستنزفة",
    description: "خطوات عملية لاستعادة طاقتك بعد علاقة سامة",
    duration: "5:00",
    category: "recovery",
    tags: ["تعافي", "شفاء"]
  }
];

/**
 * قصص نجاح ملهمة (placeholder)
 */
export const successStories: SuccessStory[] = [
  {
    id: "story-1",
    title: "كيف استعدت طاقتي بعد علاقة مستنزفة",
    category: "recovery",
    summary: "رحلة تعافي من علاقة عاطفية مؤذية إلى حياة متوازنة",
    journey: {
      before: "كنت دايماً متعب ومش عارف أقول لا. كل طاقتي رايحة في علاقة مش بتديني حاجة.",
      challenge: "أصعب حاجة كانت إني أعترف إن العلاقة دي مش صحية. كان فيه ذنب كتير.",
      action: "بدأت أحط حدود واضحة. أول مرة قلت لا، حسيت بذنب. لكن مع الوقت، بقى أسهل.",
      after: "دلوقتي عندي طاقة أكتر. بعرف أختار مين يستحق وقتي. حياتي بقت أهدى بكتير."
    },
    duration: "4 أشهر",
    anonymous: true,
    tags: ["تعافي", "حدود", "علاقات"]
  },
  {
    id: "story-2",
    title: "رحلتي مع وضع حدود مع العائلة",
    category: "boundaries",
    summary: "كيف وضعت حدود صحية مع أهلي بدون قطع العلاقة",
    journey: {
      before: "عائلتي كانت بتتدخل في كل حاجة. حاسس إني مش عايش حياتي.",
      challenge: "خوفي من إني أزعلهم أو يحسوا إني مش بحبهم.",
      action: "بدأت أوضح احتياجاتي بهدوء. 'أنا بحبكم، لكن محتاج مساحة شخصية'.",
      after: "العلاقة بقت أحسن. فهموا إني مش برفضهم، أنا بحمي نفسي."
    },
    duration: "6 أشهر",
    anonymous: true,
    tags: ["عائلة", "حدود", "تواصل"]
  },
  {
    id: "story-3",
    title: "من الاستنزاف إلى الاستقلالية",
    category: "relationships",
    summary: "كيف تعلمت أقول لا وأعيش حياة متوازنة",
    journey: {
      before: "كنت people pleaser. دايماً بقول أيوه حتى لو مش مريح.",
      challenge: "الخوف من إني أخسر ناس أو أبقى 'الشخص السيء'.",
      action: "بدأت أمارس قول لا في مواقف صغيرة. مع الوقت بقى طبيعي.",
      after: "اكتشفت إن اللي يستاهل هيفهم وهيحترمني أكتر. والباقي... مش خسارة."
    },
    duration: "5 أشهر",
    anonymous: true,
    tags: ["استقلالية", "people pleasing", "نمو"]
  }
];

/**
 * أسئلة شائعة
 */
export const faqs: FAQItem[] = [
  {
    id: "faq-1",
    question: "هل من الأنانية وضع حدود؟",
    answer: "لا، وضع الحدود مش أنانية. ده حماية لصحتك النفسية. لو ما حميتش نفسك، مش هتقدر تدي حاجة لحد. الحدود بتخلي العلاقات أصح وأطول.",
    category: "boundaries",
    tags: ["أنانية", "حدود"]
  },
  {
    id: "faq-2",
    question: "كيف أتعامل مع شخص لا يحترم حدودي؟",
    answer: "أولاً: وضّح الحد بشكل واضح ومباشر. ثانياً: كن ثابت - لو خرقوا الحد، ذكّرهم بهدوء. ثالثاً: لو استمروا، قلل التواصل أو ابعد تماماً. أنت مش مسؤول عن فهمهم، أنت مسؤول عن حماية نفسك.",
    category: "boundaries",
    relatedContent: ["vid-4"],
    tags: ["احترام", "حدود"]
  },
  {
    id: "faq-3",
    question: "ماذا لو كان الشخص المستنزف أحد الوالدين؟",
    answer: "العلاقة مع الأهل معقدة. لكن حتى مع الأهل، ليك الحق في حدود. مش لازم تقطع العلاقة، لكن ممكن تقلل المدة، تحدد المواضيع، وتحمي طاقتك. الاحترام مش معناه التضحية بصحتك.",
    category: "boundaries",
    relatedContent: ["story-2"],
    tags: ["عائلة", "أهل"]
  },
  {
    id: "faq-4",
    question: "كم يستغرق التعافي من علاقة مستنزفة؟",
    answer: "مافيش وقت محدد. كل شخص مختلف. الأهم إنك تبدأ. بعض الناس يحسوا بتحسن في أسابيع، والبعض يحتاج شهور. المهم تكون صبور على نفسك وتستمر في التقدم.",
    category: "recovery",
    relatedContent: ["vid-5", "story-1"],
    tags: ["تعافي", "وقت"]
  },
  {
    id: "faq-5",
    question: "هل يمكن أن تتحسن علاقة في الدائرة الحمراء؟",
    answer: "نعم، ممكن. لكن ده يحتاج تغيير حقيقي من الطرفين. حط حدود واضحة، وراقب التحسن. لو الشخص احترم الحدود واستمر، ممكن العلاقة تتحسن. لو لأ، المسافة أفضل.",
    category: "relationships",
    tags: ["تحسين", "علاقات"]
  },
  {
    id: "faq-6",
    question: "ليه بحس بالذنب لما بقول لا؟",
    answer: "الذنب الزائف ده نتيجة تربية أو ضغوط اجتماعية. اتعلمنا إن 'الطيبين' دايماً بيقولوا أيوه. لكن الحقيقة: قول لا مش معناه إنك وحش، معناه إنك بتحترم نفسك.",
    category: "symptoms",
    relatedContent: ["vid-3"],
    tags: ["ذنب", "مشاعر"]
  },
  {
    id: "faq-7",
    question: "كيف أعرف إن الحد اللي حطيته صح؟",
    answer: "الحد الصح بيخليك تحس براحة أكتر، مش بتوتر. لو حاسس إنك محتاج تبرر الحد كتير، ممكن يكون محتاج تعديل. جرّب وعدّل مع الوقت.",
    category: "boundaries",
    tags: ["تقييم", "حدود"]
  },
  {
    id: "faq-8",
    question: "هل يجب أن أشرح سبب وضع الحد؟",
    answer: "لا. 'لا' جملة كاملة. ممكن تشرح لو حبيت، لكن مش لازم. الناس اللي بتحترمك مش هتطلب تبرير.",
    category: "communication",
    relatedContent: ["vid-4"],
    tags: ["تواصل", "شرح"]
  },
  {
    id: "faq-9",
    question: "ماذا لو خرق الشخص الحد مرة أخرى؟",
    answer: "ذكّره بهدوء مرة. لو كرر، قلل التواصل. لو استمر، ابعد. الناس اللي بتحب فعلاً بتحترم حدودك.",
    category: "boundaries",
    tags: ["خرق", "احترام"]
  },
  {
    id: "faq-10",
    question: "هل يمكن أن تكون كل علاقاتي في الدائرة الخضراء؟",
    answer: "مش واقعي ومش ضروري. حتى العلاقات الصحية بتحتاج مجهود أحياناً. الدائرة الصفراء عادية (عائلة، عمل). المهم تكون واعي وتحمي طاقتك.",
    category: "relationships",
    tags: ["توقعات", "واقعية"]
  },
  {
    id: "faq-11",
    question: "كيف أوازن بين الحدود والمرونة؟",
    answer: "الحدود مش جدران خرسانية. ممكن تكون مرن في أوقات معينة (أزمة، ظرف استثنائي). لكن متخليش المرونة هي القاعدة. الحد الواضح مع مرونة مؤقتة = توازن.",
    category: "boundaries",
    tags: ["توازن", "مرونة"]
  },
  {
    id: "faq-12",
    question: "ماذا أفعل إذا شعرت بالوحدة بعد وضع الحدود؟",
    answer: "الوحدة المؤقتة أفضل من الاستنزاف المستمر. مع الوقت، هتلاقي ناس بتحترم حدودك. الوحدة دي فرصة تتعرف على نفسك أكتر وتبني علاقات أصح.",
    category: "recovery",
    relatedContent: ["story-3"],
    tags: ["وحدة", "تعافي"]
  }
];

/**
 * الفئات مع تسمياتها العربية
 */
export const categoryLabels: Record<ContentCategory, string> = {
  boundaries: "الحدود الشخصية",
  symptoms: "الأعراض والمشاعر",
  recovery: "التعافي",
  relationships: "العلاقات",
  communication: "التواصل"
};

/**
 * الحصول على محتوى مقترح حسب الموقف
 */
export function getSuggestedContent(ring: "green" | "yellow" | "red"): {
  videos: VideoContent[];
  stories: SuccessStory[];
  faqs: FAQItem[];
} {
  if (ring === "red") {
    return {
      videos: videos.filter(v => v.category === "recovery" || v.category === "boundaries"),
      stories: successStories.filter(s => s.category === "recovery"),
      faqs: faqs.filter(f => f.category === "recovery" || f.id === "faq-3")
    };
  }
  
  if (ring === "yellow") {
    return {
      videos: videos.filter(v => v.category === "boundaries" || v.category === "communication"),
      stories: successStories.filter(s => s.category === "boundaries"),
      faqs: faqs.filter(f => f.category === "boundaries" || f.category === "communication")
    };
  }
  
  // green
  return {
    videos: videos.filter(v => v.category === "relationships"),
    stories: successStories.filter(s => s.category === "relationships"),
    faqs: faqs.filter(f => f.category === "relationships")
  };
}
