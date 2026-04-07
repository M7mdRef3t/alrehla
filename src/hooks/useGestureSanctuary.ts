import { useEffect, useRef, useState } from "react";
import { orchestrator } from "@/ai/orchestrator/Core";

/**
 * useGestureSanctuary — محول الإشارات الفيزيائية إلى أوامر سكون
 * يرصد: الهز (Shake) والضغط المطول (Long Press)
 */
export function useGestureSanctuary() {
    const [isSanctuary, setIsSanctuary] = useState(false);
    const lastShakeRef = useRef<number>(0);

    useEffect(() => {
        // 1. رصد حركة الهز (Shake Detection)
        const handleMotion = (event: DeviceMotionEvent) => {
            const acc = event.accelerationIncludingGravity;
            if (!acc) return;

            const threshold = 15; // قوة الهز المطلوبة
            const delta = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);

            if (delta > threshold) {
                const now = Date.now();
                if (now - lastShakeRef.current > 2000) { // منع التكرار في ثانيتين
                    console.warn("📳 [GESTURE] Shake detected. Triggering Sanctuary.");
                    triggerSanctuary();
                    lastShakeRef.current = now;
                }
            }
        };

        if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
            window.addEventListener("devicemotion", handleMotion);
        }

        return () => window.removeEventListener("devicemotion", handleMotion);
    }, []);

    const triggerSanctuary = () => {
        orchestrator.activateSanctuary();
        setIsSanctuary(true);

        // إشعار بسيط جداً (هزة خفيفة للموبايل لو الموبايل بيدعم Vibrate)
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    };

    const exitSanctuary = () => {
        orchestrator.exitSanctuary();
        setIsSanctuary(false);
    };

    // 2. منطق الضغط المطول (Long Press Logic)
    const longPressTimeout = useRef<any>(null);

    const onTouchStart = () => {
        longPressTimeout.current = setTimeout(() => {
            console.warn("👆 [GESTURE] Long Press detected. Triggering Sanctuary.");
            triggerSanctuary();
        }, 2000); // ثانيتين من السكون
    };

    const onTouchEnd = () => {
        if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    };

    return {
        isSanctuary,
        exitSanctuary,
        gestureHandlers: {
            onTouchStart,
            onTouchEnd,
            onMouseDown: onTouchStart,
            onMouseUp: onTouchEnd
        }
    };
}
