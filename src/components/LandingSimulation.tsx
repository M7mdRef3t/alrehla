import { useState, useRef, useCallback } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";

/** Internal coordinate system is 320x320. All drag/ring math uses this base. */
const BASE = 320;
const CENTER_OFFSET_Y = 112; // distance from center to start position (85% of 320 - 50%)

export function LandingSimulation() {
    const [activeZone, setActiveZone] = useState<"green" | "yellow" | "red" | null>(null);
    const [placed, setPlaced] = useState(false);
    const controls = useAnimation();
    const constraintsRef = useRef<HTMLDivElement>(null);
    const [hintVisible, setHintVisible] = useState(true);

    const rings = [
        { id: "green", radius: 70, color: "#34d399", label: "قريب", labelAr: "الآمن" },
        { id: "yellow", radius: 110, color: "#fbbf24", label: "متذبذب", labelAr: "نطاق اضطراب" },
        { id: "red", radius: 150, color: "#f87171", label: "بعيد", labelAr: "نطاق استنزاف" },
    ] as const;

    /** Get scale factor: actual container width / BASE (320). */
    const getScale = useCallback(() => {
        if (!constraintsRef.current) return 1;
        return constraintsRef.current.offsetWidth / BASE;
    }, []);

    const handleDrag = (_: unknown, info: PanInfo) => {
        if (hintVisible) setHintVisible(false);
        const s = getScale();
        const currentX = info.offset.x / s;
        const currentY = CENTER_OFFSET_Y + info.offset.y / s;
        const dist = Math.sqrt(currentX * currentX + currentY * currentY);

        if (dist < 80) setActiveZone("green");
        else if (dist < 120) setActiveZone("yellow");
        else if (dist < 165) setActiveZone("red");
        else setActiveZone(null);
    };

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        const s = getScale();
        const currentX = info.offset.x / s;
        const currentY = CENTER_OFFSET_Y + info.offset.y / s;
        const dist = Math.sqrt(currentX * currentX + currentY * currentY);

        let targetZone: "green" | "yellow" | "red" | null = null;
        let targetRadius = 0;

        if (dist < 85) { targetZone = "green"; targetRadius = 60; }
        else if (dist < 125) { targetZone = "yellow"; targetRadius = 100; }
        else if (dist < 180) { targetZone = "red"; targetRadius = 140; }

        if (targetZone) {
            setPlaced(true);
            setActiveZone(targetZone);

            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(targetZone === "red" ? [50, 30, 50] : targetZone === "yellow" ? [40] : [20]);
            }

            const angle = Math.atan2(currentY, currentX);
            const snapX = Math.cos(angle) * targetRadius * s;
            const snapY = (Math.sin(angle) * targetRadius - CENTER_OFFSET_Y) * s;

            controls.start({
                x: snapX,
                y: snapY,
                transition: { type: "spring", stiffness: 300, damping: 20 }
            });
        } else {
            setPlaced(false);
            setActiveZone(null);
            controls.start({ x: 0, y: 0, transition: { type: "spring" } });
        }
    };

    return (
        <div
            className="relative w-full max-w-[320px] aspect-square mx-auto my-6 select-none"
            ref={constraintsRef}
            aria-label="محاكاة تفاعلية للوضع في المدرات"
        >
            <div className="sr-only" aria-live="polite" aria-atomic="true">
                {placed
                    ? `تم التثبيت في: ${rings.find(r => r.id === activeZone)?.labelAr ?? "لم يحدد"}`
                    : activeZone
                        ? `يحوم حالياً فوق: ${rings.find(r => r.id === activeZone)?.labelAr}`
                        : "اسحب الهدف لتسكينه في أحد المدارات"
                }
            </div>
            {/* Background Rings — sizes as % of container (radius/160 * 100) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                {rings.map((ring) => {
                    const pct = (ring.radius / (BASE / 2)) * 100;
                    return (
                        <motion.div
                            key={ring.id}
                            className="absolute rounded-full flex items-start justify-center pt-2 transition-all duration-300"
                            animate={{
                                scale: activeZone === ring.id ? 1.05 : 1,
                                borderColor: activeZone === ring.id ? ring.color : "rgba(255,255,255,0.1)",
                                backgroundColor: activeZone === ring.id ? `${ring.color}15` : "transparent",
                            }}
                            style={{
                                width: `${pct}%`,
                                height: `${pct}%`,
                                borderWidth: 1.5,
                                borderStyle: "dashed",
                                zIndex: 1
                            }}
                        >
                            <span
                                className="text-[clamp(0.625rem,2.5vw,0.875rem)] font-bold transition-all duration-300 whitespace-nowrap"
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
                    );
                })}

                {/* Center Self */}
                <div className="absolute w-[15%] aspect-square rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center z-10 shadow-2xl shadow-teal-900/30">
                    <span className="text-[clamp(0.625rem,2.5vw,0.875rem)] text-slate-400 font-bold">المركز</span>
                </div>
            </div>

            {/* Draggable Node */}
            <motion.div
                className="absolute w-[14%] aspect-square rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-20 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                tabIndex={0}
                role="button"
                aria-label="الهدف المراد تسكينه، اسحبه وأفلته، أو العب بالأسهم للمحاكاة"
                aria-grabbed={!placed}
                style={{
                    background: placed
                        ? activeZone === "green" ? "#34d399" : activeZone === "yellow" ? "#fbbf24" : "#f87171"
                        : "rgba(255,255,255,0.1)",
                    border: "2px solid rgba(255,255,255,0.4)",
                    color: placed ? "#0f172a" : "#fff",
                    left: "50%",
                    top: "85%",
                    transform: "translate(-50%, -50%)"
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
                onKeyDown={(e) => {
                    const zones = [null, "green", "yellow", "red"] as const;
                    const currentIndex = zones.indexOf(activeZone);
                    const s = getScale();
                    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                        e.preventDefault();
                        const nextIndex = currentIndex < 3 ? currentIndex + 1 : 3;
                        setActiveZone(zones[nextIndex]);
                        setPlaced(false);
                    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                        e.preventDefault();
                        const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
                        setActiveZone(zones[nextIndex]);
                        setPlaced(false);
                    } else if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (activeZone) {
                            const target = activeZone === "red" ? 140 : activeZone === "yellow" ? 100 : 60;
                            setPlaced(true);
                            controls.start({ x: target * s, y: (target - CENTER_OFFSET_Y) * s, transition: { type: "spring" } });
                        }
                    }
                }}
            >
                <span className="text-[clamp(0.625rem,2.5vw,0.875rem)] font-bold">{placed ? "جاهز" : "هدف"}</span>
            </motion.div>

            {/* Simulation Hint */}
            <div
                className={`absolute bottom-0 left-0 right-0 text-center pointer-events-none transition-opacity duration-500 ${hintVisible && !placed ? "opacity-100" : "opacity-0"}`}
            >
                <p className="text-[clamp(0.625rem,2.5vw,0.875rem)] text-slate-400/80 animate-pulse bg-slate-900/50 inline-block px-3 py-1 rounded-full border border-white/5" aria-hidden="true">
                    جرب رصد "هدف" وسحبه للمدار
                </p>
            </div>
        </div>
    );
}
