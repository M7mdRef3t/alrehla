import { logger } from "@/services/logger";
import type { FC } from "react";
import { useState } from "react";
import { useMapState } from '@/modules/map/dawayirIndex';
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { DatabaseZap, Loader2, CheckCircle2 } from "lucide-react";
import type { Ring } from "@/modules/map/mapTypes";

export const DemoInjector: FC = () => {
    const [status, setStatus] = useState<"idle" | "injecting" | "success" | "error">("idle");

    const handleInjectData = async () => {
        setStatus("injecting");
        try {
            // 1. Clear existing local state for clean demo
            useMapState.getState().resetMap();

            // 2. Add Demo Relationships
            const demoNodes = [
                { id: "demo-1", name: "محمود (مدير سام)", context: "عمل", category: "work", distance: 100, angle: 45, energyDelta: -5, lastEnergy: -5, ring: "red" as Ring },
                { id: "demo-2", name: "أحمد (صديق داعم)", context: "صداقة", category: "friends", distance: 150, angle: 120, energyDelta: 4, lastEnergy: 4, ring: "green" as Ring },
                { id: "demo-3", name: "سارة (شريك حياة)", context: "عائلة", category: "family", distance: 80, angle: 250, energyDelta: 2, lastEnergy: 2, ring: "yellow" as Ring },
                { id: "demo-4", name: "عمرو (استنزاف خفي)", context: "معارف", category: "others", distance: 200, angle: 320, energyDelta: -1, lastEnergy: -1, ring: "yellow" as Ring }
            ];

            demoNodes.forEach(n => {
                const addedId = useMapState.getState().addNode(
                    n.name,
                    n.ring
                );

                // MapNode uses x/y. Calculate from demo distance/angle.
                const radians = n.angle * (Math.PI / 180);
                const x = Math.cos(radians) * n.distance;
                const y = Math.sin(radians) * n.distance;

                // Update specific placements to match the visual need
                useMapState.getState().updateNode(addedId, {
                    x,
                    y,
                    goalId: n.category,
                    categoryId: n.category as unknown as string,
                    stagnationDays: n.id === "demo-4" ? 14 : 0, // Make Amr stagnant for visual effect
                    zone: 'active' // Ensure they show up
                } as unknown as never);

                // Initial energy balance mock
                useMapState.getState().addEnergyTransaction(addedId, n.energyDelta, "رصيد ديمو");

                if (n.id === "demo-4") {
                    useMapState.getState().updateNode(addedId, {
                        lastRingChangeAt: Date.now() - (14 * 24 * 60 * 60 * 1000)
                    });
                }
            });

            // 3. Inject Historical Pulses (Past 14 days)
            const now = Date.now();
            const dayMs = 24 * 60 * 60 * 1000;
            const energies = [
                6, 5, 4, // Drop
                5, 7, 8, // Recover
                6, 4, 3, // Drop again
                4, 5, 6, // Stable
                3, 2     // Recent Burnout (Alert threshold)
            ];

            // Only log locally for the demo visual if real DB sync isn't needed
            energies.forEach((energy, index) => {
                const timestamp = now - ((energies.length - index) * dayMs);
                usePulseState.getState().logPulse({
                    energy,
                    mood: 'stressed',
                    focus: 'work',
                    notes: index === energies.length - 1 ? "استنزاف شديد اليوم" : undefined,
                    timestamp
                } as unknown as never);
            });

            setStatus("success");
            setTimeout(() => setStatus("idle"), 3000);
        } catch (e) {
            logger.error("Demo injection failed", e);
            setStatus("error");
        }
    };

    return (
        <button
            onClick={handleInjectData}
            disabled={status === "injecting" || status === "success"}
            className="w-full flex items-center justify-between p-4 rounded-2xl text-right transition-all group mt-4 mb-2"
            style={{
                background: status === "success" ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.05)",
                border: `1px solid ${status === "success" ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.2)"}`,
            }}
        >
            <div className="flex-1 text-right">
                <p className={`text-sm font-bold ${status === "success" ? "text-emerald-400" : "text-rose-400"}`}>
                    محقن الديمو (للمستثمرين)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">يملأ الخريطة بعلاقات وأرقام للعرض الفوري</p>
            </div>
            {status === "idle" && (
                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/40 transition-colors">
                    <DatabaseZap className="w-4 h-4 text-rose-500" />
                </div>
            )}
            {status === "injecting" && <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />}
            {status === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        </button>
    );
};
