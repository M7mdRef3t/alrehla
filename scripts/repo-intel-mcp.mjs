import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const ROOT = process.cwd();
const GRAPH_PATH = path.join(ROOT, "output", "repo-graph", "graph.json");
const CONFLICTS_PATH = path.join(ROOT, "output", "repo-graph", "conflicts.json");

function loadJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureGraph() {
  const graph = loadJson(GRAPH_PATH);
  if (!graph) {
    throw new Error("Repo graph not generated. Run npm run repo:graph first.");
  }
  return graph;
}

function getConflicts() {
  return loadJson(CONFLICTS_PATH, { duplicateRoutes: [], duplicateFunctions: [] });
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function inbound(graph, id, types = null) {
  return graph.edges.filter((edge) => edge.target === id && (!types || types.includes(edge.type)));
}

function outbound(graph, id, types = null) {
  return graph.edges.filter((edge) => edge.source === id && (!types || types.includes(edge.type)));
}

function toolResult(payload) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2)
      }
    ]
  };
}

function getFileImpact(graph, input) {
  const query = String(input.path ?? "").replaceAll("\\", "/");
  const node = graph.nodes.find((entry) => entry.id === query || entry.path === query) ?? null;
  if (!node) return { found: false, query };
  return {
    found: true,
    query,
    node,
    inboundDependents: inbound(graph, node.id, ["imports", "re_exports", "fetches_route", "calls_function_named"]).map((edge) => edge.source),
    declaredFunctions: outbound(graph, node.id, ["declares_function"]).map((edge) => edge.target)
  };
}

function getRouteConsumers(graph, input) {
  const query = String(input.route ?? "");
  const route = query.startsWith("/") ? query : `/${query}`;
  const node = graph.nodes.find((entry) => entry.type === "route" && entry.label === route) ?? null;
  if (!node) return { found: false, query: route };
  return {
    found: true,
    query: route,
    node,
    definitions: inbound(graph, node.id, ["defines_route"]).map((edge) => edge.source),
    consumers: inbound(graph, node.id, ["fetches_route"]).map((edge) => edge.source)
  };
}

function findFunction(graph, input) {
  const query = normalize(input.name);
  const matches = graph.nodes
    .filter((entry) => entry.type === "function" && normalize(entry.label).includes(query))
    .slice(0, 50)
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      path: entry.path,
      inboundCallers: inbound(graph, entry.id, ["calls_function_local", "calls_function_named"]).map((edge) => edge.source),
      outboundCalls: outbound(graph, entry.id, ["calls_function_local", "calls_function_named"]).map((edge) => edge.target)
    }));
  return { query: String(input.name ?? ""), count: matches.length, matches };
}

function getServiceConsumers(graph, input) {
  const query = normalize(input.name);
  const matches = graph.nodes
    .filter((entry) => entry.type === "file" && entry.layer === "service" && normalize(entry.id).includes(query))
    .slice(0, 50)
    .map((entry) => ({
      id: entry.id,
      inboundImports: inbound(graph, entry.id, ["imports"]).map((edge) => edge.source)
    }));
  return { query: String(input.name ?? ""), count: matches.length, matches };
}

function agentPreflight(graph, input) {
  const conflicts = getConflicts();
  const fileImpact = input.path ? getFileImpact(graph, { path: input.path }) : null;
  const routeImpact = input.route ? getRouteConsumers(graph, { route: input.route }) : null;
  const functionImpact = input.name ? findFunction(graph, { name: input.name }) : null;

  const checks = ["npm run typecheck"];
  const intent = String(input.intent ?? "");
  const intentNorm = normalize(intent);
  if (fileImpact?.found) checks.push("npm run repo:graph");
  if (routeImpact?.found || intentNorm.includes("route") || intentNorm.includes("api")) checks.push("Verify route consumers and response contract");
  if (intentNorm.includes("ui") || intentNorm.includes("component") || intentNorm.includes("screen")) checks.push("Run browser verification on affected pages");
  if (intentNorm.includes("env") || intentNorm.includes("runtime") || intentNorm.includes("vite") || intentNorm.includes("next")) checks.push("Verify Vite and Next behavior");

  return {
    intent,
    fileImpact,
    routeImpact,
    functionImpact,
    conflicts,
    verificationChecklist: Array.from(new Set(checks))
  };
}

const tools = [
  {
    name: "get_file_impact",
    description: "Return reverse dependencies and declared functions for a file path in the repo graph.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" }
      },
      required: ["path"]
    }
  },
  {
    name: "get_route_consumers",
    description: "Return route definition files and consumer files for an API route path.",
    inputSchema: {
      type: "object",
      properties: {
        route: { type: "string" }
      },
      required: ["route"]
    }
  },
  {
    name: "find_function",
    description: "Search function nodes by name and show callers/callees.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" }
      },
      required: ["name"]
    }
  },
  {
    name: "get_service_consumers",
    description: "Find service files by name and list import consumers.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" }
      },
      required: ["name"]
    }
  },
  {
    name: "list_conflicts",
    description: "List duplicate route and function conflicts detected by repo-intel.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "agent_preflight",
    description: "Build an impact-aware verification plan before editing code.",
    inputSchema: {
      type: "object",
      properties: {
        intent: { type: "string" },
        path: { type: "string" },
        route: { type: "string" },
        name: { type: "string" }
      }
    }
  }
];

function respond(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

function respondError(id, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32000, message } })}\n`);
}

function handleRequest(message) {
  const { id, method, params } = message;
  try {
    if (method === "initialize") {
      respond(id, {
        protocolVersion: "2024-11-05",
        serverInfo: { name: "repo-intel-mcp", version: "0.1.0" },
        capabilities: { tools: {} }
      });
      return;
    }

    if (method === "tools/list") {
      respond(id, { tools });
      return;
    }

    if (method === "tools/call") {
      const graph = ensureGraph();
      const input = params?.arguments ?? {};
      const name = params?.name;
      let payload;

      if (name === "get_file_impact") payload = getFileImpact(graph, input);
      else if (name === "get_route_consumers") payload = getRouteConsumers(graph, input);
      else if (name === "find_function") payload = findFunction(graph, input);
      else if (name === "get_service_consumers") payload = getServiceConsumers(graph, input);
      else if (name === "list_conflicts") payload = getConflicts();
      else if (name === "agent_preflight") payload = agentPreflight(graph, input);
      else throw new Error(`Unknown tool: ${name}`);

      respond(id, toolResult(payload));
      return;
    }

    if (method === "notifications/initialized") return;

    respondError(id ?? null, `Unsupported method: ${method}`);
  } catch (error) {
    respondError(id ?? null, String(error instanceof Error ? error.message : error));
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity
});

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    handleRequest(JSON.parse(trimmed));
  } catch (error) {
    respondError(null, `Invalid JSON input: ${error instanceof Error ? error.message : String(error)}`);
  }
});
