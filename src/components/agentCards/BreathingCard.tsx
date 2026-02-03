import type { FC } from "react";
import { Wind } from "lucide-react";

interface BreathingCardProps {
  onStart: () => void;
}

export const BreathingCard: FC<BreathingCardProps> = ({ onStart }) => (
  <div className="mt-2 rounded-xl border border-purple-200 bg-purple-50 p-3 max-w-[85%]">
    <p className="text-sm font-medium text-purple-900 mb-2">تمرين تنفس (دقيقة)</p>
    <p className="text-xs text-purple-700 mb-3">خد نفس هادي وارجع تركّز.</p>
    <button
      type="button"
      onClick={onStart}
      className="flex items-center gap-2 rounded-lg bg-purple-600 text-white px-3 py-2 text-sm font-medium hover:bg-purple-700 transition-colors"
      aria-label="ابدأ تمرين التنفس"
    >
      <Wind className="w-4 h-4" />
      ابدأ
    </button>
  </div>
);
