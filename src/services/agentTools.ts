
import { getAuthToken } from "@/domains/auth/store/auth.store";

export interface AgentToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export const AGENT_TOOLS: AgentToolDefinition[] = [
  {
    name: "read_file",
    description: "Reads the content of a file from the repository.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "The relative path to the file." },
      },
      required: ["path"],
    },
  },
  {
    name: "list_files",
    description: "Lists files in a directory.",
    parameters: {
      type: "object",
      properties: {
        dir: { type: "string", description: "The relative path to the directory." },
      },
      required: ["dir"],
    },
  },
  {
    name: "run_diagnostic",
    description: "Runs a safe diagnostic command (e.g., npm run test).",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "The command to run (must be in the allowed list)." },
      },
      required: ["command"],
    },
  },
];

export async function executeAgentTool(tool: string, args: any): Promise<any> {
    const bearer = getAuthToken();

    if (!bearer) {
        throw new Error("unauthorized_tool_execution");
    }

    const response = await fetch("/api/admin/sovereign/agent", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${bearer}`
        },
        body: JSON.stringify({ tool, args })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "tool_execution_failed");
    }

    return await response.json();
}
