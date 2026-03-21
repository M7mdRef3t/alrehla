import type { Ring } from "../modules/map/mapTypes";

/**
 * Suggested Placement Logic
 * يحدد المكان الصحيح المقترح للعلاقة بناءً على:
 * 1. المكان الحالي (current ring)
 * 2. نوع العلاقة (category)
 * 3. الأعراض (symptoms) - اختياري
 */

export interface SuggestedPlacement {
  currentRing: Ring;
  suggestedRing: Ring;
  reason: string;
  steps: string[];
  isHealthy: boolean; // لو العلاقة في مكانها الصحيح
  shockMessage?: string; // رسالة تنبيه لو الفجوة كبيرة
}

/**
 * حساب المكان الصحيح المقترح
 */
export function calculateSuggestedPlacement(
  currentRing: Ring,
  category: string,
  selectedSymptoms?: string[]
): SuggestedPlacement {
  
  // الحالة 1: لو العلاقة في الدائرة الخضراء → صحية!
  if (currentRing === "green") {
    return {
      currentRing,
      suggestedRing: "green",
      reason: "العلاقة دي في مكانها الصحيح! استمر في الحفاظ عليها.",
      steps: [
        "حافظ على التواصل المنتظم",
        "شارك المشاعر الإيجابية",
        "استمر في احترام الحدود المتبادلة",
        "قدّر وجود الشخص ده في حياتك"
      ],
      isHealthy: true
    };
  }

  // الحالة 2: لو العلاقة في الدائرة الصفراء
  if (currentRing === "yellow") {
    const symptomsCount = selectedSymptoms?.length || 0;
    
    // لو عنده أعراض كتيرة (5+) → محتاج حدود أقوى
    if (symptomsCount >= 5) {
      return {
        currentRing,
        suggestedRing: "yellow",
        reason: "العلاقة محتاجة حدود أوضح عشان ما تنزلقش للدائرة الحمراء.",
        steps: [
          "حدد أوقات واضحة للتواصل",
          "تعلم تقول 'لأ' بدون ذنب",
          "راقب الأعراض - لو زادت، المسافة لازم تزيد",
          "اعمل check-in كل أسبوعين"
        ],
        isHealthy: false
      };
    }
    
    // لو عنده أعراض قليلة (1-4) → ممكن يحسنها
    return {
      currentRing,
      suggestedRing: "green",
      reason: "العلاقة ممكن تتحسن وتبقى صحية لو اتعملت تعديلات بسيطة.",
      steps: [
        "وضّح توقعاتك من العلاقة",
        "اتكلم عن اللي بيضايقك بهدوء",
        "اديله فرصة يعدّل سلوكه",
        "لو استجاب، العلاقة ممكن تبقى خضراء"
      ],
      isHealthy: false
    };
  }

  // الحالة 3: لو العلاقة في الدائرة الحمراء (استنزاف/ألم)
  // القاعدة: لو الأعراض عالية → الحماية القصوى (ابقى في الأحمر)، مش نرجع للأصفر
  if (currentRing === "red") {
    const symptomsCount = selectedSymptoms?.length ?? 0;
    const suggestedRing = symptomsCount >= 3 ? "red" : getSuggestedRingForCategory(category);
    
    // Shock factor: لو كان فاكرها خضراء بس هي حمراء (ده بيتحسب في resultScreenAI عادة بس هنا بنأكده)
    let shockMessage;
    if (currentRing === "red" && symptomsCount >= 5) {
      shockMessage = "⚠️ الصدمة دي طبيعية.. جسمك كان شايل فوق طاقته وانكشفت الحقيقة دلوقتي.";
    }

    return {
      currentRing,
      suggestedRing,
      reason: getSuggestedReason(category, suggestedRing),
      steps: getSuggestedSteps(category, suggestedRing),
      isHealthy: suggestedRing === "red" && currentRing === "red", // في مكانه الصحيح = حماية قصوى
      shockMessage
    };
  }

  // Default fallback
  return {
    currentRing,
    suggestedRing: currentRing,
    reason: "استمر في مراقبة العلاقة وتقييمها.",
    steps: ["راجع الحدود بشكل دوري", "اسمع لجسمك وإحساسك"],
    isHealthy: false
  };
}

/**
 * تحديد المكان المقترح بناءً على نوع العلاقة
 */
function getSuggestedRingForCategory(category: string): Ring {
  switch (category) {
    case "mother":
    case "father":
    case "sibling":
      // العائلة: صعب القطع → الأصفر أفضل (مع حدود)
      return "yellow";
    
    case "romantic_partner":
    case "spouse":
      // الشريك الرومانسي: لو في استنزاف → الأصفر أو القطع
      return "yellow";
    
    case "friend":
    case "colleague":
      // الصديق/الزميل: ممكن نبعد → الأصفر أو قطع
      return "yellow";
    
    case "boss":
    case "authority":
      // المدير/السلطة: محتاج حدود مهنية → الأصفر
      return "yellow";
    
    case "ex":
      // الـ ex: الأفضل قطع أو مسافة كبيرة جداً
      return "yellow";
    
    default:
      return "yellow";
  }
}

/**
 * السبب المقترح
 */
function getSuggestedReason(category: string, suggestedRing: Ring): string {
  const isFamilyOrSpouse = ["mother", "father", "sibling", "spouse"].includes(category);
  
  if (suggestedRing === "red") {
    return "الحالة دي **استنزاف وألم** - المكان الصح هو **الحماية القصوى** (دائرة الاستنزاف = حدود صارمة). مش نرجع للأصفر دلوقتي؛ خليك في أبعد نقطة عشان تحمي نفسك.";
  }
  
  if (suggestedRing === "yellow") {
    if (isFamilyOrSpouse) {
      return "العلاقة دي ليها دور في حياتك، بس محتاج **حدود واضحة** عشان ما تستنزفكش. المكان الصحيح: دائرة القرب المشروط (الأصفر) - تواصل محدود + حماية نفسية.";
    }
    return "العلاقة دي محتاجة **مسافة أكبر + حدود واضحة**. المكان الصحيح: دائرة القرب المشروط (الأصفر) - تواصل محدود ومشروط بالاحترام المتبادل.";
  }
  
  if (suggestedRing === "green") {
    return "العلاقة دي ممكن تبقى صحية لو اتعملت تغييرات حقيقية. المكان الصحيح: دائرة القرب الصحي (الأخضر) - بس بشروط واضحة.";
  }
  
  return "العلاقة محتاجة إعادة تقييم وتحديد حدود أوضح.";
}

/**
 * الخطوات المقترحة
 */
function getSuggestedSteps(category: string, suggestedRing: Ring): string[] {
  const isFamilyOrSpouse = ["mother", "father", "sibling", "spouse"].includes(category);
  
  if (suggestedRing === "red") {
    return [
      "قلل التواصل لأقل حد ممكن (مرة كل أسبوعين أو أقل)",
      "مكالمات قصيرة جداً (15 دقيقة max) أو رسائل فقط",
      "ما تلتقيش في أماكن خاصة - أماكن عامة فقط",
      "متشاركش أي حاجة شخصية عن حياتك",
      "لو زاد الاستنزاف، فكّر في القطع التام أو المسافة الكاملة"
    ];
  }
  
  if (suggestedRing === "yellow") {
    if (isFamilyOrSpouse) {
      return [
        "حدد أوقات محددة للتواصل (مثلاً: مكالمة واحدة في الأسبوع، 30 دقيقة)",
        "ما تردش على كل مكالمة/رسالة فوراً - خد وقتك",
        "لو حصل استنزاف في اللقاء، اعتذر بهدوء وانسحب",
        "ما تشاركش كل تفاصيل حياتك - احتفظ بمساحة ليك",
        "خليك حازم على الحدود - التنازل بيخليك ترجع للدائرة الحمراء"
      ];
    }
    
    return [
      "قلل التواصل لأقل حد ممكن (مرة كل أسبوعين أو أقل)",
      "لو محتاج تتواصل، خليها مكالمات قصيرة (15 دقيقة max)",
      "ما تلتقيش في أماكن خاصة - أماكن عامة أفضل",
      "متشاركش أي حاجة شخصية عن حياتك",
      "لو زاد الاستنزاف، ابدأ فكر في القطع التام"
    ];
  }
  
  if (suggestedRing === "green") {
    return [
      "اتكلم بوضوح عن اللي بيضايقك",
      "حدد توقعات واضحة للعلاقة",
      "ادي الشخص فرصة يغير (شهر واحد)",
      "لو التغيير حصل فعلاً، العلاقة ممكن تبقى صحية",
      "لو ما حصلش تغيير، ارجع للدائرة الصفراء"
    ];
  }
  
  return [
    "راجع الحدود بشكل دوري",
    "اسمع لجسمك - هو مش بيكذب",
    "استعين بمعالج نفسي لو محتاج دعم"
  ];
}

/**
 * الحصول على label للمكان المقترح
 */
export function getSuggestedRingLabel(ring: Ring): string {
  switch (ring) {
    case "green":
      return "دائرة القرب الصحي (الأخضر)";
    case "yellow":
      return "دائرة القرب المشروط (الأصفر)";
    case "red":
      return "دائرة الاستنزاف (الأحمر)";
  }
}

/**
 * الحصول على أيقونة للمكان
 */
export function getRingIcon(ring: Ring): string {
  switch (ring) {
    case "green":
      return "✅";
    case "yellow":
      return "⚠️";
    case "red":
      return "🚨";
  }
}

