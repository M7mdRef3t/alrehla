import { PulseEntry } from "@/state/pulseState";
import { type MapNode } from "@/modules/map/mapTypes";

// Interfaces for data we need (mocking or importing)
interface ChronicleChapter {
    title: string;
    date: string;
    content: string;
    mood: "chaos" | "order" | "flow";
}

export class ChronicleGenerator {

    static generateChronicle(nodes: MapNode[], pulseLogs: PulseEntry[]): string {
        const chapters: ChronicleChapter[] = [];

        // Chapter 1: The Awakening (First Pulse or Node)
        if (pulseLogs.length > 0) {
            const firstPulse = pulseLogs[pulseLogs.length - 1]; // Oldest
            chapters.push({
                title: "The Awakening",
                date: new Date(firstPulse.timestamp).toLocaleDateString(),
                content: `On this day, the Commander first acknowledged their state. Energy was ${firstPulse.energy}/10.`,
                mood: firstPulse.energy < 4 ? "chaos" : "order"
            });
        }

        // Chapter 2: The Constellation (Map Creation)
        if (nodes.length > 0) {
            chapters.push({
                title: "The Constellation Forms",
                date: "Unknown Date", // We don't track node creation date easily yet
                content: `The Commander mapped ${nodes.length} stars in their universe.`,
                mood: "order"
            });
        }

        // Chapter 3: The Present Moment
        chapters.push({
            title: "The Continuous Now",
            date: new Date().toLocaleDateString(),
            content: "The story is still being written...",
            mood: "flow"
        });

        return this.formatAsMarkdown(chapters);
    }

    private static formatAsMarkdown(chapters: ChronicleChapter[]): string {
        return chapters.map(c => `## ${c.title} (${c.date})\n*Mood: ${c.mood.toUpperCase()}*\n\n${c.content}\n`).join("\n---\n\n");
    }
}
