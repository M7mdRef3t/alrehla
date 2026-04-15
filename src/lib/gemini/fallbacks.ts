/**
 * Fallback generators for Gemini-dependent features.
 * These provide reasonable static responses when AI is unavailable.
 */

/**
 * Build a deterministic fallback analysis for the Weather Diagnostic
 * when Gemini is unavailable or returns an error.
 */
export function buildAnalyzeFallback(answers: unknown[]) {
  const label1 = typeof answers[0] === "string" ? answers[0] : "عامل ضغط ١";
  const label2 = typeof answers[1] === "string" ? answers[1] : "عامل ضغط ٢";
  const label3 = typeof answers[2] === "string" ? answers[2] : "شيء متجاهل";

  return {
    nodes: [
      { id: "user_core", label: "أنت (المركز)", size: "medium", color: "core", mass: 10 },
      { id: "node_1", label: label1, size: "large", color: "danger", mass: 8 },
      { id: "node_2", label: label2, size: "medium", color: "neutral", mass: 5 },
      { id: "node_3", label: label3, size: "small", color: "ignored", mass: 3 },
    ],
    edges: [
      { source: "user_core", target: "node_1", type: "draining", animated: true },
      { source: "user_core", target: "node_2", type: "stable", animated: false },
      { source: "user_core", target: "node_3", type: "ignored", animated: false },
    ],
    insight_message: "الموقف محتاج وقفة — ده مش تحليل ذكاء اصطناعي، لكنه بداية.",
    detected_symptoms: ["exhausted", "avoidance"],
  };
}
