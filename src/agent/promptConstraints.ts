export interface CodingConstraintCheck {
  isCodingRequest: boolean;
  hasComplexityConstraint: boolean;
  hasMemoryConstraint: boolean;
  hasAcceptanceCriteria: boolean;
  hasTestRequirement: boolean;
  missing: string[];
  isReady: boolean;
}

const CODE_HINTS = [
  "code",
  "algorithm",
  "function",
  "class",
  "optimize",
  "complexity",
  "memory leak",
  "typescript",
  "javascript",
  "python",
  "java",
  "c++",
  "sql",
  "api",
  "implement",
  "debug",
  "fix bug",
  "اكتب كود",
  "خوارزمية",
  "تعقيد",
  "دالة",
  "حل برمجي",
  "تحسين الأداء",
  "تسريب ذاكرة",
  "اختبار",
  "نفذ بالكود"
];

export function evaluateCodingPromptConstraints(input: string): CodingConstraintCheck {
  const text = input.toLowerCase();
  const isCodingRequest = CODE_HINTS.some((k) => text.includes(k));

  const hasComplexityConstraint =
    /o\([^)]+\)/i.test(input) ||
    /complexity|time complexity|space complexity|linear|logarithmic|n\)/i.test(text) ||
    /تعقيد|زمن التنفيذ|خطي/.test(input);

  const hasMemoryConstraint =
    /memory leak|no leaks|zero leaks|bounded memory|space o\(/i.test(text) ||
    /تسريب ذاكرة|بدون تسريب|استهلاك الذاكرة/.test(input);

  const hasAcceptanceCriteria =
    /acceptance|success criteria|must|should|constraints?:|deliverables?/i.test(text) ||
    /معايير القبول|لازم|شرط|مخرجات/.test(input);

  const hasTestRequirement =
    /test|unit test|integration test|benchmark|perf/i.test(text) ||
    /اختبار|تيست|قياس أداء|بنشمارك/.test(input);

  const missing: string[] = [];
  if (isCodingRequest && !hasComplexityConstraint) missing.push("حدد تعقيد مطلوب (مثال: O(n)).");
  if (isCodingRequest && !hasMemoryConstraint) missing.push("حدد قيد ذاكرة واضح (مثال: zero memory leaks / bounded memory).");
  if (isCodingRequest && !hasAcceptanceCriteria) missing.push("اكتب معايير قبول قابلة للقياس.");
  if (isCodingRequest && !hasTestRequirement) missing.push("اطلب اختبارات صريحة (unit/perf/security).");

  return {
    isCodingRequest,
    hasComplexityConstraint,
    hasMemoryConstraint,
    hasAcceptanceCriteria,
    hasTestRequirement,
    missing,
    isReady: !isCodingRequest || missing.length === 0
  };
}

export function buildCodingPromptTemplate(task: string): string {
  return [
    `Task: ${task}`,
    "Constraints:",
    "- Time complexity: O(n) maximum.",
    "- Memory: zero memory leaks and bounded auxiliary memory.",
    "- Security: validate all external input and prevent IDOR/injection.",
    "- Reliability: graceful error handling, no silent failures.",
    "- Testing: include unit tests + one performance benchmark.",
    "Acceptance Criteria:",
    "- All tests pass.",
    "- Performance threshold is met.",
    "- No security regression is introduced."
  ].join("\n");
}

export function buildPromptCoachingMessage(missing: string[]): string {
  return [
    "الطلب البرمجي محتاج يتشد شوية قبل التنفيذ.",
    "ناقص فيه:",
    ...missing.map((m) => `- ${m}`),
    "",
    "استخدم القالب ده:",
    "Write this logic with O(n) complexity and zero memory leaks. Include unit tests, perf benchmark, and explicit acceptance criteria."
  ].join("\n");
}

export function buildCodingSystemConstraintBlock(): string {
  return [
    "إذا الرسالة برمجية، التزم بالآتي:",
    "1) ابدأ بخطة مختصرة (المدخلات/المخرجات/التعقيد).",
    "2) ممنوع اقتراح حل بدون ذكر Time/Space complexity.",
    "3) ممنوع أي pattern يسبب memory leaks أو listeners بدون cleanup.",
    "4) أضف اختبارات تغطي edge cases + performance.",
    "5) لو القيود ناقصة، اطلب توضيح قبل التنفيذ.",
    "6) قبل كل block كود، اكتب تعليقين إلزاميين بهذا الشكل:",
    "   // Why: ليه البلوك ده موجود؟",
    "   // Time Complexity: O(...)"
  ].join("\n");
}
