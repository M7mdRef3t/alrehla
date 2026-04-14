/**
 * Mini Diagnosis Engine
 * ══════════════════════════════════════════════════
 * Converts LandingSimulation 3-question answers to UserStateObject
 * Compatible with ConversionOfferCard
 */

import type { UserStateObject, UserStateType, MainPain, RecommendedProduct } from "../diagnosis/types";
import type { JourneyPhaseV1 } from "../recommendation/types";

interface MiniAnswers {
  q1_category?: "future" | "relationships" | "progress";
  q2_category?: "future" | "relationships" | "progress";
  q3_category?: "future" | "relationships" | "progress";
}

const CATEGORY_TO_PAIN: Record<string, MainPain> = {
  future: "self",
  relationships: "relationship",
  progress: "work",
};

const CATEGORY_TO_STATE: Record<string, UserStateType> = {
  future: "lost",
  relationships: "overwhelmed",
  progress: "stuck",
};

const CATEGORY_TO_PRODUCT: Record<string, RecommendedProduct> = {
  future: "masarat",
  relationships: "dawayir",
  progress: "atmosfera",
};

/**
 * Compute UserStateObject from LandingSimulation mini answers
 */
export function computeMiniDiagnosis(answers: MiniAnswers): UserStateObject {
  // Count categories
  const categories = [answers.q1_category, answers.q2_category, answers.q3_category].filter(Boolean);
  const counts: Record<string, number> = {};
  categories.forEach((cat) => {
    counts[cat!] = (counts[cat!] || 0) + 1;
  });

  // Find dominant category
  let dominant: "future" | "relationships" | "progress" = "future";
  let maxCount = 0;
  for (const [cat, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = cat as "future" | "relationships" | "progress";
    }
  }

  // Map to UserStateObject
  const mainPain = CATEGORY_TO_PAIN[dominant];
  const type = CATEGORY_TO_STATE[dominant];
  const recommendedProduct = CATEGORY_TO_PRODUCT[dominant];

  // Calculate readiness based on consistency
  const uniqueCategories = Object.keys(counts).length;
  const readiness: "low" | "medium" | "high" = uniqueCategories === 1 ? "high" : uniqueCategories === 2 ? "medium" : "low";

  // Calculate score (70-90 range for mini diagnosis)
  const diagnosisScore = 70 + Math.floor(Math.random() * 20);

  // Map to journey phase
  const journeyPhase: JourneyPhaseV1 = dominant === "future" ? "lost" : dominant === "relationships" ? "resistance" : "awareness";

  return {
    type,
    mainPain,
    diagnosisScore,
    recommendedProduct,
    readiness,
    journeyPhase,
    completedAt: Date.now(),
  };
}
