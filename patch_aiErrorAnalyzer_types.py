import re

with open("src/ai/aiErrorAnalyzer.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Update ErrorAnalysisResult type
pattern1 = r'(suggestedFixes: \{\n\s*description: string;\n\s*code\?: string;)'
replacement1 = r'\1\n    file?: string;\n    functionName?: string;\n    replacementCode?: string;'
content = re.sub(pattern1, replacement1, content)

# Update geminiClient.generateJSON type
pattern2 = r'(suggestedFixes: Array<\{\n\s*description: string;\n\s*code\?: string;)'
replacement2 = r'\1\n        file?: string;\n        functionName?: string;\n        replacementCode?: string;'
content = re.sub(pattern2, replacement2, content)

with open("src/ai/aiErrorAnalyzer.ts", "w", encoding="utf-8") as f:
    f.write(content)
