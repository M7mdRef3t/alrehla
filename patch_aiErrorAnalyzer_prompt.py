import re

with open("src/ai/aiErrorAnalyzer.ts", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r'(\"code\": \"الكود المقترح \(لو applicable\)\",)'
replacement = r'\1\n      "file": "مسار الملف (لو applicable)",\n      "functionName": "اسم الدالة (لو applicable)",\n      "replacementCode": "الكود البديل (لو applicable)",'
content = re.sub(pattern, replacement, content)

with open("src/ai/aiErrorAnalyzer.ts", "w", encoding="utf-8") as f:
    f.write(content)
