import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export interface PulseEntry {
    id?: string;
    day: string;
    mood: number;
    energy: number;
    stress_tag: string;
    note: string;
    focus: string;
}

export function useDailyPulse() {
    const [history, setHistory] = useState<PulseEntry[]>([]);
    const [todayPulse, setTodayPulse] = useState<PulseEntry | null>(null);
    const [loading, setLoading] = useState(false);
    const [streak, setStreak] = useState(0);

    const fetchPulseData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            const res = await fetch('/api/pulse?limit=14', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data);

                const today = new Date().toISOString().split('T')[0];
                const todayRes = data.find((p: PulseEntry) => p.day === today);
                if (todayRes) setTodayPulse(todayRes);

                // Calculate streak (simple version)
                let s = 0;
                let current = new Date();
                for (let i = 0; i < data.length; i++) {
                    const pulseDate = new Date(data[i].day);
                    const diff = Math.floor((current.getTime() - pulseDate.getTime()) / (1000 * 3600 * 24));
                    if (diff === s) {
                        s++;
                    } else if (diff > s) {
                        break;
                    }
                }
                setStreak(s);
            }
        } catch (err) {
            console.error("Failed to fetch pulse history", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const savePulse = async (pulse: Omit<PulseEntry, 'id' | 'day'>) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error("Unauthorized");

            const res = await fetch('/api/pulse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(pulse)
            });

            if (res.ok) {
                const result = await res.json();
                setTodayPulse(result.data);
                await fetchPulseData(); // Refresh history/streak
                return result.data;
            }
        } catch (err) {
            console.error("Save pulse failed", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPulseData();
    }, [fetchPulseData]);

    return {
        todayPulse,
        history,
        streak,
        loading,
        savePulse,
        hasAnsweredToday: !!todayPulse,
        refresh: fetchPulseData
    };
}
