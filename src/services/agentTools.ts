import { useAdminState } from "@/domains/admin/store/admin.store";
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
  {
    name: "audit_ui_cognitive",
    description: "Analyzes a UI component code for cognitive psychology and accessibility issues.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "The relative path to the UI component file." },
      },
      required: ["path"],
    },
  },
  {
    name: "read_db_schema",
    description: "Reads the current database schema to understand structure and find optimization targets.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_performance_insights",
    description: "Retrieves recent performance logs from the database to identify bottlenecks.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of recent logs to fetch (default: 50)." },
      },
      required: [],
    },
  },
  {
    name: "suggest_db_optimization",
    description: "Proposes a SQL optimization (like a new index or schema change) to improve performance.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", description: "Type of optimization (index, schema, etc)." },
        target: { type: "string", description: "The table or column targeted." },
        rationale: { type: "string", description: "Why this optimization is needed." },
        proposed_fix: { type: "string", description: "The SQL or migration code proposed." },
      },
      required: ["kind", "target", "rationale", "proposed_fix"],
    },
  },
  {
    name: "mutate_ui_component",
    description: "Generates a new code variant for a UI component to improve UX and resonance based on collected data.",
    parameters: {
      type: "object",
      properties: {
        componentId: { type: "string", description: "The name of the component (e.g., HeroSection)." },
        variantName: { type: "string", description: "A slug for the variant name (e.g., minimalist_v1)." },
        code: { type: "string", description: "The full React component code for the variant." },
        hypothesis: { type: "string", description: "The rationale for why this change will improve the system." },
      },
      required: ["componentId", "variantName", "code", "hypothesis"],
    },
  },
  {
    name: "delegate_to_adk",
    description: "Delegates a complex analytical or architecture task to the high-level Google ADK orchestrator.",
    parameters: {
      type: "object",
      properties: {
        task: { type: "string", description: "A detailed description of the task (e.g., 'Analyze performance and suggest evolution')." },
        context_type: { type: "string", description: "The type of context to include ('performance', 'psychology', or 'full')." },
      },
      required: ["task", "context_type"],
    },
  },
  {
    name: "get_consciousness_insights",
    description: "Retrieves deep psychological insights about a traveler's journey using ADK's behavioral loop analysis.",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "The session ID of the traveler to analyze." },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "discover_agents",
    description: "Searches for specialized agents in the sovereign registry (e.g. searching for a 'Relations' or 'Content' agent).",
    parameters: {
      type: "object",
      properties: {
        capability: { type: "string", description: "The specific capability needed (optional)." },
      },
      required: [],
    },
  },
  {
    name: "communicate_with_agent",
    description: "Sends a request or message to another agent identified by discovery.",
    parameters: {
      type: "object",
      properties: {
        targetAgentId: { type: "string", description: "The ID of the target agent." },
        payload: { type: "object", description: "The request payload or message." },
      },
      required: ["targetAgentId", "payload"],
    },
  },
  {
    name: "mcp_get_context",
    description: "Invokes the Model Context Protocol bridge to pull external data (Maps, BigQuery, Ads) into memory.",
    parameters: {
      type: "object",
      properties: {
        service: { type: "string", description: "The specific MCP service ('maps', 'bigquery')." },
        query_args: { type: "object", description: "Arguments for the context query." },
      },
      required: ["service", "query_args"],
    },
  },
];

export async function executeAgentTool(tool: string, args: any): Promise<any> {
    const bearer = getAuthToken();

    if (!bearer) {
        console.error("[Agent Tools] Execution rejected: No auth session found.");
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
