import { DawayirPlayground } from "@/modules/social/DawayirPlayground";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "الدوائر | ذكاء العلاقات",
  description: "اكتشف الأنماط الخفية في علاقاتك الاجتماعية. من يستنزفك ومن يمنحك القوة؟",
};

export default function DawayirPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <DawayirPlayground />
    </div>
  );
}
