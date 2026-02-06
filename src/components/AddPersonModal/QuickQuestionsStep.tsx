import type { FC } from "react";
import { getOptionButtonClass } from "../../utils/optionColors";
import type { OptionTier } from "../../utils/optionColors";

interface OptionItem {
  value: string;
  label: string;
}

interface QuickQuestionsStepProps {
  title: string;
  question1: string;
  options1: OptionItem[];
  question2: string;
  options2: OptionItem[];
  quickAnswer1: string | null;
  quickAnswer2: string | null;
  isEmergency: boolean;
  onSelectQuick1: (value: string) => void;
  onSelectQuick2: (value: string) => void;
  onSelectEmergency: (value: boolean) => void;
  onBack: () => void;
  onContinue: (e: React.FormEvent) => void;
  disableSubmit: boolean;
  getTier1: (value: string) => OptionTier;
  getTier2: (value: string) => OptionTier;
  nextLabel: string;
}

export const QuickQuestionsStep: FC<QuickQuestionsStepProps> = ({
  title,
  question1,
  options1,
  question2,
  options2,
  quickAnswer1,
  quickAnswer2,
  isEmergency,
  onSelectQuick1,
  onSelectQuick2,
  onSelectEmergency,
  onBack,
  onContinue,
  disableSubmit,
  getTier1,
  getTier2,
  nextLabel
}) => {
  return (
    <form onSubmit={onContinue} className="text-right">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{title}</h2>
      <div className="space-y-5 mb-6">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">{question1}</p>
          <div className="flex flex-wrap gap-2">
            {options1.map((opt) => {
              const tier = getTier1(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectQuick1(opt.value)}
                  className={getOptionButtonClass(tier, quickAnswer1 === opt.value)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">{question2}</p>
          <div className="flex flex-wrap gap-2">
            {options2.map((opt) => {
              const tier = getTier2(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectQuick2(opt.value)}
                  className={getOptionButtonClass(tier, quickAnswer2 === opt.value)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">هل الوضع طوارئ؟ (إيذاء بدني، ابتزاز خطير)</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectEmergency(false)}
              className={getOptionButtonClass("green", !isEmergency)}
            >
              لا
            </button>
            <button
              type="button"
              onClick={() => onSelectEmergency(true)}
              className={getOptionButtonClass("red", isEmergency)}
            >
              نعم — طوارئ
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          className="flex-1 rounded-full bg-gray-100 px-6 py-3 text-sm text-gray-700 font-medium hover:bg-gray-200"
          onClick={onBack}
        >
          رجوع
        </button>
        <button
          type="submit"
          disabled={disableSubmit}
          className="flex-1 rounded-full bg-teal-600 text-white px-6 py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {nextLabel}
        </button>
      </div>
    </form>
  );
};
