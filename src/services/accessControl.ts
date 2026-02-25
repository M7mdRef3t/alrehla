import { supabase } from './supabaseClient';

export class AccessControl {
    private static PIONEER_CODE = 'T-ZERO-SOVEREIGN';

    /**
     * Validates if a user has access to the Alpha-Zero environment.
     */
    static async validatePioneer(userId: string, code: string): Promise<boolean> {
        if (code !== this.PIONEER_CODE) return false;

        if (!supabase) return false;

        // Tag the user as a Pioneer in their metadata
        const { error } = await supabase.auth.updateUser({
            data: {
                role: 'pioneer',
                cohort: 'alpha-zero',
                joined_at: new Date().toISOString()
            }
        });

        // Track cohort size
        const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('metadata->>role', 'pioneer');

        if ((count || 0) > 10) {
            console.error("❌ [AccessControl] Alpha-Zero cohort is FULL (10/10).");
            return false;
        }

        return !error;
    }

    /**
     * Permission Check: Only Oracles or Pioneers can access the Hive components.
     */
    static async canAccessHive(userId: string): Promise<boolean> {
        if (!supabase) return false;
        const { data: { user } } = await supabase.auth.getUser();

        const role = user?.user_metadata?.role;
        return role === 'pioneer' || role === 'oracle' || role === 'architect';
    }
}
