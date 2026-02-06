import type { LucideIcon } from "lucide-react";
import { 
  User, 
  Users, 
  UserCircle, 
  Heart, 
  Briefcase, 
  UserCheck,
  UserX,
  Building2
} from "lucide-react";

export interface SuggestionCard {
  label: string;
  icon: LucideIcon;
}

export const SUGGESTIONS: Record<string, SuggestionCard[]> = {
  family: [
    { label: "أب", icon: User },
    { label: "أم", icon: Heart },
    { label: "أخ", icon: Users },
    { label: "أخت", icon: UserCircle },
    { label: "ابن", icon: UserCheck },
    { label: "ابنة", icon: UserCircle },
    { label: "زوج", icon: Heart },
    { label: "زوجة", icon: Heart },
    { label: "زوجة الأخ", icon: Users },
    { label: "زوج الأخت", icon: Users },
    { label: "قريب", icon: Users }
  ],
  work: [
    { label: "مدير", icon: Briefcase },
    { label: "زميل", icon: Users },
    { label: "عميل", icon: Building2 },
    { label: "مدير سابق", icon: UserX }
  ],
  love: [
    { label: "شريك", icon: Heart },
    { label: "خطيب", icon: Heart },
    { label: "زوج", icon: Heart },
    { label: "إكس", icon: UserX }
  ],
  money: [
    { label: "صديق", icon: Users },
    { label: "جار", icon: UserCheck },
    { label: "معرفة", icon: UserCircle }
  ],
  unknown: [
    { label: "صديق", icon: Users },
    { label: "جار", icon: UserCheck },
    { label: "معرفة", icon: UserCircle }
  ],
  general: [
    { label: "صديق", icon: Users },
    { label: "جار", icon: UserCheck },
    { label: "معرفة", icon: UserCircle }
  ]
};

export const PLACEHOLDERS: Record<string, string> = {
  family: "مثال: ماما / الأب / الأخ الكبير",
  work: "مثال: المدير / الزميل / العميل",
  love: "مثال: الشريك / الخطيب / الإكس",
  money: "مثال: الصديق / الجار",
  unknown: "مثال: الشخص اللي في بالك",
  general: "مثال: الشخص اللي في بالك"
};
