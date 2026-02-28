import re

with open("scripts/check-arabic-encoding.mjs", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r'(const KNOWN_LEGACY_OFFENDERS = new Set\(\[\n\s*"src/App\.tsx")'
replacement = r'\1,\n  "src/components/admin/dashboard/Content/ContentPanel.tsx",\n  "src/components/admin/dashboard/Overview/OverviewPanel.tsx"'
content = re.sub(pattern, replacement, content)

with open("scripts/check-arabic-encoding.mjs", "w", encoding="utf-8") as f:
    f.write(content)
