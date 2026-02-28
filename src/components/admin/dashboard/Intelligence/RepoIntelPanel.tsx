import { useEffect, useMemo, useState } from "react";

type GraphNode = {
  id: string;
  type: string;
  label?: string;
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

export default function RepoIntelPanel() {
  const [graph, setGraph] = useState<RepoGraph | null>(null);
  const [query, setQuery] = useState("");
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

  const filtered = useMemo(() => {
    if (!graph) return [];
    const q = query.trim().toLowerCase();
    return graph.nodes
      .filter((node) => node.type === "file" || node.type === "route" || node.type === "function")
      .filter((node) => !q || node.id.toLowerCase().includes(q) || String(node.label || "").toLowerCase().includes(q))
      .slice(0, 250);
  }, [graph, query]);

  const activeNode = useMemo(() => graph?.nodes.find((node) => node.id === activeId) ?? null, [graph, activeId]);
  const inbound = useMemo(() => graph?.edges.filter((edge) => edge.target === activeId) ?? [], [graph, activeId]);
  const outbound = useMemo(() => graph?.edges.filter((edge) => edge.source === activeId) ?? [], [graph, activeId]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Files" value={graph?.stats.scannedFiles ?? "--"} />
        <MetricCard label="Nodes" value={graph?.stats.nodeCount ?? "--"} />
        <MetricCard label="Edges" value={graph?.stats.edgeCount ?? "--"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث في المسارات أو أسماء الدوال"
            className="mb-4 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
          />
          <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {filtered.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => setActiveId(node.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-right transition-colors ${
                  node.id === activeId
                    ? "border-teal-400/60 bg-teal-500/10 text-white"
                    : "border-white/5 bg-slate-950/60 text-slate-300 hover:border-white/10"
                }`}
              >
                <div className="font-bold">{node.label || node.id}</div>
                <div className="mt-1 text-[11px] text-slate-500">{node.id}</div>
              </button>
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        </section>

        <section className="space-y-4">
          <Panel title={activeNode?.label || "اختر عقدة"}>
            <p className="text-xs text-slate-400">
              {activeNode ? `${activeNode.id} · ${activeNode.layer || activeNode.type}` : "لا توجد عقدة محددة"}
            </p>
            {graph && <p className="mt-2 text-[11px] text-slate-500">Generated: {graph.generatedAt}</p>}
          </Panel>

          <Panel title="Inbound">
            <EdgeList edges={inbound} />
          </Panel>

          <Panel title="Outbound">
            <EdgeList edges={outbound} />
          </Panel>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="text-xs uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-teal-300">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h3 className="mb-3 text-lg font-black text-white">{title}</h3>
      {children}
    </div>
  );
}

function EdgeList({ edges }: { edges: GraphEdge[] }) {
  if (edges.length === 0) {
    return <p className="text-sm text-slate-500">No edges</p>;
  }

  return (
    <ul className="space-y-2 text-sm text-slate-300">
      {edges.slice(0, 120).map((edge, index) => (
        <li key={`${edge.type}-${edge.source}-${edge.target}-${index}`} className="rounded-2xl border border-white/5 bg-slate-950/50 px-3 py-2">
          <span className="font-mono text-teal-300">[{edge.type}]</span> {edge.source} → {edge.target}
        </li>
      ))}
    </ul>
  );
}
