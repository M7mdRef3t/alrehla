import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DawayirGraph, DawayirNode, Ring, GraphInsights, EdgeType } from "../types";
import { 
  createGraph, createNode, createEdge, analyzeGraph
} from "../services/engine";
import { eventBus as bus } from "@/shared/events/bus";
import { zustandIdbStorage } from '@/utils/idbStorage';


interface DawayirState {
  graph: DawayirGraph;
  insights: GraphInsights;
  selectedNodeId: string | null;
  
  // Actions
  addNode: (label: string, ring: Ring, score?: number) => void;
  updateNode: (id: string, updates: Partial<DawayirNode>) => void;
  removeNode: (id: string) => void;
  archiveNode: (id: string) => void;
  
  addEdge: (source: string, target: string, type: EdgeType, weight?: number) => void;
  removeEdge: (source: string, target: string) => void;
  
  selectNode: (id: string | null) => void;
  refreshInsights: () => void;
}

export const useDawayirStore = create<DawayirState>()(
  persist(
    (set, get) => ({
      graph: createGraph(),
      insights: analyzeGraph(createGraph()),
      selectedNodeId: null,

      addNode: (label, ring, score) => {
        const node = createNode(label, ring, score);
        const newGraph = {
          ...get().graph,
          nodes: [...get().graph.nodes, node],
        };
        
        set({ 
          graph: newGraph,
          insights: analyzeGraph(newGraph)
        });

        // Use correct event bus and events
        bus.emit("dawayir:node_added", { 
          nodeId: node.id, 
          ring: node.ring,
          label: node.label
        });
        
        // Tajmeed integration signal - use the real reward requested event in the future
        // For now, we use analytics as a proxy if needed, or custom events
        bus.emit("analytics:event", {
          name: "dawayir_node_added", storage: zustandIdbStorage,
          properties: { ring: node.ring }
        });
      },

      updateNode: (id, updates) => {
        const node = get().graph.nodes.find(n => n.id === id);
        const oldRing = node?.ring;
        
        const newNodes = get().graph.nodes.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
        );
        const newGraph = { ...get().graph, nodes: newNodes };
        
        set({ 
          graph: newGraph,
          insights: analyzeGraph(newGraph)
        });

        if (updates.ring && oldRing && updates.ring !== oldRing) {
          bus.emit("dawayir:ring_changed", {
            nodeId: id,
            from: oldRing,
            to: updates.ring
          });
        }
      },

      removeNode: (id) => {
        const newNodes = get().graph.nodes.filter((n) => n.id !== id);
        const newEdges = get().graph.edges.filter((e) => e.source !== id && e.target !== id);
        const newGraph = { ...get().graph, nodes: newNodes, edges: newEdges };
        
        set({ 
          graph: newGraph,
          insights: analyzeGraph(newGraph),
          selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId
        });
      },

      archiveNode: (id) => {
        const newNodes = get().graph.nodes.map((n) =>
          n.id === id ? { ...n, archived: true, updatedAt: new Date().toISOString() } : n
        );
        const newGraph = { ...get().graph, nodes: newNodes };
        
        set({ 
          graph: newGraph,
          insights: analyzeGraph(newGraph)
        });

        bus.emit("dawayir:node_archived", { nodeId: id });
        
        // Tajmeed integration signal
        bus.emit("analytics:event", {
          name: "dawayir_boundary_set", storage: zustandIdbStorage,
          properties: { nodeId: id }
        });
      },

      addEdge: (source, target, type, weight) => {
        const edge = createEdge(source, target, type, weight);
        const newEdges = [...get().graph.edges, edge];
        const newGraph = { ...get().graph, edges: newEdges };
        
        set({ 
          graph: newGraph,
          insights: analyzeGraph(newGraph)
        });
      },

      removeEdge: (source, target) => {
        const newEdges = get().graph.edges.filter(
          (e) => !(e.source === source && e.target === target)
        );
        const newGraph = { ...get().graph, edges: newEdges };
        
        set({ 
          graph: newGraph,
          insights: analyzeGraph(newGraph)
        });
      },

      selectNode: (id) => set({ selectedNodeId: id }),

      refreshInsights: () => {
        set({ insights: analyzeGraph(get().graph) });
      }
    }),
    {
      name: "alrehla-dawayir-storage", storage: zustandIdbStorage,
      partialize: (state) => ({ graph: state.graph }),
    }
  )
);
