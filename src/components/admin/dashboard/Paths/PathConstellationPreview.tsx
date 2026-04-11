import React, { useMemo, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  Position,
  Handle
} from "reactflow";
import "reactflow/dist/style.css";
import type { JourneyPathStep } from "@/domains/admin/store/admin.store";

interface PathConstellationPreviewProps {
  steps: JourneyPathStep[];
}

// Custom Node to match Dawayir's dark/glassmorphic interface
const CustomNode = ({ data }: { data: any }) => {
  const { title, kind, screen, description, isEnabled } = data;

  const bgStyles = {
    entry: "bg-emerald-500/10 border-emerald-500/30 text-emerald-100",
    check: "bg-indigo-500/10 border-indigo-500/30 text-indigo-100",
    decision: "bg-amber-500/10 border-amber-500/30 text-amber-100",
    intervention: "bg-blue-500/10 border-blue-500/30 text-blue-100",
    screen: "bg-slate-500/10 border-slate-500/30 text-slate-100",
    "telemetry-chaos": "bg-rose-500/10 border-rose-500/30 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.3)]",
    "telemetry-idle": "bg-violet-500/10 border-violet-500/30 text-violet-100",
    outcome: "bg-cyan-500/10 border-cyan-500/30 text-cyan-100"
  }[kind as string] || "bg-slate-800/50 border-slate-700 text-slate-200";

  return (
    <div className={`rounded-xl border p-3 min-w-[150px] shadow-sm backdrop-blur-md transition-all hover:scale-105 ${bgStyles} ${!isEnabled ? "opacity-50 grayscale" : ""}`}>
      <Handle type="target" position={Position.Top} className="bg-slate-400" />
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
          {kind}
        </span>
        <span className="text-sm font-bold">{title}</span>
        <span className="text-[10px] text-slate-300 opacity-60">[{screen}]</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="bg-slate-400" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode
};

export function PathConstellationPreview({ steps }: PathConstellationPreviewProps) {
  const nodes: Node[] = useMemo(() => {
    return steps.map((step, index) => ({
      id: step.id,
      type: "custom",
      position: { x: 250, y: index * 120 }, // Layout vertically
      data: {
        title: step.title,
        kind: step.kind,
        screen: step.screen,
        description: step.description,
        isEnabled: step.enabled
      }
    }));
  }, [steps]);

  const edges: Edge[] = useMemo(() => {
    const arr: Edge[] = [];
    for (let i = 0; i < steps.length - 1; i++) {
      arr.push({
        id: `e-${steps[i].id}-${steps[i + 1].id}`,
        source: steps[i].id,
        target: steps[i + 1].id,
        animated: steps[i].enabled && steps[i + 1].enabled,
        style: { stroke: "#64748b", strokeWidth: 2, opacity: steps[i].enabled ? 1 : 0.3 }
      });
    }
    return arr;
  }, [steps]);

  if (steps.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-[2rem] border border-slate-800 bg-[#0B0F19] text-sm text-slate-500">
        أضف خطوات لرؤية التشريح البصري
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full rounded-[2rem] border border-slate-800 bg-[#0B0F19] overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls className="fill-slate-400" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
