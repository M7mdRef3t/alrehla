import type { Ring } from "@/modules/map/mapTypes";

export type SymptomCategory =
  | "emotional"
  | "physical"
  | "behavioral"
  | "psychological"
  | "neurological"
  | "spiritual"
  | "financial"
  | "social"
  | "professional"
  | "time"
  | "family"
  | "values";

export interface Symptom {
  id: string;
  text: string;
  category: SymptomCategory;
}

/** قواعد قاطعة من قائمة الأعراض — تظهر تحت كل فئة لربط الاختيار بالحكم */
export const CATEGORY_RULES: Partial<Record<SymptomCategory, string>> = {
  physical: "أي علاقة تدخل جسمك في وضع دفاع = مش علاقة صحية.",
  psychological: "العلاقة الصحية ما تحتاجش تفسير علشان تكمل.",
  emotional: "أي علاقة شغّالة بالذنب = استنزاف.",
  behavioral: "لو وجودك محتاج مجهود علشان \"يعدّي\" فالعلاقة مش في مكانها.",
  neurological: "لو دماغك اشتغل زيادة بسبب شخص… اسأل ليه.",
  spiritual: "لو خرجت من نفسك عشان العلاقة… يبقى في دور أو تنازل عن قيمك.",
  social: "العلاقة الصحية ما بتسرقش من وقتك ولا علاقاتك التانية.",
  family: "الحدود مع العيلة مش أنانية — دي حماية.",
  values: "أي علاقة تخلّيك تتنازل عن قيمك = مكانها غلط.",
};

/** أعراض العلاقة الصحية — تظهر لما مفيش أعراض مختارة (مرجع للمستخدم) */
export const HEALTHY_RELATIONSHIP_SIGNS = [
  "جسمك هادي بعد التعامل",
  "تقدر تسكت من غير توتر",
  "تقدر تقول لأ من غير خوف",
  "حياتك ماشية حتى لو الطرف غايب",
  "مفيش تفسير ولا تبرير مستمر",
];

export const symptomsDatabase: Record<Ring, Symptom[]> = {
  red: [
    { 
      id: "guilt", 
      text: "بتحس بالذنب لما تقول 'لأ'", 
      category: "emotional" 
    },
    { 
      id: "exhausted", 
      text: "بترجع من اللقاء منهك نفسياً وجسدياً", 
      category: "physical" 
    },
    { 
      id: "ruminating", 
      text: "بتفكر في الكلام لساعات بعد اللقاء", 
      category: "behavioral" 
    },
    { 
      id: "not_enough", 
      text: "بتحس إنك 'مش كفاية' مهما عملت", 
      category: "emotional" 
    },
    { 
      id: "avoidance", 
      text: "بتتجنب المكالمات أو اللقاءات", 
      category: "behavioral" 
    },
    { 
      id: "self_neglect", 
      text: "بتنسى احتياجاتك عشان ترضيه/ترضيها", 
      category: "behavioral" 
    },
    {
      id: "physical_tension",
      text: "بتحس بتوتر جسدي (صداع، ألم معدة) قبل أو بعد اللقاء",
      category: "physical"
    },
    {
      id: "emotional_manipulation",
      text: "بتحس إنه/إنها بتلاعبك عاطفياً",
      category: "emotional"
    },
    {
      id: "lose_identity",
      text: "بتنسى مين أنت أو إيه اللي بتحبه",
      category: "emotional"
    },
    {
      id: "chronic_fatigue",
      text: "إرهاق أو تعب مزمن مرتبط بالعلاقة",
      category: "physical"
    },
    {
      id: "sleep_disturbance",
      text: "اضطراب في النوم (أرق أو نوم متقطع) بعد التواصل",
      category: "physical"
    },
    {
      id: "anxiety_before_contact",
      text: "قلق أو خوف قبل المكالمة أو اللقاء",
      category: "emotional"
    },
    {
      id: "shame",
      text: "بتحس بالحرج أو الخجل من نفسك في العلاقة",
      category: "emotional"
    },
    {
      id: "over_explaining",
      text: "بتبرر أو تشرح كتير عشان ما يزعلش",
      category: "behavioral"
    },
    {
      id: "appetite_change",
      text: "تغيير في الشهية (فقدان أو زيادة أكل) مرتبط بالعلاقة",
      category: "physical"
    },
    {
      id: "hopeless",
      text: "بتحس إن الوضع مش هيتغير أو إنك عاجز",
      category: "emotional"
    },
    {
      id: "suppressed_anger",
      text: "بتحس بغض أو زعل بس بتكتمه عشان ما تصعّبش الأمور",
      category: "emotional"
    },
    {
      id: "checking_phone",
      text: "بتتابع المكالمات أو الرسائل بقلق",
      category: "behavioral"
    },
    {
      id: "chest_tightness",
      text: "ضيق في الصدر أو صعوبة تنفس قبل أو بعد اللقاء",
      category: "physical"
    },
    {
      id: "stomach_knot",
      text: "مغص أو «قفشة» في البطن قبل ما تشوفه أو أول ما اسمه يظهر",
      category: "physical"
    },
    {
      id: "breath_holding",
      text: "بتلاقي نفسك كاتم نفسك وانت قاعد معاه، ومش بتتنفس بعمق",
      category: "physical"
    },
    {
      id: "relief_on_cancel",
      text: "شعور براحة أو «نشوة» لو اعتذر عن اللقاء (وجوده عبء)",
      category: "physical"
    },
    {
      id: "rehearsing",
      text: "بتعمل بروفات للكلام في دماغك قبل ما تقوله عشان خايف من رد فعله",
      category: "psychological"
    },
    {
      id: "self_cancellation",
      text: "بتلغي خططك أو هواياتك أو راحتك فوراً لو طلب حاجة",
      category: "behavioral"
    },
    {
      id: "hiding_relationship",
      text: "بتبدأ تخبي تفاصيل العلاقة عن صحابك أو أهلك عشان عارفين إنها مؤذية",
      category: "behavioral"
    },
    {
      id: "anxiety_low_mood",
      text: "قلق أو مزاج منخفض مرتبط بالعلاقة",
      category: "psychological"
    },
    {
      id: "brain_fog",
      text: "تشتت أو صعوبة تركيز أو نسيان بعد التواصل",
      category: "neurological"
    },
    {
      id: "inner_emptiness",
      text: "بتحس بفراغ أو بُعد عن نفسك بسبب العلاقة",
      category: "spiritual"
    },
    {
      id: "financial_strain",
      text: "ضغط مالي أو تنازل عن مصلحتك المالية عشان العلاقة",
      category: "financial"
    },
    {
      id: "social_withdrawal",
      text: "انسحاب من الناس أو فقدان صداقات بسبب العلاقة",
      category: "social"
    },
    {
      id: "work_affected",
      text: "العلاقة بتأثر على شغلك أو تركيزك في العمل",
      category: "professional"
    },
    {
      id: "time_drained",
      text: "وقتك كله رايح للعلاقة ومفيش مساحة ليك",
      category: "time"
    },
    {
      id: "family_tension",
      text: "ضغط أو توتر مع باقي العيلة بسبب العلاقة دي",
      category: "family"
    },
    {
      id: "values_conflict",
      text: "تعارض قيم أو معايير مع الطرف ده بيخليك في صراع",
      category: "values"
    }
  ],
  yellow: [
    { 
      id: "inconsistent", 
      text: "العلاقة مرات حلوة ومرات مرهقة", 
      category: "emotional" 
    },
    { 
      id: "walking_eggshells", 
      text: "بتحسب كلامك عشان ما يزعلش", 
      category: "behavioral" 
    },
    { 
      id: "conditional", 
      text: "بتحس بالقبول بس لما تعمل اللي هو/هي عايزه", 
      category: "emotional" 
    },
    {
      id: "confused",
      text: "مش متأكد لو العلاقة دي صحية ولا لأ",
      category: "emotional"
    },
    {
      id: "people_pleasing",
      text: "بتحاول ترضيه/ترضيها على حساب راحتك",
      category: "behavioral"
    },
    {
      id: "boundaries_unclear",
      text: "مش عارف إيه الحدود المناسبة في العلاقة دي",
      category: "behavioral"
    },
    {
      id: "tired_after_contact",
      text: "بتحس بإرهاق أو ثقل بعد ما تتكلم أو تقابله",
      category: "physical"
    },
    {
      id: "mild_tension",
      text: "توتر خفيف في الجسم (رقبة، كتفين) لما تفكر فيه أو قبل اللقاء",
      category: "physical"
    },
    {
      id: "sleep_after_contact",
      text: "صعوبة في النوم أو نوم متقطع بعد التواصل معاه/معاها",
      category: "physical"
    },
    {
      id: "responsible_for_mood",
      text: "بتحس إنك مسؤول عن مزاجه أو راحته",
      category: "emotional"
    },
    {
      id: "delay_reply",
      text: "بتأخر الرد أو بتتجنب مواضيع معينة عشان ما تصعّبش الوضع",
      category: "behavioral"
    },
    {
      id: "worry_reaction",
      text: "بتقلق من رد فعله لو قلت رأيك أو رفضت",
      category: "emotional"
    },
    {
      id: "cancel_plans",
      text: "أحياناً تلغى خطط أو تتهرب من لقاء عشان ترتاح",
      category: "behavioral"
    },
    {
      id: "mood_swings_relation",
      text: "مزاجك بيتأثر بيه/بها أو بالعلاقة",
      category: "psychological"
    },
    {
      id: "tension_head",
      text: "صداع أو ثقل في الرأس بعد التواصل",
      category: "neurological"
    },
    {
      id: "lack_peace",
      text: "مش حاسس بسلام داخلي في العلاقة دي",
      category: "spiritual"
    },
    {
      id: "money_unease",
      text: "قلق أو عدم راحة من موضوع فلوس معاه/معاها",
      category: "financial"
    },
    {
      id: "less_social",
      text: "أحياناً بتقلل تواصلك مع ناس تانيين عشان العلاقة دي",
      category: "social"
    },
    {
      id: "work_boundaries_blur",
      text: "حدود الشغل والحياة بتختلط بسبب العلاقة",
      category: "professional"
    },
    {
      id: "time_pressure",
      text: "بتحس بضغط إنك لازم تكون متاح أو تلبّي طلبات على حساب وقتك",
      category: "time"
    },
    {
      id: "family_pressure",
      text: "ضغط من العيلة أو تحالفات عشان العلاقة دي",
      category: "family"
    },
    {
      id: "values_unsure",
      text: "مش واثق إن قيمك أو معاييرك محترمة في العلاقة دي",
      category: "values"
    }
  ],
  green: [
    { 
      id: "safe", 
      text: "بتحس بالأمان وانت معاه/معاها", 
      category: "emotional" 
    },
    { 
      id: "energized", 
      text: "بترجع من اللقاء مبسوط ومرتاح", 
      category: "physical" 
    },
    { 
      id: "authentic", 
      text: "بتقدر تكون نفسك من غير تصنع", 
      category: "behavioral" 
    },
    {
      id: "mutual_respect",
      text: "في احترام متبادل وتقدير",
      category: "emotional"
    },
    {
      id: "healthy_boundaries",
      text: "الحدود واضحة ومحترمة من الطرفين",
      category: "behavioral"
    },
    {
      id: "balanced",
      text: "العلاقة متوازنة - بياخد ويدي",
      category: "emotional"
    },
    {
      id: "calm_after",
      text: "بتحس بهدوء وراحة بعد ما تتكلم معاه/معاها",
      category: "physical"
    },
    {
      id: "supported",
      text: "بتحس إنه/إنها بيدعمك وقت ما تحتاج",
      category: "emotional"
    },
    {
      id: "mental_clarity",
      text: "وضوح وصفاء ذهني بعد ما تتكلم معاه/معاها",
      category: "psychological"
    },
    {
      id: "inner_peace",
      text: "سلام داخلي واتصال مع نفسك في العلاقة",
      category: "spiritual"
    },
    {
      id: "financial_comfort",
      text: "حدود مالية واضحة ومريحة بينكم",
      category: "financial"
    },
    {
      id: "no_tension_after",
      text: "مش بتحس بتوتر أو تشتت بعد ما تتكلم معاه/معاها",
      category: "neurological"
    },
    {
      id: "social_balance",
      text: "العلاقة مش بتمنعك من علاقاتك التانية أو حياتك الاجتماعية",
      category: "social"
    },
    {
      id: "work_life_clear",
      text: "حدود واضحة بين الشغل والحياة والعلاقة دي",
      category: "professional"
    },
    {
      id: "time_respected",
      text: "وقتك ومساحتك محترمة في العلاقة",
      category: "time"
    },
    {
      id: "family_ok",
      text: "العلاقة دي مش بتخلّي توتر مع باقي العيلة",
      category: "family"
    },
    {
      id: "values_aligned",
      text: "قيمك ومعاييرك محترمة ومتوافقة في العلاقة",
      category: "values"
    }
  ]
};

/** أوزان الأعراض حسب الرادار (جسد=أصدق شاهد) — للمعادلة القاطعة */
export function getSymptomWeight(ring: Ring, category: SymptomCategory): number {
  if (ring === "red") return category === "physical" ? 10 : 5; // جسدي أحمر = 10، باقي أحمر = 5
  if (ring === "yellow") return 3;
  return 0; // أخضر = 0
}

/** عتبات الحكم: لو المجموع >= 10 أو في عرض جسدي أحمر → حمراء؛ >= 6 → صفراء */
export const WEIGHT_THRESHOLD_RED = 10;
export const WEIGHT_THRESHOLD_YELLOW = 6;

// Helper function to get symptoms by ring
export const getSymptomsByRing = (ring: Ring): Symptom[] => {
  return symptomsDatabase[ring] || [];
};

// Helper function to get symptom by id
export const getSymptomById = (id: string, ring: Ring): Symptom | undefined => {
  return symptomsDatabase[ring].find(s => s.id === id);
};

/** تسمية قصيرة للأعراض للعرض في الرؤى والـ Why Box */
const SYMPTOM_SHORT_LABELS: Record<string, string> = {
  guilt: "الذنب",
  exhausted: "استنزاف",
  ruminating: "التفكير المتكرر",
  not_enough: "مش كفاية",
  avoidance: "التجنب",
  self_neglect: "إهمال الذات",
  physical_tension: "التوتر الجسدي",
  emotional_manipulation: "التلاعب العاطفي",
  lose_identity: "فقدان الهوية",
  chronic_fatigue: "الإرهاق المزمن",
  sleep_disturbance: "اضطراب النوم",
  inconsistent: "التذبذب",
  walking_eggshells: "المشي على قشر بيض",
  conditional: "القبول المشروط",
  confused: "الحيرة",
  people_pleasing: "إرضاء الآخرين",
  boundaries_unclear: "الحدود غير الواضحة",
  tired_after_contact: "الإرهاق بعد التواصل",
  mild_tension: "التوتر الخفيف",
  sleep_after_contact: "صعوبة النوم بعد التواصل",
  anxiety_before_contact: "القلق قبل التواصل",
  shame: "الحرج أو الخجل",
  over_explaining: "التبرير الزائد",
  appetite_change: "تغيير الشهية",
  responsible_for_mood: "تحمّل مسؤولية مزاجه",
  delay_reply: "تأخير الرد أو تجنب مواضيع",
  hopeless: "الإحساس بالعجز",
  suppressed_anger: "كتم الغضب أو الزعل",
  checking_phone: "متابعة المكالمات بقلق",
  chest_tightness: "ضيق الصدر أو صعوبة التنفس",
  stomach_knot: "انقباض المعدة",
  breath_holding: "انقطاع النفس",
  relief_on_cancel: "الراحة عند الإلغاء",
  rehearsing: "بروفات الكلام",
  self_cancellation: "إلغاء الذات",
  hiding_relationship: "العزل/إخفاء العلاقة",
  worry_reaction: "القلق من رد الفعل",
  cancel_plans: "إلغاء الخطط أو التهرب من اللقاء",
  calm_after: "الهدوء بعد التواصل",
  supported: "الشعور بالدعم",
  anxiety_low_mood: "القلق أو المزاج المنخفض",
  brain_fog: "التشتت أو صعوبة التركيز",
  inner_emptiness: "الفراغ أو البُعد عن الذات",
  financial_strain: "الضغط المالي",
  mood_swings_relation: "تأثر المزاج بالعلاقة",
  tension_head: "صداع أو ثقل الرأس",
  lack_peace: "عدم السلام الداخلي",
  money_unease: "قلق من موضوع الفلوس",
  mental_clarity: "الوضوح والصفاء الذهني",
  inner_peace: "السلام الداخلي",
  financial_comfort: "الراحة المالية والحدود الواضحة",
  no_tension_after: "عدم التوتر أو التشتت بعد التواصل",
  social_withdrawal: "الانسحاب الاجتماعي",
  work_affected: "تأثير على الشغل",
  time_drained: "استنزاف الوقت",
  family_tension: "توتر عائلي",
  values_conflict: "تعارض القيم",
  less_social: "تقليل التواصل مع الآخرين",
  work_boundaries_blur: "اختلاط حدود الشغل",
  time_pressure: "ضغط الوقت",
  family_pressure: "ضغط العائلة",
  values_unsure: "عدم وضوح القيم",
  social_balance: "التوازن الاجتماعي",
  work_life_clear: "حدود الشغل والحياة",
  time_respected: "احترام الوقت",
  family_ok: "سلامة العلاقة مع العائلة",
  values_aligned: "توافق القيم",
};

export function getSymptomLabel(symptomId: string): string {
  return SYMPTOM_SHORT_LABELS[symptomId] ?? symptomId;
}
