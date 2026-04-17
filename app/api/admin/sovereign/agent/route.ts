import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const ROOT = process.cwd();

/**
 * Sovereign Agent Bridge API 🌉
 * Allows the local AI agent to perform system-level actions via the backend.
 * Protected by Admin verification.
 */
export async function POST(req: Request) {
  try {
    // 1. Authorization check (Simple check for now, should be unified with admin layout)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { tool, args } = await req.json();

    switch (tool) {
      case "read_file":
        return await handleReadFile(args.path);
      case "run_diagnostic":
        return await handleRunDiagnostic(args.command);
      case "list_files":
        return await handleListFiles(args.dir);
      default:
        return NextResponse.json({ error: "unknown_tool" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleReadFile(filePath: string) {
  try {
    const fullPath = path.resolve(ROOT, filePath);
    if (!fullPath.startsWith(ROOT)) {
      throw new Error("Access denied: path outside root");
    }
    const content = await fs.readFile(fullPath, "utf8");
    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

async function handleListFiles(dirPath: string = ".") {
    try {
      const fullPath = path.resolve(ROOT, dirPath);
      if (!fullPath.startsWith(ROOT)) {
        throw new Error("Access denied: path outside root");
      }
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const files = entries.map(e => ({ name: e.name, isDir: e.isDirectory() }));
      return NextResponse.json({ files });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
}

async function handleRunDiagnostic(command: string) {
  // Restricted list of safe commands
  const allowedCommands = ["npm run test", "npm run build", "node -v", "npm -v"];
  const isAllowed = allowedCommands.some(cmd => command.startsWith(cmd));
  
  if (!isAllowed) {
    return NextResponse.json({ error: "Command not in allowed diagnostic list" }, { status: 403 });
  }

  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
    return NextResponse.json({ stdout, stderr });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stderr: error.stderr }, { status: 500 });
  }
}
