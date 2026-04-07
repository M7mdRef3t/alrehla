import re

with open('app/api/dev/apply-fix/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add webpack ignore magic comment to prevent dynamic import static analysis
target = 'const jscodeshift = (await import("jscodeshift")).default;'
replacement = 'const jscodeshift = (await import(/* webpackIgnore: true */ "jscodeshift")).default;'

if target in content:
    content = content.replace(target, replacement)
else:
    print("Not found target string")

with open('app/api/dev/apply-fix/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
