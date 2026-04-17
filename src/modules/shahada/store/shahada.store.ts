/**
 * شهادة — Shahada Store
 *
 * Journey Certificates: visual shareable badges after milestones.
 * Auto-unlocked based on user activity across the ecosystem.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type CertificateId =
  | "first-step"       // الخطوة الأولى
  | "7-days"           // مسافر 7 أيام
  | "30-days"          // مسافر 30 يوم
  | "tazkiya-master"   // سيد التزكية
  | "bridge-builder"   // بانِ الجسور
  | "bottle-sender"    // رسّال البحر
  | "khalwa-seeker"    // طالب الخلوة
  | "seed-planter"     // غارس البذور
  | "pledge-keeper"    // حافظ العهد
  | "deep-listener"    // مستمع عميق
  | "full-circle"      // الدائرة الكاملة
  | "explorer";        // المستكشف

export type CertificateTier = "bronze" | "silver" | "gold" | "legendary";

export interface Certificate {
  id: CertificateId;
  title: string;
  subtitle: string;
  emoji: string;
  tier: CertificateTier;
  color: string;
  bgGradient: string;
  requirement: string;
  unlockedAt?: number;
  isUnlocked: boolean;
}

export interface ShahadaState {
  certificates: Certificate[];
  userName: string;

  // Actions
  setUserName: (name: string) => void;
  unlockCertificate: (id: CertificateId) => void;
  checkAndUnlock: (stats: EcosystemStats) => CertificateId[];

  // Getters
  getUnlocked: () => Certificate[];
  getLocked: () => Certificate[];
  getLatest: () => Certificate | undefined;
  getProgress: () => number;
}

export interface EcosystemStats {
  daysActive: number;
  tazkiyaCycles: number;
  bridgesBuilt: number;
  bottlesSent: number;
  khalwaMinutes: number;
  seedsPlanted: number;
  pledgesKept: number;
  messagesReceived: number;
  productsExplored: number;
  totalActions: number;
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const TIER_META: Record<CertificateTier, { label: string; color: string; glow: string }> = {
  bronze:    { label: "برونزية", color: "#cd7f32", glow: "rgba(205,127,50,0.3)" },
  silver:    { label: "فضية",   color: "#c0c0c0", glow: "rgba(192,192,192,0.3)" },
  gold:      { label: "ذهبية",  color: "#ffd700", glow: "rgba(255,215,0,0.3)" },
  legendary: { label: "أسطورية", color: "#e879f9", glow: "rgba(232,121,249,0.4)" },
};

const DEFAULT_CERTIFICATES: Certificate[] = [
  {
    id: "first-step",
    title: "الخطوة الأولى",
    subtitle: "بدأت رحلتك مع الرحلة",
    emoji: "👣",
    tier: "bronze",
    color: "#cd7f32",
    bgGradient: "linear-gradient(135deg, #451a03, #78350f, #451a03)",
    requirement: "سجّل دخولك الأول",
    isUnlocked: false,
  },
  {
    id: "7-days",
    title: "مسافر أسبوع",
    subtitle: "7 أيام متتالية في الرحلة",
    emoji: "🌟",
    tier: "silver",
    color: "#c0c0c0",
    bgGradient: "linear-gradient(135deg, #1e293b, #334155, #1e293b)",
    requirement: "7 أيام نشاط",
    isUnlocked: false,
  },
  {
    id: "30-days",
    title: "مسافر شهر",
    subtitle: "30 يوم — أنت ملتزم حقاً",
    emoji: "🏅",
    tier: "gold",
    color: "#ffd700",
    bgGradient: "linear-gradient(135deg, #422006, #713f12, #422006)",
    requirement: "30 يوم نشاط",
    isUnlocked: false,
  },
  {
    id: "tazkiya-master",
    title: "سيّد التزكية",
    subtitle: "أكملت 10 دورات تطهير",
    emoji: "🕊️",
    tier: "silver",
    color: "#a78bfa",
    bgGradient: "linear-gradient(135deg, #1e1b4b, #312e81, #1e1b4b)",
    requirement: "10 دورات تزكية",
    isUnlocked: false,
  },
  {
    id: "bridge-builder",
    title: "بانِ الجسور",
    subtitle: "بنيت 5 جسور إصلاح",
    emoji: "🌉",
    tier: "silver",
    color: "#10b981",
    bgGradient: "linear-gradient(135deg, #022c22, #064e3b, #022c22)",
    requirement: "5 جسور",
    isUnlocked: false,
  },
  {
    id: "bottle-sender",
    title: "رسّال البحر",
    subtitle: "أرسلت 10 زجاجات",
    emoji: "🍾",
    tier: "bronze",
    color: "#06b6d4",
    bgGradient: "linear-gradient(135deg, #083344, #155e75, #083344)",
    requirement: "10 زجاجات بحر",
    isUnlocked: false,
  },
  {
    id: "khalwa-seeker",
    title: "طالب الخلوة",
    subtitle: "60 دقيقة خلوة إجمالية",
    emoji: "🧘",
    tier: "silver",
    color: "#8b5cf6",
    bgGradient: "linear-gradient(135deg, #2e1065, #4c1d95, #2e1065)",
    requirement: "60 دقيقة خلوة",
    isUnlocked: false,
  },
  {
    id: "seed-planter",
    title: "غارس البذور",
    subtitle: "زرعت 10 بذور عادات",
    emoji: "🌱",
    tier: "bronze",
    color: "#10b981",
    bgGradient: "linear-gradient(135deg, #022c22, #065f46, #022c22)",
    requirement: "10 بذور",
    isUnlocked: false,
  },
  {
    id: "pledge-keeper",
    title: "حافظ العهد",
    subtitle: "أكملت 3 عقود مع النفس",
    emoji: "🤝",
    tier: "gold",
    color: "#fbbf24",
    bgGradient: "linear-gradient(135deg, #422006, #78350f, #422006)",
    requirement: "3 عقود مكتملة",
    isUnlocked: false,
  },
  {
    id: "deep-listener",
    title: "مستمع عميق",
    subtitle: "استقبلت 20 رسالة من مسافرين",
    emoji: "👂",
    tier: "bronze",
    color: "#ec4899",
    bgGradient: "linear-gradient(135deg, #500724, #831843, #500724)",
    requirement: "20 رسالة مستقبلة",
    isUnlocked: false,
  },
  {
    id: "full-circle",
    title: "الدائرة الكاملة",
    subtitle: "استخدمت 10 أدوات مختلفة",
    emoji: "⭕",
    tier: "gold",
    color: "#6366f1",
    bgGradient: "linear-gradient(135deg, #1e1b4b, #3730a3, #1e1b4b)",
    requirement: "10 منتجات مختلفة",
    isUnlocked: false,
  },
  {
    id: "explorer",
    title: "المستكشف",
    subtitle: "100 إجراء في المنظومة",
    emoji: "🧭",
    tier: "legendary",
    color: "#e879f9",
    bgGradient: "linear-gradient(135deg, #4a044e, #86198f, #4a044e)",
    requirement: "100 إجراء",
    isUnlocked: false,
  },
];

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

export const useShahadaState = create<ShahadaState>()(
  persist(
    (set, get) => ({
      certificates: DEFAULT_CERTIFICATES,
      userName: "",

      setUserName: (name) => set({ userName: name }),

      unlockCertificate: (id) => {
        set((s) => ({
          certificates: s.certificates.map((c) =>
            c.id === id && !c.isUnlocked
              ? { ...c, isUnlocked: true, unlockedAt: Date.now() }
              : c
          ),
        }));
      },

      checkAndUnlock: (stats) => {
        const unlocked: CertificateId[] = [];
        const certs = get().certificates;
        const unlock = get().unlockCertificate;

        const check = (id: CertificateId, condition: boolean) => {
          const cert = certs.find((c) => c.id === id);
          if (cert && !cert.isUnlocked && condition) {
            unlock(id);
            unlocked.push(id);
          }
        };

        check("first-step", stats.totalActions >= 1);
        check("7-days", stats.daysActive >= 7);
        check("30-days", stats.daysActive >= 30);
        check("tazkiya-master", stats.tazkiyaCycles >= 10);
        check("bridge-builder", stats.bridgesBuilt >= 5);
        check("bottle-sender", stats.bottlesSent >= 10);
        check("khalwa-seeker", stats.khalwaMinutes >= 60);
        check("seed-planter", stats.seedsPlanted >= 10);
        check("pledge-keeper", stats.pledgesKept >= 3);
        check("deep-listener", stats.messagesReceived >= 20);
        check("full-circle", stats.productsExplored >= 10);
        check("explorer", stats.totalActions >= 100);

        return unlocked;
      },

      // Getters
      getUnlocked: () => get().certificates.filter((c) => c.isUnlocked),
      getLocked: () => get().certificates.filter((c) => !c.isUnlocked),
      getLatest: () => {
        const unlocked = get().certificates
          .filter((c) => c.isUnlocked && c.unlockedAt)
          .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0));
        return unlocked[0];
      },
      getProgress: () => {
        const certs = get().certificates;
        const unlocked = certs.filter((c) => c.isUnlocked).length;
        return Math.round((unlocked / certs.length) * 100);
      },
    }),
    { name: "alrehla-shahada" }
  )
);
