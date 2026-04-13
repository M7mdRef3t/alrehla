/* eslint-disable @typescript-eslint/no-explicit-any */
export type StoreItemType = "theme" | "voice" | "badge" | "feature" | "frost_token" | "border";

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
  },

  // --- ❄️ Tajmeed: Frost Tokens ---
  {
    id: "frost_instant_freeze",
    name: "تجميد فوري",
    nameEn: "Instant Freeze",
    description: "جمّد علاقة مستنزفة بضغطة واحدة من الخريطة — بدون المرور بخطوات الأرشفة.",
    descriptionEn: "One-tap freeze from the map, skip the archive flow.",
    price: 500,
    type: "frost_token",
    icon: "Sparkles",
    metadata: {
      uses: 3,
      effect: "instant_archive"
    }
  },
  {
    id: "frost_mega_freeze",
    name: "العاصفة الجليدية",
    nameEn: "Ice Storm",
    description: "جمّد كل العلاقات الحمراء دفعة واحدة. قرار جذري.",
    descriptionEn: "Freeze all red-ring relationships at once. A sovereign decision.",
    price: 2000,
    type: "frost_token",
    icon: "Sparkles",
    metadata: {
      uses: 1,
      effect: "bulk_archive_red"
    }
  },

  // --- ❄️ Tajmeed: Ice Borders ---
  {
    id: "border_crystal",
    name: "إطار كريستالي",
    nameEn: "Crystal Frame",
    description: "إطار بصري كريستالي يظهر على العقد المجمدة في الخريطة.",
    descriptionEn: "A crystal visual effect that renders on frozen map nodes.",
    price: 800,
    type: "border",
    icon: "Sparkles",
    metadata: {
      borderStyle: "crystal_glow",
      animation: "shimmer"
    }
  },
  {
    id: "border_aurora",
    name: "إطار الشفق القطبي",
    nameEn: "Aurora Borealis",
    description: "تأثير شفق قطبي متحرك حول العقد المجمدة.",
    descriptionEn: "Animated aurora borealis effect around frozen nodes.",
    price: 1200,
    type: "border",
    icon: "Moon",
    metadata: {
      borderStyle: "aurora_ring",
      animation: "wave"
    }
  },

  // --- New AI Voice ---
  {
    id: "voice_siberian",
    name: "المرشد السيبيري",
    nameEn: "The Siberian Guide",
    description: "شخصية هادئة وحازمة، تركز على التجميد الواعي وحماية الطاقة.",
    descriptionEn: "Calm yet firm. Focused on conscious freezing and energy protection.",
    price: 2000,
    type: "voice",
    icon: "Shield",
    metadata: {
      tone: "strategic",
      speed: 0.95
    }
  }
];
