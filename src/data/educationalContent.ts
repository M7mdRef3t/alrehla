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
 * محتوى فيديوهات تعليمية — روابط يوتيوب حقيقية
 */
export const videos: VideoContent[] = [
  {
    id: "vid-1",
    title: "ما هي الحدود الشخصية؟",
    description: "مقدمة بسيطة عن مفهوم الحدود وأهميتها في حياتنا — الحدود الشخصية: كيف تصنعها وتحافظ على احترام الآخرين",
    duration: "2:30",
    category: "boundaries",
    thumbnailUrl: "https://img.youtube.com/vi/8KX9gPXNm-s/mqdefault.jpg",
    videoUrl: "https://www.youtube.com/embed/8KX9gPXNm-s",
    relatedGoals: ["حدود صحية", "احترام الذات"],
    tags: ["مبتدئ", "أساسيات"]
  },
  {
    id: "vid-2",
    title: "كيف تعرف إذا كانت علاقتك صحية؟",
    description: "علامات العلاقة الصحية والعلاقة المستنزفة — علامات تدل أنك في علاقة سامة وكيف تتعامل معها",
    duration: "3:15",
    category: "relationships",
    thumbnailUrl: "https://img.youtube.com/vi/op5yEsy1aQs/mqdefault.jpg",
    videoUrl: "https://www.youtube.com/embed/op5yEsy1aQs",
    relatedGoals: ["تقييم العلاقة", "وعي"],
    tags: ["تقييم", "علاقات"]
  },
  {
    id: "vid-3",
    title: "التعامل مع الشعور بالذنب",
    description: "كيف تتخلص من الذنب الزائف عند وضع حدود — أنواع الحدود وكيف تضع حدود بدون ذنب مزيف",
    duration: "4:00",
    category: "symptoms",
    thumbnailUrl: "https://img.youtube.com/vi/YHPB3bPLSGo/mqdefault.jpg",
    videoUrl: "https://www.youtube.com/embed/YHPB3bPLSGo",
    relatedGoals: ["فك الارتباط الشعوري", "ذنب صحي"],
    tags: ["مشاعر", "ذنب"]
  },
  {
    id: "vid-4",
    title: "كيف تقول لا بطريقة صحية؟",
    description: "تقنيات عملية لرفض الطلبات بدون إيذاء الآخرين — تمرين عملي لوضع حدود صحية من دون ما تخسر علاقاتك",
    duration: "3:30",
    category: "communication",
    thumbnailUrl: "https://img.youtube.com/vi/1xREu13F9yI/mqdefault.jpg",
    videoUrl: "https://www.youtube.com/embed/1xREu13F9yI",
    relatedGoals: ["درع الحماية", "تواصل واضح"],
    tags: ["مهارات", "تواصل"]
  },
  {
    id: "vid-5",
    title: "التعافي من علاقة مستنزفة",
    description: "خطوات عملية لاستعادة طاقتك بعد علاقة سامة — كيف تتخلص من العلاقات السامة المؤذية وتستعيد حياتك",
    duration: "5:00",
    category: "recovery",
    thumbnailUrl: "https://img.youtube.com/vi/76AG2Ug2des/mqdefault.jpg",
    videoUrl: "https://www.youtube.com/embed/76AG2Ug2des",
    relatedGoals: ["صيام شعوري", "تعافي"],
    tags: ["تعافي", "شفاء"]
  }
];

/**
 * قصص نجاح ملهمة — بيانات كاملة
 */
export const successStories: SuccessStory[] = [
  {
    id: "story-1",
    title: "كيف استعدت طاقتي بعد علاقة مستنزفة",
    category: "recovery",
    summary: "رحلة تعافي من علاقة عاطفية مؤذية إلى حياة متوازنة",
    journey: {
      before: "كنت دايماً متعب ومش عارف أقول لا. كل طاقتي رايحة في علاقة مش بتديني حاجة. حسيت إني فاضي من جوا.",
      challenge: "أصعب حاجة كانت إني أعترف إن العلاقة دي مش صحية. كان فيه ذنب كتير وإحساس إني لازم أستمر.",
      action: "بدأت أحط حدود واضحة. أول مرة قلت لا، حسيت بذنب. لكن مع الوقت، بقى أسهل. استخدمت تمارين التنفس وكتابة المواقف اللي وجعتني عشان أتذكر ليه باعدت.",
      after: "دلوقتي عندي طاقة أكتر. بعرف أختار مين يستحق وقتي. حياتي بقت أهدى بكتير والنوم بقي منتظم."
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
      before: "عائلتي كانت بتتدخل في كل حاجة: الشغل، الزواج، حتى نوعية الأكل. حاسس إني مش عايش حياتي.",
      challenge: "خوفي من إني أزعلهم أو يحسوا إني مش بحبهم. المجتمع كمان بيقول 'بر الوالدين' فحسيت إن أي حدود = عقوق.",
      action: "بدأت أوضح احتياجاتي بهدوء. 'أنا بحبكم، لكن محتاج مساحة شخصية وقرارات خاصة بيا'. رفضت مناقشات معينة في أوقات معينة.",
      after: "العلاقة بقت أحسن. فهموا إني مش برفضهم، أنا بحمي نفسي. حتى أمي بدأت تحترم وقتي وتستأذن."
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
      before: "كنت people pleaser. دايماً بقول أيوه حتى لو مش مريح. مكالمات الساعة ١٢ ليلاً، طلبات آخر لحظة، كل حاجة أولوية غيري.",
      challenge: "الخوف من إني أخسر ناس أو أبقى 'الشخص السيء'. كنت بحسب إن الحدود هتبعدني عن الكل.",
      action: "بدأت أمارس قول لا في مواقف صغيرة: 'مش هقدر النهاردة، ممكن بكرة؟'. مع الوقت بقى طبيعي. استخدمت جمل جاهزة: 'ده مش يناسبني حالياً'.",
      after: "اكتشفت إن اللي يستاهل هيفهم وهيحترمني أكتر. والباقي مش خسارة. عدد علاقاتي قلّ لكن نوعيتها زادت."
    },
    duration: "5 أشهر",
    anonymous: true,
    tags: ["استقلالية", "people pleasing", "نمو"]
  },
  {
    id: "story-4",
    title: "فك الارتباط الشعوري: بعد ما بعدت جسدياً",
    category: "recovery",
    summary: "كنت بعيد عن الشخص فعلاً، لكن لسه بفكر فيه ٢٤ ساعة. رحلة الصيام الشعوري.",
    journey: {
      before: "قطعت التواصل من سنين، لكن لسه صورته في دماغي. أي مناسبة أو أغنية تفتح الجرح. حسيت إني حرّ برا بس مسجون جوا.",
      challenge: "الذنب إنني مش بكلمه، والحنين لأيام حلوة، والخوف إنه يتكلم عني. المحكمة الداخلية كانت شغالة طول الوقت.",
      action: "استخدمت 'مرساة الواقع': كتبت ٣ مواقف خلّوني أبعد فعلاً وقرأتها كل ما حسيت بحنين. زرار 'أنا بفكر فيه دلوقتي' وكنت بصنّف: ذنب؟ حنين؟ خوف؟ وده خفف الاجترار.",
      after: "الفكرة بقت عابرة مش ضيف دايماً. مش بقى زعلان لما ييجي على بالي، بقى زي أي ذكرى بعيدة. راحة ذهنية حقيقية."
    },
    duration: "3 أشهر",
    anonymous: true,
    tags: ["صيام شعوري", "فك ارتباط", "حدود داخلية"]
  },
  {
    id: "story-5",
    title: "حدود في الشغل: من الاستنزاف إلى الاحتراف",
    category: "boundaries",
    summary: "كيف وضعت حدود مع المدير والزملاء بدون ما أخسر الوظيفة",
    journey: {
      before: "مديري كان بيكلمني في أي وقت، ويطلب شغل إضافي في الإجازات. زملاء بيحملوني مهامهم. حسيت إني 'صندوق شكاوى' ومش بقى عندي وقت لأسرتي.",
      challenge: "الخوف من التقييم السيء أو إنهم يقللوا مسؤولياتي. الواحد اتعلّم إن 'الطيب' هو اللي ما يرفضش.",
      action: "وضحت أوقات الرد: 'هرد في أوقات العمل الرسمية إلا للطوارئ الحقيقية'. رفضت مهام مش من اختصاصي بهدوء: 'ده مش في نطاق دوري، ممكن ننسق مع فلان'. سجّلت المهام والمواعيد عشان ما يتحمّلش عليّ فوق طاقتي.",
      after: "الاحترام زاد. مديري بيعرف إني جاد في الشغل بس مش متاح ٢٤ ساعة. العلاقة بقت أوضح ومفيش لعب على الحبل."
    },
    duration: "4 أشهر",
    anonymous: true,
    tags: ["شغل", "حدود", "تواصل"]
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
