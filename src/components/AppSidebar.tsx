import type { FC } from "react";
import { Target, ArrowLeft, ClipboardList, PanelRightOpen } from "lucide-react";
import { useJourneyState } from "../state/journeyState";

interface AppSidebarProps {
  onOpenGym: () => void;
  onStartJourney: () => void;
  onOpenBaseline: () => void;
}

export const AppSidebar: FC<AppSidebarProps> = ({
  onOpenGym,
  onStartJourney,
  onOpenBaseline
}) => {
  const isFirstTime = useJourneyState((s) => s.baselineCompletedAt == null);

  return (
    <div
      className="fixed top-0 right-0 z-40 h-full flex flex-row-reverse group/sidebar"
      aria-label="القائمة الرئيسية"
    >
      {/* المحتوى — يظهر عند تحريك الماوس على التاب أو الشريط */}
      <aside
        className="h-full bg-white border-l border-slate-200 shadow-lg flex flex-col gap-2 py-6 px-3 overflow-hidden transition-[width] duration-200 ease-out w-0 group-hover/sidebar:w-52 min-w-0"
      >
        {isFirstTime && (
          <button
            type="button"
            onClick={onOpenGym}
            className="w-full flex items-center gap-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 text-sm font-semibold hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-all text-right shrink-0 whitespace-nowrap"
            title="تدرب على سيناريوهات حقيقية قبل ما تبدأ"
          >
            <Target className="w-5 h-5 shrink-0" />
            جرب نفسك الأول
          </button>
        )}
        <button
          type="button"
          onClick={onStartJourney}
          className="w-full flex items-center gap-3 rounded-xl bg-teal-600 text-white px-4 py-3 text-sm font-semibold hover:bg-teal-700 transition-all text-right shrink-0 whitespace-nowrap"
          title="قائمة الأهداف"
        >
          <ArrowLeft className="w-5 h-5 shrink-0" />
          أبدأ رحلتك
        </button>
        <button
          type="button"
          onClick={onOpenBaseline}
          className="w-full flex items-center gap-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 text-sm font-semibold hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-all text-right shrink-0 whitespace-nowrap"
          title="القياس الأولي"
        >
          <ClipboardList className="w-5 h-5 shrink-0" />
          القياس
        </button>
      </aside>
      {/* تاب صغير ظاهر دايماً — تحريك الماوس عليه يفتح الشريط */}
      <div
        className="h-full w-10 shrink-0 flex flex-col justify-center items-center bg-teal-600 text-white border-l border-teal-700 shadow-md cursor-default py-4"
        title="افتح القائمة"
      >
        <PanelRightOpen className="w-5 h-5" />
      </div>
    </div>
  );
};
