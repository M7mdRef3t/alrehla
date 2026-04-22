import { safeGetSession } from "./supabaseClient";

export interface Insight {
    id: number;
    user_id: string;
    content: string;
    category: string;
    energy_level: number;
    exercise_code: string;
    created_at: string;
}

export const insightService = {
    async getInsights(): Promise<Insight[]> {
        const session = await safeGetSession();
        if (!session) {
            throw new Error("User not authenticated.");
        }

        const res = await fetch('/api/sovereign/insights', {
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        if (!res.ok) {
            if (res.status === 401) {
                throw new Error('Sovereign Authentication Failed. Please log in again.');
            }
            throw new Error(`Failed to fetch insights: ${res.status}`);
        }

        return res.json();
    },

    async createInsight(data: Partial<Insight>): Promise<Insight> {
        const session = await safeGetSession();
        if (!session) {
            throw new Error("User not authenticated.");
        }

        const res = await fetch('/api/sovereign/insights', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            if (res.status === 401) {
                throw new Error('Sovereign Authentication Failed. Please log in again.');
            }
            throw new Error(`Failed to create insight: ${res.status}`);
        }

        return res.json();
    }
};
