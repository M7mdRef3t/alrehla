const CODE_HINTS = [
  "code", "algorithm", "function", "class", "optimize", "complexity", "memory leak",
  "typescript", "javascript", "python", "java", "c++", "sql", "api", "implement", "debug",
  "اكتب كود", "خوارزمية", "تعقيد", "دالة", "حل برمجي", "تحسين الأداء", "تسريب ذاكرة", "اختبار"
];

function isCodingLike(text) {
  const lower = String(text || "").toLowerCase();
  return CODE_HINTS.some((k) => lower.includes(k));
}

function hasComplexity(text) {
  const lower = String(text || "").toLowerCase();
  return /o\([^)]+\)/i.test(text) || /complexity|time complexity|space complexity|linear|logarithmic/.test(lower) || /تعقيد|زمن التنفيذ|خطي/.test(text);
}

function hasMemoryConstraint(text) {
  const lower = String(text || "").toLowerCase();
  return /memory leak|no leaks|zero leaks|bounded memory|space o\(/.test(lower) || /تسريب ذاكرة|بدون تسريب|استهلاك الذاكرة/.test(text);
}

function hasAcceptanceCriteria(text) {
  const lower = String(text || "").toLowerCase();
  return /acceptance|success criteria|must|should|constraints?:|deliverables?/.test(lower) || /معايير القبول|لازم|شرط|مخرجات/.test(text);
}

function hasTests(text) {
  const lower = String(text || "").toLowerCase();
  return /test|unit test|integration test|benchmark|perf/.test(lower) || /اختبار|تيست|قياس أداء|بنشمارك/.test(text);
}

export function evaluatePrompt(text) {
  const source = String(text || "");
  const coding = isCodingLike(source);
  const missing = [];
  if (coding && !hasComplexity(source)) missing.push("حدد تعقيد مطلوب (مثال: O(n)).");
  if (coding && !hasMemoryConstraint(source)) missing.push("حدد قيد ذاكرة واضح (مثال: zero memory leaks).");
  if (coding && !hasAcceptanceCriteria(source)) missing.push("اكتب معايير قبول قابلة للقياس.");
  if (coding && !hasTests(source)) missing.push("اطلب اختبارات صريحة (unit/perf/security).");

  return { coding, missing, ok: !coding || missing.length === 0 };
}

export function buildPromptGuardResponse(missing) {
  return {
    error: "Prompt constraints required for coding requests",
    message: "الطلب البرمجي ناقص قيود إلزامية قبل التنفيذ.",
    missing,
    template:
      "Write this logic with O(n) complexity and zero memory leaks. Include unit tests, perf benchmark, and explicit acceptance criteria."
  };
}

export const CODING_OUTPUT_CONTRACT = [
  "Output Contract (Mandatory for coding answers):",
  "- Before every code block, write a short comment header that answers:",
  "  1) Why this block exists.",
  "  2) Its time complexity.",
  "- Use this exact style before each block:",
  "  // Why: ...",
  "  // Time Complexity: O(...)",
  "- If complexity differs inside helpers, annotate each helper separately."
].join("\n");

export function applyCodingOutputContractToPrompt(prompt) {
  const text = String(prompt || "");
  const guard = evaluatePrompt(text);
  if (!guard.coding) return text;
  return `${CODING_OUTPUT_CONTRACT}\n\n${text}`;
}

export function validateCodingCommentContract(outputText) {
  const text = String(outputText || "");
  const codeBlockRegex = /```[\w-]*\n[\s\S]*?```/g;
  const matches = [...text.matchAll(codeBlockRegex)];
  if (matches.length === 0) return { ok: true, violations: [] };

  const violations = [];
  for (const match of matches) {
    const blockStart = match.index ?? 0;
    const prefix = text.slice(0, blockStart);
    const prefixLines = prefix.split("\n");
    const contextLines = prefixLines.slice(-6).join("\n");
    const hasWhy = /\/\/\s*why\s*:/i.test(contextLines);
    const hasComplexity = /\/\/\s*time complexity\s*:\s*o\([^)]+\)/i.test(contextLines);
    if (!hasWhy || !hasComplexity) {
      violations.push({
        blockIndex: violations.length + 1,
        missingWhy: !hasWhy,
        missingComplexity: !hasComplexity
      });
    }
  }

  return { ok: violations.length === 0, violations };
}

export function buildOutputContractViolationResponse(violations) {
  return {
    error: "Coding output contract violated",
    message:
      "مرفوض: كل code block لازم يسبقه تعليق Why و Time Complexity.",
    violations
  };
}

export function extractLatestUserTextFromContents(contents) {
  if (!Array.isArray(contents)) return "";
  for (let i = contents.length - 1; i >= 0; i -= 1) {
    const entry = contents[i];
    if (!entry || entry.role !== "user" || !Array.isArray(entry.parts)) continue;
    const texts = entry.parts
      .map((p) => (typeof p?.text === "string" ? p.text : ""))
      .filter(Boolean);
    if (texts.length) return texts.join("\n");
  }
  return "";
}
