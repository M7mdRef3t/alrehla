import re

with open('app/api/dev/apply-fix/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove static import
content = content.replace('import jscodeshift from "jscodeshift";', '')

# Replace usage
target = """    // Since `jscodeshift` needs a parser that handles TypeScript/TSX,
    // we specify it using the api.
    const j = jscodeshift.withParser(fullPath.endsWith('.tsx') ? 'tsx' : 'ts');"""

replacement = """    // Since `jscodeshift` needs a parser that handles TypeScript/TSX,
    // we specify it using the api.
    // Dynamically import jscodeshift to prevent Next.js from bundling it in production
    const jscodeshift = (await import("jscodeshift")).default;
    const j = jscodeshift.withParser(fullPath.endsWith('.tsx') ? 'tsx' : 'ts');"""

content = content.replace(target, replacement)

with open('app/api/dev/apply-fix/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
