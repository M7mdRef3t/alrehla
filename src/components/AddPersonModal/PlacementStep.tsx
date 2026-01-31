import { DndContext, TouchSensor, MouseSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { mapCopy } from "../../copy/map";
import { DraggablePersonChip } from "./DraggablePersonChip";
import { DroppableZone, type RingId } from "./DroppableZone";

const RING_ZONES: { id: RingId; label: string; bg: string; border: string }[] = [
  { id: "green", label: mapCopy.legendGreen, bg: "bg-teal-400/20", border: "border-teal-400" },
  { id: "yellow", label: mapCopy.legendYellow, bg: "bg-amber-400/20", border: "border-amber-400" },
  { id: "red", label: mapCopy.legendRed, bg: "bg-rose-400/20", border: "border-rose-400" }
];

interface PlacementStepProps {
  personLabel: string;
  onPlace: (ring: RingId) => void;
}

export function PlacementStep({ personLabel, onPlace }: PlacementStepProps) {
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5
    }
  });
  const sensors = useSensors(mouseSensor, touchSensor);
  
  const handleDragEnd = (event: DragEndEvent) => {
    const over = event.over;
    if (over && (over.id === "green" || over.id === "yellow" || over.id === "red")) {
      onPlace(over.id as RingId);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-xl font-bold text-slate-900 mb-1">{mapCopy.placementTitle}</h2>
      <p className="text-sm text-gray-600 mb-6">{mapCopy.placementHint}</p>

      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="grid grid-cols-1 gap-3 mb-8">
          {RING_ZONES.map((z) => (
            <DroppableZone
              key={z.id}
              ring={z.id}
              label={z.label}
              bg={z.bg}
              border={z.border}
              onPlace={onPlace}
            />
          ))}
        </div>

        <div className="flex justify-center pt-4 pb-2" aria-label="الدائرة في إيدك">
          <DraggablePersonChip personLabel={personLabel} />
        </div>
        <p className="text-xs text-gray-500">اسحب الدائرة فوق المنطقة واتركها</p>
      </DndContext>
    </div>
  );
}

export { type RingId };
