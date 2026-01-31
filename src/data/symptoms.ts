import type { Ring } from "../modules/map/mapTypes";

export interface Symptom {
  id: string;
  text: string;
  category: "emotional" | "physical" | "behavioral";
}

export const symptomsDatabase: Record<Ring, Symptom[]> = {
  red: [
    { 
      id: "guilt", 
      text: "بتحس بالذنب لما تقول 'لأ'", 
      category: "emotional" 
    },
    { 
      id: "exhausted", 
      text: "بترجع من اللقاء منهك نفسياً", 
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
    }
  ]
};

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
  inconsistent: "التذبذب",
  walking_eggshells: "المشي على قشر بيض",
  conditional: "القبول المشروط",
  confused: "الحيرة",
  people_pleasing: "إرضاء الآخرين",
  boundaries_unclear: "الحدود غير الواضحة",
};

export function getSymptomLabel(symptomId: string): string {
  return SYMPTOM_SHORT_LABELS[symptomId] ?? symptomId;
}
