/**
 * BadgeShareHost.tsx
 * ──────────────────
 * Listens to the "badge:unlocked" window CustomEvent dispatched by achievementState.unlock()
 * and shows the BadgeShareCard modal for that achievement.
 * Mount once at app root (already done via App.tsx).
 */
import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ACHIEVEMENTS } from "../data/achievements";
import { useAuthState } from "../state/authState";
import type { Achievement } from "../data/achievements";

const BadgeShareCard = lazy(() =>
  import("./BadgeShareCard").then(m => ({ default: m.BadgeShareCard }))
);

export function BadgeShareHost() {
  const [pending, setPending] = useState<Achievement | null>(null);
  const displayName = useAuthState(s => s.displayName);

  useEffect(() => {
    function onBadgeUnlocked(e: Event) {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      if (!id) return;
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      if (achievement) {
        // Small delay so main unlock toast renders first
        setTimeout(() => setPending(achievement), 1200);
      }
    }
    window.addEventListener("badge:unlocked", onBadgeUnlocked);
    return () => window.removeEventListener("badge:unlocked", onBadgeUnlocked);
  }, []);

  return (
    <AnimatePresence>
      {pending && (
        <Suspense fallback={null}>
          <BadgeShareCard
            achievement={pending}
            userName={displayName ?? undefined}
            onClose={() => setPending(null)}
          />
        </Suspense>
      )}
    </AnimatePresence>
  );
}
