import { GrowthArea } from "../modules/sullam/store/sullam.store";

export interface Lantern {
  id: string;
  growth_area: GrowthArea;
  content_type: "text" | "audio";
  content_payload: string;
  resonance_count: number;
  created_at: string;
}

export const lanternsService = {
  /**
   * Fetches a serendipitous lantern for the given area
   */
  async fetchLanternForArea(area: GrowthArea): Promise<Lantern | null> {
    try {
      const res = await fetch(`/api/sullam/lanterns?area=${area}`);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      return data.lantern || null;
    } catch (error) {
      console.error("Failed to fetch lantern:", error);
      return null;
    }
  },

  /**
   * Leaves a new legacy lantern for fellow travelers
   */
  async leaveLantern(area: GrowthArea, payload: string): Promise<Lantern | null> {
    try {
      const res = await fetch(`/api/sullam/lanterns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          growth_area: area,
          content_type: "text",
          content_payload: payload,
        }),
      });
      if (!res.ok) throw new Error("Failed to post lantern");
      const data = await res.json();
      return data.lantern;
    } catch (error) {
      console.error("Failed to leave lantern:", error);
      return null;
    }
  },

  /**
   * Lights a lantern up (adds resonance)
   */
  async lightLantern(lanternId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/sullam/lanterns/resonance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lantern_id: lanternId }),
      });
      return res.ok;
    } catch (error) {
      console.error("Failed to light lantern:", error);
      return false;
    }
  },
};
