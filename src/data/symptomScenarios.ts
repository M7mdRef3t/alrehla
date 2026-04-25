/**
 * Scenario Engine: تدريب مفصل حسب الدور + المنطقة + العرض
 * targetRoles: من وُجه له السيناريو (أهل = ذنب/تربية، شغل = خوف، شريك = تعلق)
 * targetZones: المنطقة على الخريطة (أحمر = قطع/حماية، أصفر = تفاوض، أخضر = صحي)
 * symptomId: العرض (ذنب، استنزاف، تلاعب...) – يحدد أولوية السيناريو
 */

export type ScenarioRole = "family" | "work" | "partner" | "all";
export type ScenarioZone = "red" | "yellow" | "green";

export interface TrainingScenario {
  id: string;
  symptomId: string;
  title: string;
  context: string;
  situation: string;
  /** من يصلح له السيناريو: family=أهل، work=شغل/مدير، partner=شريك، all=أي دور */
  targetRoles: ScenarioRole[];
  /** في أي منطقة على الخريطة يظهر: red=استنزاف، yellow=مشروط، green=صحي */
  targetZones: ScenarioZone[];
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
    explanation: string;
  }>;
}

export const symptomScenariosDatabase: TrainingScenario[] = [
  // ========================================
  // سيناريوهات مخصصة حسب الدور + المنطقة
  // ========================================
  {
    id: "family-red-guilt-mama",
    symptomId: "guilt",
    title: "كسر دائرة الابتزاز العاطفي",
    context: "ماما بتتصل الساعة 2 بليل وبتعيط عشان وحشتها، وبتقول: أنا ضحيت بعمري عشانك، وأنت مستخسر فيا مكالمة؟",
    situation: "إيه الرد الصح؟",
    targetRoles: ["family"],
    targetZones: ["red"],
    options: [
      {
        id: "mama-red-a",
        text: "طيب ماما، أنا هكلمك دلوقتي (وتسهر رغم تعبك)",
        isCorrect: false,
        feedback: "❌ استسلام للابتزاز",
        explanation: "الابتزاز العاطفي بيقوى كل ما تتنازل. الحدود مش قسوة - دي حماية ليك وليها."
      },
      {
        id: "mama-red-b",
        text: "أنا بحبك، بس مش هقدر أكلمك دلوقتي. نتكلم بكرة الصبح؟",
        isCorrect: true,
        feedback: "✅ حدود مع حب",
        explanation: "أنت حطيت حد واضح من غير ما تنكر المشاعر. الحب الصح بيحترم احتياجك للراحة."
      },
      {
        id: "mama-red-c",
        text: "أنت دايماً بتعملي كده!",
        isCorrect: false,
        feedback: "⚠️ اتهام",
        explanation: "الاتهام بيزود التوتر. الأفضل تكون هادي وحازم على الحدود."
      }
    ]
  },
  {
    id: "work-yellow-boss",
    symptomId: "exhausted",
    title: "حدود وقت العمل",
    context: "مديرك باعت رسالة واتس آب يوم الجمعة بيسأل على شغل. أنت في يوم راحتك.",
    situation: "إيه الرد الصح؟",
    targetRoles: ["work"],
    targetZones: ["yellow"],
    options: [
      {
        id: "boss-yellow-a",
        text: "ترد فوراً وتنفذ المطلوب",
        isCorrect: false,
        feedback: "❌ عدم حدود",
        explanation: "ده بيعلّم مديرك إن وقتك متاح 24/7. الحدود الواضحة بتحمي راحتك وأداءك."
      },
      {
        id: "boss-yellow-b",
        text: "أرد بكرة في أوقات الشغل الرسمية",
        isCorrect: true,
        feedback: "✅ احترافية + حدود",
        explanation: "أنت حافظت على الاحترافية ووضعت حد واضح لوقت العمل. الشغل ليه وقت، والراحة ليها وقت."
      },
      {
        id: "boss-yellow-c",
        text: "ما تردش خالص",
        isCorrect: false,
        feedback: "⚠️ تجنب",
        explanation: "التجنب ممكن يسبب سوء فهم. الأفضل ترد في وقت الشغل وترسّل الحدود بأدب."
      }
    ]
  },
  {
    id: "family-red-dad-guilt",
    symptomId: "guilt",
    title: "حدود مع الأب الضاغط",
    context: "أبوك قالك: إنت اللي مشغول؟ أنا اللي ربّيتك ودفعت فلوس تعليمك، ودلوقتي مكالمة واحدة مش هتاخد منك؟",
    situation: "إيه الرد الصح؟",
    targetRoles: ["family"],
    targetZones: ["red"],
    options: [
      {
        id: "dad-red-a",
        text: "طيب يا بابا، أنا آسف، هكلمك دلوقتي",
        isCorrect: false,
        feedback: "❌ استسلام للذنب",
        explanation: "الاعتراف بالذنب والاستسلام بيقوّي التلاعب. الاحترام مش معناه تنفيذ كل طلب."
      },
      {
        id: "dad-red-b",
        text: "أنا بحترمك وبحبك، بس دلوقتي مش مناسب. هنكلم بعض بكرة؟",
        isCorrect: true,
        feedback: "✅ حدود مع احترام",
        explanation: "حطيت حد من غير ما تنكر مشاعرك أو تقلل من قيمته. الحدود مش قلة أدب."
      },
      {
        id: "dad-red-c",
        text: "إنت دايماً بتلومني!",
        isCorrect: false,
        feedback: "⚠️ اتهام",
        explanation: "الاتهام بيصعد الموقف. الأفضل تثبت على حدك بهدوء."
      }
    ]
  },
  {
    id: "family-yellow-boundaries",
    symptomId: "guilt",
    title: "تفاوض مع الأهل",
    context: "عيلتك عايزة تزورك كل جمعة، وإنت محتاج مساحة. بيقولولك: إحنا عايزين نلاقيك.",
    situation: "إيه الرد الصح؟",
    targetRoles: ["family"],
    targetZones: ["yellow"],
    options: [
      {
        id: "fam-yellow-a",
        text: "أوافق عشان ما يزعلوش",
        isCorrect: false,
        feedback: "❌ تنازل كامل",
        explanation: "التنازل الدايم بيورّيك. ممكن تتفاوض على توقيت يناسبك ويناسبهم."
      },
      {
        id: "fam-yellow-b",
        text: "أنا بحب لقاكم، بس مش كل جمعة. نقدر نلتقي مرة أو اتنين في الشهر؟",
        isCorrect: true,
        feedback: "✅ تفاوض واضح",
        explanation: "عرضت بديل يحافظ على العلاقة ويحترم مساحتك. التفاوض مش رفض."
      },
      {
        id: "fam-yellow-c",
        text: "مش هقدر أستقبل حد دلوقتي",
        isCorrect: false,
        feedback: "⚠️ رفض مطلق",
        explanation: "الرفض المطلق ممكن يجرح. الأفضل تعرض بديل لو العلاقة مهمة ليك."
      }
    ]
  },
  {
    id: "work-red-boss-fear",
    symptomId: "physical_tension",
    title: "مدير يهدّد أو يقلل من قيمتك",
    context: "مديرك قالك قدام الزملاء: إنت مش شغال زي المطلوب، ممكن نلاقي حد غيرك.",
    situation: "إيه الرد الصح؟",
    targetRoles: ["work"],
    targetZones: ["red"],
    options: [
      {
        id: "work-red-a",
        text: "تسكت وتقبل عشان تخاف على الشغل",
        isCorrect: false,
        feedback: "❌ خوف واستسلام",
        explanation: "الصمت بيعلّم الطرف التاني إنه يقدر يتعدى. الحدود في الشغل ممكن تكون كتابية أو مع HR."
      },
      {
        id: "work-red-b",
        text: "تقول: أنا مستعد أناقش الأداء في اجتماع خاص، مش قدام الكل",
        isCorrect: true,
        feedback: "✅ حماية + احترافية",
        explanation: "حطيت حد للطريقة، وفتحت باب للنقاش في مكان مناسب. ده يحميك ويحافظ على وضعك."
      },
      {
        id: "work-red-c",
        text: "ترد عليه بنفس الأسلوب قدام الكل",
        isCorrect: false,
        feedback: "⚠️ تصعيد",
        explanation: "الرد العدائي بيصعّد ويضرّك أكتر. الأفضل حدود واضحة، مش حرب."
      }
    ]
  },
  {
    id: "partner-red-control",
    symptomId: "walking_eggshells",
    title: "تحكم: كنت فين ومع مين؟",
    context: "شريكك بيسألك للمرة العاشرة النهاردة: كنت فين؟ ومع مين؟ ليه تأخرت؟",
    situation: "إيه الرد الصح؟",
    targetRoles: ["partner"],
    targetZones: ["red"],
    options: [
      {
        id: "partner-red-a",
        text: "ترد على كل سؤال عشان تثبت إنك مفيش حاجة",
        isCorrect: false,
        feedback: "❌ تبرير مستمر",
        explanation: "التبرير الدايم بيعلّم الطرف التاني إنه له حق التحقيق. الثقة مش بالاستجواب."
      },
      {
        id: "partner-red-b",
        text: "أنا بحس إن السؤال المتكرر بيزعجني. إيه اللي محيرك؟ نقدر نتكلم عنه؟",
        isCorrect: true,
        feedback: "✅ حدود + فتح حوار",
        explanation: "حطيت حد للاستجواب وفتحت باب لحوار عن الثقة. الحدود مش جري."
      },
      {
        id: "partner-red-c",
        text: "ده شغلك؟ ما تتدخلش",
        isCorrect: false,
        feedback: "⚠️ قطع وجرح",
        explanation: "القطع بيصعّد. الأفضل تعبّر عن مشاعرك وتطلب احترام حدودك."
      }
    ]
  },
  {
    id: "partner-yellow-care-vs-control",
    symptomId: "conditional",
    title: "قلق vs رعاية",
    context: "شريكك بيبعت رسائل كتير طول اليوم: 'إنت كويس؟ فينك؟' ولو متردش بسرعة بيزعل.",
    situation: "إيه الرد الصح؟",
    targetRoles: ["partner"],
    targetZones: ["yellow"],
    options: [
      {
        id: "partner-yellow-a",
        text: "ترد على طول عشان ما يزعلهوش",
        isCorrect: false,
        feedback: "❌ تكيّف مع القلق",
        explanation: "لو رضيت بالضغط، هيستمر. ممكن تحط حد لطيف: متواصلين، بس مش كل ساعة."
      },
      {
        id: "partner-yellow-b",
        text: "تقول: أنا بحس إننا محتاجين توازن - أنا هرد لما أقدر، وإنت متقلقش لو تأخرت شوية",
        isCorrect: true,
        feedback: "✅ حدود مع طمأنة",
        explanation: "حطيت حد واضح وطمأنت الطرف التاني. الرعاية مش معناها استجابة 24/7."
      },
      {
        id: "partner-yellow-c",
        text: "تقول: خلاص متبعتش كتير، مش هرد",
        isCorrect: false,
        feedback: "⚠️ قطع",
        explanation: "القطع ممكن يجرح. الأفضل تفاوض على وتيرة تناسب الاتنين."
      }
    ]
  },

  // ========================================
  // Guilt (الذنب) Scenarios
  // ========================================
  {
    id: "guilt-scenario-1",
    symptomId: "guilt",
    title: "رفض طلب غير معقول",
    context: "الشخص اتصل بيك الساعة 11 بالليل وأنت تعبان ومحتاج تنام",
    situation: "قالك: 'محتاج أكلمك دلوقتي في حاجة مهمة، ممكن؟'",
    targetRoles: ["family", "partner", "all"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "guilt-1-a",
        text: "طبعاً، اتفضل (وتسهر رغم تعبك)",
        isCorrect: false,
        feedback: "❌ استنزاف",
        explanation: "أنت ضحيت براحتك واحتياجك للنوم. ده هيخليك منهك بكرة، وهيعلّم الشخص إن وقتك مش محترم."
      },
      {
        id: "guilt-1-b",
        text: "ما أردش خالص",
        isCorrect: false,
        feedback: "⚠️ تجنب",
        explanation: "التجنب بيخلي المشكلة أكبر وبيخليك تحس بذنب. الأفضل إنك تحط حد واضح."
      },
      {
        id: "guilt-1-c",
        text: "أنا تعبان دلوقتي، نتكلم بكرة الصبح؟",
        isCorrect: true,
        feedback: "✅ حدود صحية",
        explanation: "أنت احترمت احتياجك للراحة + عرضت بديل واضح. لو الموضوع فعلاً مهم، ممكن يستنى للصبح."
      }
    ]
  },
  {
    id: "guilt-scenario-2",
    symptomId: "guilt",
    title: "قول 'لأ' بدون تبرير مبالغ فيه",
    context: "الشخص طلب منك تروح معاه مكان مش عايز تروحه",
    situation: "قالك: 'تعالى معايا المكان ده، هنبسط'",
    targetRoles: ["family", "partner", "all"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "guilt-2-a",
        text: "أوافق رغم إني مش عايز",
        isCorrect: false,
        feedback: "❌ إرضاء الآخرين",
        explanation: "أنت خنت نفسك عشان ترضيه. كل مرة بتعمل كده، بتبعد عن هويتك الحقيقية."
      },
      {
        id: "guilt-2-b",
        text: "مش هقدر، عندي شغل/مشوار/ظرف (تبرير طويل)",
        isCorrect: false,
        feedback: "⚠️ تبرير مبالغ",
        explanation: "التبرير الكتير بيفتح باب للنقاش والإقناع. حقك تقول 'لأ' من غير ما تبرر."
      },
      {
        id: "guilt-2-c",
        text: "شكراً على الدعوة، بس مش هقدر",
        isCorrect: true,
        feedback: "✅ رفض واضح",
        explanation: "أنت رفضت بأدب ووضوح من غير ما تفتح باب للنقاش. 'لأ' جملة كاملة - مش محتاجة تبرير."
      }
    ]
  },
  {
    id: "guilt-scenario-3",
    symptomId: "guilt",
    title: "مواجهة الذنب المفتعل",
    context: "رفضت طلب للشخص، فقالك: 'أنت اتغيرت... مبقتش زي زمان'",
    situation: "إيه ردك؟",
    targetRoles: ["family", "partner"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "guilt-3-a",
        text: "أنا آسف، هعمل اللي انت عايزه",
        isCorrect: false,
        feedback: "❌ استسلام",
        explanation: "ده تلاعب عاطفي. هو بيستخدم الذنب عشان يسيطر عليك. لو استسلمت، الدائرة هتفضل."
      },
      {
        id: "guilt-3-b",
        text: "أنا فعلاً اتغيرت - بقيت أحترم نفسي أكتر",
        isCorrect: true,
        feedback: "✅ تأكيد الذات",
        explanation: "أنت حولت 'الاتهام' لحقيقة إيجابية. التغيير مش عيب - التغيير للأحسن قوة."
      },
      {
        id: "guilt-3-c",
        text: "أنت اللي مش فاهم، أنا مش اتغيرت!",
        isCorrect: false,
        feedback: "⚠️ دفاع زائد",
        explanation: "الدفاع الزائد بيخليك تبان ضعيف. الأفضل تأكد على نفسك بهدوء من غير ما تدخل في جدال."
      }
    ]
  },

  // ========================================
  // Exhausted (الإرهاق) Scenarios
  // ========================================
  {
    id: "exhausted-scenario-1",
    symptomId: "exhausted",
    title: "تحديد وقت المكالمة",
    context: "الشخص بيكلمك كل يوم لساعات، وده بيستنزف طاقتك",
    situation: "قرر تحدد وقت للمكالمات. إيه أفضل طريقة؟",
    targetRoles: ["family", "partner", "all"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "exhausted-1-a",
        text: "أوقف المكالمات تماماً",
        isCorrect: false,
        feedback: "⚠️ قطع كامل",
        explanation: "القطع الكامل قد يكون قاسي وغير ضروري. الحدود الصحية أفضل من القطع."
      },
      {
        id: "exhausted-1-b",
        text: "أكمل زي ما أنا عشان ما أزعلهوش",
        isCorrect: false,
        feedback: "❌ استنزاف",
        explanation: "أنت بتضحي بصحتك النفسية عشان ترضيه. ده مش مستدام - هتنهار في النهاية."
      },
      {
        id: "exhausted-1-c",
        text: "نتكلم يوم محدد (مثلاً السبت) لمدة 30-45 دقيقة",
        isCorrect: true,
        feedback: "✅ حد واضح",
        explanation: "أنت حددت وقت ومدة. ده بيحمي طاقتك وفي نفس الوقت بيحافظ على التواصل."
      }
    ]
  },
  {
    id: "exhausted-scenario-2",
    symptomId: "exhausted",
    title: "إنهاء محادثة مستنزفة",
    context: "أنت في مكالمة من 45 دقيقة، بدأت تحس بالإرهاق والشخص لسه بيتكلم",
    situation: "إزاي تنهي المكالمة؟",
    targetRoles: ["family", "partner", "all"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "exhausted-2-a",
        text: "أكمل لحد ما هو يخلص (حتى لو ساعة كمان)",
        isCorrect: false,
        feedback: "❌ استنزاف",
        explanation: "أنت بتتجاهل إشارات جسمك. الإرهاق ده حقيقي ومهم - لازم تحترمه."
      },
      {
        id: "exhausted-2-b",
        text: "أقفل المكالمة فجأة",
        isCorrect: false,
        feedback: "⚠️ غير محترم",
        explanation: "ده قد يسبب مشاكل أكبر. الأفضل تنهي المكالمة بأدب ووضوح."
      },
      {
        id: "exhausted-2-c",
        text: "أعتذر بهدوء: 'محتاج أخلص دلوقتي، نكمل مرة تانية'",
        isCorrect: true,
        feedback: "✅ إنهاء محترم",
        explanation: "أنت احترمت نفسك ووقتك، وفي نفس الوقت كنت مهذب. ده الحد الصحي."
      }
    ]
  },

  // ========================================
  // Emotional Manipulation (التلاعب العاطفي) Scenarios
  // ========================================
  {
    id: "manipulation-scenario-1",
    symptomId: "emotional_manipulation",
    title: "اكتشاف التلاعب بالذنب",
    context: "الشخص قالك: 'لو كنت بتحبني فعلاً، كنت عملت اللي أنا طلبته'",
    situation: "ده تلاعب عاطفي. إيه الرد الصح؟",
    targetRoles: ["family", "partner"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "manipulation-1-a",
        text: "طيب، هعمله عشان أثبت حبي",
        isCorrect: false,
        feedback: "❌ وقعت في الفخ",
        explanation: "الحب الحقيقي مش بيتقاس بالطاعة. ده تلاعب - بيستخدم 'الحب' عشان يسيطر عليك."
      },
      {
        id: "manipulation-1-b",
        text: "الحب مش معناه إني أعمل كل حاجة تطلبها",
        isCorrect: true,
        feedback: "✅ كشف التلاعب",
        explanation: "أنت كشفت التلاعب بوضوح. الحب الحقيقي بيحترم الحدود والاختلاف."
      },
      {
        id: "manipulation-1-c",
        text: "أنت مش بتحبني أصلاً!",
        isCorrect: false,
        feedback: "⚠️ دفاع عاطفي",
        explanation: "الدفاع العاطفي بيدخلك في دراما أكبر. الأفضل تكون حازم وهادي."
      }
    ]
  },
  {
    id: "manipulation-scenario-2",
    symptomId: "emotional_manipulation",
    title: "مواجهة 'دور الضحية'",
    context: "الشخص قالك: 'أنا تعبان ومحدش بيهتم بيا... أنت كمان هتسيبني؟'",
    situation: "ده محاولة لجعلك تحس بالذنب. إيه الرد الصح؟",
    targetRoles: ["family", "partner"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "manipulation-2-a",
        text: "لا طبعاً، أنا مش هسيبك، قولي محتاج إيه",
        isCorrect: false,
        feedback: "❌ دور المنقذ",
        explanation: "أنت دخلت في 'دور المنقذ'. ده بيخليك مسؤول عن مشاعره - وده مش دورك."
      },
      {
        id: "manipulation-2-b",
        text: "أنا فاهمك، بس أنا مش مسؤول عن سعادتك",
        isCorrect: true,
        feedback: "✅ حد واضح",
        explanation: "أنت أظهرت تعاطف بس وضحت الحدود. كل شخص مسؤول عن مشاعره."
      },
      {
        id: "manipulation-2-c",
        text: "أنت دايماً بتلعب دور الضحية!",
        isCorrect: false,
        feedback: "⚠️ اتهام",
        explanation: "الاتهام المباشر بيخليك تبان 'الشخص السيء'. الأفضل تكون هادي وحازم."
      }
    ]
  },

  // ========================================
  // Walking on Eggshells (الحذر الدائم) Scenarios
  // ========================================
  {
    id: "eggshells-scenario-1",
    symptomId: "walking_eggshells",
    title: "التعبير عن رأي مختلف",
    context: "أنت بتتجنب تقول رأيك الحقيقي خوفاً من ردة فعل الشخص",
    situation: "الشخص سألك رأيك في موضوع، وأنت عندك رأي مختلف. إيه تعمل؟",
    targetRoles: ["family", "partner", "work"],
    targetZones: ["yellow"],
    options: [
      {
        id: "eggshells-1-a",
        text: "أوافقه عشان ما يزعلش",
        isCorrect: false,
        feedback: "❌ كذب على نفسك",
        explanation: "أنت بتكذب على نفسك وعليه. العلاقة الصحية بتسمح بالاختلاف."
      },
      {
        id: "eggshells-1-b",
        text: "أقول رأيي بهدوء ووضوح",
        isCorrect: true,
        feedback: "✅ صدق وشجاعة",
        explanation: "الاختلاف في الرأي صحي. لو زعل، ده مشكلته مش مشكلتك. أنت ليك الحق في رأيك."
      },
      {
        id: "eggshells-1-c",
        text: "أتهرب من الإجابة",
        isCorrect: false,
        feedback: "⚠️ تجنب",
        explanation: "التجنب بيخليك تحس بضعف. الأفضل تواجه وتعبر عن نفسك."
      }
    ]
  },

  // ========================================
  // People Pleasing (إرضاء الآخرين) Scenarios
  // ========================================
  {
    id: "pleasing-scenario-1",
    symptomId: "people_pleasing",
    title: "المماطلة بدل الموافقة الفورية",
    context: "الشخص طلب منك طلب، وأنت مش متأكد لو عايز توافق",
    situation: "بدل ما تقول 'نعم' فوراً، إيه البديل؟",
    targetRoles: ["all"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "pleasing-1-a",
        text: "أقول 'نعم' فوراً عشان أرضيه",
        isCorrect: false,
        feedback: "❌ إرضاء",
        explanation: "أنت وافقت قبل ما تفكر - هتندم بعدين. خد وقتك دايماً."
      },
      {
        id: "pleasing-1-b",
        text: "خليني أفكر وأرد عليك",
        isCorrect: true,
        feedback: "✅ مساحة للتفكير",
        explanation: "أنت أخدت وقت تفكر: أنا فعلاً عايز؟ ولا بس عشان أرضيه؟ ده القرار الصح."
      },
      {
        id: "pleasing-1-c",
        text: "أقول 'لأ' فوراً",
        isCorrect: false,
        feedback: "⚠️ رد فعل مضاد",
        explanation: "الهدف مش الرفض الأعمى - الهدف إنك تاخد وقت تفكر وتقرر بوعي."
      }
    ]
  },

  // ========================================
  // Ruminating (التفكير الدائري) Scenarios
  // ========================================
  {
    id: "ruminating-scenario-1",
    symptomId: "ruminating",
    title: "إيقاف التفكير المستمر",
    context: "رجعت من لقاء مع الشخص، ومن ساعة ما رجعت وأنت بتفكر في الكلام اللي قيل",
    situation: "الأفكار بتدور في دماغك: 'كان لازم أقول كذا... ليه قلت كذا...' - إيه تعمل؟",
    targetRoles: ["all"],
    targetZones: ["yellow"],
    options: [
      {
        id: "ruminating-1-a",
        text: "أسيب نفسي أفكر لحد ما أتعب",
        isCorrect: false,
        feedback: "❌ استنزاف عقلي",
        explanation: "التفكير الدائري بيسرق حياتك. لازم توقفه بوعي."
      },
      {
        id: "ruminating-1-b",
        text: "أكتب الأفكار على ورقة وأغير نشاطي فوراً",
        isCorrect: true,
        feedback: "✅ تقنية فعالة",
        explanation: "الكتابة بتطلع الأفكار من دماغك. تغيير النشاط بيقطع الحلقة. ممتاز!"
      },
      {
        id: "ruminating-1-c",
        text: "أحاول أنسى الموضوع",
        isCorrect: false,
        feedback: "⚠️ كبت",
        explanation: "الكبت مش حل - الأفكار هترجع. الأفضل تفرغها بالكتابة."
      }
    ]
  },

  // ========================================
  // Self-Neglect (إهمال النفس) Scenarios
  // ========================================
  {
    id: "self_neglect-scenario-1",
    symptomId: "self_neglect",
    title: "إعطاء الأولوية لنفسك",
    context: "عندك خطة تعمل حاجة ليك (رياضة، قراءة، راحة) والشخص طلب يقابلك نفس الوقت",
    situation: "إيه اللي هتعمله؟",
    targetRoles: ["family", "partner"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "self_neglect-1-a",
        text: "ألغي خططي وأقابله",
        isCorrect: false,
        feedback: "❌ إهمال نفسك",
        explanation: "أنت ضحيت باحتياجاتك مرة تانية. كل مرة بتعمل كده، بتبعد عن نفسك أكتر."
      },
      {
        id: "self_neglect-1-b",
        text: "أقوله: 'عندي خطة، ممكن نشوف وقت تاني؟'",
        isCorrect: true,
        feedback: "✅ احترام نفسك",
        explanation: "أنت حطيت احتياجاتك في الأولوية. ده مش أنانية - ده صحة نفسية."
      },
      {
        id: "self_neglect-1-c",
        text: "ما أردش عليه",
        isCorrect: false,
        feedback: "⚠️ تجنب",
        explanation: "التجنب مش حل. الأفضل تكون واضح ومحترم."
      }
    ]
  },

  // ========================================
  // Physical Tension (التوتر الجسدي) Scenarios
  // ========================================
  {
    id: "tension-scenario-1",
    symptomId: "physical_tension",
    title: "الاستماع لجسدك",
    context: "قبل ما تقابل الشخص، بتحس بتوتر في معدتك أو صدرك",
    situation: "جسمك بيحذرك. إيه اللي هتعمله؟",
    targetRoles: ["all"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "tension-1-a",
        text: "أتجاهل الإحساس وأكمل",
        isCorrect: false,
        feedback: "❌ تجاهل الإنذار",
        explanation: "جسمك بيتكلم - لازم تسمعه. التوتر ده إشارة خطر حقيقية."
      },
      {
        id: "tension-1-b",
        text: "أخد نفس عميق 3 مرات وأعترف بالإحساس",
        isCorrect: true,
        feedback: "✅ وعي جسدي",
        explanation: "أنت اعترفت بالإشارة وتعاملت معاها. ممكن تقرر تأجل اللقاء لو التوتر شديد."
      },
      {
        id: "tension-1-c",
        text: "ألغي اللقاء فوراً",
        isCorrect: false,
        feedback: "⚠️ رد فعل مبالغ",
        explanation: "مش كل توتر معناه إلغاء. الأفضل تعترف بيه وتقرر بوعي."
      }
    ]
  },

  // ========================================
  // Conditional Love (القبول المشروط) Scenarios
  // ========================================
  {
    id: "conditional-scenario-1",
    symptomId: "conditional",
    title: "كسر دائرة القبول المشروط",
    context: "بتحس إن الشخص بيقبلك بس لما تعمل اللي هو عايزه",
    situation: "قررت تعمل حاجة مختلفة عن المتوقع. إيه اللي هيحصل؟",
    targetRoles: ["family", "partner"],
    targetZones: ["yellow"],
    options: [
      {
        id: "conditional-1-a",
        text: "أرجع للسلوك القديم عشان أضمن قبوله",
        isCorrect: false,
        feedback: "❌ قبول مشروط",
        explanation: "أنت بترجع للقفص. القبول الحقيقي مش مشروط - لازم تكون نفسك."
      },
      {
        id: "conditional-1-b",
        text: "أكمل في طريقي وأشوف رد فعله",
        isCorrect: true,
        feedback: "✅ اختبار حقيقي",
        explanation: "لو رفضك، يبقى القبول كان مشروط. ده صعب بس ضروري عشان تعرف الحقيقة."
      },
      {
        id: "conditional-1-c",
        text: "أقطع العلاقة فوراً",
        isCorrect: false,
        feedback: "⚠️ رد فعل متسرع",
        explanation: "الأفضل تختبر الموقف الأول. ممكن يكون في مساحة للتغيير."
      }
    ]
  },

  // ========================================
  // Not Enough (مش كفاية) Scenarios
  // ========================================
  {
    id: "not_enough-scenario-1",
    symptomId: "not_enough",
    title: "تحدي شعور 'مش كفاية'",
    context: "الشخص قالك (مباشر أو غير مباشر): 'أنت ممكن تعمل أحسن من كده'",
    situation: "إيه ردك؟",
    targetRoles: ["family", "partner", "work"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "not_enough-1-a",
        text: "أوافقه وأحاول أعمل أكتر",
        isCorrect: false,
        feedback: "❌ تصديق الكذبة",
        explanation: "مهما تعمل، مش هيكفي. المعايير دي مستحيلة - مصممة عشان تفشل."
      },
      {
        id: "not_enough-1-b",
        text: "أنا بعمل اللي أقدر عليه، وده كفاية",
        isCorrect: true,
        feedback: "✅ قبول الذات",
        explanation: "أنت رفضت المعيار المستحيل. قيمتك مش مرتبطة بإنجازاتك."
      },
      {
        id: "not_enough-1-c",
        text: "أنت اللي مش كفاية!",
        isCorrect: false,
        feedback: "⚠️ دفاع عدواني",
        explanation: "الدفاع العدواني بيخليك تبان ضعيف. الثقة الهادئة أقوى."
      }
    ]
  },

  // ========================================
  // Lose Identity (فقدان الهوية) Scenarios
  // ========================================
  {
    id: "identity-scenario-1",
    symptomId: "lose_identity",
    title: "استرجاع هويتك",
    context: "أنت بتلاقي نفسك ناسي هواياتك واهتماماتك، كل حياتك بقت حول الشخص ده",
    situation: "صاحبك دعاك تعملوا حاجة كنت بتحبها زمان. إيه ردك؟",
    targetRoles: ["partner", "family"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "identity-1-a",
        text: "لا، أنا مش مهتم بالحاجات دي دلوقتي",
        isCorrect: false,
        feedback: "❌ فقدان كامل",
        explanation: "أنت فقدت نفسك تماماً. لازم ترجع لاهتماماتك - دي جزء من هويتك."
      },
      {
        id: "identity-1-b",
        text: "أشوف لو الشخص موافق الأول",
        isCorrect: false,
        feedback: "⚠️ اعتماد كامل",
        explanation: "أنت مش محتاج إذن. حياتك ليك أنت - مش ملك حد تاني."
      },
      {
        id: "identity-1-c",
        text: "فكرة حلوة! أنا محتاج أرجع لنفسي",
        isCorrect: true,
        feedback: "✅ استرجاع الهوية",
        explanation: "أنت قررت ترجع لنفسك. دي أول خطوة في استرجاع هويتك المفقودة."
      }
    ]
  },

  // ========================================
  // Avoidance (التجنب) Scenarios
  // ========================================
  {
    id: "avoidance-scenario-1",
    symptomId: "avoidance",
    title: "من التجنب للمواجهة الصحية",
    context: "أنت بتتجنب الرد على مكالمات الشخص بسبب القلق",
    situation: "بدل التجنب، إيه البديل الصحي؟",
    targetRoles: ["all"],
    targetZones: ["yellow"],
    options: [
      {
        id: "avoidance-1-a",
        text: "أكمل في التجنب",
        isCorrect: false,
        feedback: "❌ هروب",
        explanation: "التجنب بيزود القلق مع الوقت. لازم تواجه - لكن بحدود."
      },
      {
        id: "avoidance-1-b",
        text: "أرد على كل مكالمة",
        isCorrect: false,
        feedback: "⚠️ استنزاف",
        explanation: "ده من extreme لـ extreme. الحل في الوسط: حدود واضحة."
      },
      {
        id: "avoidance-1-c",
        text: "أحدد وقت محدد للتواصل وألتزم بيه",
        isCorrect: true,
        feedback: "✅ حدود واعية",
        explanation: "أنت حولت التجنب لحدود صحية. كده أنت متحكم، مش هارب."
      }
    ]
  },
  {
    id: "identity-scenario-1",
    symptomId: "lose_identity",
    title: "استعادة البوصلة الشخصية",
    context: "تكتشف أن نظامك التشغيلي بالكامل أصبح يدور حول 'احتياجات الآخرين' لدرجة أنك نسيت هوايتك القديمة أو ما يحبذه عقلك المنفرد.",
    situation: "ما هي 'الحركة الخاصة' لاستعادة هويتك؟",
    targetRoles: ["all"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "id-1-a",
        text: "تخصيص ساعة واحدة يومياً لأنشطة 'فردية بحتة' دون استئذان أحد",
        isCorrect: true,
        feedback: "✅ استعادة القيادة",
        explanation: "الهوية تُبنى في العزلة والأنشطة الفردية. حماية وقتك الخاص هو حق أصيل غير قابل للتفاوض."
      },
      {
        id: "id-1-b",
        text: "سؤال المقربين: 'إيه اللي كنت بحبه زمان؟'",
        isCorrect: false,
        feedback: "⚠️ اعتمادية مرتدة",
        explanation: "هويتك لا تُستمد من ذاكرة الآخرين عنك. ابحث في داخلك عما يشحن طاقتك الآن."
      }
    ]
  },
  {
    id: "conditional-scenario-1",
    symptomId: "conditional",
    title: "كسر بروتوكول 'القبول المشروط'",
    context: "الطرف الآخر يرسل إشارات (بصمة شعورية): 'سأحبك فقط إذا نفذت الخطة (الهدف) الذي وضعته لك'.",
    situation: "كيف تكسر هذا القيد؟",
    targetRoles: ["family", "partner"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "cond-1-a",
        text: "إعلان 'الاختلاف الوظيفي': المحبة لا تعني التطابق في الأهداف",
        isCorrect: true,
        feedback: "✅ فك الارتباك",
        explanation: "القبول المشروط هو تلاعب خفي. التأكيد على أن قيمتك مستقلة عن أفعالك هو جوهر الدفاع النفسي."
      },
      {
        id: "cond-1-b",
        text: "محاولة شرح وجهة نظرك بالتفصيل حتى يقتنع",
        isCorrect: false,
        feedback: "❌ استهلاك طاقي",
        explanation: "الشرح الطويل هو محاولة للحصول على 'إذن' بالاختلاف. القيادة تعني أنك لا تحتاج إذناً لتكون نفسك."
      }
    ]
  },
  {
    id: "neglect-scenario-1",
    symptomId: "self_neglect",
    title: "إعادة توجيه الطاقة (Self-Priority)",
    context: "مؤشر طاقتك في المنطقة الحمراء، وبطارية الوعي تنفد، ومع ذلك يطلب منك شخص ما القيام بمهمة 'ثانوية' له.",
    situation: "ما هو الرد التقني الصحيح؟",
    targetRoles: ["all"],
    targetZones: ["red", "yellow"],
    options: [
      {
        id: "neg-1-a",
        text: "تفعيل 'وضع توفير الطاقة': اعتذر فوراً وأعطِ الأولوية لراحتك",
        isCorrect: true,
        feedback: "✅ حماية النواة",
        explanation: "إهمال النفس هو خيانة للقيادة الشخصية. البطارية الفارغة لا يمكنها شحن الآخرين."
      },
      {
        id: "neg-1-b",
        text: "تنفيذ المهمة 'بسرعة' لتستريح بعدها",
        isCorrect: false,
        feedback: "❌ استنزاف نهائي",
        explanation: "القيام بمهام إضافية وأنت مستنزف يؤدي إلى انهيار الجهاز العصبي (Burnout). 'لا' الآن هي 'نعم' لصحتك بكرة."
      }
    ]
  },
  // ========================================
  // ELITE CHALLENGES (Warlord Rank) ⚔️
  // ========================================
  {
    id: "elite-1-triadic-resolution",
    symptomId: "interference",
    title: "التطهير الاستراتيجي للدائرة الخضراء",
    context: "استشعر جارفيس تداخلاً كهرومغناطيسياً حاداً: اثنان من المقربين في مدارك الأخضر يستنزفان طاقتك في نفس الوقت بصراعاتهما المتداخلة.",
    situation: "ما هي 'المناورة الحاسمة' الأنسب هنا؟",
    targetRoles: ["all"],
    targetZones: ["green"],
    options: [
      {
        id: "elite-1-a",
        text: "محاولة التوسط بينهما لحل الخلاف وضمان استقرار المدار",
        isCorrect: false,
        feedback: "❌ فخ الاستهلاك",
        explanation: "محاولة 'الإصلاح' بين أطراف مستنزفة تضعك في مركز الإعصار. القائد يحمي مداره أولاً، لا يغرق في دراما الآخرين."
      },
      {
        id: "elite-1-b",
        text: "إعلان 'بروتوكول الصمت' ونقل أحدهما مؤقتاً للمدار الأصفر حتى يستقر جهازهما عصبي",
        isCorrect: true,
        feedback: "✅ مناورة حاسمة",
        explanation: "حماية النواة (الدائرة الخضراء) تتطلب جراحاً ماهراً. تقليل الكثافة في منطقة الخطر هو القرار الاستراتيجي الأعلى."
      }
    ]
  },
  {
    id: "elite-2-emotional-detachment",
    symptomId: "guilt",
    title: "اختبار ثبات الـ Warlord",
    context: "شخصية محورية في تاريخك تحاول استدراجك عبر 'محطة الذنب القديمة' برسالة استعطاف مفاجئة تكسر بروتوكول الحدود الذي وضعته.",
    situation: "كيف ستتحرك؟",
    targetRoles: ["family", "partner"],
    targetZones: ["red"],
    options: [
      {
        id: "elite-2-a",
        text: "تفعيل 'البرقية الدبلوماسية' للصد البارد دون فتح جبهات نقاش",
        isCorrect: true,
        feedback: "✅ دفاع محكم",
        explanation: "الثبات على الحدود أمام الاستعطاف هو أصعب اختبار للقوة الذاتية. الرد المبرمج يمنع تسرب الطاقة."
      },
      {
        id: "elite-2-b",
        text: "الرد بتوضيح أسباب غضبك لتفادي الشعور بالظلم",
        isCorrect: false,
        feedback: "❌ ثغرة أمنية",
        explanation: "التوضيح هو شكل من أشكال التبرير. المبرر يمنح الطرف الآخر 'مقبضاً' ليسحبك منه مرة أخرى."
      }
    ]
  }
];

/** خريطة goalId التطبيق → دور السيناريو */
function goalIdToRole(goalId: string): ScenarioRole {
  switch (goalId) {
    case "family": return "family";
    case "work": return "work";
    case "love": return "partner";
    case "money":
    case "unknown":
    case "general":
    default: return "all";
  }
}

/**
 * محرك السيناريوهات: يختار أسئلة حسب (الدور + المنطقة + العرض).
 * - الدور: من الخريطة (عيلة = ذنب/تربية، شغل = خوف، شريك = تعلق).
 * - المنطقة: أحمر = قطع/حماية، أصفر = تفاوض، أخضر = صحي.
 * - العرض: لو المستخدم اختار "ذنب" → أسئلة الابتزاز العاطفي أولاً (Level 1).
 */
export function getScenariosForNode(
  ring: ScenarioZone,
  goalId: string,
  selectedSymptoms: string[]
): TrainingScenario[] {
  const role = goalIdToRole(goalId);
  const filtered = symptomScenariosDatabase.filter(
    (s) =>
      (s.targetRoles.includes(role) || s.targetRoles.includes("all")) &&
      s.targetZones.includes(ring)
  );
  const matchSymptoms = filtered.filter((s) => selectedSymptoms.includes(s.symptomId));
  const rest = filtered.filter((s) => !selectedSymptoms.includes(s.symptomId));
  return [...matchSymptoms, ...rest];
}

/** للتوافق مع الشاشات اللي لسه بتستخدم الأعراض فقط */
export function getScenariosBySymptoms(symptomIds: string[]): TrainingScenario[] {
  return symptomScenariosDatabase.filter((scenario) =>
    symptomIds.includes(scenario.symptomId)
  );
}

export function getScenarioById(scenarioId: string): TrainingScenario | undefined {
  return symptomScenariosDatabase.find(s => s.id === scenarioId);
}

export function getSymptomScenarioCount(symptomId: string): number {
  return symptomScenariosDatabase.filter(s => s.symptomId === symptomId).length;
}
