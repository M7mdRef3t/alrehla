export interface WeeklyStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface WeekPlan {
  week: number;
  title: string;
  description: string;
  steps: WeeklyStep[];
}

export interface RecoveryPlan {
  ring: "green" | "yellow" | "red";
  duration: number; // days
  weeks: WeekPlan[];
}

export interface ScriptCategory {
  situation: string;
  dontSay: string;
  doSay: string;
  explanation?: string;
}

export interface SituationLog {
  id: string;
  date: number;
  situation: string;
  feeling: string;
  response: string;
  outcome: string;
  lesson: string;
}

export interface ProgressState {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  milestones: {
    started: boolean;
    firstBoundary: boolean;
    feelingBetter: boolean;
    healthyRelation: boolean;
    completed: boolean;
  };
}
