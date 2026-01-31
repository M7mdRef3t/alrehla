import { useDroppable } from "@dnd-kit/core";

type RingId = "green" | "yellow" | "red";

interface DroppableZoneProps {
  ring: RingId;
  label: string;
  bg: string;
  border: string;
  onPlace: (ring: RingId) => void;
}

export function DroppableZone({ ring, label, bg, border, onPlace }: DroppableZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id: ring });
  
  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={() => onPlace(ring)}
      className={`flex flex-col items-center justify-center rounded-2xl border-2 min-h-[80px] transition-all ${bg} ${border} ${
        isOver ? "ring-4 ring-teal-400 ring-offset-2 scale-[1.02]" : "hover:scale-[1.02]"
      }`}
    >
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="text-xs text-slate-600 mt-0.5">اضغط أو اسحب الدائرة هنا</span>
    </button>
  );
}

export type { RingId };
