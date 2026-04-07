import { useState, useEffect } from "react";
import { getWindowOrNull } from "@/services/clientRuntime";

const AB_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function useABTestingVariant(
    variantKey: string,
    startedAtKey: string
): "A" | "B" {
    const [variant, setVariant] = useState<"A" | "B">(() => {
        if (typeof window === "undefined") return "A";
        try {
            const stored = window.localStorage.getItem(variantKey);
            if (stored === "A" || stored === "B") return stored;
        } catch {
            // Ignore
        }
        return "A";
    });

    useEffect(() => {
        const windowRef = getWindowOrNull();
        if (!windowRef) return;
        try {
            const now = Date.now();
            const storage = windowRef.localStorage;
            const startedRaw = storage.getItem(startedAtKey);
            const variantRaw = storage.getItem(variantKey);

            const startedAt = startedRaw ? Number(startedRaw) : NaN;
            const hasValidWindow = Number.isFinite(startedAt) && now - startedAt <= AB_WINDOW_MS;

            if (!hasValidWindow) {
                storage.setItem(startedAtKey, String(now));
                const nextVariant: "A" | "B" = Math.random() < 0.5 ? "A" : "B";
                storage.setItem(variantKey, nextVariant);
                setVariant(nextVariant);
            } else if (variantRaw === "A" || variantRaw === "B") {
                setVariant(variantRaw);
            } else {
                const fallbackVariant: "A" | "B" = Math.random() < 0.5 ? "A" : "B";
                storage.setItem(variantKey, fallbackVariant);
                setVariant(fallbackVariant);
            }
        } catch {
            setVariant("A");
        }
    }, [variantKey, startedAtKey]);

    return variant;
}
