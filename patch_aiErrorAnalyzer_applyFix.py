import re

with open("src/ai/aiErrorAnalyzer.ts", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r'(\s*)private async applyFix\(fix: ErrorAnalysisResult\["suggestedFixes"\]\[0\]\): Promise<boolean> \{\n\s*// TODO: في المستقبل، ممكن نستخدم AST manipulation\n\s*// مؤقتاً: نحفظ الـ fix suggestion للمراجعة اليدوية\n\s*try \{\n\s*const suggestions = JSON\.parse\(\n\s*localStorage\.getItem\("dawayir-fix-suggestions"\) \|\| "\[\]"\n\s*\) as typeof fix\[\];\n\s*suggestions\.push\(fix\);\n\s*localStorage\.setItem\(\n\s*"dawayir-fix-suggestions",\n\s*JSON\.stringify\(suggestions\.slice\(-20\)\)\n\s*\);\n\s*return true;\n\s*\} catch \{\n\s*return false;\n\s*\}'

replacement = r'''\1private async applyFix(fix: ErrorAnalysisResult["suggestedFixes"][0]): Promise<boolean> {
\1  if (fix.file && fix.functionName && fix.replacementCode) {
\1    try {
\1      const response = await fetch("/api/admin/?path=ast-fix", {
\1        method: "POST",
\1        headers: { "Content-Type": "application/json" },
\1        body: JSON.stringify({
\1          file: fix.file,
\1          functionName: fix.functionName,
\1          replacementCode: fix.replacementCode,
\1        }),
\1      });
\1      if (response.ok) {
\1        return true;
\1      } else {
\1        console.error("❌ AST fix failed:", await response.text());
\1      }
\1    } catch (error) {
\1      console.error("❌ Failed to contact AST fix API:", error);
\1    }
\1  }
\1
\1  // مؤقتاً: نحفظ الـ fix suggestion للمراجعة اليدوية (Fallback)
\1  try {
\1    const suggestions = JSON.parse(
\1      localStorage.getItem("dawayir-fix-suggestions") || "[]"
\1    ) as typeof fix[];
\1
\1    suggestions.push(fix);
\1
\1    localStorage.setItem(
\1      "dawayir-fix-suggestions",
\1      JSON.stringify(suggestions.slice(-20))
\1    );
\1
\1    return true;
\1  } catch {
\1    return false;
\1  }'''

content = re.sub(pattern, replacement, content)

with open("src/ai/aiErrorAnalyzer.ts", "w", encoding="utf-8") as f:
    f.write(content)
