import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { GeneratedMission } from '../services/missionGenerator';

export interface TrajectoryRecord {
    id: string;
    user_id: string;
    title: string;
    status: 'composing' | 'ready' | 'active' | 'completed' | 'archived';
    data: GeneratedMission;
    cognitive_bandwidth: number;
    initial_vector?: any;
    final_vector?: any;
    sovereignty_report?: any;
    sovereignty_score?: number;
    created_at: string;
}

export const useTrajectoryRealtime = (userId?: string) => {
    const [trajectories, setTrajectories] = useState<TrajectoryRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId || !supabase) return;

        // 1. Initial Fetch
        const fetchInitial = async () => {
            const { data, error } = await supabase
                .from('user_trajectories')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setTrajectories(data as TrajectoryRecord[]);
            }
            setLoading(false);
        };

        fetchInitial();

        // 2. Realtime Subscription
        const channel = supabase
            .channel('user_trajectories_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_trajectories',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log('⚡ [Realtime] Trajectory update received:', payload);

                    if (payload.eventType === 'INSERT') {
                        setTrajectories((prev) => [payload.new as TrajectoryRecord, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setTrajectories((prev) =>
                            prev.map((t) => (t.id === payload.new.id ? (payload.new as TrajectoryRecord) : t))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setTrajectories((prev) => prev.filter((t) => t.id === payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            if (supabase) {
                supabase.removeChannel(channel);
            }
        };
    }, [userId]);

    const activeTrajectory = trajectories.find(t => t.status === 'active' || t.status === 'ready');
    const completedTrajectory = trajectories.find(t => t.status === 'completed');

    return { trajectories, activeTrajectory, completedTrajectory, loading };
};
