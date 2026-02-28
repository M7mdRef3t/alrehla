"use client";

import { useEffect, useMemo, useState } from "react";

type GraphNode = {
  id: string;
  type: string;
  label?: string;
  path?: string;
  layer?: string;
};

type GraphEdge = {
  type: string;
  source: string;
  target: string;
};

type RepoGraph = {
  generatedAt: string;
  stats: {
    scannedFiles: number;
    nodeCount: number;
    edgeCount: number;
  };
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export default function RepoIntelPage() {
  const [graph, setGraph] = useState<RepoGraph | null>(null);
  const [query, setQuery] = useState("");
  const [layer, setLayer] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/repo-graph", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Failed to load repo graph." }));
          throw new Error(String(data.error || "Failed to load repo graph."));
        }
        return res.json() as Promise<RepoGraph>;
      })
      .then((data) => {
        if (cancelled) return;
        setGraph(data);
        setActiveId(data.nodes[0]?.id ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(String(err?.message || err || "Failed to load repo graph."));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const layers = useMemo(() => {
    if (!graph) return [];
    return Array.from(new Set(graph.nodes.map((node) => node.layer).filter(Boolean) as string[])).sort();
  }, [graph]);

  const filteredNodes = useMemo(() => {
    if (!graph) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return graph.nodes
      .filter((node) => node.type === "file" || node.type === "route" || node.type === "function")
      .filter((node) => !layer || node.layer === layer)
      .filter((node) => {
        if (!normalizedQuery) return true;
        return (
          node.id.toLowerCase().includes(normalizedQuery) ||
          String(node.label || "").toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 400);
  }, [graph, query, layer]);

  const activeNode = useMemo(() => graph?.nodes.find((node) => node.id === activeId) ?? null, [graph, activeId]);
  const inbound = useMemo(() => graph?.edges.filter((edge) => edge.target === activeId) ?? [], [graph, activeId]);
  const outbound = useMemo(() => graph?.edges.filter((edge) => edge.source === activeId) ?? [], [graph, activeId]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #08111c, #0f172a)",
        color: "#e5e7eb",
        padding: "24px"
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "20px" }}>
        <section
          style={{
            background: "rgba(15,23,42,0.92)",
            border: "1px solid #1f2937",
            borderRadius: "20px",
            padding: "18px"
          }}
        >
          <h1 style={{ marginTop: 0 }}>Repo Intel</h1>
          <p style={{ color: "#94a3b8", fontSize: "12px" }}>
            {graph ? `Generated ${graph.generatedAt}` : "Waiting for graph data"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
            <MetricCard label="Files" value={graph?.stats.scannedFiles ?? "--"} />
            <MetricCard label="Nodes" value={graph?.stats.nodeCount ?? "--"} />
            <MetricCard label="Edges" value={graph?.stats.edgeCount ?? "--"} />
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search path or label"
            style={inputStyle}
          />
          <select value={layer} onChange={(event) => setLayer(event.target.value)} style={inputStyle}>
            <option value="">All layers</option>
            {layers.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
          <div style={{ display: "grid", gap: "8px", maxHeight: "70vh", overflow: "auto" }}>
            {filteredNodes.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => setActiveId(node.id)}
                style={{
                  background: node.id === activeId ? "rgba(45,212,191,0.12)" : "#0b1220",
                  color: "#e5e7eb",
                  border: node.id === activeId ? "1px solid #2dd4bf" : "1px solid #1f2937",
                  borderRadius: "12px",
                  padding: "10px",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <div style={{ fontWeight: 700 }}>{node.label || node.id}</div>
                <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>{node.id}</div>
              </button>
            ))}
          </div>
          {error && <p style={{ color: "#fca5a5", marginTop: "12px" }}>{error}</p>}
        </section>

        <section style={{ display: "grid", gap: "16px" }}>
          <Panel title={activeNode?.label || "Select a node"}>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>
              {activeNode ? `${activeNode.id} · ${activeNode.layer || activeNode.type}` : "No node selected"}
            </div>
          </Panel>
          <Panel title="Inbound">
            <EdgeList edges={inbound} />
          </Panel>
          <Panel title="Outbound">
            <EdgeList edges={outbound} />
          </Panel>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "14px", padding: "12px" }}>
      <div style={{ color: "#94a3b8", fontSize: "12px" }}>{label}</div>
      <div style={{ color: "#2dd4bf", fontWeight: 800, fontSize: "22px" }}>{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(17,24,39,0.92)", border: "1px solid #1f2937", borderRadius: "18px", padding: "16px" }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </div>
  );
}

function EdgeList({ edges }: { edges: GraphEdge[] }) {
  if (edges.length === 0) {
    return <div style={{ color: "#94a3b8", fontSize: "13px" }}>No edges</div>;
  }
  return (
    <ul style={{ margin: 0, paddingLeft: "18px" }}>
      {edges.slice(0, 120).map((edge, index) => (
        <li key={`${edge.type}-${edge.source}-${edge.target}-${index}`} style={{ color: "#94a3b8", marginBottom: "8px" }}>
          <code style={{ color: "#2dd4bf" }}>[{edge.type}]</code> {edge.source} → {edge.target}
        </li>
      ))}
    </ul>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0b1220",
  color: "#e5e7eb",
  border: "1px solid #1f2937",
  borderRadius: "12px",
  padding: "10px 12px",
  marginBottom: "10px"
};
