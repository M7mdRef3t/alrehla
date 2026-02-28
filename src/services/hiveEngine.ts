import { supabase } from './supabaseClient';
import { AwarenessVector } from './trajectoryEngine';

export interface ProvenPath {
    id: string;
    title: string;
    initial_vector: AwarenessVector;
    mission_data: any;
    tags: string[];
    approved_by_ids?: string[];
}

export interface SwarmMetrics {
    mean_vector: AwarenessVector;
    outlier_vector: AwarenessVector; // Top 10% performance
    active_sovereigns: number;
    swarm_momentum: number;
    metadata?: { external_tension?: number; last_signal_label?: string; [key: string]: unknown };
}

export class HiveEngine {
    /**
     * Vector Similarity Search: Finds the most relevant proven path from the Hive.
     * Uses a simplified similarity check for now (can be upgraded to pgvector later).
     */
    static async getProvenPath(v: AwarenessVector): Promise<ProvenPath | null> {
        if (!supabase) return null;

        // Hybrid Routing Logic (70/30 split if vault is shallow)
        const { count } = await supabase
            .from('hive_wisdom_vault')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        const vaultCount = count || 0;
        const hybridThreshold = 50;

        // If vault is shallow, 70% chance to return null (forcing AI generation)
        if (vaultCount < hybridThreshold && Math.random() < 0.7) {
            console.log("🌀 [HiveEngine] Hybrid Routing: Falling back to AI Genesis (Vault shallow)");
            return null;
        }

        const { data, error } = await supabase
            .from('hive_wisdom_vault')
            .select('*')
            .eq('status', 'active');

        if (error || !data || data.length === 0) return null;

        // Simplified Euclidean distance ranking (Lower is better)
        const rankedPaths = data.map(path => {
            const pv = path.initial_vector as AwarenessVector;
            const distance = Math.sqrt(
                Math.pow(v.rs - pv.rs, 2) +
                Math.pow(v.av - pv.av, 2) +
                Math.pow(v.bi - pv.bi, 2) +
                Math.pow(v.se - pv.se, 2)
            );
            return { ...path, distance };
        }).sort((a, b) => a.distance - b.distance);

        return rankedPaths[0] as ProvenPath;
    }

    /**
     * Archiving: Adds a successful Oracle-rank journey to the Wisdom Vault.
     */
    static async contributeToVault(trajectoryId: string, userId: string): Promise<boolean> {
        if (!supabase) return false;

        // Fetch the trajectory to be archived
        const { data: traj, error: fetchError } = await supabase
            .from('user_trajectories')
            .select('*')
            .eq('id', trajectoryId)
            .single();

        if (fetchError || !traj) return false;

        // Insert into Wisdom Vault (Anonymized)
        const { error: insertError } = await supabase
            .from('hive_wisdom_vault')
            .insert({
                origin_user_id: userId,
                origin_trajectory_id: trajectoryId,
                title: traj.title,
                initial_vector: traj.initial_vector,
                final_vector: traj.final_vector,
                growth_delta: traj.growth_delta || {},
                mission_data: traj.data
            });

        return !insertError;
    }

    /**
     * Swarm Analytics: Fetches collective metrics for the Radar UI.
     */
    static async getSwarmMetrics(): Promise<SwarmMetrics | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('hive_swarm_metrics')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (error) return null;
        return data as SwarmMetrics;
    }

    /**
     * Governance: Fetches Oracle reputation for a specific user.
     */
    static async getOracleReputation(userId: string): Promise<{ data: any; error: any }> {
        if (!supabase) return { data: null, error: 'Supabase not initialized' };
        return await supabase
            .from('oracle_reputation')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
    }

    /**
     * Governance: Approves a pending trajectory for the global Wisdom Vault.
     */
    static async approveTrajectory(id: string, oracleId: string): Promise<boolean> {
        if (!supabase) return false;

        // Fetch current approvals and total weight
        const { data: current } = await supabase
            .from('hive_wisdom_vault')
            .select('approved_by_ids, total_approval_weight')
            .eq('id', id)
            .single();

        const approvals = current?.approved_by_ids || [];
        if (approvals.includes(oracleId)) return true; // Already approved by this Oracle

        // Fetch Oracle Reputation for Weight Calculation
        const { data: rep } = await supabase
            .from('oracle_reputation')
            .select('audit_count, accuracy_score')
            .eq('user_id', oracleId)
            .single();

        // Archimedean Weighting: W = 1 + min(0.5, alpha * log10(Audit + 1) * Accuracy)
        const alpha = 0.5; // Scaling factor
        const auditCount = rep?.audit_count || 0;
        const accuracy = rep?.accuracy_score || 1.0;
        const weight = 1 + Math.min(0.5, alpha * Math.log10(auditCount + 1) * accuracy);

        const newApprovals = [...approvals, oracleId];
        const newTotalWeight = (current?.total_approval_weight || 0) + weight;

        const { error } = await supabase
            .from('hive_wisdom_vault')
            .update({
                approved_by_ids: newApprovals,
                total_approval_weight: newTotalWeight,
                reviewed_by: oracleId, // Last reviewer
                reviewed_at: new Date().toISOString()
            })
            .eq('id', id);

        // Update Oracle Reputation
        await HiveEngine.updateOracleReputation(oracleId, 1);

        return !error;
    }

    /**
     * Genesis Governance: Instant activation by the Founding Architect.
     * Bypasses dual-consensus during the bootstrapping phase.
     */
    static async genesisApprove(id: string, architectId: string): Promise<boolean> {
        if (!supabase) return false;

        // Skip consensus check, set directly to active
        const { error } = await supabase
            .from('hive_wisdom_vault')
            .update({
                status: 'active',
                approved_by_ids: [architectId],
                reviewed_by: architectId,
                reviewed_at: new Date().toISOString(),
                review_notes: "GENESIS_APPROVAL: Prime the Swarm."
            })
            .eq('id', id);

        return !error;
    }

    /**
     * Governance: Updates Oracle reputation score.
     */
    static async updateOracleReputation(oracleId: string, delta: number): Promise<void> {
        if (!supabase) return;

        const { data: rep } = await supabase
            .from('oracle_reputation')
            .select('audit_count')
            .eq('user_id', oracleId)
            .single();

        const count = (rep?.audit_count || 0) + delta;

        await supabase
            .from('oracle_reputation')
            .upsert({
                user_id: oracleId,
                audit_count: count,
                last_active: new Date().toISOString()
            });
    }

    /**
     * Governance: Flags a trajectory as invalid or low-quality.
     */
    static async flagTrajectory(id: string, oracleId: string, notes: string): Promise<boolean> {
        if (!supabase) return false;
        const { error } = await supabase
            .from('hive_wisdom_vault')
            .update({
                status: 'flagged',
                reviewed_by: oracleId,
                reviewed_at: new Date().toISOString(),
                review_notes: notes
            })
            .eq('id', id);
        return !error;
    }

    /**
     * Governance: Fetches pending trajectories for the Oracle Council.
     */
    static async getPendingTrajectories(): Promise<ProvenPath[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('hive_wisdom_vault')
            .select('*')
            .eq('status', 'pending');
        return (data || []) as ProvenPath[];
    }
}
