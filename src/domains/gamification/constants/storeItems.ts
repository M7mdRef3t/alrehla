export type StoreItemType = "theme" | "voice" | "badge" | "feature";

export interface StoreItem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: number;
  type: StoreItemType;
  icon: string;
  metadata?: Record<string, any>;
}

export const STORE_ITEMS: StoreItem[] = [
  // --- Themes ---
  {
    id: "theme_nocturnal",
    name: "السِيادة الليلية",
    nameEn: "Nocturnal Sovereign",
    description: "مظهر داكن مع توهج أرجواني عميق وتأثيرات بصرية نابضة.",
    descriptionEn: "Deep dark mode with neon purple accents and living flows.",
    price: 1000,
    type: "theme",
    icon: "Moon",
    metadata: {
      primaryColor: "#818cf8",
      glowColor: "rgba(129, 140, 248, 0.2)"
    }
  },
  {
    id: "theme_solar",
    name: "الوعي الشمسي",
    nameEn: "Solar Awareness",
    description: "واجهة فاتحة نقية تعتمد على الزجاج الشفاف والتدرجات السماوية.",
    descriptionEn: "Purity light mode based on clear glass and sky gradients.",
    price: 1000,
    type: "theme",
    icon: "Sun",
    metadata: {
      primaryColor: "#2dd4bf",
      glowColor: "rgba(45, 212, 191, 0.1)"
    }
  },
  {
    id: "theme_binary",
    name: "الفراغ الرقمي",
    nameEn: "Binary Void",
    description: "مظهر مينيمالست مستوحى من المصفوفة الرقمية باللونين الأخضر والأسود.",
    descriptionEn: "Minimalist matrix-inspired aesthetic in green and deep black.",
    price: 1500,
    type: "theme",
    icon: "Cpu",
    metadata: {
      primaryColor: "#10b981",
      glowColor: "rgba(16, 185, 129, 0.15)"
    }
  },

  // --- AI Voices / Personalities ---
  {
    id: "voice_maraya",
    name: "مرآة الروح",
    nameEn: "Maraya Mirror",
    description: "شخصية فلسفية عميقة، تحلل الجوانب الروحية والنفسية خلف الأرقام.",
    descriptionEn: "Deep philosophical persona, analyzing spiritual and psychological depths.",
    price: 2500,
    type: "voice",
    icon: "Sparkles",
    metadata: {
       tone: "philosophical",
       speed: 0.9
    }
  },
  {
    id: "voice_general",
    name: "القائد الحازم",
    nameEn: "The General",
    description: "نبرة عسكرية منضبطة، تركز على التنفيذ الصارم والمبادئ الأولى فقط.",
    descriptionEn: "Disciplined military tone, focusing on strict execution and first principles.",
    price: 3000,
    type: "voice",
    icon: "Shield",
    metadata: {
       tone: "military",
       speed: 1.1
    }
  }
];
