import re

with open("vite.config.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Add the import
import_pattern = r'(const \{ handleJourneyMap \} = await import\("\./server/admin/journey-map"\);)'
import_replacement = r'\1\n          const { handleAstFix } = await import("./server/admin/ast-fix");'
content = re.sub(import_pattern, import_replacement, content)

# Add to ROUTES
routes_pattern = r'("journey-map": handleJourneyMap\n\s*)(\};)'
routes_replacement = r'\1, "ast-fix": handleAstFix\n          \2'
content = re.sub(routes_pattern, routes_replacement, content)

with open("vite.config.ts", "w", encoding="utf-8") as f:
    f.write(content)
