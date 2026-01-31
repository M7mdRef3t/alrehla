import type { DynamicStep } from "../utils/dynamicPlanGenerator";

// تمارين مخصصة لكل عرض
export interface SymptomExercise {
  symptomId: string;
  week: number;
  title: string;
  description: string;
  actions: DynamicStep['actions'];
  successCriteria: string;
}

export const symptomExercisesDatabase: SymptomExercise[] = [
  // ========================================
  // Emotional Symptoms (الأعراض العاطفية)
  // ========================================
  
  // 1. Guilt (الذنب)
  {
    symptomId: "guilt",
    week: 1,
    title: "تحدي الذنب المفتعل",
    description: "الذنب اللي بتحسه مش دايماً حقيقي. ساعات بيكون مفتعل عشان يتحكم فيك. هنتعلم نفرق بين الذنب الحقيقي (لما نغلط فعلاً) والذنب المفتعل (لما نحمي حدودنا).",
    actions: [
      {
        id: "guilt-1-1",
        type: "reflection",
        text: "اكتب 3 مواقف حسيت فيها بذنب مع الشخص ده",
        requiresInput: true,
        placeholder: "مثال: لما رفضت أروح معاه مكان مش عايزه، حسيت إني أناني رغم إني تعبان",
        helpText: "حاول تفتكر مواقف محددة حصلت فعلاً"
      },
      {
        id: "guilt-1-2",
        type: "writing",
        text: "لكل موقف، اسأل نفسك: هل أنا غلطت فعلاً؟ ولا أنا حميت نفسي؟",
        requiresInput: true,
        placeholder: "الموقف الأول: أنا مش غلطت، أنا كان عندي الحق أقول لأ لأني كنت تعبان...",
        helpText: "الذنب الحقيقي = لما تأذي حد عمداً. الذنب المفتعل = لما تحمي نفسك"
      },
      {
        id: "guilt-1-3",
        type: "practice",
        text: "قول 'لأ' مرة واحدة هالأسبوع بدون تبرير طويل",
        helpText: "كفاية تقول: 'مش هقدر، شكراً' - ومتبررش أكتر من كده"
      }
    ],
    successCriteria: "قدرت تقول 'لأ' مرة واحدة على الأقل من غير ما تحس بذنب مبالغ فيه"
  },

  // 2. Not Enough (مش كفاية)
  {
    symptomId: "not_enough",
    week: 2,
    title: "تحدي 'أنا مش كفاية'",
    description: "الإحساس إنك 'مش كفاية' بييجي من مقارنة نفسك بمعايير مستحيلة. هنتعلم نشوف قيمتنا الحقيقية.",
    actions: [
      {
        id: "not_enough-2-1",
        type: "writing",
        text: "اكتب 5 حاجات بتعملها كويس في العلاقة دي",
        requiresInput: true,
        placeholder: "مثال: 1. بسمع له/لها لما يكون تعبان 2. باتصل بيه كل أسبوع...",
        helpText: "حتى لو صغيرة، اكتبها. مفيش حاجة 'تافهة'"
      },
      {
        id: "not_enough-2-2",
        type: "reflection",
        text: "متى بالظبط بتحس إنك 'مش كفاية'؟ وين بيجي الإحساس ده؟",
        requiresInput: true,
        placeholder: "مثال: لما أقول لأ على طلب، يقولي 'أنت متغيرت'...",
        helpText: "الإحساس ده غالباً بييجي من كلام معين أو موقف معين"
      },
      {
        id: "not_enough-2-3",
        type: "practice",
        text: "المرة الجاية لما تحس كده، قول لنفسك: 'أنا بعمل اللي أقدر عليه، وده كفاية'",
        helpText: "ممكن تكتبها على ورقة وتحطها في جيبك"
      }
    ],
    successCriteria: "بدأت تلاحظ متى بيجي الإحساس ده وبتقاومه بجملة إيجابية"
  },

  // 3. Conditional Love (القبول المشروط)
  {
    symptomId: "conditional",
    week: 2,
    title: "كسر دائرة القبول المشروط",
    description: "القبول الحقيقي مش مشروط. لو بتحس إنك مقبول بس لما تعمل حاجة معينة، ده مش حب حقيقي.",
    actions: [
      {
        id: "conditional-2-1",
        type: "observation",
        text: "راقب: إمتى بتحس بالقبول ومتى بتحس بالرفض؟",
        requiresInput: true,
        placeholder: "قبول: لما أعمل اللي هو عايزه | رفض: لما أعبر عن رأيي المختلف...",
        helpText: "اكتب مواقف محددة حصلت خلال الأسبوع"
      },
      {
        id: "conditional-2-2",
        type: "practice",
        text: "جرب تعمل حاجة 'مش متوقعة منك' وشوف رد الفعل",
        helpText: "مثال: قول رأيك الحقيقي في موضوع، حتى لو مختلف عنه"
      }
    ],
    successCriteria: "بدأت تفهم إن القبول الحقيقي مش مشروط بسلوك معين"
  },

  // 4. Emotional Manipulation (التلاعب العاطفي)
  {
    symptomId: "emotional_manipulation",
    week: 3,
    title: "تمييز التلاعب العاطفي",
    description: "التلاعب العاطفي صعب تكتشفه لأنه بيستخدم الحب والذنب كأدوات. هنتعلم نميزه ونوقفه.",
    actions: [
      {
        id: "manipulation-3-1",
        type: "writing",
        text: "اكتب جمل بتتقال ليك وبتحسك بذنب أو خوف",
        requiresInput: true,
        placeholder: "مثال: 'أنت السبب في تعبي' | 'مفيش حد بيحبني غيرك' | 'لو بتحبني كنت هتعمل كذا'...",
        helpText: "الجمل دي كلها تلاعب عاطفي - بتحاول تتحكم فيك"
      },
      {
        id: "manipulation-3-2",
        type: "practice",
        text: "لما تسمع جملة تلاعب، قول: 'أنا مش مسؤول عن مشاعرك'",
        helpText: "أو: 'ده اختيارك، مش ذنبي' - متدخلش في الدفاع أو التبرير"
      }
    ],
    successCriteria: "بقيت تعرف تميز التلاعب وتوقفه بجملة حازمة"
  },

  // ========================================
  // Physical Symptoms (الأعراض الجسدية)
  // ========================================

  // 5. Exhausted (الإرهاق النفسي)
  {
    symptomId: "exhausted",
    week: 1,
    title: "حماية الطاقة",
    description: "الإرهاق بعد اللقاء علامة إن العلاقة بتستنزفك. هنتعلم نحمي طاقتنا ونحددها.",
    actions: [
      {
        id: "exhausted-1-1",
        type: "observation",
        text: "راقب مستوى طاقتك قبل وبعد التواصل (من 1 لـ 10)",
        requiresInput: true,
        placeholder: "قبل: 7/10 | بعد: 3/10 | المدة: ساعتين...",
        helpText: "سجل كل لقاء/مكالمة - هتلاقي pattern واضح"
      },
      {
        id: "exhausted-1-2",
        type: "practice",
        text: "حدد وقت اللقاء/المكالمة (30-45 دقيقة فقط)",
        helpText: "لما الوقت يخلص، اعتذر بهدوء: 'عندي حاجة تانية، هكلمك لاحقاً'"
      },
      {
        id: "exhausted-1-3",
        type: "practice",
        text: "بعد كل لقاء، خد 30 دقيقة لنفسك (استرخاء، موسيقى، مشي)",
        helpText: "دي مش أنانية - دي ضرورة عشان تسترجع طاقتك"
      }
    ],
    successCriteria: "قدرت تحدد الوقت مرة على الأقل وخدت وقت استرجاع بعد اللقاء"
  },

  // 6. Physical Tension (التوتر الجسدي)
  {
    symptomId: "physical_tension",
    week: 2,
    title: "الاستماع للجسد",
    description: "جسمك بيحذرك من الخطر قبل ما عقلك يفهم. التوتر الجسدي علامة واضحة.",
    actions: [
      {
        id: "tension-2-1",
        type: "observation",
        text: "لاحظ: وين بيحصل التوتر في جسمك؟ (رقبة، كتف، معدة، صدر؟)",
        requiresInput: true,
        placeholder: "مثال: قبل المكالمة بتيجيلي ألم في المعدة، وبعدها صداع...",
        helpText: "الجسم بيتكلم - لازم نسمعه"
      },
      {
        id: "tension-2-2",
        type: "practice",
        text: "لما تحس بالتوتر، خد نفس عميق 3 مرات وقول: 'أنا آمن دلوقتي'",
        helpText: "تمرين التنفس بيهدي الجهاز العصبي"
      }
    ],
    successCriteria: "بقيت تلاحظ إشارات جسمك وبتتعامل معاها"
  },

  // ========================================
  // Behavioral Symptoms (الأعراض السلوكية)
  // ========================================

  // 7. Ruminating (التفكير الدائري)
  {
    symptomId: "ruminating",
    week: 2,
    title: "كسر حلقة التفكير الدائري",
    description: "التفكير لساعات بعد اللقاء بيسرق حياتك. هنتعلم نوقفه.",
    actions: [
      {
        id: "ruminating-2-1",
        type: "writing",
        text: "اكتب الأفكار اللي بتدور في دماغك على ورقة",
        requiresInput: true,
        placeholder: "مثال: كان لازم أقول كذا... ليه قلت كذا... هيفكر فيا إزاي دلوقتي؟...",
        helpText: "لما تكتبها، بتطلعها من دماغك - بتبقى أخف"
      },
      {
        id: "ruminating-2-2",
        type: "practice",
        text: "استخدم تقنية 'Stop-Drop-Roll': قول 'Stop' بصوت عالي، غير نشاطك فوراً",
        helpText: "روح اتفرج على فيديو، اتكلم مع حد تاني، اعمل رياضة - أي حاجة تقطع التفكير"
      }
    ],
    successCriteria: "قدرت توقف حلقة التفكير مرة على الأقل باستخدام التقنية"
  },

  // 8. Avoidance (التجنب)
  {
    symptomId: "avoidance",
    week: 3,
    title: "من التجنب للحدود الواعية",
    description: "التجنب مش حل - بيخليك تحس بذنب أكتر. الحدود الواضحة أفضل.",
    actions: [
      {
        id: "avoidance-3-1",
        type: "reflection",
        text: "ليه بتتجنب المكالمات/اللقاءات؟ إيه اللي خايف منه؟",
        requiresInput: true,
        placeholder: "مثال: خايف من الانتقاد... خايف من طلبات ما أقدرش أرفضها...",
        helpText: "التجنب دايماً بيخبي خوف - لازم نواجهه"
      },
      {
        id: "avoidance-3-2",
        type: "practice",
        text: "بدل التجنب، حدد: متى ومدة التواصل (يوم وساعة محددة)",
        helpText: "مثال: 'هكلمك كل سبت الساعة 5 لمدة 30 دقيقة' - كده أنت متحكم، مش هارب"
      }
    ],
    successCriteria: "حولت التجنب لحدود واضحة ومحددة"
  },

  // 9. Self-Neglect (إهمال النفس)
  {
    symptomId: "self_neglect",
    week: 1,
    title: "إعادة اكتشاف احتياجاتك",
    description: "لما بتنسى احتياجاتك عشان ترضي غيرك، بتفقد نفسك. هنسترجعها.",
    actions: [
      {
        id: "self_neglect-1-1",
        type: "writing",
        text: "اكتب 5 احتياجات ليك انت اتأجلت بسبب العلاقة دي",
        requiresInput: true,
        placeholder: "مثال: 1. محتاج أنام بدري 2. عايز أقرأ 3. نفسي ألتقي بصحابي...",
        helpText: "حتى لو صغيرة، اكتبها"
      },
      {
        id: "self_neglect-1-2",
        type: "practice",
        text: "اختار احتياج واحد فقط وحققه هالأسبوع",
        helpText: "مثال: 'هنام بدري يوم الأربعاء' - خليه أولوية، مش optional"
      }
    ],
    successCriteria: "حققت احتياج واحد على الأقل ليك أنت شخصياً"
  },

  // 10. Walking on Eggshells (الحذر الدائم)
  {
    symptomId: "walking_eggshells",
    week: 2,
    title: "التحرر من الخوف المستمر",
    description: "لما بتحسب كل كلمة عشان ما يزعلش، ده معناه إنك عايش في خوف مستمر. دي مش علاقة صحية.",
    actions: [
      {
        id: "eggshells-2-1",
        type: "observation",
        text: "راقب: إيه المواضيع اللي بتتجنبها خوفاً من الزعل؟",
        requiresInput: true,
        placeholder: "مثال: ما بتكلمش عن شغلي... ما بقولش رأيي في السياسة... ما بطلبش حاجة...",
        helpText: "لو مش قادر تتكلم بحرية، ده مش أمان"
      },
      {
        id: "eggshells-2-2",
        type: "challenge",
        text: "جرب تتكلم في موضوع من دول مرة واحدة - بهدوء ووضوح",
        helpText: "لو زعل، ده مش غلطتك. ده دليل إن الخوف كان في محله - وده محتاج حدود أوضح"
      }
    ],
    successCriteria: "عبرت عن رأيك مرة واحدة حتى لو كان مختلف"
  },

  // 11. People Pleasing (إرضاء الآخرين)
  {
    symptomId: "people_pleasing",
    week: 1,
    title: "من People Pleaser لـ Boundary Keeper",
    description: "إرضاء الناس على حساب راحتك بيخليك تفقد هويتك. هنتعلم نرضي نفسنا الأول.",
    actions: [
      {
        id: "pleasing-1-1",
        type: "reflection",
        text: "متى آخر مرة قلت 'نعم' وانت عايز تقول 'لأ'؟",
        requiresInput: true,
        placeholder: "مثال: امبارح لما طلب مني أروح معاه وأنا تعبان، قلت أيوه عشان مش عايز يزعل...",
        helpText: "كل مرة بتقول 'نعم' وانت مش عايز، بتخون نفسك"
      },
      {
        id: "pleasing-1-2",
        type: "practice",
        text: "المرة الجاية، جرب: 'خليني أفكر وأرد عليك' - بدل 'نعم' الفورية",
        helpText: "ده بيديك وقت تفكر: أنا فعلاً عايز؟ ولا بس عشان أرضيه؟"
      }
    ],
    successCriteria: "استخدمت 'خليني أفكر' مرة واحدة على الأقل بدل الموافقة الفورية"
  },

  // 12. Lose Identity (فقدان الهوية)
  {
    symptomId: "lose_identity",
    week: 3,
    title: "استرجاع هويتك",
    description: "لما بتنسى مين أنت وإيه اللي بتحبه، ده معناه إن العلاقة بتبلعك. هنسترجع نفسنا.",
    actions: [
      {
        id: "identity-3-1",
        type: "writing",
        text: "اكتب: مين كنت قبل العلاقة دي؟ إيه اللي كنت بتحبه؟ إيه اللي اتغير؟",
        requiresInput: true,
        placeholder: "قبل: كنت بحب القراءة، عندي هوايات، بشوف صحابي... دلوقتي: كل وقتي في إرضاء الشخص ده...",
        helpText: "مش بتلوم نفسك - بس بتفهم إيه اللي حصل"
      },
      {
        id: "identity-3-2",
        type: "practice",
        text: "ارجع لحاجة واحدة كنت بتحبها قبل كده - خصص وقت ليها",
        helpText: "مثال: لو كنت بتحب الرسم، ارسم 30 دقيقة هالأسبوع"
      }
    ],
    successCriteria: "رجعت لحاجة واحدة على الأقل من هويتك القديمة"
  }
];

// Helper function: Get exercises for specific symptoms
export function getExercisesForSymptoms(symptomIds: string[]): SymptomExercise[] {
  return symptomExercisesDatabase.filter(exercise => 
    symptomIds.includes(exercise.symptomId)
  );
}

// Helper function: Get exercises grouped by week
export function getExercisesByWeek(symptomIds: string[]): Record<number, SymptomExercise[]> {
  const exercises = getExercisesForSymptoms(symptomIds);
  return exercises.reduce((acc, exercise) => {
    if (!acc[exercise.week]) {
      acc[exercise.week] = [];
    }
    acc[exercise.week].push(exercise);
    return acc;
  }, {} as Record<number, SymptomExercise[]>);
}
