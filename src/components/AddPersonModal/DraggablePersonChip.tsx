import { useDraggable } from "@dnd-kit/core";

interface DraggablePersonChipProps {
  personLabel: string;
}

export function DraggablePersonChip({ personLabel }: DraggablePersonChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: "new-person" });
  
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`rounded-full bg-white border-2 border-teal-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg cursor-grab active:cursor-grabbing select-none ${
        isDragging ? "opacity-90 scale-105 shadow-xl" : ""
      }`}
    >
      {personLabel}
    </div>
  );
}
