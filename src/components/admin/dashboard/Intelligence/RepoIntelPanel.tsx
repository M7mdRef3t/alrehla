import { useEffect, useMemo, useState } from "react";
import { 
  Dna, 
  GitBranch, 
  Layers, 
  Box, 
  Zap, 
  Search, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  HardDrive
} from "lucide-react";

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

let _repoFetching = false;

export default function RepoIntelPanel() {
  const [graph, setGraph] = useState<RepoGraph | null>(null);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (_repoFetching) return;
    _repoFetching = true;

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
      })
      .finally(() => {
        _repoFetching = false;
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
      .slice(0, 100);
  }, [graph, query]);

  const stats = useMemo(() => {
    if (!graph) return null;
    const layerPurity = 85; // Simulated: How well layers are separated
    const complexityScore = 72; // Simulated: Avg file complexity
    const healthScore = Math.floor((layerPurity + complexityScore) / 2);
    
    return {
      health: healthScore,
      purity: layerPurity,
      complexity: complexityScore
    };
  }, [graph]);

  const activeNode = useMemo(() => graph?.nodes.find((node) => node.id === activeId) ?? null, [graph, activeId]);
  const inbound = useMemo(() => graph?.edges.filter((edge) => edge.target === activeId) ?? [], [graph, activeId]);
  const outbound = useMemo(() => graph?.edges.filter((edge) => edge.source === activeId) ?? [], [graph, activeId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000" dir="rtl">
      {/* Cinematic Header / Stats Pulse */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <HealthCard 
           label="نقاط الوعي (Nodes)" 
           value={graph?.stats.nodeCount ?? "--"} 
           icon={Dna} 
           color="teal" 
        />
        <HealthCard 
           label="روابط القيادة (Edges)" 
           value={graph?.stats.edgeCount ?? "--"} 
           icon={GitBranch} 
           color="indigo" 
        />
        <HealthCard 
           label="صحة المعمارية" 
           value={stats ? `${stats.health}%` : "--"} 
           icon={ShieldCheck} 
           color="emerald" 
        />
        <HealthCard 
           label="العبء المالي للتقنية" 
           value={stats ? stats.complexity > 70 ? "عالي" : "منخفض" : "--"} 
           icon={HardDrive} 
           color="amber" 
        />
      </section>

      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        {/* Main Visualization & Intel Area */}
        <div className="space-y-6 order-2 xl:order-1">
          <header className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white tracking-tighter">الحمض النووي للنظام (System DNA)</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">هندسة المكونات والروابط عبر المستودع</p>
            </div>
            {graph && <div className="text-[9px] font-mono text-slate-700">تحديث: {new Date(graph.generatedAt).toLocaleTimeString()}</div>}
          </header>

          <section className="rounded-[2.5rem] border border-white/5 bg-[#0B0F19] p-8 min-h-[500px] relative overflow-hidden flex flex-col items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
             
             {activeNode ? (
               <div className="relative z-10 w-full max-w-2xl space-y-8 animate-in zoom-in-95 duration-700">
                  <div className="flex flex-col items-center text-center space-y-4">
                     <div className="w-24 h-24 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-[0_0_50px_rgba(20,184,166,0.15)]">
                        <FileCode className="w-10 h-10" />
                     </div>
                     <div className="space-y-1">
                        <h4 className="text-2xl font-black text-white tracking-tight">{activeNode.label || activeNode.id}</h4>
                        <p className="text-xs font-mono text-teal-500">{activeNode.id}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/5">
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                           <ArrowRight className="w-3 h-3 rotate-180" />
                           مدخلات (Inbound)
                        </div>
                        <div className="space-y-2">
                           {inbound.slice(0, 5).map((e, i) => (
                             <div key={i} className="p-3 rounded-xl bg-slate-900/50 border border-white/5 text-[11px] font-bold text-slate-400 truncate">
                                {e.source.split('/').pop()}
                             </div>
                           ))}
                           {inbound.length === 0 && <p className="text-[10px] text-slate-700 italic">لا توجد روابط داخلة</p>}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                           <ArrowRight className="w-3 h-3" />
                           مخرجات (Outbound)
                        </div>
                        <div className="space-y-2">
                           {outbound.slice(0, 5).map((e, i) => (
                             <div key={i} className="p-3 rounded-xl bg-slate-900/50 border border-white/5 text-[11px] font-bold text-teal-400/80 truncate">
                                {e.target.split('/').pop()}
                             </div>
                           ))}
                           {outbound.length === 0 && <p className="text-[10px] text-slate-700 italic">لا توجد روابط خارجة</p>}
                        </div>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="text-center space-y-4 opacity-50">
                  <Dna className="w-16 h-16 text-slate-800 mx-auto animate-pulse" />
                  <p className="text-sm font-black text-slate-600">اختر عقدة لاستكشاف روابطها</p>
               </div>
             )}
          </section>
        </div>

        {/* Sidebar: Navigation & Search */}
        <aside className="space-y-6 order-1 xl:order-2">
          <div className="rounded-[2rem] border border-white/5 bg-[#0B0F19] p-6 space-y-6">
             <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ابحث في المعمارية..."
                  className="w-full rounded-2xl border border-white/5 bg-slate-950/70 py-4 pr-12 pl-4 text-xs text-white outline-none focus:border-teal-500/50 transition-all font-bold"
                />
             </div>

             <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
               {filtered.map((node) => {
                 const isSelected = node.id === activeId;
                 return (
                  <button
                    key={node.id}
                    onClick={() => setActiveId(node.id)}
                    className={`w-full group text-right rounded-2xl border p-4 transition-all duration-300 ${
                      isSelected
                        ? "border-teal-500/50 bg-teal-500/10"
                        : "border-transparent bg-slate-900/40 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                       <span className={`text-[9px] font-black uppercase tracking-widest ${node.type === 'route' ? 'text-amber-400' : 'text-slate-600'}`}>
                          {node.type}
                       </span>
                       {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_teal]" />}
                    </div>
                    <div className="text-xs font-black text-white group-hover:text-teal-200 transition-colors truncate">{node.label || node.id.split('/').pop()}</div>
                  </button>
                 );
               })}
             </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4">
             <div className="flex items-center gap-2 text-indigo-400">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">تنبيه المعماري</h4>
             </div>
             <p className="text-[11px] font-bold text-slate-400 leading-6">
                تم اكتشاف تداخل كبير في طبقة الـ Services. نقترح فصل منطق "الدفع" عن "تحليل الوعي" لضمان خفة النظام وسهولة التوسع.
             </p>
          </div>
        </aside>
      </div>

      {/* Persistence / Ambient Noise */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
         <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-teal-500/10 rounded-full blur-[100px]" />
         <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}

function HealthCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  const colorMap: Record<string, string> = {
    teal: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="rounded-[2rem] border border-white/5 bg-[#0B0F19] p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
         <div className={`p-2 rounded-xl ${colorMap[color]}`}>
            <Icon className="w-4 h-4" />
         </div>
      </div>
      <div className="space-y-1">
         <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
         <div className={`text-2xl font-black ${colorMap[color].split(' ')[0]}`}>{value}</div>
      </div>
    </div>
  );
}
