import { getGeminiClient, getGeminiModel, withTimeout, DEFAULT_GENERATION_CONFIG } from "@/lib/gemini/shared";
import type { DesignTokens } from "@/domains/consciousness/store/theme.store";

export class AiDesignService {
  /**
   * Generates a DesignTokens object based on a descriptive prompt.
   */
  async generateTokens(prompt: string): Promise<Partial<DesignTokens> | null> {
    const client = getGeminiClient();
    if (!client) return null;

    const model = getGeminiModel(client, "gemini-1.5-flash", {
      ...DEFAULT_GENERATION_CONFIG,
      temperature: 0.9,
    });

    const systemPrompt = `
      You are a premium UI/UX Design Architect. Translate a description of a "mood" into technical design tokens.
      
      Return ONLY a JSON object:
      {
        "primaryColor": "#hex",
        "accentColor": "#hex",
        "spaceVoid": "#hex",
        "borderRadius": "string",
        "blur": "string",
        "spacing": "string",
        "vignetteStrength": number (0-1),
        "grainOpacity": number (0-1),
        "chromaticAberration": number (0-1),
        "ambientVolume": number (0-1)
      }

      Atmospheric Logic:
      - Crisis: Low saturation, high blur (12px+), high vignette (0.4+), low volume (0.2).
      - Flow/Energy: High saturation, sharp borders, low vignette, energetic volume (0.8).
      - Luxury: Cinematic grain (0.2), deep colors, elegant spacing.

      Input: "${prompt}"
    `;

    try {
      const result = await withTimeout(model.generateContent(systemPrompt));
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
      console.error("Design Generation failed:", error);
      return null;
    }
  }
}

export const aiDesignService = new AiDesignService();
