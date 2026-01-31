import type { FC } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { Ring } from "../modules/map/mapTypes";
import { getSymptomsByRing, type Symptom } from "../data/symptoms";

interface SymptomsChecklistProps {
  ring: Ring;
  personLabel: string;
  selectedSymptoms?: string[];
  onSymptomsChange?: (symptomIds: string[]) => void;
  readOnly?: boolean;
}

export const SymptomsChecklist: FC<SymptomsChecklistProps> = ({
  ring,
  personLabel,
  selectedSymptoms = [],
  onSymptomsChange,
  readOnly = false
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedSymptoms));
  const symptoms = getSymptomsByRing(ring);

  const handleToggle = (symptomId: string) => {
    if (readOnly) return;
    
    const newSelected = new Set(selected);
    if (newSelected.has(symptomId)) {
      newSelected.delete(symptomId);
    } else {
      newSelected.add(symptomId);
    }
    setSelected(newSelected);
    onSymptomsChange?.(Array.from(newSelected));
  };

  const getCategoryEmoji = (category: Symptom['category']) => {
    switch (category) {
      case 'emotional': return '💭';
      case 'physical': return '🫀';
      case 'behavioral': return '🎯';
    }
  };

  const getCategoryLabel = (category: Symptom['category']) => {
    switch (category) {
      case 'emotional': return 'عاطفي';
      case 'physical': return 'جسدي';
      case 'behavioral': return 'سلوكي';
    }
  };

  // Group symptoms by category
  const groupedSymptoms = symptoms.reduce((acc, symptom) => {
    if (!acc[symptom.category]) {
      acc[symptom.category] = [];
    }
    acc[symptom.category].push(symptom);
    return acc;
  }, {} as Record<Symptom['category'], Symptom[]>);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-xl text-right">
        <h3 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
          <span>📋</span> أعراض بتحصل معاك في علاقتك مع {personLabel}؟
        </h3>
        <p className="text-xs text-purple-800">
          اختار كل اللي ينطبق عليك (ده هيساعدنا نصمم خطة أدق ليك)
        </p>
      </div>

      <div className="space-y-4">
        {(Object.keys(groupedSymptoms) as Symptom['category'][]).map((category) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <span>{getCategoryEmoji(category)}</span>
              <span>{getCategoryLabel(category)}</span>
            </div>
            
            <div className="space-y-2">
              {groupedSymptoms[category].map((symptom) => {
                const isSelected = selected.has(symptom.id);
                
                return (
                  <motion.button
                    key={symptom.id}
                    type="button"
                    onClick={() => handleToggle(symptom.id)}
                    disabled={readOnly}
                    className={`w-full p-4 rounded-xl border-2 text-right transition-all duration-200 ${
                      isSelected
                        ? 'bg-teal-50 border-teal-500 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-teal-300 hover:bg-teal-50/50'
                    } ${readOnly ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'}`}
                    whileTap={!readOnly ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-10 h-10 sm:w-6 sm:h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-teal-500 border-teal-500'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-6 h-6 sm:w-4 sm:h-4 text-white" strokeWidth={3} />
                        )}
                      </div>
                      <span
                        className={`text-sm flex-1 ${
                          isSelected ? 'text-teal-900 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {symptom.text}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selected.size > 0 && !readOnly && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border-2 border-green-300 rounded-xl text-center"
        >
          <p className="text-sm font-semibold text-green-900">
            ✓ اخترت {selected.size} عرض - كويس! ده هيساعدنا نفهمك أكتر
          </p>
        </motion.div>
      )}
    </div>
  );
};
