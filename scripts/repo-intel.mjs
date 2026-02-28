import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "app", "server", "supabase"];
const OUTPUT_DIR = path.join(ROOT, "output", "repo-graph");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "graph.json");
const VIEWER_FILE = path.join(OUTPUT_DIR, "index.html");
const REPORT_MD_FILE = path.join(OUTPUT_DIR, "report.md");
const ROUTES_CSV_FILE = path.join(OUTPUT_DIR, "routes.csv");
const CONFLICTS_FILE = path.join(OUTPUT_DIR, "conflicts.json");
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".sql"]);

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function isSourceFile(filePath) {
  return SOURCE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function walk(dirPath, acc = []) {
  if (!fs.existsSync(dirPath)) return acc;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", ".git", "coverage", "output"].includes(entry.name)) continue;
    const abs = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(abs, acc);
    } else if (isSourceFile(abs)) {
      acc.push(abs);
    }
  }
  return acc;
}

function classifyFile(relPath) {
  const normalized = toPosix(relPath);
  if (normalized.includes("/components/")) return "component";
  if (normalized.includes("/modules/")) return "module";
  if (normalized.includes("/services/")) return "service";
  if (normalized.includes("/hooks/")) return "hook";
  if (normalized.includes("/state/")) return "state";
  if (normalized.includes("/config/")) return "config";
  if (normalized.includes("/contexts/")) return "context";
  if (normalized.includes("/types/")) return "type";
  if (normalized.includes("/utils/")) return "utility";
  if (normalized.endsWith("/route.ts") || normalized.includes("/api/")) return "api-route";
  if (normalized.startsWith("server/")) return "server";
  if (normalized.startsWith("supabase/")) return "supabase";
  return "file";
}

function routePathFromFile(relPath) {
  const normalized = toPosix(relPath);
  const apiIndex = normalized.indexOf("app/api/");
  if (apiIndex === -1 || !normalized.endsWith("/route.ts")) return null;
  const suffix = normalized.slice(apiIndex + "app/api".length, normalized.length - "/route.ts".length);
  return suffix || "/";
}

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function createModuleResolver(allFiles) {
  const fileSet = new Set(allFiles.map((value) => path.resolve(value)));
  return (fromFile, specifier) => {
    if (!specifier.startsWith(".")) return null;
    const base = path.resolve(path.dirname(fromFile), specifier);
    const candidates = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      `${base}.jsx`,
      `${base}.mjs`,
      `${base}.cjs`,
      path.join(base, "index.ts"),
      path.join(base, "index.tsx"),
      path.join(base, "index.js"),
      path.join(base, "index.jsx"),
      path.join(base, "index.mjs"),
      path.join(base, "index.cjs")
    ];
    return candidates.find((candidate) => fileSet.has(candidate)) ?? null;
  };
}

function createFunctionId(fileId, name) {
  return `fn:${fileId}#${name}`;
}

function getFunctionName(node, sourceFile) {
  if (ts.isFunctionDeclaration(node) && node.name) return node.name.text;
  if (ts.isMethodDeclaration(node) && node.name && ts.isIdentifier(node.name)) return node.name.text;
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) return parent.name.text;
    if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) return parent.name.text;
  }
  return null;
}

function writeViewer(graph) {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Repo Graph Viewer</title>
  <style>
    :root {
      --bg: #0a0f1a;
      --panel: #111827;
      --line: #1f2937;
      --text: #e5e7eb;
      --muted: #94a3b8;
      --accent: #2dd4bf;
      --accent-soft: rgba(45, 212, 191, 0.12);
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: linear-gradient(180deg, #08111c, #0f172a); color: var(--text); }
    .layout { display: grid; grid-template-columns: 360px 1fr; min-height: 100vh; }
    .sidebar { border-right: 1px solid var(--line); background: rgba(15, 23, 42, 0.92); padding: 20px; }
    .content { padding: 20px; }
    .card { background: rgba(17, 24, 39, 0.92); border: 1px solid var(--line); border-radius: 16px; padding: 16px; margin-bottom: 16px; }
    .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
    .stat { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 12px; }
    .stat strong { display: block; font-size: 20px; color: var(--accent); }
    .muted { color: var(--muted); font-size: 12px; }
    input, select { width: 100%; background: #0b1220; color: var(--text); border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; margin-bottom: 10px; }
    .list { max-height: calc(100vh - 280px); overflow: auto; display: grid; gap: 8px; }
    .item { background: #0b1220; border: 1px solid transparent; border-radius: 12px; padding: 10px; cursor: pointer; }
    .item:hover, .item.active { border-color: var(--accent); background: var(--accent-soft); }
    .pill { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 11px; border: 1px solid var(--line); color: var(--muted); }
    ul { margin: 10px 0 0; padding-left: 18px; }
    li { margin-bottom: 6px; color: var(--muted); }
    code { color: var(--accent); }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="card">
        <h2>Repo Graph</h2>
        <div class="muted">Generated: ${graph.generatedAt}</div>
      </div>
      <div class="stats">
        <div class="stat"><span class="muted">Files</span><strong>${graph.stats.scannedFiles}</strong></div>
        <div class="stat"><span class="muted">Nodes</span><strong>${graph.stats.nodeCount}</strong></div>
        <div class="stat"><span class="muted">Edges</span><strong>${graph.stats.edgeCount}</strong></div>
      </div>
      <div class="card">
        <input id="search" placeholder="Search path or label" />
        <select id="layer">
          <option value="">All layers</option>
        </select>
        <div class="list" id="list"></div>
      </div>
    </aside>
    <main class="content">
      <div class="card">
        <h2 id="title">Select a node</h2>
        <div class="muted" id="meta"></div>
      </div>
      <div class="card">
        <div class="pill">Inbound</div>
        <ul id="inbound"></ul>
      </div>
      <div class="card">
        <div class="pill">Outbound</div>
        <ul id="outbound"></ul>
      </div>
    </main>
  </div>
  <script>
    const graph = ${JSON.stringify(graph)};
    const listEl = document.getElementById("list");
    const searchEl = document.getElementById("search");
    const layerEl = document.getElementById("layer");
    const titleEl = document.getElementById("title");
    const metaEl = document.getElementById("meta");
    const inboundEl = document.getElementById("inbound");
    const outboundEl = document.getElementById("outbound");

    const layers = Array.from(new Set(graph.nodes.map((node) => node.layer).filter(Boolean))).sort();
    layers.forEach((layer) => {
      const option = document.createElement("option");
      option.value = layer;
      option.textContent = layer;
      layerEl.appendChild(option);
    });

    let activeId = null;

    function renderList() {
      const q = searchEl.value.trim().toLowerCase();
      const layer = layerEl.value;
      const items = graph.nodes
        .filter((node) => node.type === "file" || node.type === "route" || node.type === "function")
        .filter((node) => !layer || node.layer === layer)
        .filter((node) => !q || node.id.toLowerCase().includes(q) || String(node.label || "").toLowerCase().includes(q))
        .slice(0, 400);

      listEl.innerHTML = "";
      for (const node of items) {
        const button = document.createElement("button");
        button.className = "item" + (node.id === activeId ? " active" : "");
        button.innerHTML = "<div><strong>" + node.label + "</strong></div><div class='muted'>" + node.id + "</div>";
        button.onclick = () => selectNode(node.id);
        listEl.appendChild(button);
      }
    }

    function renderEdges(targetEl, edges) {
      targetEl.innerHTML = "";
      if (edges.length === 0) {
        targetEl.innerHTML = "<li>No edges</li>";
        return;
      }
      for (const edge of edges.slice(0, 100)) {
        const li = document.createElement("li");
        li.innerHTML = "<code>[" + edge.type + "]</code> " + edge.source + " → " + edge.target;
        targetEl.appendChild(li);
      }
    }

    function selectNode(id) {
      activeId = id;
      const node = graph.nodes.find((entry) => entry.id === id);
      if (!node) return;
      titleEl.textContent = node.label || node.id;
      metaEl.textContent = node.id + " · " + (node.layer || node.type);
      renderEdges(inboundEl, graph.edges.filter((edge) => edge.target === id));
      renderEdges(outboundEl, graph.edges.filter((edge) => edge.source === id));
      renderList();
    }

    searchEl.addEventListener("input", renderList);
    layerEl.addEventListener("change", renderList);
    renderList();
  </script>
</body>
</html>`;
  fs.writeFileSync(VIEWER_FILE, html);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function buildConflicts(graph) {
  const routes = new Map();
  const functions = new Map();

  for (const node of graph.nodes) {
    if (node.type === "route") {
      const current = routes.get(node.label) ?? [];
      current.push(node.id);
      routes.set(node.label, current);
    }
    if (node.type === "function") {
      const current = functions.get(node.label) ?? [];
      current.push(node.id);
      functions.set(node.label, current);
    }
  }

  const duplicateRoutes = Array.from(routes.entries())
    .filter(([, ids]) => ids.length > 1)
    .map(([label, ids]) => ({ label, ids }));

  const duplicateFunctions = Array.from(functions.entries())
    .filter(([, ids]) => ids.length > 1)
    .map(([label, ids]) => ({ label, ids }));

  return {
    duplicateRoutes,
    duplicateFunctions
  };
}

function writeReports(graph) {
  const conflicts = buildConflicts(graph);
  const routeNodes = graph.nodes.filter((node) => node.type === "route").sort((a, b) => a.id.localeCompare(b.id));
  const markdown = [
    "# Repo Intel Report",
    "",
    `Generated: ${graph.generatedAt}`,
    "",
    "## Stats",
    "",
    `- Files: ${graph.stats.scannedFiles}`,
    `- Nodes: ${graph.stats.nodeCount}`,
    `- Edges: ${graph.stats.edgeCount}`,
    "",
    "## Duplicate Routes",
    "",
    ...(conflicts.duplicateRoutes.length === 0
      ? ["- None"]
      : conflicts.duplicateRoutes.map((entry) => `- ${entry.label}: ${entry.ids.join(", ")}`)),
    "",
    "## Duplicate Functions",
    "",
    ...(conflicts.duplicateFunctions.length === 0
      ? ["- None"]
      : conflicts.duplicateFunctions.slice(0, 50).map((entry) => `- ${entry.label}: ${entry.ids.join(", ")}`)),
    "",
    "## Routes",
    "",
    ...routeNodes.flatMap((route) => {
      const defs = graph.edges.filter((edge) => edge.type === "defines_route" && edge.target === route.id);
      const consumers = graph.edges.filter((edge) => edge.type === "fetches_route" && edge.target === route.id);
      return [
        `### ${route.label}`,
        ...defs.map((edge) => `- defined by: ${edge.source}`),
        ...consumers.map((edge) => `- consumed by: ${edge.source}`),
        ""
      ];
    })
  ].join("\n");

  const csvRows = [
    ["route", "defined_by", "consumed_by"],
    ...routeNodes.flatMap((route) => {
      const defs = graph.edges.filter((edge) => edge.type === "defines_route" && edge.target === route.id).map((edge) => edge.source);
      const consumers = graph.edges.filter((edge) => edge.type === "fetches_route" && edge.target === route.id).map((edge) => edge.source);
      return [[route.label, defs.join(" | "), consumers.join(" | ")]];
    })
  ];

  fs.writeFileSync(REPORT_MD_FILE, markdown);
  fs.writeFileSync(
    ROUTES_CSV_FILE,
    csvRows.map((row) => row.map(csvEscape).join(",")).join("\n")
  );
  fs.writeFileSync(CONFLICTS_FILE, JSON.stringify(conflicts, null, 2));
}

function buildGraph() {
  const files = SCAN_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
  const resolveImport = createModuleResolver(files);
  const nodes = [];
  const edges = [];
  const functionIndex = new Map();

  for (const absPath of files) {
    const relPath = toPosix(path.relative(ROOT, absPath));
    const routePath = routePathFromFile(relPath);
    nodes.push({
      id: relPath,
      type: "file",
      label: path.basename(relPath),
      path: relPath,
      layer: classifyFile(relPath),
      routePath
    });

    if (routePath) {
      nodes.push({
        id: `route:${routePath}`,
        type: "route",
        label: routePath,
        path: relPath,
        layer: "api-route"
      });
      edges.push({ type: "defines_route", source: relPath, target: `route:${routePath}` });
    }
  }

  for (const absPath of files) {
    const relPath = toPosix(path.relative(ROOT, absPath));
    const extension = path.extname(absPath).toLowerCase();
    if (extension === ".sql") continue;
    const sourceText = fs.readFileSync(absPath, "utf8");
    const sourceFile = ts.createSourceFile(
      absPath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      extension === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const localFunctions = new Set();

    const visit = (node) => {
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node)
      ) {
        const name = getFunctionName(node, sourceFile);
        if (name) {
          const fnId = createFunctionId(relPath, name);
          localFunctions.add(name);
          functionIndex.set(name, fnId);
          nodes.push({
            id: fnId,
            type: "function",
            label: name,
            path: relPath,
            layer: classifyFile(relPath)
          });
          edges.push({ type: "declares_function", source: relPath, target: fnId });
        }
      }

      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const specifier = node.moduleSpecifier.text;
        const resolved = resolveImport(absPath, specifier);
        if (resolved) {
          edges.push({
            type: "imports",
            source: relPath,
            target: toPosix(path.relative(ROOT, resolved)),
            meta: { specifier }
          });
        }
      }

      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const specifier = node.moduleSpecifier.text;
        const resolved = resolveImport(absPath, specifier);
        if (resolved) {
          edges.push({
            type: "re_exports",
            source: relPath,
            target: toPosix(path.relative(ROOT, resolved)),
            meta: { specifier }
          });
        }
      }

      if (ts.isCallExpression(node)) {
        const exprText = node.expression.getText(sourceFile);

        if (exprText === "fetch" && node.arguments.length > 0) {
          const firstArg = node.arguments[0];
          if (ts.isStringLiteral(firstArg) || ts.isNoSubstitutionTemplateLiteral(firstArg)) {
            const url = firstArg.text;
            if (url.startsWith("/api/")) {
              edges.push({
                type: "fetches_route",
                source: relPath,
                target: `route:${url.slice(4)}`,
                meta: { url }
              });
            }
          }
        }

        if (exprText === "createClient") {
          edges.push({ type: "uses_supabase_client", source: relPath, target: "external:supabase" });
        }

        if (ts.isIdentifier(node.expression)) {
          const callee = node.expression.text;
          if (localFunctions.has(callee)) {
            edges.push({
              type: "calls_function_local",
              source: relPath,
              target: createFunctionId(relPath, callee)
            });
          } else if (functionIndex.has(callee)) {
            edges.push({
              type: "calls_function_named",
              source: relPath,
              target: functionIndex.get(callee)
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  nodes.push({ id: "external:supabase", type: "external", label: "supabase", layer: "external" });

  return {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    stats: {
      scannedFiles: files.length,
      nodeCount: nodes.length,
      edgeCount: edges.length
    },
    nodes,
    edges
  };
}

function writeGraph(graph) {
  ensureOutputDir();
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(graph, null, 2));
  writeViewer(graph);
  writeReports(graph);
}

function readGraph() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    const graph = buildGraph();
    writeGraph(graph);
    return graph;
  }
  return JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
}

function findNode(graph, rawTarget) {
  const target = toPosix(rawTarget);
  return graph.nodes.find((node) => node.id === target || node.path === target || node.label === rawTarget) ?? null;
}

function printImpact(graph, rawTarget) {
  const targetNode = findNode(graph, rawTarget);
  if (!targetNode) {
    console.error(`Target not found: ${rawTarget}`);
    process.exitCode = 1;
    return;
  }
  const inbound = graph.edges.filter((edge) => edge.target === targetNode.id);
  const outbound = graph.edges.filter((edge) => edge.source === targetNode.id);
  console.log(`Impact report for ${targetNode.id}`);
  console.log(`Inbound dependencies: ${inbound.length}`);
  for (const edge of inbound.slice(0, 100)) console.log(`  <- [${edge.type}] ${edge.source}`);
  console.log(`Outbound dependencies: ${outbound.length}`);
  for (const edge of outbound.slice(0, 100)) console.log(`  -> [${edge.type}] ${edge.target}`);
}

function printRoute(graph, routePath) {
  const normalizedRoute = routePath.startsWith("/") ? routePath : `/${routePath}`;
  const routeId = `route:${normalizedRoute}`;
  const routeNode = graph.nodes.find((node) => node.id === routeId);
  if (!routeNode) {
    console.error(`Route not found: ${normalizedRoute}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Route ${normalizedRoute}`);
  for (const edge of graph.edges.filter((edge) => edge.type === "defines_route" && edge.target === routeId)) {
    console.log(`  defined by: ${edge.source}`);
  }
  for (const edge of graph.edges.filter((edge) => edge.type === "fetches_route" && edge.target === routeId)) {
    console.log(`  consumed by: ${edge.source}`);
  }
}

function printWhoImports(graph, target) {
  const node = findNode(graph, target);
  if (!node) {
    console.error(`Target not found: ${target}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Files importing ${node.id}`);
  for (const edge of graph.edges.filter((edge) => edge.type === "imports" && edge.target === node.id)) {
    console.log(`  ${edge.source}`);
  }
}

function printService(graph, target) {
  const normalized = String(target).trim().toLowerCase();
  const services = graph.nodes.filter(
    (node) =>
      node.layer === "service" &&
      (node.id.toLowerCase().includes(normalized) || String(node.label || "").toLowerCase().includes(normalized))
  );
  if (services.length === 0) {
    console.error(`No service matched: ${target}`);
    process.exitCode = 1;
    return;
  }
  for (const service of services) {
    console.log(`Service ${service.id}`);
    const consumers = graph.edges.filter((edge) => edge.type === "imports" && edge.target === service.id);
    for (const edge of consumers.slice(0, 100)) {
      console.log(`  consumed by: ${edge.source}`);
    }
  }
}

function printFunction(graph, target) {
  const normalized = String(target).trim().toLowerCase();
  const functions = graph.nodes.filter(
    (node) =>
      node.type === "function" &&
      (node.id.toLowerCase().includes(normalized) || String(node.label || "").toLowerCase().includes(normalized))
  );
  if (functions.length === 0) {
    console.error(`No function matched: ${target}`);
    process.exitCode = 1;
    return;
  }
  for (const fn of functions.slice(0, 20)) {
    console.log(`Function ${fn.id}`);
    const inbound = graph.edges.filter((edge) => edge.target === fn.id);
    const outbound = graph.edges.filter((edge) => edge.source === fn.id);
    for (const edge of inbound.slice(0, 40)) console.log(`  inbound: [${edge.type}] ${edge.source}`);
    for (const edge of outbound.slice(0, 40)) console.log(`  outbound: [${edge.type}] ${edge.target}`);
  }
}

function printRoutes(graph) {
  const routes = graph.nodes.filter((node) => node.type === "route").sort((a, b) => a.id.localeCompare(b.id));
  for (const route of routes) {
    console.log(route.label);
    const defs = graph.edges.filter((edge) => edge.type === "defines_route" && edge.target === route.id);
    const consumers = graph.edges.filter((edge) => edge.type === "fetches_route" && edge.target === route.id);
    for (const edge of defs) console.log(`  defined by: ${edge.source}`);
    for (const edge of consumers) console.log(`  consumed by: ${edge.source}`);
  }
}

const command = process.argv[2] ?? "graph";

if (command === "graph") {
  const graph = buildGraph();
  writeGraph(graph);
  console.log(`Graph written to ${toPosix(path.relative(ROOT, OUTPUT_FILE))}`);
  console.log(`Viewer written to ${toPosix(path.relative(ROOT, VIEWER_FILE))}`);
  console.log(JSON.stringify(graph.stats, null, 2));
} else if (command === "impact") {
  const target = process.argv[3];
  if (!target) {
    console.error("Usage: node scripts/repo-intel.mjs impact <file-or-node>");
    process.exit(1);
  }
  printImpact(readGraph(), target);
} else if (command === "route") {
  const target = process.argv[3];
  if (!target) {
    console.error("Usage: node scripts/repo-intel.mjs route </api-path>");
    process.exit(1);
  }
  printRoute(readGraph(), target);
} else if (command === "who-imports") {
  const target = process.argv[3];
  if (!target) {
    console.error("Usage: node scripts/repo-intel.mjs who-imports <file>");
    process.exit(1);
  }
  printWhoImports(readGraph(), target);
} else if (command === "service") {
  const target = process.argv[3];
  if (!target) {
    console.error("Usage: node scripts/repo-intel.mjs service <name>");
    process.exit(1);
  }
  printService(readGraph(), target);
} else if (command === "function") {
  const target = process.argv[3];
  if (!target) {
    console.error("Usage: node scripts/repo-intel.mjs function <name>");
    process.exit(1);
  }
  printFunction(readGraph(), target);
} else if (command === "routes") {
  printRoutes(readGraph());
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
