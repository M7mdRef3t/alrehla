import { FC, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MirrorInsight } from "@/services/mirrorLogic";
import { ContradictionMirrorCard } from "@/modules/maraya/components/ContradictionMirrorCard";
import { recordTruthEvent } from "@/services/truthScoreEngine";

interface MirrorOverlayProps {
    insight: MirrorInsight | null;
    onConfront: (insight: MirrorInsight) => void;
    onDeny: (insight: MirrorInsight) => void;
}

export const MirrorOverlay: FC<MirrorOverlayProps> = memo(({ insight, onConfront, onDeny }) => {
    if (!insight) return null;

    const handleConfront = useCallback(() => {
        // ⚔️ Record in Truth Score: +10 for confronting truth
        recordTruthEvent("confronted_truth", `واجه: ${insight.title}`);
        onConfront(insight);
    }, [insight, onConfront]);

    const handleDismiss = useCallback(() => {
        // ⚔️ Record in Truth Score: -5 for ignoring truth
        recordTruthEvent("ignored_truth", `تجاهل: ${insight.title}`);
        onDeny(insight);
    }, [insight, onDeny]);

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="w-full max-w-md">
                    <ContradictionMirrorCard
                        insight={insight}
                        onConfront={handleConfront}
                        onDismiss={handleDismiss}
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
});
MirrorOverlay.displayName = "MirrorOverlay";

