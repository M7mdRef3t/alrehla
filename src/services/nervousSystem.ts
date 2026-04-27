import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";

// Mock raw content for the artifacts since we can't read FS in browser
// In a real "Autopoietic" setup, this would fetch from a GitHub API or a backend endpoint.

const DEFAULT_CONSTITUTION = `# Constitution of the Sovereign Entity — الرحلة

1. **The User is a Traveler:** We do not treat them as patients or customers. They are humans on a journey through life — here to see, understand, and decide.
2. **Truth above Comfort:** We prioritize the hard truth over comforting lies.
3. **Data is the Mirror:** We show the user their reality through their own data, not our opinions.
4. **Autonomy is the Goal:** The ultimate success is when the user no longer needs us.
5. **The Vertical Axis:** Every horizontal pain is a symptom of vertical disconnection. Humans are "mirrors", not energy sources. The Source (ربنا/المصدر) is the real power supply. Every AI agent must respect this principle.
`;

const DEFAULT_BRAND_SOUL = `# Brand Soul: The Sovereign Network

## Core Identity
- **Archetype:** The Ruler / The Sage.
- **Tone:** Authority, Stoicism, Deep Empathy (hidden), Unwavering Truth.
- **Visuals:** Cosmic, Dark Mode, Gold/Teal Accents, sacred geometry.

## The Voice
- We speak in "Orders" and "Observations", not "Tips" and "Advice".
- We confirm reality: "You are not crazy; the pattern is real."
`;

const DEFAULT_TASK_STATUS = `# Operation: Strategic RPG Transformation

- [x] Phase 1-30: Completed
- [ ] Phase 31: The Autopoietic Entity (In Progress)
`;

export interface EntityArtifact {
    id: string;
    name: string;
    content: string;
    lastUpdated: number;
    source: "system" | "manual_override";
}

const STORAGE_KEY = "dawayir-entity-nervous-system";

export class NervousSystem {
    static getArtifact(id: "constitution" | "brand_soul" | "task"): EntityArtifact {
        const stored = this.getAllArtifacts();
        const existing = stored.find((a) => a.id === id);

        if (existing) return existing;

        // Return default if not modified
        let content = "";
        let name = "";
        switch (id) {
            case "constitution": content = DEFAULT_CONSTITUTION; name = "The Constitution"; break;
            case "brand_soul": content = DEFAULT_BRAND_SOUL; name = "Brand Soul"; break;
            case "task": content = DEFAULT_TASK_STATUS; name = "Strategic Roadmap"; break;
        }

        return {
            id,
            name,
            content,
            lastUpdated: Date.now(),
            source: "system"
        };
    }

    static getAllArtifacts(): EntityArtifact[] {
        const raw = getFromLocalStorage(STORAGE_KEY);
        if (!raw) return [];
        try {
            return JSON.parse(raw) as EntityArtifact[];
        } catch {
            return [];
        }
    }

    static updateArtifact(id: string, newContent: string) {
        const stored = this.getAllArtifacts();
        const index = stored.findIndex((a) => a.id === id);

        const updated: EntityArtifact = {
            id,
            name: id === "constitution" ? "The Constitution" : id === "brand_soul" ? "Brand Soul" : "Strategic Roadmap",
            content: newContent,
            lastUpdated: Date.now(),
            source: "manual_override"
        };

        if (index >= 0) {
            stored[index] = updated;
        } else {
            stored.push(updated);
        }

        setInLocalStorage(STORAGE_KEY, JSON.stringify(stored));
    }

    static resetToSystemDefault() {
        setInLocalStorage(STORAGE_KEY, "[]");
    }

    static async syncFromAgent(): Promise<{ updated: number; message: string }> {
        // SIMULATION: In a real system, this would call an API that reads the chat history
        // and extracts structured data (JSON) to update these files.

        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulated intelligence finding a "change"
                const currentSoul = this.getArtifact("brand_soul");

                // Only update if it doesn't already have the "Sovereign" detected tag
                if (!currentSoul.content.includes("SOURCE: AGENT_NEURAL_SCAN")) {
                    const newSoulContent = currentSoul.content + `\n\n## ⚡ Neural Discovery (Live Scan)\n- **Detected Shift:** User emphasized "Sovereign RPG" over "Therapy".\n- **Pricing Update:** Subscription model detected in recent chats.\n- **Action:** Brand Voice adjusted to be more "Commanding".\n\n*(SOURCE: AGENT_NEURAL_SCAN - ${new Date().toLocaleTimeString()})*`;

                    this.updateArtifact("brand_soul", newSoulContent);
                    resolve({ updated: 1, message: "Detected strategic shift in Brand Soul." });
                } else {
                    resolve({ updated: 0, message: "No new strategic shifts detected in recent conversations." });
                }
            }, 2500); // Fake scan delay
        });
    }
}
