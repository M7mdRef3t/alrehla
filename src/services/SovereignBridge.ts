import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { logger } from "./logger";

const execAsync = promisify(exec);
const ROOT = process.cwd();

/**
 * SovereignBridge 🌉
 * Bridges TypeScript Next.js world with Python Google ADK world.
 */
export class SovereignBridge {
    private static AGENTS_DIR = path.join(ROOT, "agents_runtime");

    /**
     * Executes a complex task using the ADK Orchestrator
     * @param taskDescription The description of the task for ADK agents
     * @param context Additional context (JSON stringified)
     */
    static async delegateToADK(taskDescription: string, context: string = "{}"): Promise<any> {
        try {
            const scriptPath = path.join(this.AGENTS_DIR, "main_orchestrator.py");
            
            // Check if script exists
            try {
                await fs.access(scriptPath);
            } catch {
                throw new Error("ADK Main Orchestrator not found. Ensuring environment...");
            }

            // Execute Python script
            // Using JSON for structured A2A communication
            const command = `python "${scriptPath}" --task "${taskDescription}" --context '${context}'`;
            
            const { stdout, stderr } = await execAsync(command, { 
                cwd: this.AGENTS_DIR,
                timeout: 60000 // ADK agents might need time to think
            });

            if (stderr && !stdout) {
                throw new Error(`ADK Error: ${stderr}`);
            }

            return JSON.parse(stdout);
        } catch (error: any) {
            logger.error("[SovereignBridge] Delegation failed:", error);
            throw error;
        }
    }
}
