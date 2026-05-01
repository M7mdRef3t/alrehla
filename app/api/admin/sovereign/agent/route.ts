import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { geminiClient } from "@/services/geminiClient";
import { COGNITIVE_AUDITOR_PROMPT } from "@/prompts/cognitiveAuditor";
import { supabaseAdmin } from "@/services/supabaseClient";
import { CommandBridge } from "@/services/CommandBridge";
import { A2AHub } from "@/services/A2AHub";
import { MCPBridge } from "@/services/MCPBridge";

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
      case "audit_ui_cognitive":
        return await handleAuditUICognitive(args.path);
      case "read_db_schema":
        return await handleReadDbSchema();
      case "get_performance_insights":
        return await handleGetPerformanceInsights(args.limit);
      case "suggest_db_optimization":
        return await handleSuggestDbOptimization(args);
      case "mutate_ui_component":
        return await handleMutateUIComponent(args);
      case "delegate_to_adk":
        return await handleDelegateToADK(args);
      case "get_consciousness_insights":
        return await handleGetConsciousnessInsights(args);
      case "discover_agents":
        return NextResponse.json(await A2AHub.discoverAgents(args.capability));
      case "communicate_with_agent":
        return NextResponse.json(await A2AHub.sendMessage(args.fromAgentId || "Sovereign", args.targetAgentId, args.payload));
      case "mcp_get_context":
        return NextResponse.json(await MCPBridge.getContext({ provider: "google", service: args.service, args: args.query_args }));
      default:
        return NextResponse.json({ error: "unknown_tool" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleReadFile(filePath: string) {
  try {
    const fullPath = path.resolve(/*turbopackIgnore: true*/ ROOT, filePath);
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
      const fullPath = path.resolve(/*turbopackIgnore: true*/ ROOT, dirPath);
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

async function handleAuditUICognitive(filePath: string) {
  try {
    const fullPath = path.resolve(/*turbopackIgnore: true*/ ROOT, filePath);
    if (!fullPath.startsWith(ROOT)) {
      throw new Error("Access denied: path outside root");
    }

    const content = await fs.readFile(fullPath, "utf8");
    const prompt = `${COGNITIVE_AUDITOR_PROMPT}\n\n${content}`;

    const report = await geminiClient.generateJSON(prompt, "ux_cognitive_audit");
    
    if (!report) {
       throw new Error("Failed to generate cognitive audit report");
    }

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleReadDbSchema() {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase Admin not available" }, { status: 500 });
  
  try {
    const { data: tables, error: tableError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('table_name, column_name, data_type')
      .eq('table_schema', 'public');
        
    if (tableError) throw tableError;
    return NextResponse.json({ schema: tables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleGetPerformanceInsights(limit: number = 50) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase Admin not available" }, { status: 500 });

  try {
    const { data, error } = await supabaseAdmin
      .from("performance_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ logs: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleSuggestDbOptimization(args: any) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase Admin not available" }, { status: 500 });

  try {
    const { data, error } = await supabaseAdmin
      .from("architect_optimizations")
      .insert({
        kind: args.kind,
        target: args.target,
        rationale: args.rationale,
        proposed_fix: args.proposed_fix,
        status: "proposed"
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ suggestion: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleMutateUIComponent(args: any) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase Admin not available" }, { status: 500 });

  try {
    const { componentId, variantName, code, hypothesis } = args;
    
    // 🛡️ Security: Path Sanitization
    // Ensure componentId and variantName only contain alphanumeric characters, hyphens, and underscores.
    // This blocks Path Traversal (e.g., ../../../etc/passwd)
    const isValidId = /^[a-zA-Z0-9-_]+$/.test(componentId);
    const isValidVariant = /^[a-zA-Z0-9-_]+$/.test(variantName);

    if (!isValidId || !isValidVariant) {
      throw new Error("Security Violation: Invalid character in componentId or variantName. Only alphanumeric, hyphen and underscore allowed.");
    }

    // 1. Create directory if not exists
    const evolDir = path.join(/*turbopackIgnore: true*/ ROOT, "src", "evolution", componentId);
    await fs.mkdir(evolDir, { recursive: true });
    
    // 2. Write the component file
    const fileName = `${variantName}.tsx`;
    const filePath = path.join(evolDir, fileName);

    // Final check: Ensure the resolved path is still within our evolution root
    const evolutionRoot = path.join(/*turbopackIgnore: true*/ ROOT, "src", "evolution");
    if (!filePath.startsWith(evolutionRoot)) {
       throw new Error("Security Violation: Target path is outside the evolution boundary.");
    }

    await fs.writeFile(filePath, code, "utf8");
    
    // 3. Register in DB
    const variantPath = `${componentId}/${variantName}`; // This corresponds to the dynamic import path in EvolutionarySynapse
    const { data: mutation, error } = await supabaseAdmin
      .from("ui_mutations")
      .insert({
        component_id: componentId,
        variant_name: variantName,
        variant_path: variantPath,
        hypothesis,
        is_active: false // We start as inactive for safety unless explicitly enabled
      })
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json({ 
      success: true, 
      mutation, 
      localPath: filePath 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleDelegateToADK(args: any) {
    try {
        const { task, context_type } = args;
        
        // Fetch context based on type
        const context: any = {};
        
        if (context_type === "performance" || context_type === "full") {
            const { data } = await supabaseAdmin!.from("performance_logs").select("*").limit(10);
            context.performance_logs = data;
        }
        
        if (context_type === "psychology" || context_type === "full") {
            const { data } = await supabaseAdmin!.from("journey_events").select("*").limit(20);
            context.journey_events = data;
        }

        const result = await CommandBridge.delegateToADK(task, JSON.stringify(context));
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function handleGetConsciousnessInsights(args: any) {
    try {
        const { sessionId } = args;
        const { data: events } = await supabaseAdmin!
            .from("journey_events")
            .select("*")
            .eq("session_id", sessionId)
            .order("created_at", { ascending: true });

        const task = `Analyze the psychological journey for session ${sessionId} and provide behavioral insights.`;
        const result = await CommandBridge.delegateToADK(task, JSON.stringify({ journey_events: events }));
        
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

