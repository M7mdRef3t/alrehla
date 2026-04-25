import type { FeelingAnswers } from '@/modules/exploration/FeelingCheck';
import type { RealityAnswers } from '@/modules/exploration/RealityCheck';
import type { QuickAnswer2 } from "./suggestInitialRing";
import type { PersonGender } from "./resultScreenAI";
import {
  RESULT_SCREEN_SCENARIOS,
  RESULT_SCREEN_SECTION_TITLES,
  RESULT_SCREEN_RULES,
  type ResultScoreLevel,
  type ResultScenarioKey
} from "@/data/resultScreenTemplates";
export type { ResultScenarioKey };
import { getScoringThresholds, getScoringWeights } from "@/domains/admin/store/admin.store";
import type { AdviceCategory } from "@/data/adviceScripts";

type ScoreLevel = ResultScoreLevel;

export interface ResultTemplate {
  scenarioKey: ResultScenarioKey;
  title: string;
  state_label: string;
  goal_label: string;
  promise_label: string;
  promise_body: string;
  mission_label: string;
  mission_goal: string;
  requirements: Array<{ title: string; detail: string }>;
  steps: string[];
  obstacles: Array<{ title: string; solution: string }>;
  understanding_title: string;
  understanding_body: string;
  explanation_title: string;
  explanation_body: string;
  suggested_zone_title: string;
  suggested_zone_label: string;
  suggested_zone_body: string;
  commandScore: number; // 0-100%
}

export interface ResultTemplateInput {
  score: number;
  feelingAnswers?: FeelingAnswers;
  realityAnswers?: RealityAnswers;
  isEmergency?: boolean;
  safetyAnswer?: QuickAnswer2;
  personGender?: PersonGender;
  category?: AdviceCategory;
}

interface ResultRuleContext {
  emergency: boolean;
  symptomLevel: ScoreLevel;
  contactLevel: ScoreLevel;
  safetyHigh: boolean;
}

function answerPoints(answer: "often" | "sometimes" | "rarely" | "never"): number {
  const weights = getScoringWeights();
  if (answer === "often") return weights.often;
  if (answer === "sometimes") return weights.sometimes;
  if (answer === "rarely") return weights.rarely;
  return weights.never;
}

function scoreLevel(score: number): ScoreLevel {
  const thresholds = getScoringThresholds();
  if (score > thresholds.mediumMax) return "high";
  if (score > thresholds.lowMax) return "medium";
  return "low";
}

function genderedText(
  gender: PersonGender | undefined,
  male: string,
  female: string,
  neutral: string
): string {
  if (gender === "male") return male;
  if (gender === "female") return female;
  return neutral;
}

function applyTokens(text: string, tokens: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => tokens[key] ?? "");
}

function buildTokens(gender?: PersonGender): Record<string, string> {
  return {
    presence: genderedText(gender, "وجوده", "وجودها", "وجود الشخص ده"),
    subjectPresenceInDay: genderedText(
      gender,
      "هو موجود بكثافة في يومك",
      "هي موجودة بكثافة في يومك",
      "الشخص ده موجود بكثافة في يومك"
    ),
    withPerson: genderedText(gender, "معاه", "معاها", "مع الشخص ده"),
    fadingEffect: genderedText(
      gender,
      "هو مبقاش مؤثر",
      "هي مبقتش مؤثرة",
      "الشخص ده مبقاش مؤثر"
    ),
    threatFrom: genderedText(gender, "منه", "منها", "من الشخص ده"),
    contactVoice: genderedText(gender, "صوته", "صوتها", "الصوت"),
    calls: genderedText(gender, "مكالماته", "مكالماتها", "المكالمات")
  };
}

function buildResultTemplate(scenario: ResultScenarioKey, gender?: PersonGender): ResultTemplate {
  const copy = RESULT_SCREEN_SCENARIOS[scenario];
  const tokens = buildTokens(gender);

  return {
    scenarioKey: scenario,
    title: applyTokens(copy.title, tokens),
    state_label: applyTokens(copy.state_label, tokens),
    goal_label: applyTokens(copy.goal_label, tokens),
    promise_label: applyTokens(copy.promise_label, tokens),
    promise_body: applyTokens(copy.promise_body, tokens),
    mission_label: applyTokens(copy.mission_label, tokens),
    mission_goal: applyTokens(copy.mission_goal, tokens),
    requirements: copy.requirements.map((item) => ({
      title: applyTokens(item.title, tokens),
      detail: applyTokens(item.detail, tokens)
    })),
    steps: copy.steps.map((step) => applyTokens(step, tokens)),
    obstacles: copy.obstacles.map((item) => ({
      title: applyTokens(item.title, tokens),
      solution: applyTokens(item.solution, tokens)
    })),
    understanding_title: RESULT_SCREEN_SECTION_TITLES.understanding_title,
    understanding_body: applyTokens(copy.understanding_body, tokens),
    explanation_title: RESULT_SCREEN_SECTION_TITLES.explanation_title,
    explanation_body: applyTokens(copy.explanation_body, tokens),
    suggested_zone_title: RESULT_SCREEN_SECTION_TITLES.suggested_zone_title,
    suggested_zone_label: applyTokens(copy.suggested_zone_label, tokens),
    suggested_zone_body: applyTokens(copy.suggested_zone_body, tokens),
    commandScore: 0 // Placeholder, will be overriden
  };
}

function matchesLevel(
  value: ScoreLevel,
  expected?: ScoreLevel | ScoreLevel[]
): boolean {
  if (!expected) return true;
  if (Array.isArray(expected)) return expected.includes(value);
  return value === expected;
}

function matchesRule(rule: typeof RESULT_SCREEN_RULES[number], ctx: ResultRuleContext): boolean {
  const { when } = rule;
  if (when.emergency !== undefined && when.emergency !== ctx.emergency) return false;
  if (!matchesLevel(ctx.symptomLevel, when.symptomLevel)) return false;
  if (!matchesLevel(ctx.contactLevel, when.contactLevel)) return false;
  if (when.safetyHigh !== undefined && when.safetyHigh !== ctx.safetyHigh) return false;
  return true;
}

export function buildResultTemplateFromAnswers(input: ResultTemplateInput): ResultTemplate {
  const symptomScore = input.feelingAnswers
    ? answerPoints(input.feelingAnswers.q1) +
      answerPoints(input.feelingAnswers.q2) +
      answerPoints(input.feelingAnswers.q3)
    : input.score;
  const contactScore = input.realityAnswers
    ? answerPoints(input.realityAnswers.q1) +
      answerPoints(input.realityAnswers.q2) +
      answerPoints(input.realityAnswers.q3)
    : 0;
  let symptomLevel = scoreLevel(symptomScore);
  if (input.feelingAnswers?.q3 === "often") symptomLevel = "high";
  const contactLevel = scoreLevel(contactScore);
  const safetyHigh = input.safetyAnswer === "high";

  const context: ResultRuleContext = {
    emergency: Boolean(input.isEmergency),
    symptomLevel,
    contactLevel,
    safetyHigh
  };

  const fallbackScenario = RESULT_SCREEN_RULES[RESULT_SCREEN_RULES.length - 1]?.scenario
    ?? (Object.keys(RESULT_SCREEN_SCENARIOS)[0] as ResultScenarioKey);
  const matchedScenario =
    RESULT_SCREEN_RULES.find((rule) => matchesRule(rule, context))?.scenario
    ?? fallbackScenario;

  const template = buildResultTemplate(matchedScenario, input.personGender);
  
  // Calculate Command Score based on First Principles:
  // Symptom (Feeling) and Contact (Reality) subtract from your command.
  // max score per category (3 questions * often(10) = 30)
  const maxSubScore = 30;
  const symptomImpact = (symptomScore / maxSubScore) * 50; // 50% weight
  const contactImpact = (contactScore / maxSubScore) * 50; // 50% weight
  
  template.commandScore = Math.max(0, Math.min(100, Math.round(100 - (symptomImpact + contactImpact))));

  // Handle Category Modifiers (Deeper Connection)
  if (input.category === "work") {
    template.mission_goal = template.mission_goal.replace("استرداد المساحة العقلية", "حماية الاحترافية الذهنية");
    template.suggested_zone_body += " (تكتيكات العمل المحترفة تتطلب تواصل رسمي ومحدود).";
  }

  return template;
}
