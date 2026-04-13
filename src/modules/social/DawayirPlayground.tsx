"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Trash2, Shield, AlertTriangle, Info, Plus, 
  ChevronRight, Circle, Layers, Activity, Heart, Search
} from "lucide-react";
import { useDawayirStore } from "@/domains/social/store/dawayir.store";
import { interpretPainLevel } from "@/domains/social/services/analytics";
import { Ring, DawayirNode } from "@/domains/social/types";
import { freezeRewardsService } from "@/domains/gamification/services/freezeRewards";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";

export function DawayirPlayground({ onBack }: { onBack?: () => void }) {
  const { 
    graph, insights, selectedNodeId, 
    addNode, removeNode, selectNode 
  } = useDawayirStore();

  useEffect(() => {
    // Reward for opening the deep awareness platform
    freezeRewardsService.onIntelligenceDeepDive();
  }, []);

  const [newName, setNewName] = useState("");
  const [newRing, setNewRing] = useState<Ring>("yellow");
  const canvasSize = 600;

  const active = useMemo(() => graph.nodes.filter(n => !n.archived), [graph.nodes]);

  const ringGroups = useMemo(() => {
    const groups: Record<Ring, DawayirNode[]> = { red: [], yellow: [], green: [] };
    active.forEach(n => groups[n.ring].push(n));
    return groups;
  }, [active]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addNode(
      newName.trim(), 
      newRing, 
      newRing === "green" ? 85 : newRing === "yellow" ? 50 : 20
    );
    setNewName("");
  };

  const selectedNode = active.find(n => n.id === selectedNodeId);

  // Helper for polar positioning
  const getPosition = (node: DawayirNode, index: number, totalInRing: number) => {
    const ringRadius: Record<Ring, number> = { red: 0.16, yellow: 0.32, green: 0.46 };
    const r = ringRadius[node.ring] * canvasSize;
    const angle = (2 * Math.PI * index) / Math.max(totalInRing, 1) - Math.PI / 2;
    const cx = canvasSize / 2 + Math.cos(angle) * r;
    const cy = canvasSize / 2 + Math.sin(angle) * r;
    const size = 16 + (node.score / 100) * 16;
    return { cx, cy, size };
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 lg:p-8 min-h-[800px]">
      {/* Back Button for Platform Integration */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-6 left-6 z-[60] w-12 h-12 rounded-full glass-heavy flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-2xl"
          title="رجوع"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      )}

      {/* Sidebar / Controls */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        <section className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-white">
            <Plus className="w-5 h-5 text-cyan-400" />
            إضافة شخص للدوائر
          </h2>
          
          <div className="space-y-4">
            <input
              type="text"
              value={newName}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="اسم الشخص..."
              className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white placeholder:text-white/20 outline-none focus:border-cyan-500/50 transition-all"
            />
            
            <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
              {(["green", "yellow", "red"] as Ring[]).map(r => (
                <button
                  key={r}
                  onClick={() => setNewRing(r)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${
                    newRing === r 
                      ? r === 'green' ? 'bg-emerald-500 text-black' : r === 'yellow' ? 'bg-amber-400 text-black' : 'bg-rose-500 text-white'
                      : 'text-white/40 hover:bg-white/5'
                  }`}
                >
                  {r === "green" ? "آمن" : r === "yellow" ? "عالق" : "نزيف"}
                </button>
              ))}
            </div>

            <button 
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold disabled:opacity-30 transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
            >
              إضافة للرحلة
            </button>
          </div>
        </section>

        {/* Selected Node Details */}
        <AnimatePresence mode="wait">
          {selectedNode && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Users className="w-24 h-24" />
              </div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white">{selectedNode.label}</h3>
                  <div className="flex gap-2 items-center mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      selectedNode.ring === 'green' ? 'bg-emerald-500/20 text-emerald-400' : 
                      selectedNode.ring === 'yellow' ? 'bg-amber-400/20 text-amber-400' : 
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      {selectedNode.ring === 'green' ? 'الدائرة الآمنة' : selectedNode.ring === 'yellow' ? 'دائرة الانتظار' : 'دائرة الاستنزاف'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => removeNode(selectedNode.id)}
                  className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                  <div className="flex justify-between text-xs text-white/40 mb-2">
                    <span>مستوى القرب</span>
                    <span className="text-white">{selectedNode.score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedNode.score}%` }}
                      className={`h-full ${
                        selectedNode.score > 70 ? 'bg-emerald-500' : selectedNode.score > 40 ? 'bg-amber-400' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Quick Insights */}
        <section className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white/60 text-sm font-bold border-b border-white/5 pb-4">
            <Activity className="w-4 h-4 text-emerald-400" />
            تحليل النبض الاجتماعي
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
              <div className="text-[10px] text-white/30 uppercase font-bold">الصحة العامة</div>
              <div className="text-xl font-black text-white">{insights.overallHealth}%</div>
            </div>
            <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
              <div className="text-[10px] text-white/30 uppercase font-bold">الآمان</div>
              <div className="text-xl font-black text-emerald-400">{insights.nurturingRatio * 100}%</div>
            </div>
          </div>
          
          <p className="text-xs text-white/40 leading-relaxed italic">
            &quot;{insights.recommendation}&quot;
          </p>
        </section>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 min-h-[500px] flex items-center justify-center relative bg-black/40 rounded-[40px] border border-white/5 overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0,transparent_70%)]" />
        
        {/* SVG Graph */}
        <svg 
          width={canvasSize} 
          height={canvasSize} 
          viewBox={`0 0 ${canvasSize} ${canvasSize}`}
          className="relative drop-shadow-2xl z-10"
        >
          {/* Concentric rings with Alrehla Style */}
          {[
            { r: 0.46, color: "rgba(16, 185, 129, 0.08)", label: "Safe" },
            { r: 0.32, color: "rgba(245, 158, 11, 0.08)", label: "Buffer" },
            { r: 0.16, color: "rgba(244, 63, 94, 0.08)", label: "Toxic" },
          ].map((ring, i) => (
            <React.Fragment key={i}>
              <circle
                cx={canvasSize / 2}
                cy={canvasSize / 2}
                r={ring.r * canvasSize}
                fill={ring.color}
                stroke="white"
                strokeOpacity={0.05}
                strokeDasharray="4 8"
                strokeWidth={1}
              />
            </React.Fragment>
          ))}

          {/* Center Identity Node */}
          <g>
            <circle
              cx={canvasSize / 2}
              cy={canvasSize / 2}
              r={24}
              fill="rgba(6, 182, 212, 0.2)"
              className="animate-pulse"
            />
            <circle
              cx={canvasSize / 2}
              cy={canvasSize / 2}
              r={12}
              fill="white"
            />
            <text 
              x={canvasSize / 2} y={canvasSize / 2 + 35} 
              textAnchor="middle" fill="white" 
              fontSize={10} fontWeight={800} className="tracking-widest uppercase opacity-40"
            >
              أنت
            </text>
          </g>

          {/* Edges */}
          {graph.edges.map((edge, i) => {
            const sNode = active.find(n => n.id === edge.source);
            const tNode = active.find(n => n.id === edge.target);
            if (!sNode || !tNode) return null;
            
            const sp = getPosition(sNode, ringGroups[sNode.ring].indexOf(sNode), ringGroups[sNode.ring].length);
            const tp = getPosition(tNode, ringGroups[tNode.ring].indexOf(tNode), ringGroups[tNode.ring].length);
            
            return (
              <line
                key={i}
                x1={sp.cx} y1={sp.cy} x2={tp.cx} y2={tp.cy}
                stroke="white" strokeOpacity={0.1} strokeWidth={1}
              />
            );
          })}

          {/* All Ring Nodes */}
          {(["green", "yellow", "red"] as Ring[]).map(ring => (
            <g key={ring}>
              {ringGroups[ring].map((node, idx) => {
                const pos = getPosition(node, idx, ringGroups[ring].length);
                const isSelected = selectedNodeId === node.id;
                const fill = 
                  ring === "green" ? "#10b981" : 
                  ring === "yellow" ? "#f59e0b" : "#f43f5e";
                
                return (
                  <motion.g 
                    key={node.id} 
                    cursor="pointer"
                    onClick={() => selectNode(isSelected ? null : node.id)}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.2 }}
                  >
                    <circle
                      cx={pos.cx} cy={pos.cy} r={pos.size + (isSelected ? 4 : 0)}
                      fill={isSelected ? 'white' : fill}
                      className="transition-all duration-300"
                    />
                    {isSelected && (
                      <circle
                        cx={pos.cx} cy={pos.cy} r={pos.size + 8}
                        fill="none" stroke="white" strokeWidth={1} strokeOpacity={0.3}
                        className="animate-ping"
                      />
                    )}
                    <text
                      x={pos.cx} y={pos.cy + pos.size + 16}
                      textAnchor="middle"
                      fill={isSelected ? "white" : "white"}
                      fillOpacity={isSelected ? 1 : 0.4}
                      fontSize={10}
                      fontWeight={isSelected ? 900 : 500}
                    >
                      {node.label}
                    </text>
                  </motion.g>
                );
              })}
            </g>
          ))}
        </svg>

        {/* Hidden Pattern Overlays */}
        <div className="absolute top-8 right-8 flex flex-col gap-2 max-w-[240px] z-20">
          <AnimatePresence>
            {insights.hiddenPatterns.map((pattern, idx) => (
              <motion.div
                key={pattern.kind + idx}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="p-3 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md shadow-xl flex gap-3 items-start"
              >
                <div className={`p-1.5 rounded-lg ${
                  pattern.severity === 'high' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-400/20 text-amber-400'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-white/40 mb-1">{pattern.kind.replace(/_/g, ' ')}</div>
                  <div className="text-[11px] text-white/80 leading-tight leading-relaxed">{pattern.description}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="absolute bottom-8 left-8 flex items-center gap-2 text-white/30 text-[10px] font-bold tracking-tighter uppercase z-20">
          <Layers className="w-3 h-3" />
          Dawayir Engine v2.45
        </div>
      </div>
    </div>
  );
}
