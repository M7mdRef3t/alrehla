import type ts from 'typescript';
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  // STRICT SECURITY CHECK: Ensure this only runs in local development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden in production" }, { status: 403 });
  }

  try {
    // Dynamically import typescript so it isn't bundled in production
    const tsCompiler = await import("typescript");

    const body = await req.json();
    const { filePath, originalCode, code, action } = body;

    if (!filePath || !code) {
      return NextResponse.json({ error: "Missing filePath or code" }, { status: 400 });
    }

    // Resolve path relative to project root
    const fullPath = path.resolve(process.cwd(), filePath);

    // Safety check - only allow modifying files in src/ or app/
    const srcDir = path.join(process.cwd(), "src") + path.sep;
    const appDir = path.join(process.cwd(), "app") + path.sep;

    if (!fullPath.startsWith(srcDir) && !fullPath.startsWith(appDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    const sourceText = await fs.readFile(fullPath, "utf-8");

    // AST Manipulation using TypeScript Compiler API
    const sourceFile = tsCompiler.createSourceFile(
      fullPath,
      sourceText,
      tsCompiler.ScriptTarget.Latest,
      true
    );

    let newSourceText = sourceText;

    if (action === "replace" && originalCode) {
      // Find the most specific AST node containing the originalCode
      let foundNode: ts.Node | undefined;
      const visit = (node: ts.Node) => {
        const nodeText = node.getText(sourceFile);
        if (nodeText.includes(originalCode) && (!foundNode || nodeText.length < foundNode.getText(sourceFile).length)) {
          foundNode = node;
        }
        tsCompiler.forEachChild(node, visit);
      };
      visit(sourceFile);

      if (foundNode) {
         const start = foundNode.getStart(sourceFile);
         const end = foundNode.getEnd();
         const before = sourceText.substring(0, start);
         const after = sourceText.substring(end);
         const nodeText = foundNode.getText(sourceFile);
         const replacedText = nodeText.replace(originalCode, code);
         newSourceText = before + replacedText + after;
      } else {
         return NextResponse.json({ error: "Target code not found in AST" }, { status: 404 });
      }
    } else if (action === "append") {
       newSourceText = sourceText + "\n" + code;
    } else {
       if (!originalCode && action === "replace") {
         return NextResponse.json({ error: "Missing originalCode for replace action" }, { status: 400 });
       }
       newSourceText = sourceText.replace(originalCode || "", code);
    }

    await fs.writeFile(fullPath, newSourceText, "utf-8");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Auto-fix failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
