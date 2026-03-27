import { supabase } from "./supabaseClient";

export interface UserTrial {
  id?: string;
  user_id?: string;
  charge: string;
  defense_points: string[];
  verdict: string;
  created_at?: string;
}

export const userTrialsService = {
  /**
   * Saves a new guilt court trial result to Supabase.
   */
  async saveTrialResult(trial: Omit<UserTrial, "id" | "user_id" | "created_at">) {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase!
        .from("user_trials")
        .insert({
          user_id: user.id,
          charge: trial.charge,
          defense_points: trial.defense_points,
          verdict: trial.verdict
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving trial result:", error);
      // Fallback: save to local storage if needed, but for production we want the server
      return null;
    }
  },

  /**
   * Fetches the trial history for the current user.
   */
  async getTrialsHistory() {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase!
        .from("user_trials")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserTrial[];
    } catch (error) {
      console.error("Error fetching trials history:", error);
      return [];
    }
  }
};
