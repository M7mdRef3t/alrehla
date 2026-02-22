import { useState, useRef } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";

export function LandingSimulation() {
    const [activeZone, setActiveZone] = useState<"green" | "yellow" | "red" | null>(null);
    const [placed, setPlaced] = useState(false);
    const controls = useAnimation();
    const constraintsRef = useRef<HTMLDivElement>(null);
    const [hintVisible, setHintVisible] = useState(true);

    // Rings definition
    const rings = [
        { id: "green", radius: 70, color: "#34d399", label: "قريب", labelAr: "النطاق الآمن" },
        { id: "yellow", radius: 110, color: "#fbbf24", label: "متذبذب", labelAr: "منطقة اضطراب" },
        { id: "red", radius: 150, color: "#f87171", label: "بعيد", labelAr: "نطاق استنزاف" },
    ] as const;

    // Since draggable starts at (50%, 85%) relative to container 320x320
    // Center is (160, 160). Start is (160, 272).
    // Delta Y is 112px down.
    // We need to track actual position.

    const handleDrag = (_: unknown, info: PanInfo) => {
        if (hintVisible) setHintVisible(false);

        // Approximate distance from center
        // Starting offset from center is (0, 112)
        const currentX = info.offset.x;
        const currentY = 112 + info.offset.y;
        const dist = Math.sqrt(currentX * currentX + currentY * currentY);

        if (dist < 80) setActiveZone("green");
        else if (dist < 120) setActiveZone("yellow");
        else if (dist < 165) setActiveZone("red");
        else setActiveZone(null);
    };

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        const currentX = info.offset.x;
        const currentY = 112 + info.offset.y;
        const dist = Math.sqrt(currentX * currentX + currentY * currentY);

        let targetZone: "green" | "yellow" | "red" | null = null;
        let targetRadius = 0;

        if (dist < 85) { targetZone = "green"; targetRadius = 60; }
        else if (dist < 125) { targetZone = "yellow"; targetRadius = 100; }
        else if (dist < 180) { targetZone = "red"; targetRadius = 140; }

        if (targetZone) {
            setPlaced(true);
            setActiveZone(targetZone);
            // Snap to that radius at current angle
            const angle = Math.atan2(currentY, currentX);
            const snapX = Math.cos(angle) * targetRadius;
            const snapY = Math.sin(angle) * targetRadius - 112; // adjust back to offset relative to start

            controls.start({
                x: snapX,
                y: snapY,
                transition: { type: "spring", stiffness: 300, damping: 20 }
            });
        } else {
            // Return to start
            setPlaced(false);
            setActiveZone(null);
            controls.start({ x: 0, y: 0, transition: { type: "spring" } });
        }
    };

    return (
        <div className="relative w-[320px] h-[320px] mx-auto my-6 select-none" ref={constraintsRef}>
            {/* Background Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {rings.map((ring) => (
                    <motion.div
                        key={ring.id}
                        className="absolute rounded-full flex items-start justify-center pt-2 transition-all duration-300"
                        animate={{
                            scale: activeZone === ring.id ? 1.05 : 1,
                            borderColor: activeZone === ring.id ? ring.color : "rgba(255,255,255,0.1)",
                            backgroundColor: activeZone === ring.id ? `${ring.color}15` : "transparent",
                        }}
                        style={{
                            width: ring.radius * 2,
                            height: ring.radius * 2,
                            borderWidth: 1.5,
                            borderStyle: "dashed",
                            zIndex: 1
                        }}
                    >
                        <span
                            className="text-[10px] font-medium transition-all duration-300"
                            style={{
                                color: ring.color,
                                opacity: activeZone === ring.id || placed ? 1 : 0,
                                background: "rgba(15,23,42,0.9)",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                marginTop: "-11px",
                                boxShadow: `0 0 10px ${ring.color}40`,
                                transform: activeZone === ring.id ? "translateY(0)" : "translateY(4px)"
                            }}
                        >
                            {ring.labelAr}
                        </span>
                    </motion.div>
                ))}

                {/* Center Self */}
                <div className="absolute w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center z-10 shadow-2xl shadow-teal-900/30">
                    <span className="text-[10px] text-slate-400 font-medium">المركز</span>
                </div>
            </div>

            {/* Draggable Node */}
            <motion.div
                className="absolute w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-20 backdrop-blur-md"
                style={{
                    background: placed
                        ? activeZone === "green" ? "#34d399" : activeZone === "yellow" ? "#fbbf24" : "#f87171"
                        : "rgba(255,255,255,0.1)",
                    border: "2px solid rgba(255,255,255,0.4)",
                    color: placed ? "#0f172a" : "#fff",
                    left: "50%",
                    top: "85%",
                    marginLeft: -28, // explicit centering because x/y transform is used for drag
                    marginTop: -28
                }}
                drag
                dragConstraints={constraintsRef}
                dragElastic={0.2}
                dragMomentum={false}
                onDragStart={() => setPlaced(false)}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={controls}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <span className="text-xs font-bold">{placed ? "جاهز" : "هدف"}</span>
            </motion.div>

            {/* Simulation Hint */}
            <div
                className={`absolute bottom-0 left-0 right-0 text-center pointer-events-none transition-opacity duration-500 ${hintVisible && !placed ? "opacity-100" : "opacity-0"}`}
            >
                <p className="text-[11px] text-slate-400/80 animate-pulse bg-slate-900/50 inline-block px-3 py-1 rounded-full border border-white/5">
                    جرب رصد "هدف" وسحبه للمدار
                </p>
            </div>
        </div>
    );
}
