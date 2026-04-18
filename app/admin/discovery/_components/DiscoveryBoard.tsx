"use client";

import React, { useState, useEffect } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { DiscoveryItem, DiscoveryStage } from "@/types/discovery";
import BoardColumn from "./BoardColumn";
import ItemCard from "./ItemCard";
import ItemDetailModal from "./ItemDetailModal";
import { runtimeEnv } from "@/config/runtimeEnv";
import { supabase } from "@/infrastructure/database/client";
import { Brain, Sparkles } from "lucide-react";

const STAGES: DiscoveryStage[] = [
  "Inbox",
  "Needs Evidence",
  "Validated",
  "Prioritized",
  "In Delivery",
  "Shipped",
  "Dropped",
];

type DiscoveryBoardProps = {
  searchQuery?: string;
  latestItem?: DiscoveryItem | null;
  filters: {
    priority: string;
    source: string;
    funnel_stage: string;
  };
};

export default function DiscoveryBoard({ searchQuery = "", latestItem, filters }: DiscoveryBoardProps) {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<DiscoveryItem | null>(null);
  
  // Triage state
  const [triageData, setTriageData] = useState<{ summary: string; suggestions: any[] } | null>(null);
  const [triageLoading, setTriageLoading] = useState(false);

  const adminCode = runtimeEnv.adminCode ?? "";

  useEffect(() => {
    // 1. Initial Fetch
    fetch("/api/admin/discovery", {
      headers: { Authorization: `Bearer ${adminCode}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
        setLoading(false);
      })
      .catch(console.error);

    // 2. Post-fetch Realtime Subscription
    if (!supabase) return;

    const channel = supabase.channel('discovery_items_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'discovery_items' },
        (payload) => {
          console.log('[Discovery] Realtime Sync Event:', payload);
          setItems(current => {
            if (payload.eventType === 'INSERT') {
               const exists = current.some(i => i.id === payload.new.id);
               return exists ? current : [payload.new as DiscoveryItem, ...current];
            }
            if (payload.eventType === 'UPDATE') {
               // Merge with existing to preserve local optimistic states if needed, though override is safer.
               return current.map(item => item.id === payload.new.id ? { ...item, ...payload.new } : item);
            }
            if (payload.eventType === 'DELETE') {
               return current.filter(item => item.id !== payload.old?.id);
            }
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [adminCode]);

  // Prepend newly captured signal optimistically
  useEffect(() => {
    if (latestItem) {
      setItems((prev) => {
        const already = prev.some((i) => i.id === latestItem.id);
        return already ? prev : [latestItem, ...prev];
      });
    }
  }, [latestItem]);

  const filtered = items.filter((i) => {
    const matchesSearch = !searchQuery.trim() || 
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = filters.priority === "all" || i.priority === filters.priority;
    const matchesSource = filters.source === "all" || i.source === filters.source;
    const matchesFunnel = filters.funnel_stage === "all" || i.funnel_stage === filters.funnel_stage;

    return matchesSearch && matchesPriority && matchesSource && matchesFunnel;
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveContainer = STAGES.includes(activeId as DiscoveryStage);
    const isOverContainer = STAGES.includes(overId as DiscoveryStage);

    if (isActiveContainer) return; // We aren't dragging columns

    setItems((items) => {
      const activeIndex = items.findIndex((t) => t.id === activeId);
      const overIndex = items.findIndex((t) => t.id === overId);
      const activeItem = items[activeIndex];
      
      // Dropping item over a column
      if (isOverContainer) {
        if (activeItem.stage !== overId) {
          // Optimistically update UI
          const newItems = items.map(item => 
            item.id === activeItem.id ? { ...item, stage: overId as DiscoveryStage } : item
          );
          // Persist
          fetch("/api/admin/discovery", {
            method: "PATCH",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${adminCode}`
            },
            body: JSON.stringify({ id: activeItem.id, updates: { stage: overId } })
          }).catch(console.error);
          return newItems;
        }
        return items;
      }

      // Dropping item over another item
      if (!isOverContainer && overIndex >= 0) {
        const overItem = items[overIndex];
        const newItems = [...items];
        
        if (activeItem.stage !== overItem.stage) {
          newItems[activeIndex] = { ...activeItem, stage: overItem.stage };
          // Persist
          fetch("/api/admin/discovery", {
            method: "PATCH",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${adminCode}`
            },
            body: JSON.stringify({ id: activeItem.id, updates: { stage: overItem.stage } })
          }).catch(console.error);
        }

        return arrayMove(newItems, activeIndex, overIndex);
      }

      return items;
    });
  };

  const handleDragEnd = () => {
    setActiveId(null);
  };

  const handleUpdate = (id: string, updates: Partial<DiscoveryItem>) => {
    setItems((prev) => 
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/discovery?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminCode}` },
      });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const runTriage = async () => {
    setTriageLoading(true);
    try {
      const res = await fetch("/api/admin/discovery/triage", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminCode}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTriageData(data);
      } else {
        console.error("Triage Error", await res.text());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTriageLoading(false);
    }
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  if (loading) {
    return <div className="p-12 text-center text-neutral-500 animate-pulse">Loading signals pipeline...</div>;
  }

  const totalSignals = items.length;
  const prioritized = items.filter(i => i.stage === "Prioritized").length;
  const shipped = items.filter(i => i.stage === "Shipped").length;
  const validated = items.filter(i => ["Validated", "Prioritized", "In Delivery", "Shipped"].includes(i.stage)).length;
  const validationRate = totalSignals > 0 ? Math.round((validated / totalSignals) * 100) : 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="px-6 pt-4 pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-neutral-800/50 border border-white/5 rounded-xl p-4">
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Total Signals</p>
            <p className="text-2xl font-black text-white">{totalSignals}</p>
          </div>
          <div className="bg-neutral-800/50 border border-white/5 rounded-xl p-4">
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Prioritized</p>
            <p className="text-2xl font-black text-purple-400">{prioritized}</p>
          </div>
          <div className="bg-neutral-800/50 border border-white/5 rounded-xl p-4">
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Shipped</p>
            <p className="text-2xl font-black text-emerald-400">{shipped}</p>
          </div>
          <div className="bg-neutral-800/50 border border-white/5 rounded-xl p-4">
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Validation Rate</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-blue-400">{validationRate}%</p>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${validationRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <button
            onClick={runTriage}
            disabled={triageLoading}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all font-bold text-sm tracking-wide disabled:opacity-50"
          >
            {triageLoading ? <Sparkles className="w-5 h-5 animate-pulse" /> : <Brain className="w-5 h-5" />}
            Cognitive Triage (Analyze Inbox)
          </button>
        </div>

        {triageData && (
          <div className="mb-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 text-sm text-indigo-200">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-100 block mb-1">Crucible Synthesis:</strong>
                <p>{triageData.summary}</p>
                {triageData.suggestions?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {triageData.suggestions.map((s: any, idx: number) => (
                      <div key={idx} className="bg-indigo-900/40 p-2 rounded border border-indigo-500/20">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded mr-2">{s.type}</span>
                        <span>{s.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 px-6 pb-6 h-[calc(100vh-14rem)] overflow-x-auto overflow-y-hidden">
        {STAGES.map((stage) => {
          const columnItems = filtered.filter((i) => i.stage === stage);
          return (
            <BoardColumn key={stage} id={stage} title={stage}>
              <SortableContext items={columnItems.map((i) => i.id)}>
                <div className="flex flex-col gap-3 min-h-[150px]">
                  {columnItems.map((item) => (
                    <ItemCard 
                      key={item.id} 
                      item={item} 
                      onClick={setSelectedItem}
                    />
                  ))}
                </div>
              </SortableContext>
            </BoardColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeItem ? <ItemCard item={activeItem} isOverlay /> : null}
      </DragOverlay>

      {selectedItem && (
        <ItemDetailModal 
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </DndContext>
  );
}
