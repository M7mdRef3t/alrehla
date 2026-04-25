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
      className={`rounded-full bg-teal-500/20 border-2 border-teal-500 px-8 py-3.5 text-sm font-black text-teal-900 dark:text-teal-50 cursor-grab active:cursor-grabbing select-none shadow-[0_0_20px_rgba(20,184,166,0.2)] backdrop-blur-md ${
        isDragging ? "opacity-90" : "opacity-100"
      }`}
    >
      {personLabel}
    </div>
  );
}


