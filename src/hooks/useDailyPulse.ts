import { logger } from "@/services/logger";
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, isSupabaseAbortError } from '@/services/supabaseClient';
import { getLocalDayString } from '@/utils/dateUtils';
import { trackEvent, AnalyticsEvents } from '@/services/analytics';

export interface PulseEntry {
    id?: string;
    day: string;
    mood: number;
    energy: number;
    stress_tag: string;
    note: string;
    focus: string;
}

/* ══════════════════════════════════════════
   Quiz Reminder Helpers
   ══════════════════════════════════════════ */

const ALL_QUIZ_DEFS: Array<{ id: string; title: string; emoji: string }> = [
    { id: 'attachment',    title: 'أنماط الارتباط',     emoji: '🔗' },
    { id: 'boundaries',   title: 'الحدود الشخصية',     emoji: '🛡️' },
    { id: 'codependency', title: 'الاعتماد العاطفي',    emoji: '🪢' },
    { id: 'quality',      title: 'جودة العلاقة',        emoji: '💎' },
    { id: 'eq',           title: 'الذكاء العاطفي',      emoji: '💡' },
    { id: 'social',       title: 'التوافق الاجتماعي',   emoji: '🌐' },
    { id: 'communication', title: 'درجة التواصل',       emoji: '🗣️' },
];

export interface QuizReminder {
    quizId: string;
    title: string;
    emoji: string;
}

function loadPendingQuizReminders(): QuizReminder[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem('alrehla_quiz_history');
        const history: Array<{ quizId: string }> = raw ? JSON.parse(raw) : [];
        const done = new Set(history.map((e) => e.quizId));
        return ALL_QUIZ_DEFS
            .filter((q) => !done.has(q.id))
            .slice(0, 3)
            .map((q) => ({ quizId: q.id, title: q.title, emoji: q.emoji }));
    } catch { return []; }
}

export function useDailyPulse() {
    const [history, setHistory] = useState<PulseEntry[]>([]);
    const [todayPulse, setTodayPulse] = useState<PulseEntry | null>(null);
    const [loading, setLoading] = useState(false);
    const [streak, setStreak] = useState(0);
    const [quizReminders, setQuizReminders] = useState<QuizReminder[]>([]);
    const isSavingRef = useRef(false);

    /* Load quiz reminders on mount */
    useEffect(() => {
        setQuizReminders(loadPendingQuizReminders());
    }, []);

    const fetchPulseData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            const token = session?.access_token;

            if (token) {
                const res = await fetch('/api/pulse?limit=14', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                    const today = getLocalDayString();
                    const todayRes = data.find((p: PulseEntry) => p.day === today);
                    if (todayRes) setTodayPulse(todayRes);

                    // Simple streak calc
                    let s = 0;
                    const current = new Date();
                    for (let i = 0; i < data.length; i++) {
                        const pulseDate = new Date(data[i].day);
                        const diff = Math.floor((current.getTime() - pulseDate.getTime()) / (1000 * 3600 * 24));
                        if (diff === s) s++;
                        else if (diff > s) break;
                    }
                    setStreak(s);
                    return;
                }
            }

            // Fallback for Guest Mode (LocalStorage)
            const localDataStr = localStorage.getItem('dawayir_guest_pulses');
            if (localDataStr) {
                const data: PulseEntry[] = JSON.parse(localDataStr);
                setHistory(data);
                const today = getLocalDayString();
                const todayRes = data.find((p: PulseEntry) => p.day === today);
                if (todayRes) setTodayPulse(todayRes);
                setStreak(data.length);
            }
        } catch (err) {
            if (!isSupabaseAbortError(err)) {
                logger.error("Failed to fetch pulse data", err);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const savePulse = async (pulse: Omit<PulseEntry, 'id' | 'day'>) => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        setLoading(true);
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            const token = session?.access_token;
            const today = getLocalDayString();

            if (token) {
                const res = await fetch('/api/pulse', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ ...pulse, day: today })
                });

                if (res.ok) {
                    const result = await res.json();
                    setTodayPulse(result.data);

                    const isFirst = history.length === 0;
                    if (isFirst) {
                        trackEvent(AnalyticsEvents.FIRST_PULSE_SUBMITTED, { mode: "auth" });
                    }
                    trackEvent("pulse_day_n", { day: history.length + 1 });

                    await fetchPulseData();
                    return result.data;
                }
            } else {
                // Guest Saving
                const localDataStr = localStorage.getItem('dawayir_guest_pulses');
                let data: PulseEntry[] = localDataStr ? JSON.parse(localDataStr) : [];

                const existingIndex = data.findIndex(p => p.day === today);
                const newEntry: PulseEntry = { ...pulse, day: today, id: `guest_${Date.now()}` };

                if (existingIndex > -1) {
                    data[existingIndex] = newEntry;
                } else {
                    data = [newEntry, ...data];

                    const isFirst = data.length === 1;
                    if (isFirst) {
                        trackEvent(AnalyticsEvents.FIRST_PULSE_SUBMITTED, { mode: "guest" });
                    }
                    trackEvent("pulse_day_n", { day: data.length });
                }

                localStorage.setItem('dawayir_guest_pulses', JSON.stringify(data));
                setTodayPulse(newEntry);
                setHistory(data);
                setStreak(data.length);
                return newEntry;
            }
        } catch (err) {
            if (isSupabaseAbortError(err)) return;
            logger.error("Save pulse failed", err);
            throw err;
        } finally {
            setLoading(false);
            isSavingRef.current = false;
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
        refresh: fetchPulseData,
        quizReminders,  // ← NEW: up to 3 uncompleted quiz reminders
    };
}
