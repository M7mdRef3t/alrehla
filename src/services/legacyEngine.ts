import { logger } from "@/services/logger";
import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";

export interface WisdomCapsule {
    id: string;
    content: string; // The text content or URL to audio
    createdAt: number;
    unlockConditions: {
        date?: string; // ISO date string YYYY-MM-DD
        rank?: number; // Minimum rank required
    };
    isLocked: boolean;
    theme?: "stoic" | "tactician" | "comforter";
}

const CAPSULES_STORAGE_KEY = "dawayir-wisdom-capsules";

export class LegacyEngine {
    /**
     * Create a new Wisdom Capsule for the future.
     */
    static createCapsule(
        content: string,
        unlockDate?: string,
        minRank?: number,
        theme: "stoic" | "tactician" | "comforter" = "stoic"
    ): WisdomCapsule {
        const capsules = this.getAllCapsules();

        const newCapsule: WisdomCapsule = {
            id: `capsule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content,
            createdAt: Date.now(),
            unlockConditions: {
                date: unlockDate,
                rank: minRank,
            },
            isLocked: true,
            theme,
        };

        capsules.push(newCapsule);
        this.saveCapsules(capsules);
        return newCapsule;
    }

    /**
     * Get all capsules, calculating lock status dynamically.
     */
    static getAllCapsules(currentRank: number = 1): WisdomCapsule[] {
        const raw = getFromLocalStorage(CAPSULES_STORAGE_KEY);
        if (!raw) return [];

        try {
            const capsules = JSON.parse(raw) as WisdomCapsule[];
            return capsules.map((capsule) => ({
                ...capsule,
                isLocked: this.checkIfLocked(capsule, currentRank),
            }));
        } catch (e) {
            logger.error("Failed to parse capsules", e);
            return [];
        }
    }

    /**
     * Check if a specific capsule is locked based on current time and rank.
     */
    private static checkIfLocked(capsule: WisdomCapsule, currentRank: number): boolean {
        if (capsule.unlockConditions.date) {
            const unlockTime = new Date(capsule.unlockConditions.date).getTime();
            if (Date.now() < unlockTime) return true;
        }

        if (capsule.unlockConditions.rank) {
            if (currentRank < capsule.unlockConditions.rank) return true;
        }

        return false;
    }

    /**
     * Save capsules to storage.
     */
    private static saveCapsules(capsules: WisdomCapsule[]) {
        setInLocalStorage(CAPSULES_STORAGE_KEY, JSON.stringify(capsules));
    }

    /**
     * Delete a capsule (e.g., if user wants to remove legacy).
     */
    static destroyCapsule(id: string) {
        const capsules = this.getAllCapsules();
        const filtered = capsules.filter((c) => c.id !== id);
        this.saveCapsules(filtered);
    }
}
