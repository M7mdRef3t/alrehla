import re

with open('app/api/dev/apply-fix/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove static import
content = content.replace('import ts from "typescript";', 'import type ts from "typescript";')

# Replace usage
target = """        // Verify the new source is valid AST
        const sourceFile = ts.createSourceFile(
          fullPath,
          newSource,
          ts.ScriptTarget.Latest,
          true,
          fullPath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
        );"""

replacement = """        // Verify the new source is valid AST
        const tsModule = await import(/* webpackIgnore: true */ "typescript");
        const sourceFile = tsModule.createSourceFile(
          fullPath,
          newSource,
          tsModule.ScriptTarget.Latest,
          true,
          fullPath.endsWith('.tsx') ? tsModule.ScriptKind.TSX : tsModule.ScriptKind.TS
        );"""

content = content.replace(target, replacement)

with open('app/api/dev/apply-fix/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
