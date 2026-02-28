import { Project, MethodDeclaration, FunctionDeclaration } from "ts-morph";
import { parseJsonBody } from "./_shared";
import path from "path";
import fs from "fs";

export async function handleAstFix(req: any, res: any) {
  // In dev mode, we check for x-admin-code
  const adminSecret = process.env.ADMIN_API_SECRET || "alrehla-admin";
  const passedSecret = req.headers["x-admin-code"];

  if (passedSecret !== adminSecret) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Forbidden - Invalid Admin Code" }));
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const { file, functionName, replacementCode } = body;

    if (!file) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing 'file' field" }));
      return;
    }

    const targetFilePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(targetFilePath)) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: `File not found: ${file}` }));
      return;
    }

    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(targetFilePath);

    if (functionName && replacementCode) {
      let targetNode: FunctionDeclaration | MethodDeclaration | undefined = sourceFile.getFunction(functionName);

      if (!targetNode) {
        // Try finding it in any class
        const classes = sourceFile.getClasses();
        for (const cls of classes) {
          const method = cls.getMethod(functionName);
          if (method) {
            targetNode = method;
            break;
          }
        }
      }

      if (targetNode) {
        // Remove trailing braces from replacement if passed as a full block,
        // setBodyText takes the text inside the braces.
        let bodyText = replacementCode;
        if (bodyText.trim().startsWith('{') && bodyText.trim().endsWith('}')) {
          bodyText = bodyText.trim().slice(1, -1);
        }
        targetNode.setBodyText(bodyText);
      } else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: `Function/Method '${functionName}' not found in ${file}` }));
        return;
      }
    } else {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing 'functionName' or 'replacementCode' field" }));
      return;
    }

    await project.save();

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, message: `Applied fix to ${file}` }));

  } catch (error: any) {
    console.error("[AST Fix] Error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Failed to apply AST fix", details: error.message }));
  }
}
