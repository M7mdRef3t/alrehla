import { aiGateway } from "../ai/gateway";

export interface RhythmTelemetry {
  stability: number;
  recentErrors: number;
  interactionCount: number;
  activePath: string;
}

export interface UIMutation {
  type: "CHANGE_THEME" | "OPEN_TOOL" | "SHOW_MESSAGE" | "PULSE_EFFECT";
  payload: any;
}

export interface SwarmResponse {
  coachingText: string;
  suggestedMutations: UIMutation[];
}

export interface CustomRitual {
  title: string;
  emoji: string;
  time: "morning" | "evening" | "anytime";
  type: "pulse" | "journal" | "action" | "gratitude" | "intention";
}

export interface DailyStateResponse {
  dailyDirective: string;
  customRituals: CustomRitual[];
}

/**
 * Sovereign AI Swarm Core
 * Orchestrates Consciousness, Data, and Journey Agents.
 */
class SwarmOrchestrator {
  /**
   * Phase 1: Consciousness Agent
   * Analyzes raw human rhythm and output cognitive state.
   */
  private async invokeConsciousnessAgent(telemetry: RhythmTelemetry, initialPrompt: string): Promise<string> {
    const prompt = `[CONSCIOUSNESS AGENT]
You are analyzing the user's emotional and biological rhythm based on platform interactions.
Telemetry constraints:
Stability Score: ${telemetry.stability} (0 is chaos, 1 is calm).
Recent Errors faced: ${telemetry.recentErrors}.
Interaction Speed: ${telemetry.interactionCount} events/min.
Current UI path: ${telemetry.activePath}

User said/did: "${initialPrompt}"

Analyze the emotional undercurrent. What is the priority state right now? (e.g. Needs soothing, Needs challenge, In flow, Frustrated).
Keep the response under 100 words.`;

    const res = await aiGateway.generate({ type: "swarm_consciousness", prompt });
    return res.data || "Unknown emotional state.";
  }

  /**
   * Phase 2: Journey Agent
   * Takes the cognitive state, and formulates response + UI mutations.
   */
  private async invokeJourneyAgent(consciousnessSummary: string, initialPrompt: string): Promise<SwarmResponse> {
    const prompt = `[JOURNEY AGENT]
You are "The Master", the Live Consciousness Artist guiding the user's journey.
The Consciousness Agent provided this emotional profile of the user right now: 
"${consciousnessSummary}"

User originally triggered this: "${initialPrompt}"

Your response must be in strict JSON format matching this schema:
{
  "coachingText": "Your direct, wise, empathetic but firm response to the user. (1-2 sentences)",
  "suggestedMutations": [
    {
       "type": "CHANGE_THEME" | "OPEN_TOOL" | "SHOW_MESSAGE" | "PULSE_EFFECT",
       "payload": "the targeted value"
    }
  ]
}

Example payloads: 
- Change Theme to recovery: { "type": "CHANGE_THEME", "payload": "RECOVERY" }
- Open Breathing Tool: { "type": "OPEN_TOOL", "payload": "BREATHING" }
- Pulse screen red: { "type": "PULSE_EFFECT", "payload": "CRITICAL" }

Format cleanly, just JSON.`;

    const res = await aiGateway.generateJSON<SwarmResponse>({ type: "swarm_journey", prompt });
    
    if (res.success && res.data) {
      return res.data;
    }
    
    return { coachingText: "I hear you. Let us find your center.", suggestedMutations: [] };
  }

  /**
   * Execute the Sovereign Swarm cycle
   */
  public async orchestrate(telemetry: RhythmTelemetry, trigger: string): Promise<SwarmResponse> {
    try {
      const state = await this.invokeConsciousnessAgent(telemetry, trigger);
      const directive = await this.invokeJourneyAgent(state, trigger);
      return directive;
    } catch (e) {
      console.error("[Swarm] Orchestration failed:", e);
      return { coachingText: "System distortion. Ground yourself.", suggestedMutations: [] };
    }
  }

  /**
   * Phase 3: Deep Journey Orchestration
   * Generates the daily personalized Wird and Directive for the user based on overall system state.
   */
  public async generateDailyState(telemetry: RhythmTelemetry): Promise<DailyStateResponse> {
    const prompt = `[JOURNEY AGENT]
You are "The Master", crafting today's sovereign daily state and 'Wird' (rituals) for the user.
Recent telemetry context: 
Stability: ${telemetry.stability} (0 is chaos, 1 is calm).
Interaction Count: ${telemetry.interactionCount} events/min.
Recent Frustration/Errors: ${telemetry.recentErrors}.

Based on this, generate:
1. "dailyDirective": A concise (1-2 sentences), inspiring but firm daily focus for the user in Arabic. Say it like a wise mentor.
2. "customRituals": An array of 2 to 3 micro-actions/rituals the user must do today to regain/maintain control. 
Must strictly use this JSON schema:
{
  "dailyDirective": "...",
  "customRituals": [
    {
      "title": "Short action name in Arabic",
      "emoji": "🧘",
      "time": "morning" | "evening" | "anytime",
      "type": "pulse" | "journal" | "action" | "gratitude" | "intention"
    }
  ]
}`;

    try {
      const res = await aiGateway.generateJSON<DailyStateResponse>({ type: "swarm_daily", prompt });
      if (res.success && res.data) {
        return res.data;
      }
    } catch (e) {
      console.error("[Swarm] Daily state generation failed:", e);
    }
    
    // Fallback
    return {
      dailyDirective: "حافظ على توازنك اليوم، تقدم خطوة بخطوة في رحلتك.",
      customRituals: []
    };
  }
}

export const swarmOrchestrator = new SwarmOrchestrator();
