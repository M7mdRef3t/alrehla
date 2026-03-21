import type { Ring } from "../modules/map/mapTypes";
import type { DetectedPattern, PatternType } from "./patternAnalyzer";
import type { SymptomExercise } from "../data/symptomExercises";

export interface DynamicAction {
  id: string;
  type: 'reflection' | 'writing' | 'practice' | 'observation' | 'challenge';
  text: string;
  placeholder?: string;
  requiresInput?: boolean;
  helpText?: string;
}

export interface DynamicStep {
  id: string;
  week: number;
  title: string;
  goal: string;
  targetPattern?: PatternType;
  description: string;
  actions: DynamicAction[];
  completed: boolean;
  successCriteria: string;
  warningMessage?: string;
}

export interface DynamicRecoveryPlan {
  personLabel: string;
  ring: Ring;
  primaryPattern: PatternType | null;
  totalWeeks: number;
  steps: DynamicStep[];
  insights: string[];
  generated: number;
  aiGenerated?: boolean;
}

/**
 * Generate a personalized recovery plan based on detected patterns and symptoms
 */
export function generateDynamicPlan(
  personLabel: string,
  ring: Ring,
  patterns: DetectedPattern[],
  insights: string[],
  symptomExercises: SymptomExercise[] = [],
  focusTraumaInheritance?: boolean
): DynamicRecoveryPlan {
  
  const primaryPattern = patterns[0] || null;
  let steps: DynamicStep[] = [];
  
  // If we have symptom exercises, prioritize them
  if (symptomExercises.length > 0) {
    steps = integrateSymptomExercises(symptomExercises, patterns);
  } else if (patterns.length === 0) {
    // Fallback to basic plan if no patterns detected
    return generateBasicPlan(personLabel, ring);
  } else {
    // Use pattern-based plan
    steps.push(generateWeek1Understanding(primaryPattern));
    steps.push(generateWeek2Defense(primaryPattern));
    steps.push(generateWeek3Practice(primaryPattern));
    steps.push(generateWeek4Expansion());
  }

  const finalInsights = focusTraumaInheritance
    ? [...insights, "هذه الخطة تركز على توارث الصدمات في العيلة: الوعي بمصدر النمط وتمييز اللي هو منك عن المتوارث والحدود الصحية."]
    : insights;
  
  return {
    personLabel,
    ring,
    primaryPattern: primaryPattern?.type || null,
    totalWeeks: steps.length,
    steps,
    insights: finalInsights,
    generated: Date.now()
  };
}

/**
 * Integrate symptom-specific exercises into the plan
 * Groups exercises by week and creates structured steps
 */
function integrateSymptomExercises(
  symptomExercises: SymptomExercise[],
  patterns: DetectedPattern[]
): DynamicStep[] {
  const steps: DynamicStep[] = [];
  
  // Group exercises by week
  const exercisesByWeek = symptomExercises.reduce((acc, exercise) => {
    if (!acc[exercise.week]) {
      acc[exercise.week] = [];
    }
    acc[exercise.week].push(exercise);
    return acc;
  }, {} as Record<number, SymptomExercise[]>);
  
  // Create steps for each week
  const weeks = Object.keys(exercisesByWeek).map(Number).sort((a, b) => a - b);
  
  weeks.forEach((weekNum) => {
    const weekExercises = exercisesByWeek[weekNum];
    
    // If multiple exercises in same week, combine them
    if (weekExercises.length === 1) {
      const exercise = weekExercises[0];
      steps.push({
        id: `symptom-week-${weekNum}`,
        week: weekNum,
        title: exercise.title,
        goal: `تجاوز شعور: ${exercise.title}`,
        description: exercise.description,
        actions: exercise.actions,
        completed: false,
        successCriteria: exercise.successCriteria
      });
    } else {
      // Multiple exercises - create combined step
      const titles = weekExercises.map(e => e.title).join(" + ");
      const mainSymptomTitle = weekExercises[0].title;
      const combinedCriteria = weekExercises.map(e => e.successCriteria).join(" و ");
      
      steps.push({
        id: `symptom-week-${weekNum}`,
        week: weekNum,
        title: `مواجهة ${mainSymptomTitle} (تمارين مجمعة)`,
        goal: titles,
        description: weekExercises.map(e => `• ${e.title}: ${e.description}`).join('\n\n'),
        actions: weekExercises.flatMap(e => e.actions),
        completed: false,
        successCriteria: combinedCriteria
      });
    }
  });
  
  // If we have less than 4 weeks, add pattern-based weeks
  if (steps.length < 4 && patterns.length > 0) {
    const remainingWeeks = 4 - steps.length;
    const primaryPattern = patterns[0];
    
    for (let i = 0; i < remainingWeeks; i++) {
      const weekNum = steps.length + 1;
      if (weekNum === 3) {
        steps.push(generateWeek3Practice(primaryPattern));
      } else if (weekNum === 4) {
        steps.push(generateWeek4Expansion());
      }
    }
  }
  
  return steps;
}

/**
 * Week 1: Understanding the pattern/weapon
 */
function generateWeek1Understanding(
  primaryPattern: DetectedPattern
): DynamicStep {
  
  const patternName = getPatternArabicName(primaryPattern.type);
  const weaponDescription = getWeaponDescription(primaryPattern.type);
  
  const actions: DynamicAction[] = [
    {
      id: 'w1-understand',
      type: 'reflection',
      text: `اقرا وافهم: "${weaponDescription}"`,
      helpText: 'ده السلاح اللي بيتستخدم ضدك. مش حقيقة - ده تكتيك.'
    },
    {
      id: 'w1-meaning',
      type: 'writing',
      text: 'اكتب بكلامك: إيه معنى ده ليك؟ وإزاي بيأثر عليك؟',
      placeholder: 'مثال: عندما أرفض طلب ما، أشعر أنني شخص سيء...',
      requiresInput: true
    },
    {
      id: 'w1-phrases',
      type: 'observation',
      text: `من المواقف اللي كتبتها، الجمل دي اتقالت: ${extractKeyPhrases(primaryPattern.examples)}`,
      helpText: 'دي الجمل اللي بتحسسك بالذنب أو الضغط'
    },
    {
      id: 'w1-more-phrases',
      type: 'writing',
      text: 'اكتب 3 جمل تانية بتتقال وبتحسسك بنفس الإحساس:',
      placeholder: 'جملة واحدة في كل سطر...',
      requiresInput: true
    },
    {
      id: 'w1-feelings',
      type: 'writing',
      text: `لما تسمع الجمل دي، بتحس بإيه؟`,
      placeholder: 'صف إحساسك بالتفصيل...',
      requiresInput: true,
      helpText: 'فهم مشاعرك أول خطوة للحماية'
    },
    {
      id: 'w1-truth',
      type: 'writing',
      text: 'لكل جملة، اكتب الحقيقة المضادة',
      placeholder: `مثال:\nالجملة: "أنت مش بتحبني"\nالحقيقة: "أنا بحبك، لكن مش من حقك تتحكم في كل قراراتي"`,
      requiresInput: true,
      helpText: 'الحقيقة هي سلاحك'
    }
  ];
  
  return {
    id: 'week-1',
    week: 1,
    title: `فهم السلاح: ${patternName}`,
    goal: `التعرف على النمط الرئيسي اللي بيتستخدم ضدك وفهم تأثيره`,
    targetPattern: primaryPattern.type,
    description: `هنركز الأسبوع ده على فهم ${patternName} - ده أخطر نمط في علاقتك دي`,
    actions,
    completed: false,
    successCriteria: 'لما تقدر تشوف النمط بوضوح وتعرف الحقيقة المضادة ليه'
  };
}

/**
 * Week 2: Building defenses
 */
function generateWeek2Defense(
  primaryPattern: DetectedPattern
): DynamicStep {
  
  const protectionPhrases = generateProtectionPhrases(primaryPattern);
  
  const actions: DynamicAction[] = [
    {
      id: 'w2-phrases',
      type: 'reflection',
      text: `جمل الحماية (مخصصة ليك):\n\n${protectionPhrases}`,
      helpText: 'الجمل دي مبنية على المواقف اللي كتبتها'
    },
    {
      id: 'w2-memorize',
      type: 'practice',
      text: 'احفظ الجمل دي - كرر كل واحدة 10 مرات بصوت عالي',
      helpText: 'الحفظ مش بس بالعقل - لازم باللسان كمان'
    },
    {
      id: 'w2-custom',
      type: 'writing',
      text: 'اكتب جملة حماية بكلامك الخاص:',
      placeholder: 'جملة تحس إنها صادقة وتقدر تقولها...',
      requiresInput: true
    },
    {
      id: 'w2-mental-practice',
      type: 'practice',
      text: 'التدريب الذهني: تخيل موقف حقيقي وتدرب على الرد',
      helpText: `1. تخيل الموقف\n2. خد نفس عميق (عد لـ 4)\n3. قول الجملة\n4. متناقشش أو متبررش`
    },
    {
      id: 'w2-daily',
      type: 'observation',
      text: 'تدرب 5 دقايق يومياً - سجّل هنا لما تعمل ده',
      requiresInput: true,
      placeholder: 'اليوم 1: تدربت ✓\nاليوم 2: ...'
    }
  ];
  
  return {
    id: 'week-2',
    week: 2,
    title: 'بناء الدرع',
    goal: 'إنشاء وحفظ جمل حماية قوية ومتدرب عليها',
    targetPattern: primaryPattern.type,
    description: 'هنبني دفاعاتك النفسية والكلامية',
    actions,
    completed: false,
    successCriteria: 'لما تقدر تقول جمل الحماية بثقة وبدون تردد',
    warningMessage: 'لو حاسس إنك مش جاهز، خد وقتك - مفيش مشكلة تعيد الأسبوع'
  };
}

/**
 * Week 3: Safe practice
 */
function generateWeek3Practice(
  primaryPattern: DetectedPattern
): DynamicStep {
  
  const safeSituations = getSafePracticeSituations(primaryPattern.type);
  
  const actions: DynamicAction[] = [
    {
      id: 'w3-choose',
      type: 'writing',
      text: `اختار موقف آمن نسبياً للتدريب:\n\n${safeSituations}`,
      placeholder: 'اكتب الموقف اللي اخترته...',
      requiresInput: true,
      helpText: 'ابدأ بالسهل - مش بالصعب'
    },
    {
      id: 'w3-plan',
      type: 'writing',
      text: 'خطط للرد قبلها بيوم - اكتب إيه اللي هتقوله بالظبط:',
      placeholder: 'الموقف: ...\nهقول: ...\nلو قال/قالت: ...\nهرد: ...',
      requiresInput: true
    },
    {
      id: 'w3-execute',
      type: 'challenge',
      text: '🎯 نفذ الموقف اللي اخترته',
      helpText: 'ده التحدي الحقيقي - خد وقتك وانت جاهز'
    },
    {
      id: 'w3-log',
      type: 'writing',
      text: 'بعد التنفيذ فوراً، سجّل:\n1. إيه اللي قولته بالظبط؟\n2. كان ردها/رده إيه؟\n3. كنت حاسس بإيه؟\n4. عملت إيه بعدها؟',
      placeholder: 'اكتب بالتفصيل...',
      requiresInput: true,
      helpText: 'التوثيق مهم جداً - ده هيساعدك تتعلم'
    },
    {
      id: 'w3-reflect',
      type: 'reflection',
      text: 'تأمل: إيه اللي اتعلمته من التجربة دي؟',
      requiresInput: true,
      placeholder: 'الدروس المستفادة...'
    }
  ];
  
  return {
    id: 'week-3',
    week: 3,
    title: 'التطبيق الآمن',
    goal: 'تجربة وضع الحدود في موقف آمن ومخطط له',
    targetPattern: primaryPattern.type,
    description: 'الانتقال من التدريب للتطبيق الفعلي',
    actions,
    completed: false,
    successCriteria: 'إنك تنفذ موقف واحد على الأقل وتوثقه',
    warningMessage: '⚠️ لا تبدأ الأسبوع ده إلا لما تكون فعلاً جاهز ومرتاح'
  };
}

/**
 * Week 4: Expansion (dynamically generated)
 */
function generateWeek4Expansion(): DynamicStep {
  
  return {
    id: 'week-4',
    week: 4,
    title: 'التوسع والتطوير',
    goal: 'بناءً على نتيجة الأسبوع الثالث، هنحدد الخطوات الجاية',
    description: 'الأسبوع ده هيتم توليده تلقائياً بناءً على تقدمك',
    actions: [
      {
        id: 'w4-dynamic',
        type: 'reflection',
        text: 'الخطوات هنا هتتحدد بناءً على:\n• نتيجة الأسبوع الثالث\n• الأنماط الجديدة اللي ظهرت\n• مستوى ارتياحك\n\nارجع للخطة بعد ما تخلص الأسبوع الثالث',
        helpText: 'الخطة بتتكيف معاك - مش أنت اللي بتتكيف معاها'
      }
    ],
    completed: false,
    successCriteria: 'سيتم تحديده بناءً على تقدمك'
  };
}

// Helper functions

function getPatternArabicName(type: PatternType): string {
  const names = {
    timing: 'انتهاك الحدود الزمنية',
    financial: 'الضغط المالي',
    emotional: 'الذنب المفتعل',
    behavioral: 'السلوك المتكرر',
    boundary: 'تجاهل الحدود'
  };
  return names[type] || type;
}

function getWeaponDescription(type: PatternType): string {
  const descriptions = {
    timing: '"انتهاك الحدود الزمنية" هو لما حد بيتجاهل وقتك وراحتك - بيتصل أو يطلب حاجات في أوقات مش مناسبة. ده مش "اهتمام" - ده عدم احترام.',
    financial: '"الضغط المالي" هو لما حد بيستخدم احتياجاته المالية كوسيلة للتحكم فيك. الطلب المستمر للفلوس مع الضغط العاطفي ده تلاعب.',
    emotional: '"الذنب المفتعل" هو لما حد يحسسك إنك أناني لو رفضت، مش بتحبه لو اخترت نفسك، أو مسؤول عن مشاعره. ده سلاح نفسي قوي.',
    behavioral: '"السلوك المتكرر" هو أنماط ثابتة من التصرفات السلبية - صراخ، عدوانية، أو تجاهل. ده مش "مزاج" - ده pattern مقصود.',
    boundary: '"تجاهل الحدود" هو لما حد بيكمل الضغط حتى بعد ما ترفض. "لا" المفروض تكون جملة كاملة - مش بداية مفاوضات.'
  };
  return descriptions[type] || 'نمط ضغط متكرر';
}

function extractKeyPhrases(examples: string[]): string {
  // Extract quoted phrases or key statements from examples
  const phrases: string[] = [];
  
  examples.forEach(ex => {
    // Look for quoted text
    const quoted = ex.match(/"([^"]+)"/g) || ex.match(/'([^']+)'/g);
    if (quoted) {
      phrases.push(...quoted.map(q => q.replace(/['"]/g, '')));
    }
  });
  
  if (phrases.length === 0) {
    phrases.push('(مفيش جمل محددة اتذكرت)');
  }
  
  return phrases.slice(0, 3).map((p, i) => `${i + 1}. "${p}"`).join('\n');
}

function generateProtectionPhrases(pattern: DetectedPattern): string {
  const phrasesByType: Record<PatternType, string[]> = {
    timing: [
      'أنا مش متاح بعد الـ 10 مساءً. هكلمك/هكلمك الصبح',
      'ده وقت راحتي. ممكن نتكلم في وقت تاني؟',
      'وقتي مهم زي وقتك - محتاج أحترمه'
    ],
    financial: [
      'أنا بحبك، لكن معنديش دلوقتي',
      'الفلوس مش مقياس الحب. مش هقدر أساعد المرة دي',
      'وضعي المادي مش مسموح بده حالياً'
    ],
    emotional: [
      'حبي ليك/لك مش مرتبط بإني أوافق على كل حاجة',
      'أنا مش أناني لأني بختار نفسي',
      'مشاعري مهمة زي مشاعرك'
    ],
    behavioral: [
      'مش هقدر أكمل المحادثة دي لو استمر الصراخ',
      'محتاج وقت أهدى فيه. هنكمل بعدين',
      'أنا بسمعك، لكن مش هقبل الأسلوب ده'
    ],
    boundary: [
      '"لا" دي إجابة كاملة. مش محتاج أبررها',
      'قولت لأ، ورأيي مش هيتغير',
      'أنا بحترم نفسي لما بحط حدود'
    ]
  };
  
  const phrases = phrasesByType[pattern.type] || ['أنا محتاج مساحتي الخاصة'];
  return phrases.map((p, i) => `${i + 1}. "${p}"`).join('\n\n');
}

function getSafePracticeSituations(type: PatternType): string {
  const situations: Record<PatternType, string[]> = {
    timing: [
      '✓ رفض مكالمة في وقت مش مناسب (رسالة نصية)',
      '✓ تحديد وقت محدد للمحادثة',
      '✓ عدم الرد على رسالة فوراً'
    ],
    financial: [
      '✓ رفض طلب صغير (مش كبير)',
      '✓ تأجيل القرار لحد ما تفكر',
      '✓ طلب وقت للتفكير'
    ],
    emotional: [
      '✓ رفض دعوة اجتماعية',
      '✓ عدم التبرير الزائد لقرار',
      '✓ قول رأيك في موضوع بسيط'
    ],
    behavioral: [
      '✓ إنهاء محادثة بدأت تعلى',
      '✓ طلب تغيير طريقة الكلام',
      '✓ الانسحاب من موقف متوتر'
    ],
    boundary: [
      '✓ قول "لا" لطلب بسيط',
      '✓ تحديد حد واضح لحاجة صغيرة',
      '✓ عدم تغيير رأيك بعد الرفض'
    ]
  };
  
  const options = situations[type] || ['اختار موقف بسيط وآمن'];
  return options.join('\n');
}

/**
 * Fallback basic plan if no patterns detected. Used also for plan preview when situations < 2.
 */
export function generateBasicPlan(personLabel: string, ring: Ring): DynamicRecoveryPlan {
  return {
    personLabel,
    ring,
    primaryPattern: null,
    totalWeeks: 4,
    steps: [
      {
        id: 'basic-week-1',
        week: 1,
        title: 'فهم العلاقة',
        goal: 'كتابة مواقف أكتر لفهم الأنماط',
        description: 'محتاجين مواقف أكتر عشان نقدر نحلل ونخصص الخطة',
        actions: [
          {
            id: 'basic-write',
            type: 'writing',
            text: 'اكتب 3 مواقف إضافية حصلت مؤخراً:',
            requiresInput: true,
            placeholder: 'موقف واحد في كل مرة...'
          }
        ],
        completed: false,
        successCriteria: 'كتابة 3 مواقف على الأقل'
      }
    ],
    insights: ['محتاجين معلومات أكتر عشان نبني خطة مخصصة'],
    generated: Date.now()
  };
}
