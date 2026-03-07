import {
  Briefcase,
  Home,
  Heart,
  Wallet,
  HelpCircle,
  Users,
  UserCircle,
  type LucideIcon
} from "lucide-react";

export type GoalId = "work" | "family" | "friends" | "love" | "money" | "self" | "unknown" | "general";

export interface GoalMeta {
  id: GoalId;
  label: string;
  icon: LucideIcon;
  badgeClasses: string;
  buttonClasses: string;
}

export const GOAL_ORDER: GoalId[] = ["family", "friends", "work", "love", "money", "self", "general", "unknown"];

export const GOAL_META: Record<GoalId, GoalMeta> = {
  family: {
    id: "family",
    label: "اعة",
    icon: Home,
    badgeClasses:
      "border-teal-200 bg-teal-100 text-teal-800 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200",
    buttonClasses: "border-teal-200 hover:border-teal-300 hover:bg-teal-50 text-teal-700"
  },
  friends: {
    id: "friends",
    label: "اأصداء",
    icon: Users,
    badgeClasses:
      "border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
    buttonClasses: "border-violet-200 hover:border-violet-300 hover:bg-violet-50 text-violet-700"
  },
  work: {
    id: "work",
    label: "اشغ",
    icon: Briefcase,
    badgeClasses:
      "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
    buttonClasses: "border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700"
  },
  love: {
    id: "love",
    label: "احب",
    icon: Heart,
    badgeClasses:
      "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
    buttonClasses: "border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-rose-700"
  },
  money: {
    id: "money",
    label: "استب اأا",
    icon: Wallet,
    badgeClasses:
      "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
    buttonClasses: "border-amber-200 hover:border-amber-300 hover:bg-amber-50 text-amber-700"
  },
  self: {
    id: "self",
    label: "خرطة فس",
    icon: UserCircle,
    badgeClasses:
      "border-indigo-200 bg-[var(--soft-teal)]/15 text-indigo-800 dark:border-indigo-700 dark:bg-[var(--soft-teal)]/40 dark:text-indigo-200",
    buttonClasses: "border-indigo-200 hover:border-indigo-300 hover:bg-[var(--soft-teal)]/10 text-indigo-700"
  },
  general: {
    id: "general",
    label: "عا",
    icon: HelpCircle,
    badgeClasses:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
    buttonClasses: "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
  },
  unknown: {
    id: "unknown",
    label: "ش عارف",
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

