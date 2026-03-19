import type { LiveLanguage } from "./types";

export const PARITY_STRINGS = {
  en: {
    brandName: "Dawayir",
    brandSub: "A live cognitive mirror, not another chatbot.",
    brandHook: "Speak for minutes. Leave with one clear next step today.",
    welcomeQuestion: "What feels most tangled right now?",
    enterSpace: "Start the Mirror",
    memoryBank: "Memory Bank",
    liveChat: "Live Conversation",
    setupTitle: "Session setup",
    setupBody:
      "Speak freely about what is pressing on you. The circles will shift in real time and map your move from overload to clarity.",
    historyTitle: "Memory Bank",
    historyBody: "Review prior sessions, truth contracts, and replays.",
    coupleTitle: "Couple Mode",
    coupleBody: "Open the shared session flow with the same visual language.",
    teacherTitle: "Teacher Dashboard",
    teacherBody: "Open the coach dashboard embedded in the platform.",
    settingsTitle: "Settings",
    startHint: "Microphone permission required • Native audio session",
    viewHeadings: {
      welcome: "Welcome",
      setup: "Session setup",
      live: "Live session",
      complete: "Journey complete",
    },
  },
  ar: {
    brandName: "دواير",
    brandSub: "مراية معرفية حية، مش شات عادي.",
    brandHook: "اتكلم دقائق قليلة واخرج بخطوة واحدة واضحة لليوم.",
    welcomeQuestion: "إيه أكتر حاجة ملخبطة المشهد دلوقتي؟",
    enterSpace: "ابدأ المراية",
    memoryBank: "بنك الذاكرة",
    liveChat: "المحادثة",
    setupTitle: "تجهيز الجلسة",
    setupBody:
      "اتكلم بحرية عن الحاجة اللي ضاغطة عليك. الدواير هتتحرك لحظة بلحظة وتحوّل الزحمة لخطوة أوضح.",
    historyTitle: "بنك الذاكرة",
    historyBody: "راجع الجلسات السابقة، العقود، وإعادة التشغيل.",
    coupleTitle: "جلسة مشتركة",
    coupleBody: "افتح مسار الجلسة الثنائية بنفس اللغة البصرية الأصلية.",
    teacherTitle: "لوحة المعلم",
    teacherBody: "افتح لوحة الكوتش المدمجة داخل المنصة.",
    settingsTitle: "الإعدادات",
    startHint: "يتطلب إذن المايكروفون • جلسة صوت حي",
    viewHeadings: {
      welcome: "الترحيب",
      setup: "تجهيز الجلسة",
      live: "الجلسة الحية",
      complete: "اكتمال الرحلة",
    },
  },
} satisfies Record<LiveLanguage, Record<string, unknown>>;

export const PARITY_ONBOARDING_STEPS = {
  ar: [
    {
      title: "مرحباً — أنا دواير",
      body: "اتكلم بطبيعتك، وأنا هحوّل الزحمة اللي جواك لصورة حية قدامك. مش شات، دي مراية لعقلك.",
    },
    {
      title: "الموضوع 🟠 — الضغط الأساسي",
      body: "دايرة الموضوع بتكبر لما الضغط يزيد. هي المشكلة اللي قدامك دلوقتي.",
    },
    {
      title: "الهدف 🟢 — اللي عايز توصّله",
      body: "دايرة الهدف بتوضح لما تبدأ تشوف الطريق. كل ما تقرب، بتكبر.",
    },
    {
      title: "العقبات 🔴 — اللي بيشدك",
      body: "دايرة العقبات بتكبر لما تكتشف اللي بيمنعك. لما التلاتة يتوازنوا، الصورة بتصفى.",
    },
  ],
  en: [
    {
      title: "Welcome — I'm Dawayir",
      body: "Talk naturally, and I'll turn inner overload into a live visual. Not a chatbot — a mirror for your mind.",
    },
    {
      title: "The Topic 🟠 — The main pressure",
      body: "The topic circle grows when pressure rises. It is the main load in front of you right now.",
    },
    {
      title: "The Goal 🟢 — What you want to reach",
      body: "The goal circle becomes clearer as the path appears. The closer you get, the larger it becomes.",
    },
    {
      title: "The Obstacles 🔴 — What pulls you back",
      body: "The obstacles circle grows when the blockers become visible. When the three align, the picture clears.",
    },
  ],
} satisfies Record<LiveLanguage, Array<{ title: string; body: string }>>;
