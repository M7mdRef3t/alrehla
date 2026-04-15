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
  DragOverEvent,
  DragEndEvent
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { DiscoveryItem, DiscoveryStage } from "@/types/discovery";
import BoardColumn from "./BoardColumn";
import ItemCard from "./ItemCard";

const STAGES: DiscoveryStage[] = [
  "Inbox", 
  "Needs Evidence", 
  "Validated", 
  "Prioritized", 
  "In Delivery", 
  "Shipped"
];

// Initial mock data
const INITIAL_ITEMS: DiscoveryItem[] = [
  {
    id: "item-1",
    title: "Review automated activation pipeline",
    description: "Connect VF Cash with webhooks.",
    source: "ops_insight",
    stage: "Inbox",
    priority: "high",
    facts: ["Manual verification takes 2hrs avg"],
    interpretations: ["This bottleneck restricts scaling campaigns"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "item-2",
    title: "Implement mobile-first checkout",
    description: "Reduce friction on the /activation route.",
    source: "user_signal",
    stage: "Shipped",
    priority: "critical",
    facts: [],
    interpretations: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export default function DiscoveryBoard() {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/discovery")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setItems(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: activeItem.id, updates: { stage: overId } })
          }).catch(console.error);
          return newItems;
        }
        return items;
      }

      // Dropping item over another item
      if (!isOverContainer && overIndex >= 0) {
        const overItem = items[overIndex];
        let newItems = [...items];
        
        if (activeItem.stage !== overItem.stage) {
          newItems[activeIndex] = { ...activeItem, stage: overItem.stage };
          // Persist
          fetch("/api/admin/discovery", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: activeItem.id, updates: { stage: overItem.stage } })
          }).catch(console.error);
        }

        return arrayMove(newItems, activeIndex, overIndex);
      }

      return items;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeIndex = items.findIndex(t => t.id === activeId);
    const overIndex = items.findIndex(t => t.id === overId);

    if (activeIndex !== overIndex && overIndex >= 0) {
       setItems((items) => arrayMove(items, activeIndex, overIndex));
    }
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  if (loading) {
    return <div className="p-12 text-center text-neutral-500 animate-pulse">Loading signals pipeline...</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-6 h-[calc(100vh-6rem)] overflow-x-auto overflow-y-hidden">
        {STAGES.map((stage) => {
          const columnItems = items.filter((i) => i.stage === stage);
          return (
            <BoardColumn key={stage} id={stage} title={stage}>
              <SortableContext items={columnItems.map((i) => i.id)}>
                <div className="flex flex-col gap-3 min-h-[150px]">
                  {columnItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
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
    </DndContext>
  );
}
