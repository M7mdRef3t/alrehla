import { supabase } from '../services/supabaseClient';

export interface HistoryPoint {
    timestamp: string;
    entropy_score: number;
    state: string;
}

export interface ClientTrajectory {
    clientId: string;
    points: HistoryPoint[];
    currentTrend: 'improving' | 'declining' | 'stable';
    riskProbability: number;
}

export class TrajectoryEngine {
    /**
     * Fetch history and analyze trajectory for a specific client
     */
    static async getClientTrajectory(clientId: string): Promise<ClientTrajectory> {
        if (!supabase) throw new Error("Supabase not initialized");

        const { data, error } = await supabase
            .from('shadow_snapshots')
            .select('timestamp, entropy_score, state')
            .eq('user_id', clientId)
            .order('timestamp', { ascending: true })
            .limit(15);

        if (error) throw error;

        const points: HistoryPoint[] = data || [];

        // Basic trend analysis
        let trend: ClientTrajectory['currentTrend'] = 'stable';
        let risk = 0;

        if (points.length >= 2) {
            const first = points[0].entropy_score;
            const last = points[points.length - 1].entropy_score;
            const diff = last - first;

            if (diff > 10) trend = 'declining';
            else if (diff < -10) trend = 'improving';

            risk = last; // Current risk is equal to latest entropy
        }

        return {
            clientId,
            points,
            currentTrend: trend,
            riskProbability: risk
        };
    }
}
