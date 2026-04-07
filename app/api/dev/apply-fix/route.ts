import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import type ts from "typescript";

export async function POST(req: NextRequest) {
  try {
    const { filePath, replaceTarget, code } = await req.json();

    if (!filePath || !replaceTarget || !code) {
      return NextResponse.json(
        { error: "Missing required fields (filePath, replaceTarget, code)" },
        { status: 400 }
      );
    }

    // Security check: Only allow development mode and inside src/ or app/
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "This endpoint is disabled in production." },
        { status: 403 }
      );
    }

    const fullPath = path.resolve(process.cwd(), filePath);

    // Prevent directory traversal
    if (!fullPath.startsWith(path.resolve(process.cwd(), "src")) &&
        !fullPath.startsWith(path.resolve(process.cwd(), "app"))) {
      return NextResponse.json(
        { error: "File path must be within src or app directories." },
        { status: 403 }
      );
    }

    let source: string;
    try {
      source = await fs.readFile(fullPath, "utf-8");
    } catch (e) {
      return NextResponse.json(
        { error: `File not found: ${filePath}` },
        { status: 404 }
      );
    }

    // A simple replacement strategy verified by AST parsing:
    // We try to find the target code string within the file.
    // We replace the text, then parse the resulting code with TypeScript AST parser
    // to ensure the LLM output did not introduce syntax errors.

    // Attempt standard string replacement first to ensure the text exists
    if (source.includes(replaceTarget)) {
      const newSource = source.replace(replaceTarget, code);
      try {
        // Verify the new source is valid AST
        const tsModule = await import(/* webpackIgnore: true */ "typescript");
        const sourceFile = tsModule.createSourceFile(
          fullPath,
          newSource,
          tsModule.ScriptTarget.Latest,
          true,
          fullPath.endsWith('.tsx') ? tsModule.ScriptKind.TSX : tsModule.ScriptKind.TS
        );

        // Check for syntactic diagnostics (parsing errors)
        // Note: ts.createSourceFile doesn't throw, it creates nodes and stores errors in parseDiagnostics if we were using a full Program.
        // For a simple syntax check without a Program, we can just assume if it parses without throwing it's structurally okay,
        // but typically syntax errors are attached to the sourceFile.
        const diagnostics = (sourceFile as any).parseDiagnostics || [];
        if (diagnostics.length > 0) {
           return NextResponse.json(
            { error: `The suggested code results in invalid syntax.` },
            { status: 400 }
          );
        }

        // Save the file
        await fs.writeFile(fullPath, newSource, "utf-8");
        return NextResponse.json({ success: true, message: "Applied fix via verified AST parsing." });
      } catch (parseError: any) {
        return NextResponse.json(
          { error: `The suggested code results in invalid syntax: ${parseError.message}` },
          { status: 400 }
        );
      }
    } else {
      // Fallback: target code not found
      return NextResponse.json(
        { error: "Could not find the target code to replace." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
