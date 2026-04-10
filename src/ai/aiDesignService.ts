import { getGeminiClient, getGeminiModel, withTimeout, DEFAULT_GENERATION_CONFIG } from "@/lib/gemini/shared";
import type { DesignTokens } from "@/state/themeState";

export class AiDesignService {
  /**
   * Generates a DesignTokens object based on a descriptive prompt.
   */
  async generateTokens(prompt: string): Promise<Partial<DesignTokens> | null> {
    const client = getGeminiClient();
    if (!client) return null;

    const model = getGeminiModel(client, "gemini-1.5-flash", {
      ...DEFAULT_GENERATION_CONFIG,
      temperature: 0.9, // Higher creativity for design
    });

    const systemPrompt = `
      You are a high-end UI/UX Design Strategist. 
      Your task is to translate a poetic or functional description of a "mood" or "atmosphere" into technical CSS design tokens.
      
      You must return ONLY a JSON object followed by a brief explanation of why you chose these colors.
      The JSON must match this structure:
      {
        "primaryColor": "#hex",
        "accentColor": "#hex",
        "spaceVoid": "#hex (background color)",
        "borderRadius": "string (e.g. 16px)",
        "blur": "string (e.g. 8px)",
        "spacing": "string (e.g. 1rem)"
      }

      Guidelines:
      - For "Crisis" or "Stressed" prompts: Use calming blues/greens, high blur (12px+), and very soft corners (24px+).
      - For "Productive" or "Flow" prompts: Use high contrast, sharp corners (4px-8px), and energetic colors (Amber/Teal).
      - For "Luxury" prompts: Use Gold/Black/Deep Void colors.
      
      User Description: "${prompt}"
    `;

    try {
      const result = await withTimeout(model.generateContent(systemPrompt));
      const responseText = result.response.text();
      
      // Extract JSON using regex
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("AI returned malformed design response:", responseText);
        return null;
      }

      const tokens = JSON.parse(jsonMatch[0]);
      return tokens;
    } catch (error) {
      console.error("Design Generation failed:", error);
      return null;
    }
  }
}

export const aiDesignService = new AiDesignService();
