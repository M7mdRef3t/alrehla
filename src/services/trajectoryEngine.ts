import { supabase } from '../services/supabaseClient';

export interface AwarenessVector {
    rs: number; // Relational Symmetry (Rate of change)
    av: number; // Agentic Velocity (Derivative)
    bi: number; // Behavioral Integrity (Proxy Metric consistency)
    se: number; // Shadow Entropy (Noise-to-Signal)
    cb: number; // Cognitive Bandwidth (Safety Valve)
    timestamp: number;
}

export interface HistoryPoint {
    timestamp: string;
    entropy_score: number;
    state: string;
    vector?: AwarenessVector;
}

export interface ClientTrajectory {
    clientId: string;
    points: HistoryPoint[];
    currentTrend: 'improving' | 'declining' | 'stable';
    riskProbability: number;
    currentVector?: AwarenessVector;
}

export class TrajectoryEngine {
    /**
     * Calculates the Growth Delta relative to a Weighted Historical Baseline.
     * This prevents "gaming the system" by comparing against long-term averages.
     */
    static calculateEvolution(currentFinal: AwarenessVector, history: AwarenessVector[]) {
        const normalize = (val: number) => Math.round(val * 100);

        // Weighted Historical Moving Average (last 5 journeys)
        // More recent journeys have higher weight: 5, 4, 3, 2, 1
        let totalWeight = 0;
        const baseline = { rs: 0, av: 0, bi: 0, se: 0, cb: 0 };

        history.slice(-5).reverse().forEach((v, i) => {
            const weight = 5 - i;
            baseline.rs += (v.rs || 0) * weight;
            baseline.av += (v.av || 0) * weight;
            baseline.bi += (v.bi || 0) * weight;
            baseline.se += (v.se || 0) * weight;
            baseline.cb += (v.cb || 0) * weight;
            totalWeight += weight;
        });

        if (totalWeight > 0) {
            baseline.rs /= totalWeight;
            baseline.av /= totalWeight;
            baseline.bi /= totalWeight;
            baseline.se /= totalWeight;
            baseline.cb /= totalWeight;
        }

        const delta = {
            rs: normalize(currentFinal.rs - baseline.rs),
            av: normalize(currentFinal.av - baseline.av),
            bi: normalize(currentFinal.bi - baseline.bi),
            se: normalize(currentFinal.se - baseline.se)
        };

        // Bottleneck Principle with Chaos-Friction
        let nextFocus: keyof AwarenessVector = 'se';
        let logic = "";

        if (currentFinal.cb < 0.4) {
            nextFocus = 'se';
            logic = "Bandwidth critical. Shadow Entropy (SE) is draining cognitive resources.";
        } else if (delta.av < 5) {
            nextFocus = 'av';
            logic = "Agency stagnation. High stability allows for increased Agentic Velocity.";
        } else {
            nextFocus = 'bi';
            logic = "Symmetry achieved. Refocusing on long-term Behavioral Integrity.";
        }

        return { delta, nextFocus, logic, baseline };
    }

    /**
     * Calculates the Non-Linear Sovereignty Score (Integral Approach)
     * S = INTEGRAL(BI * AV * CB) dt - Sigma(SE)
     */
    static calculateSovereigntyScore(history: AwarenessVector[]) {
        let totalScore = 0;

        // Simple rectangular integration
        history.forEach((v) => {
            const performance = (v.bi || 1) * (v.av || 0.5) * (v.cb || 1);
            const chaosPenalty = (v.se || 0) * 1.5; // Aggressive entropy penalty

            totalScore += (performance - chaosPenalty);
        });

        // Normalize to a 0-1000 scale (with floor at 0)
        return Math.max(0, Math.min(1000, Math.round(totalScore * 10)));
    }

    /**
     * Calculates the Awareness Vector based on the difference between two snapshots (Delta-T)
     */
    static calculateVector(current: HistoryPoint, previous?: HistoryPoint): AwarenessVector {
        const now = new Date(current.timestamp).getTime();
        const prevTime = previous ? new Date(previous.timestamp).getTime() : now - 86400000; // Default 1 day
        const dt = (now - prevTime) / (1000 * 60 * 60 * 24); // dt in days

        // RS: Rate of change in entropy (simplified for now, will link to Dawayir later)
        const rs = previous ? (current.entropy_score - previous.entropy_score) / dt : 0;

        // SE: Current Entropy (Normalized 0-1)
        const se = Math.min(Math.max(current.entropy_score / 100, 0), 1);

        // CB: Cognitive Bandwidth (Inversely proportional to SE)
        // Formula: CB = 1 - SE (High entropy = Low bandwidth)
        const cb = 1 - se;

        // Placeholder values for AV and BI (will be populated by Chat Sentiment and Proxy Metrics)
        const av = 0;
        const bi = 1;

        return {
            rs,
            av,
            bi,
            se,
            cb,
            timestamp: now
        };
    }

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

        const rawPoints: HistoryPoint[] = data || [];
        const points: HistoryPoint[] = rawPoints.map((point, index) => {
            const previous = index > 0 ? rawPoints[index - 1] : undefined;
            return {
                ...point,
                vector: this.calculateVector(point, previous)
            };
        });

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
            riskProbability: risk,
            currentVector: points.length > 0 ? points[points.length - 1].vector : undefined
        };
    }
}
