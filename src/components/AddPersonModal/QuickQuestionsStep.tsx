import type { FC } from "react";
import { getOptionButtonClass } from "../../utils/optionColors";
import type { OptionTier } from "../../utils/optionColors";
import { EditableText } from "../EditableText";

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
    <form onSubmit={onContinue} className="text-right h-full min-h-0 flex flex-col">
      <h2 className="text-xl font-extrabold text-slate-100 mb-6 tracking-tight">
        <EditableText id="add_person_quick_title" defaultText={title} page="add_person" />
      </h2>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-5 mb-6">
        <div>
          <p className="text-sm font-semibold text-slate-300 mb-3">
            <EditableText id="add_person_quick_q1" defaultText={question1} page="add_person" showEditIcon={false} />
          </p>
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
          <p className="text-sm font-semibold text-slate-300 mb-3">
            <EditableText id="add_person_quick_q2" defaultText={question2} page="add_person" showEditIcon={false} />
          </p>
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
            <p className="text-sm font-semibold text-slate-300 mb-3">
              <EditableText
                id="add_person_emergency_q"
                defaultText="هل الوضع طوارئ؟ (إيذاء بدني، ابتزاز خطير)"
                page="add_person"
                showEditIcon={false}
              />
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSelectEmergency(false)}
                className={getOptionButtonClass("green", !isEmergency)}
              >
                <EditableText id="add_person_emergency_no" defaultText="لا" page="add_person" editOnClick={false} />
              </button>
              <button
                type="button"
                onClick={() => onSelectEmergency(true)}
                className={getOptionButtonClass("red", isEmergency)}
              >
                <EditableText
                  id="add_person_emergency_yes"
                  defaultText="نعم — طوارئ"
                  page="add_person"
                  editOnClick={false}
                />
              </button>
            </div>
        </div>
      </div>
      <div className="mt-6 shrink-0 flex gap-3">
        <button
          type="button"
          data-variant="ghost"
          data-size="md"
          className="ds-button flex-1"
          onClick={onBack}
        >
          <EditableText id="add_person_quick_back" defaultText="رجوع" page="add_person" editOnClick={false} />
        </button>
        <button
          type="submit"
          data-variant="primary"
          data-size="md"
          disabled={disableSubmit}
          className="ds-button flex-1"
        >
          <EditableText id="add_person_quick_next" defaultText={nextLabel} page="add_person" editOnClick={false} />
        </button>
      </div>
    </form>
  );
};

