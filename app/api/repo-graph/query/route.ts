import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const GRAPH_PATH = path.join(process.cwd(), "output", "repo-graph", "graph.json");
const CONFLICTS_PATH = path.join(process.cwd(), "output", "repo-graph", "conflicts.json");

type RepoNode = {
  id: string;
  type: string;
  label?: string;
  path?: string;
  layer?: string;
};

type RepoEdge = {
  type: string;
  source: string;
  target: string;
};

type RepoGraph = {
  nodes: RepoNode[];
  edges: RepoEdge[];
};

function loadJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function inbound(graph: RepoGraph, id: string, types?: string[]) {
  return graph.edges.filter((edge) => edge.target === id && (!types || types.includes(edge.type)));
}

function outbound(graph: RepoGraph, id: string, types?: string[]) {
  return graph.edges.filter((edge) => edge.source === id && (!types || types.includes(edge.type)));
}

function normalize(value: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  const graph = loadJson<RepoGraph>(GRAPH_PATH);
  if (!graph) {
    return NextResponse.json({ error: "Repo graph not generated yet." }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");

  if (action === "impact") {
    const filePath = (searchParams.get("path") ?? "").replaceAll("\\", "/");
    const node = graph.nodes.find((entry) => entry.id === filePath || entry.path === filePath) ?? null;
    return NextResponse.json({
      found: Boolean(node),
      query: filePath,
      node,
      dependents: node
        ? inbound(graph, node.id, ["imports", "re_exports", "fetches_route", "calls_function_named"]).map((edge) => edge.source)
        : []
    });
  }

  if (action === "route") {
    const route = searchParams.get("route") ?? "";
    const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
    const node = graph.nodes.find((entry) => entry.type === "route" && entry.label === normalizedRoute) ?? null;
    return NextResponse.json({
      found: Boolean(node),
      query: normalizedRoute,
      node,
      definitions: node ? inbound(graph, node.id, ["defines_route"]).map((edge) => edge.source) : [],
      consumers: node ? inbound(graph, node.id, ["fetches_route"]).map((edge) => edge.source) : []
    });
  }

  if (action === "function") {
    const q = normalize(searchParams.get("name"));
    const matches = graph.nodes
      .filter((entry) => entry.type === "function" && normalize(entry.label ?? "").includes(q))
      .slice(0, 50)
      .map((entry) => ({
        id: entry.id,
        label: entry.label,
        path: entry.path,
        inboundCallers: inbound(graph, entry.id, ["calls_function_local", "calls_function_named"]).map((edge) => edge.source),
        outboundCalls: outbound(graph, entry.id, ["calls_function_local", "calls_function_named"]).map((edge) => edge.target)
      }));
    return NextResponse.json({ query: searchParams.get("name"), count: matches.length, matches });
  }

  if (action === "service") {
    const q = normalize(searchParams.get("name"));
    const matches = graph.nodes
      .filter((entry) => entry.type === "file" && entry.layer === "service" && normalize(entry.id).includes(q))
      .slice(0, 50)
      .map((entry) => ({
        id: entry.id,
        inboundImports: inbound(graph, entry.id, ["imports"]).map((edge) => edge.source)
      }));
    return NextResponse.json({ query: searchParams.get("name"), count: matches.length, matches });
  }

  if (action === "conflicts") {
    return NextResponse.json(loadJson(CONFLICTS_PATH) ?? { duplicateRoutes: [], duplicateFunctions: [] });
  }

  return NextResponse.json(
    {
      error: "Unsupported repo graph query action.",
      supportedActions: ["impact", "route", "function", "service", "conflicts"]
    },
    { status: 400 }
  );
}
