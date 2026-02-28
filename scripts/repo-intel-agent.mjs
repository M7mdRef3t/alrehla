import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const GRAPH_PATH = path.join(ROOT, "output", "repo-graph", "graph.json");
const CONFLICTS_PATH = path.join(ROOT, "output", "repo-graph", "conflicts.json");

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${path.relative(ROOT, filePath)}. Run npm run repo:graph first.`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function findNode(graph, predicate) {
  return graph.nodes.find(predicate) ?? null;
}

function getInbound(graph, id, types = null) {
  return graph.edges.filter((edge) => edge.target === id && (!types || types.includes(edge.type)));
}

function getOutbound(graph, id, types = null) {
  return graph.edges.filter((edge) => edge.source === id && (!types || types.includes(edge.type)));
}

function summarizeFileImpact(graph, filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  const fileNode = findNode(graph, (node) => node.id === normalized || node.path === normalized);
  if (!fileNode) {
    return {
      kind: "file-impact",
      found: false,
      query: normalized,
      message: "File not found in repo graph."
    };
  }

  const dependents = getInbound(graph, fileNode.id, ["imports", "re_exports", "fetches_route", "calls_function_named"])
    .map((edge) => edge.source);
  const localFunctions = getOutbound(graph, fileNode.id, ["declares_function"]).map((edge) => edge.target);

  return {
    kind: "file-impact",
    found: true,
    query: normalized,
    node: fileNode,
    dependentCount: dependents.length,
    dependents: Array.from(new Set(dependents)).slice(0, 60),
    declaredFunctionCount: localFunctions.length,
    declaredFunctions: localFunctions.slice(0, 60)
  };
}

function summarizeRoute(graph, routePath) {
  const normalized = routePath.startsWith("/") ? routePath : `/${routePath}`;
  const routeNode = findNode(graph, (node) => node.type === "route" && node.label === normalized);
  if (!routeNode) {
    return {
      kind: "route-consumers",
      found: false,
      query: normalized,
      message: "Route not found in repo graph."
    };
  }

  const definitions = getInbound(graph, routeNode.id, ["defines_route"]).map((edge) => edge.source);
  const consumers = getInbound(graph, routeNode.id, ["fetches_route"]).map((edge) => edge.source);

  return {
    kind: "route-consumers",
    found: true,
    query: normalized,
    node: routeNode,
    definitionCount: definitions.length,
    definitions: Array.from(new Set(definitions)),
    consumerCount: consumers.length,
    consumers: Array.from(new Set(consumers)).slice(0, 80)
  };
}

function summarizeFunctions(graph, name) {
  const q = normalize(name);
  const matches = graph.nodes.filter((node) => node.type === "function" && normalize(node.label).includes(q));
  return {
    kind: "function-search",
    query: name,
    count: matches.length,
    matches: matches.slice(0, 50).map((node) => ({
      id: node.id,
      label: node.label,
      path: node.path,
      inboundCallers: getInbound(graph, node.id, ["calls_function_local", "calls_function_named"]).map((edge) => edge.source),
      outboundCalls: getOutbound(graph, node.id, ["calls_function_local", "calls_function_named"]).map((edge) => edge.target)
    }))
  };
}

function summarizeServices(graph, name) {
  const q = normalize(name);
  const matches = graph.nodes.filter(
    (node) => node.type === "file" && node.layer === "service" && normalize(node.id).includes(q)
  );
  return {
    kind: "service-consumers",
    query: name,
    count: matches.length,
    matches: matches.slice(0, 50).map((node) => ({
      id: node.id,
      inboundImports: getInbound(graph, node.id, ["imports"]).map((edge) => edge.source)
    }))
  };
}

function buildVerificationChecklist(surface) {
  const checks = ["npm run typecheck"];
  const touched = normalize(surface.intent);
  if (surface.fileImpact?.found) checks.push("npm run repo:graph");
  if (touched.includes("route") || surface.routeImpact?.found) checks.push("Verify route consumers and HTTP responses");
  if (touched.includes("ui") || touched.includes("component") || touched.includes("page")) checks.push("Run browser verification on affected screens");
  if (touched.includes("env") || touched.includes("runtime") || touched.includes("vite") || touched.includes("next")) {
    checks.push("Verify both Vite and Next runtime behavior");
  }
  return Array.from(new Set(checks));
}

function buildAgentPreflight(graph, conflicts, options) {
  const intent = String(options.intent ?? "").trim();
  const targetFile = options.path ? summarizeFileImpact(graph, options.path) : null;
  const targetRoute = options.route ? summarizeRoute(graph, options.route) : null;
  const targetFunction = options.function ? summarizeFunctions(graph, options.function) : null;
  const targetService = options.service ? summarizeServices(graph, options.service) : null;

  const risks = [];
  if (targetFile?.found && targetFile.dependentCount > 10) risks.push("High fan-out file: change may affect many dependents.");
  if (targetRoute?.found && targetRoute.consumerCount > 3) risks.push("Route has multiple consumers: verify response contract carefully.");
  if ((targetFunction?.count ?? 0) > 1) risks.push("Function name is ambiguous across multiple files.");
  if ((conflicts.duplicateRoutes?.length ?? 0) > 0) risks.push("Repository contains duplicate route definitions.");

  return {
    kind: "agent-preflight",
    intent,
    requestedTargets: {
      path: options.path ?? null,
      route: options.route ?? null,
      function: options.function ?? null,
      service: options.service ?? null
    },
    fileImpact: targetFile,
    routeImpact: targetRoute,
    functionImpact: targetFunction,
    serviceImpact: targetService,
    repositoryConflicts: conflicts,
    risks,
    verificationChecklist: buildVerificationChecklist({
      intent,
      fileImpact: targetFile,
      routeImpact: targetRoute
    })
  };
}

function printUsage() {
  console.log(`Usage:
  node scripts/repo-intel-agent.mjs preflight --intent "..." [--path src/file.ts] [--route /api/foo] [--function handleSend] [--service telegram]
  node scripts/repo-intel-agent.mjs impact --path src/file.ts
  node scripts/repo-intel-agent.mjs route --route /api/foo
  node scripts/repo-intel-agent.mjs function --function handleSend
  node scripts/repo-intel-agent.mjs service --service telegram`);
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const options = parseArgs(rest);
  const graph = loadJson(GRAPH_PATH);
  const conflicts = fs.existsSync(CONFLICTS_PATH) ? loadJson(CONFLICTS_PATH) : { duplicateRoutes: [], duplicateFunctions: [] };

  let result;
  if (command === "preflight") {
    result = buildAgentPreflight(graph, conflicts, options);
  } else if (command === "impact" && options.path) {
    result = summarizeFileImpact(graph, options.path);
  } else if (command === "route" && options.route) {
    result = summarizeRoute(graph, options.route);
  } else if (command === "function" && options.function) {
    result = summarizeFunctions(graph, options.function);
  } else if (command === "service" && options.service) {
    result = summarizeServices(graph, options.service);
  } else {
    printUsage();
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(result, null, 2));
}

main();
