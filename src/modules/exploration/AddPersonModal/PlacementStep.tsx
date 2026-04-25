import { DndContext, TouchSensor, MouseSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { mapCopy } from "@/copy/map";
import { addPersonCopy } from "@/copy/addPerson";
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
  /** اقتراح الدائرة من الأسئلة السريعة */
  suggestedRing?: RingId;
  suggestionReason?: string;
}

export function PlacementStep({ personLabel, onPlace, suggestedRing, suggestionReason }: PlacementStepProps) {
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

  const suggestedLabel = suggestedRing ? RING_ZONES.find((z) => z.id === suggestedRing)?.label : null;

  return (
    <div className="text-center px-2">
      <h2 className="text-2xl font-black text-[var(--consciousness-text)] mb-2">{mapCopy.placementTitle}</h2>
      <p className="text-base text-[var(--consciousness-text-muted)] leading-relaxed mb-6">{mapCopy.placementHint}</p>

      {suggestedRing && suggestionReason && suggestedLabel && (
        <div className="mb-6 p-5 bg-teal-500/10 border border-teal-500/30 backdrop-blur-md rounded-2xl text-right relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 blur-2xl group-hover:bg-teal-500/10 transition-all" />
          <p className="text-sm font-black text-teal-500 dark:text-teal-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400 animate-pulse" />
            {addPersonCopy.suggestionPrefix} «{suggestedLabel}»
          </p>
          <p className="text-sm text-[var(--consciousness-text-muted)] font-medium leading-relaxed">{suggestionReason}</p>
        </div>
      )}

      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="grid grid-cols-1 gap-3 mb-10">
          {RING_ZONES.map((z) => {
            const isSuggested = suggestedRing === z.id;
            return (
              <DroppableZone
                key={z.id}
                ring={z.id}
                label={z.label}
                bg={z.bg}
                border={z.border}
                onPlace={onPlace}
                highlight={isSuggested}
              />
            );
          })}
        </div>

        <div className="flex justify-center pt-2 pb-4" aria-label="الدائرة في إيدك">
          <DraggablePersonChip personLabel={personLabel} />
        </div>
        <p className="text-sm font-bold text-[var(--consciousness-text-muted)] opacity-60 animate-bounce mt-2">
          اسحب الدائرة فوق المنطقة واتركها لتثبيت الإحداثيات
        </p>
      </DndContext>
    </div>
  );
}

export { type RingId };


