/**
 * تعريفات الإنجازات — نصوص دافئة ومحفزة لاستكمال الرحلة
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** رسالة قصيرة عند الفتح — تشجيع */
  hint: string;
  icon: string;
  /** ترتيب العرض */
  order: number;
  /** إذا كان الإنجاز سرياً ولا يظهر إلا بعد فتحه */
  hidden?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "starter_click",
    title: "انطلاق",
    description: "ضغطت على زر «أنطلق»",
    hint: "قررت تبدأ، ودي أهم خطوة في الرحلة.",
    icon: "🚀",
    order: 1
  },
  {
    id: "mirror_discovery",
    title: "أول انعكاس",
    description: "حولت انشغالك بـ «الاسم» إلى حقيقة على الخريطة",
    hint: "اللي كان شاغلك بقى قدامك. دي بداية السيطرة على طاقتك.",
    icon: "🪞",
    order: 1.5
  },
  {
    id: "installer_click",
    title: "جاهز دايمًا",
    description: "ضغطت على «تثبيت التطبيق»",
    hint: "قرار ذكي يخلي رحلتك قريبة منك في أي وقت.",
    icon: "📲",
    order: 2
  },
  {
    id: "first_step",
    title: "أول خطوة",
    description: "أضفت أول شخص على الخريطة",
    hint: "بداية حلوة! كل رحلة بتبدأ بخطوة.",
    icon: "🌱",
    order: 3
  },
  {
    id: "writer",
    title: "كاتب",
    description: "سجّلت أول موقف",
    hint: "الكتابة بتوضّح الصورة. كمّل.",
    icon: "✍️",
    order: 4
  },
  {
    id: "plan_seeker",
    title: "صاحب مسار",
    description: "سجّلت موقفين وفتحت مسار الحماية",
    hint: "مسارك المخصص جاهز. خطوة جميلة!",
    icon: "📋",
    order: 5
  },
  {
    id: "trained",
    title: "متمرّس",
    description: "خلّصت تمرين مع شخص",
    hint: "التمرّن على المسافات بيقوّيك. فخورين بيك.",
    icon: "🎯",
    order: 6
  },
  {
    id: "growing_map",
    title: "خريطتك بتكبر",
    description: "عندك ٣ أشخاص على الخريطة",
    hint: "واضح إنك جاد في فهم مداراتك. كمّل.",
    icon: "🗺️",
    order: 7
  },
  {
    id: "boundary_keeper",
    title: "صاحب مساحة",
    description: "عندك ٥ أشخاص على الخريطة",
    hint: "إنجاز كبير! أنت بتبني مساحتك بوضوح.",
    icon: "🛡️",
    order: 8
  },
  {
    id: "measured",
    title: "واعي",
    description: "خلّصت الاستكشاف الأولي",
    hint: "معرفة نقطة البداية أول خطوة للوضوح.",
    icon: "📊",
    order: 9
  },
  {
    id: "reader",
    title: "قارئ",
    description: "فتحت المكتبة التعليمية",
    hint: "المعرفة بتنوّر الطريق. كمّل اقرأ.",
    icon: "📚",
    order: 10
  },
  {
    id: "breather",
    title: "هادي",
    description: "استخدمت تمرين التنفس",
    hint: "إنك تهتم بنفسك ده إنجاز بحد ذاته.",
    icon: "🌬️",
    order: 11
  },
  {
    id: "mission_complete",
    title: "رحّال",
    description: "خلّصت خطوة كاملة في الرحلة",
    hint: "أول خطوة مكتملة… دلوقتي أنت ماشي بجد.",
    icon: "🏁",
    order: 12
  },
  {
    id: "pulse_explainer",
    title: "فضفضة واعية",
    description: "كتبت في «لو حابب تشرح أكتر» في ضبط البوصلة",
    hint: "الشرح بيوصلك لفهم أعمق لنفسك.",
    icon: "📝",
    order: 13
  },
  {
    id: "pulse_saver",
    title: "ثبّت حالتك",
    description: "حفظت حالتك من شاشة ضبط البوصلة",
    hint: "كل حفظ بيديك وضوح أكتر لخطوتك الجاية.",
    icon: "✅",
    order: 14
  },
  {
    id: "login_success",
    title: "دخول ناجح",
    description: "سجّلت الدخول بعد شاشة ضبط البوصلة",
    hint: "جميل. حسابك اتفعل ورحلتك محفوظة.",
    icon: "🔐",
    order: 15
  },
  {
    id: "person_located_on_map",
    title: "حددت مكانه",
    description: "بعد إضافة شخص ضغطت «تم، ورّيني مكانه على الخريطة»",
    hint: "خطوة ممتازة. كده الصورة على الخريطة بقت أوضح.",
    icon: "📍",
    order: 16
  },
  {
    id: "armory_visited",
    title: "صاحب ترسانة",
    description: "فتحت شاشة المدرعة (الردود الجاهزة)",
    hint: "اللي عنده أدوات مش بيتفاجئ بالمواقف.",
    icon: "🛡️",
    order: 17
  },
  {
    id: "exit_scripts_visited",
    title: "عارف مخرجه",
    description: "فتحت مكتبة المخارج الذكية",
    hint: "الخروج الهادئ فن — وإنت بتتعلمه.",
    icon: "🚪",
    order: 18
  },
  {
    id: "grounding_visited",
    title: "لقي أرضه",
    description: "جربت أدوات التأريض",
    hint: "في الوقت الصعب، اللي يلاقي أرضه يعدّي أي عاصفة.",
    icon: "🌿",
    order: 19
  },
  {
    id: "streak_1",
    title: "بداية الطريق",
    description: "عدت للمنصة يوماً واحداً متواصلاً",
    hint: "أول يوم أصعب يوم — وإنت عديته.",
    icon: "📅",
    order: 20
  },
  {
    id: "streak_3",
    title: "ثلاثة أيام",
    description: "عدت 3 أيام متواصلة",
    hint: "3 أيام من الوعي تساوي أسابيع من الضياع.",
    icon: "🔥",
    order: 21
  },
  {
    id: "streak_7",
    title: "أسبوع كامل",
    description: "عدت 7 أيام متواصلة",
    hint: "7 أيام من الوضوح تغيّر طريقة تفكيرك. أنت تغيّرت فعلاً.",
    icon: "⚡",
    order: 22
  },
  /* ══ Hidden Achievements (Phase 2) ══ */
  {
    id: "night_owl",
    title: "حارس الليل",
    description: "استخدمت تمرين التنفس في وقت متأخر جداً",
    hint: "السكينة في وسط الليل إنجاز خاص. جارفيس فخور بهدوئك.",
    icon: "🦉",
    order: 22.1,
    hidden: true
  },
  {
    id: "discipline_master",
    title: "سيد الانضباط",
    description: "فتحت مركز التطور 10 مرات دون تشتت",
    hint: "المتابعة المستمرة لمستواك بتعني إنك جاد في التغيير.",
    icon: "🧘‍♂️",
    order: 22.2,
    hidden: true
  },
  {
    id: "impulse_master",
    title: "حكيم الموارد",
    description: "تصفحت المتجر وتراجعت 5 مرات قبل الشراء",
    hint: "التفكير قبل الإنفاق دليل على نضج الشخصية المتزنة.",
    icon: "💎",
    order: 22.3,
    hidden: true
  },
  /* ══ Quiz Achievements ══ */
  {
    id: "quiz_first",
    title: "أول اختبار",
    description: "أكملت أول اختبار على منصة الرحلة",
    hint: "الوعي يبدأ بسؤال واحد. أنت بدأت.",
    icon: "🧠",
    order: 23
  },
  {
    id: "quiz_double",
    title: "مزدوج",
    description: "أكملت اختبارين مختلفين",
    hint: "كل اختبار يضيف طبقة جديدة لفهم نفسك.",
    icon: "👫",
    order: 24
  },
  {
    id: "quiz_half",
    title: "في المنتصف",
    description: "أكملت نصف الاختبارات (4 من 7)",
    hint: "نصف الطريق مرّت — والنصف الثاني فيه وضوح أكثر!",
    icon: "🏄",
    order: 25
  },
  {
    id: "quiz_master",
    title: "سيد الوعي",
    description: "أكملت جميع الاختبارات السبعة",
    hint: "من 5٪ من المستخدمين فقط يصلون لهنا. أنت منهم.",
    icon: "🏆",
    order: 26
  },
  /* ══ Life OS / Ritual Achievements ══ */
  {
    id: "ritual_starter",
    title: "بداية الانضباط",
    description: "أكملت أول 5 عادات يومية لك",
    hint: "العادة هي اللي بتبني الشخصية. استمر.",
    icon: "🕯️",
    order: 27
  },
  {
    id: "ritual_steady",
    title: "ثبات العادة",
    description: "حافظت على سلسلة عادات كاملة لمدة 7 أيام",
    hint: "الاستمرارية هي السر الحقيقي للنجاح.",
    icon: "🧘",
    order: 28
  },
  {
    id: "ritual_master",
    title: "سيد الروتين",
    description: "أكملت 50 عادة في سجلاتك",
    hint: "دلوقتي الانضباط بقى جزء من هويتك.",
    icon: "👑",
    order: 29
  },
  {
    id: "life_seeker",
    title: "متوازن",
    description: "وصلت لمعدل حياة (Life Score) أعلى من 75%",
    hint: "أنت دلوقتي بتعيش حياة واعية ومتزنة فعلاً.",
    icon: "💎",
    order: 30
  }
].sort((a, b) => a.order - b.order);

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
