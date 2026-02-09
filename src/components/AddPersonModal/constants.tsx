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
    { label: "الأب", icon: User },
    { label: "الأم", icon: Heart },
    { label: "الأخ", icon: Users },
    { label: "الأخت", icon: UserCircle },
    { label: "الابن", icon: UserCheck },
    { label: "الابنة", icon: UserCircle },
    { label: "الزوج", icon: Heart },
    { label: "الزوجة", icon: Heart },
    { label: "الجد", icon: User },
    { label: "الجدة", icon: Heart },
    { label: "العم", icon: Users },
    { label: "الخال", icon: Users }
  ],
  work: [
    { label: "المدير", icon: Briefcase },
    { label: "الزميل", icon: Users },
    { label: "العميل", icon: Building2 },
    { label: "الموظف", icon: User },
    { label: "الرئيس السابق", icon: UserX }
  ],
  love: [
    { label: "الشريك", icon: Heart },
    { label: "الحبيب", icon: Heart },
    { label: "الخطيب", icon: Heart },
    { label: "الزوج", icon: Heart },
    { label: "الإكس", icon: UserX }
  ],
  money: [
    { label: "الصديق", icon: Users },
    { label: "الشريك التجاري", icon: Briefcase },
    { label: "الجار", icon: UserCheck },
    { label: "المقرض", icon: Building2 }
  ],
  unknown: [
    { label: "الصديق", icon: Users },
    { label: "المعرفة", icon: UserCircle },
    { label: "الجار", icon: UserCheck },
    { label: "الزميل", icon: Users }
  ],
  general: [
    { label: "الصديق", icon: Users },
    { label: "المعرفة", icon: UserCircle },
    { label: "الجار", icon: UserCheck },
    { label: "الزميل", icon: Users }
  ]
};

export const PLACEHOLDERS: Record<string, string> = {
  family: "مثلاً: ماما، الأب، الأخ الكبير",
  work: "مثلاً: المدير، الزميل",
  love: "مثلاً: الشريك، الخطيب",
  money: "مثلاً: الشريك التجاري",
  unknown: "مثلاً: الشخص اللي في بالك",
  general: "مثلاً: الشخص اللي في بالك"
};
