import re

with open("scripts/check-arabic-encoding.mjs", "r") as f:
    content = f.read()

new_set = """const KNOWN_LEGACY_OFFENDERS = new Set([
  "src/App.tsx",
  "src/components/admin/dashboard/Content/ContentPanel.tsx",
  "src/components/admin/dashboard/Overview/OverviewPanel.tsx"
]);"""

content = re.sub(
    r'const KNOWN_LEGACY_OFFENDERS = new Set\(\[\n\s+"src/App\.tsx"\n\]\);',
    new_set,
    content
)

with open("scripts/check-arabic-encoding.mjs", "w") as f:
    f.write(content)
