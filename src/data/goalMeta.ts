import {
  Briefcase,
  Home,
  Heart,
  Wallet,
  HelpCircle,
  type LucideIcon
} from "lucide-react";

export type GoalId = "work" | "family" | "love" | "money" | "unknown" | "general";

export interface GoalMeta {
  id: GoalId;
  label: string;
  icon: LucideIcon;
  badgeClasses: string;
  buttonClasses: string;
}

export const GOAL_ORDER: GoalId[] = ["family", "work", "love", "money", "general", "unknown"];

export const GOAL_META: Record<GoalId, GoalMeta> = {
  family: {
    id: "family",
    label: "العيلة",
    icon: Home,
    badgeClasses:
      "border-teal-200 bg-teal-100 text-teal-800 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200",
    buttonClasses: "border-teal-200 hover:border-teal-300 hover:bg-teal-50 text-teal-700"
  },
  work: {
    id: "work",
    label: "الشغل",
    icon: Briefcase,
    badgeClasses:
      "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
    buttonClasses: "border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700"
  },
  love: {
    id: "love",
    label: "الحب",
    icon: Heart,
    badgeClasses:
      "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
    buttonClasses: "border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-rose-700"
  },
  money: {
    id: "money",
    label: "الفلوس",
    icon: Wallet,
    badgeClasses:
      "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
    buttonClasses: "border-amber-200 hover:border-amber-300 hover:bg-amber-50 text-amber-700"
  },
  general: {
    id: "general",
    label: "عام",
    icon: HelpCircle,
    badgeClasses:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
    buttonClasses: "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
  },
  unknown: {
    id: "unknown",
    label: "مش عارف",
    icon: HelpCircle,
    badgeClasses:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
    buttonClasses: "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
  }
};

export function getGoalMeta(goalId?: string | null): GoalMeta | null {
  if (!goalId) return null;
  const normalized = goalId as GoalId;
  return GOAL_META[normalized] ?? null;
}

export function getGoalOrderIndex(goalId?: string | null): number {
  if (!goalId) return GOAL_ORDER.length;
  const idx = GOAL_ORDER.indexOf(goalId as GoalId);
  return idx === -1 ? GOAL_ORDER.length : idx;
}
