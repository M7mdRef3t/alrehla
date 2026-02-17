export const mapCopy = {
  title: "خريطة مداراتك",
  subtitle: "كل شخص في مداره، والمسافة بينكم أنت اللي بتحددها",
  addPersonLabel: "+ مين حابب يكون في خريطتك؟",
  addPersonTitle: "ابدأ بالشخص اللي واخد أكبر مساحة من طاقتك",
  feelingCta: "استكشف إحساسك",
  feelingCtaDisabledHint: "أضف شخص الأول عشان تستكشف إحساسك",
  ringsHint: "لون المدار = قرب الشخص من طاقتك. إحساسك هو البوصلة.",
  legendGreen: "مدار قريب",
  legendYellow: "مدار متذبذب",
  legendRed: "مدار بعيد",
  legendGrey: "مساحة الراحة",
  threatLevelHint: "الحلقة حول كل شخص = مستوى تأثيره على طاقتك",
  placementTitle: "حطه في مداره",
  placementHint: "اسحب الشخص وحطه في المدار اللي يعبّر عن إحساسك: قريب، متذبذب، أو بعيد.",
  confirmPlacement: "ثبّت المكان",
  firstPlacementTooltip: "مش لازم تقرر مكانه النهائي دلوقتي — الخريطة بتتغير معاك في أي وقت.",
  /** حالة الخريطة الفاضية */
  emptyMapTitle: "ابدأ بأكتر حد شاغل تفكيرك دلوقتي..",
  emptyMapHint: "مش لازم تعرف مكانه الصح من الأول — حطه في المدار وقولنا إحساسك، الخريطة بتتغير معاك.",
  emptyMapReassurance: "كل خطوة بتوضح الصورة أكتر.",
  /** شجرة العيلة */
  familyTreeTitle: "شجرة العيلة",
  familyTreeSubtitle: "من هنا بدأت الحكاية",
  familyTreeHint: "لون المدار = مكانهم في الخريطة (قريب / متذبذب / بعيد). اضغط على الشخص للتفاصيل.",
  familyTreeEmpty: "مفيش أشخاص لسه. أضف أشخاص من الخريطة الأول.",
  galaxyTitle: "كل المدارات",
  galaxyHint: "كل الأشخاص من كل السياقات في مكان واحد. استخدم الفلاتر عشان تركز.",
  forestTitle: "المسار الموحد",
  forestHint: "مجموعات الأشخاص: العيلة، الشغل، الأصدقاء، الحب.",
  viewAllCta: "عرض الكل",
  viewSingleCta: "سياق واحد",
  contextFamily: "العيلة 👨‍👩‍👧‍👦",
  contextWork: "الشغل 💼",
  contextLove: "الحب 💕",
  contextGeneral: "أخرى 📍",
  insightInheritedPattern: (rootLabel: string) =>
    `ملاحظة: يبدو إن فيه نمط متوارث في ناحية ${rootLabel} بياخد مساحة من طاقتك. تحب نركز عليه في مسار الحماية؟`,
  focusTraumaRecoveryCta: "أيوه، نركز على الأنماط المتوارثة",
  focusTraumaBadge: "تركيز: الأنماط المتوارثة",
  /** مساحة التعافي */
  detachmentTitle: "مساحة التعافي",
  detachmentRealityAnchor: "أساسك الثابت",
  detachmentRealityAnchorHint: "اكتب ٣ أسباب قوية لاختيارك للمسافة. لما تحس بتذبذب، ارجع لهم.",
  detachmentRealityAnchorPlaceholder: "مثال: لما حصل...",
  detachmentWeakButton: "وحشني / حاسس بتذبذب",
  detachmentRumination: "سجل الأفكار",
  detachmentRuminationButton: "أنا بفكر فيه دلوقتي",
  detachmentRuminationPrompt: "الفكرة دي شكلها إيه؟",
  detachmentRuminationOptions: { guilt: "ذنب مش حقيقي", nostalgia: "حنين للماضي", fear: "خوف" } as const,
  detachmentRuminationResponse: "دي فكرة عابرة، مش واقعك. سيبها تعدي.",
  /** إشارة وقف */
  detachmentStopSignButton: "مش هنا.. مش دلوقتي.. وأنا مش مسؤول عن ده",
  detachmentStopSignHint: "اضغط أول ما صورته تيجي في بالك — اهتزاز + جملة وقف.",
  /** ميزان الضمير */
  detachmentGuiltCourtTitle: "ميزان الضمير",
  detachmentGuiltCourtHint: "اكتب جملة الذنب اللي جواك واسمع الرد الهادي.",
  detachmentGuiltCourtPlaceholder: "مثال: حاسس بذنب إني مكلمتهاش",
  detachmentGuiltCourtButton: "اسمع الرد الهادي",
  detachmentGuiltCourtStaticResponse: "هل فيه قانون بيقول لازم تكلمها كل يوم؟ ولا ده قانون هي اللي حطته؟ أنت مش المتهم هنا.",
  tabDiagnosis: "فهم الوضع",
  tabSymptoms: "الإشارات",
  tabSolution: "الخطوة الجاية",
  tabPlan: "مسار الحماية",
  firstStepCta: "ابدأ خطوات الرحلة",
  /** تبويب التشخيص */
  diagnosisReadMore: "اقرأ فهم الوضع",
  diagnosisReadInsight: "رؤية إضافية",
  diagnosisCollapse: "أخفِ",
  /** شرط الخطة */
  planRuleTitle: "ليه مسار الحماية مش ظاهر؟",
  planRuleBody: "خطوات الرحلة بتظهر لما تكتب موقفين على الأقل في «الخطوة الأولى». المواقف دي بتساعدنا نفهم الأنماط ونرسم لك مسار مخصص.",
  planRuleCounter: (count: number) => `مواقفك الحالية: ${count}/2`,
  planRuleCta: "يلا نكتب المواقف ←",
  planRuleShort: "مسار الحماية يظهر بعد موقفين.",
  planPreviewTitle: "معاينة مسار الحماية",
  planPreviewCta: "اكتب موقفين عشان نرسم لك مسار مخصص كامل.",
  /** أونبوردينج الخريطة */
  onboardingStep1: "أنت في المركز. المساحة دي بتاعتك — إحساسك هو البوصلة وانت اللي بتحدد المسافات.",
  onboardingStep2: "لون كل مدار = إحساسك: أخضر قريب، أصفر متذبذب، أحمر بعيد.",
  onboardingCta: "فهمت، يلا بينا",

  /** محطات عدت — أشخاص خرجوا من الخريطة الحية */
  archivedTitle: "محطات عدت",
  archivedSubtitle: "حياتك قطر مكمل — ودول محطات نزلت فيها أو نزلوا فيها.",
  archivedEmpty: "لسه مفيش محطات عدت. لما تقرر تخرّج حد من دوايرك هيتحفظ هنا.",
  archivedRestoreCta: "ارجّعه للخريطة",
  archivedDuration: (months: number) => months >= 12
    ? `كان في دوايرك ${Math.floor(months / 12)} ${Math.floor(months / 12) === 1 ? "سنة" : "سنين"}`
    : months >= 1
      ? `كان في دوايرك ${months} ${months === 1 ? "شهر" : "شهور"}`
      : "محطة عدت",
  archivedLesson: "الدرس اللي خرجت بيه من المحطة دي كان إيه؟",
  archivedLessonPlaceholder: "اكتب هنا — مش لازم تكمل الجملة، كلمة واحدة بتكفي...",
  archivedCourage: "كنت شجاع كفاية إنك تاخد الخطوة دي.",

  /** لوحة التحكم — Dashboard Widget */
  dashboardSlogan: "الرحلة طويلة.. بس إنت مش تايه، خريطتك في إيدك.",
  dashboardMapSummary: (total: number, green: number, archived: number) =>
    `خريطتك فيها ${total} ${total === 1 ? "شخص" : "أشخاص"} — ${green} ${green === 1 ? "داعم" : "داعمين"}${archived > 0 ? ` — ${archived} في محطات عدت` : ""}`,
  dashboardDailyQuestions: [
    "مين أكتر حد في دوايرك محتاج تقرب منه النهاردة؟",
    "هل فيه محطة في 'محطات عدت' لسه شاغلة تفكيرك؟",
    "لو تحذف دايرة واحدة من خريطتك دلوقتي — أنهي دايرة هتريحك أكتر؟",
    "مين الشخص اللي لما بتفكر فيه بتحس بطاقة إيجابية؟",
    "هل خريطتك دلوقتي بتعكس مشاعرك الحقيقية؟",
    "إيه الحد اللي لو رسمته في الخريطة هيوضحلك حاجة مهمة؟",
    "مين اللي بتتجنب حطه في الخريطة وليه؟"
  ],

  // Dynamic titles based on goalId
  titles: {
    family: "خريطة العيلة",
    work: "خريطة الشغل",
    love: "خريطة الحب",
    money: "خريطة الفلوس",
    self: "خريطة نفسك",
    unknown: "خريطتك",
    general: "خريطتك"
  }
};
