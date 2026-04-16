import { create } from "zustand";

export interface TravelLantern {
  id: string;
  topic: string; // The stagnation node/area
  message: string;
  timeElapsed: string; // The emotional string "Since..."
  intensity: number; // Visual brightness multiplier
  positionX: number; // 0-100 percentage for viewport layout
  positionY: number; // 0-100 percentage for viewport layout
}

interface LanternsState {
  availableLanterns: TravelLantern[];
  activeLanternId: string | null;
  hasInteractedWithCurrentSwarm: boolean;
  spawnLanternsForTopic: (topic: string) => void;
  clearLanterns: () => void;
  openLantern: (id: string) => void;
  dismissLantern: () => void;
}

const LANTERNS_DB: TravelLantern[] = [
  {
    id: "l-withdrawal",
    topic: "relationship-withdrawal",
    message: "إلى من يقف الآن حيث وقفتُ أنا قل عامين...\nالانسحاب ليس حماية، بل هو سجن تصنعه بيدك. ابدأ بكلمة واحدة تتحدث فيها عن مخاوفك، وسوف ينهار الجدار.",
    timeElapsed: "من مسافر عبر هذه المحطة منذ عامين وتسعة أشهر",
    intensity: 0.9,
    positionX: 40,
    positionY: 60
  },
  {
    id: "l-spiritual",
    topic: "spiritual-dryness",
    message: "لا تقيس القبول بحرارة القلب دائمًا.\n الثبات في أوقات الجفاف والجفاء أصعب وأعظم عند الله من أيام الحماس واللذة. لا تتوقف، استمر وإن كان قلبك لا يشعر.",
    timeElapsed: "من مسافر عبر هذه المحطة منذ ١٤٠ يومًا",
    intensity: 1.0,
    positionX: 55,
    positionY: 35
  },
  {
    id: "l-career",
    topic: "career-doubt",
    message: "أنا الآن في الضفة الأخرى. ما يبدو لك كنهاية الطريق اليوم، هو مجرد تغيير في مسار الريح. لا تخف من البدء من جديد، خبرتك السابقة ستكون البوصلة.",
    timeElapsed: "من مسافر عبر هذه المحطة منذ ٣ سنوات",
    intensity: 0.8,
    positionX: 25,
    positionY: 20
  },
  {
    id: "l-burnout",
    topic: "burnout",
    message: "أعرف جسدك المنهك وروحك التي ترفض الراحة خوفاً من التوقف. الراحة ليست تهمة، إنها الصيانة التي تضمن للقلب ألا يتوقف تماماً. خذ إجازة اليوم بدون ذنب.",
    timeElapsed: "من مسافر عبر هذه المحطة قبل ١٢ يومًا فقط",
    intensity: 0.95,
    positionX: 65,
    positionY: 50
  }
];

export const useLanternsState = create<LanternsState>()((set) => ({
  availableLanterns: [],
  activeLanternId: null,
  hasInteractedWithCurrentSwarm: false,
  
  spawnLanternsForTopic: (topic) => {
    const matched = LANTERNS_DB.filter(l => l.topic === topic);
    set({ 
      availableLanterns: matched, 
      activeLanternId: null, 
      hasInteractedWithCurrentSwarm: false 
    });
  },

  clearLanterns: () => {
    set({ availableLanterns: [], activeLanternId: null });
  },

  openLantern: (id) => {
    set({ activeLanternId: id, hasInteractedWithCurrentSwarm: true });
  },

  dismissLantern: () => {
    set({ activeLanternId: null });
  }
}));
