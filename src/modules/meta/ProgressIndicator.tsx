import type { FC } from "react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export const ProgressIndicator: FC<ProgressIndicatorProps> = ({ 
  currentStep, 
  totalSteps,
  labels 
}) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        
        return (
          <div key={index} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-200 ${
                isCompleted
                  ? "bg-teal-500 text-white"
                  : isActive
                  ? "bg-teal-600 text-white ring-4 ring-teal-100"
                  : "bg-gray-200 text-gray-500"
              }`}
              title={labels?.[index]}
            >
              {isCompleted ? "✓" : stepNumber}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`w-8 h-1 rounded-full transition-all duration-200 ${
                  isCompleted ? "bg-teal-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
