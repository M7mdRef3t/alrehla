import { logger } from "../services/logger";
import { runtimeEnv } from "../config/runtimeEnv";

const JULES_API_BASE = "https://jules.googleapis.com/v1alpha";

/**
 * أنواع البيانات الخاصة بـ Jules API
 */
export interface JulesSource {
    name: string;
    id: string;
    githubRepo?: {
        owner: string;
        repo: string;
    };
}

export interface JulesSession {
    name: string;
    id: string;
    title: string;
    prompt: string;
    sourceContext: {
        source: string;
        githubRepoContext?: {
            startingBranch: string;
        };
    };
    status?: string;
    outputs?: Array<{
        pullRequest?: {
            url: string;
            title: string;
            description: string;
        };
    }>;
}

export interface JulesActivity {
    name: string;
    type: string;
    message?: string;
    timestamp: string;
    // يمكن إضافة المزيد من الحقول حسب الحاجة
}

class JulesService {
    private get apiKey(): string {
        return runtimeEnv.julesApiKey || "";
    }

    private get headers() {
        return {
            "Content-Type": "application/json",
            "x-goog-api-key": this.apiKey,
        };
    }

    /**
     * جلب المصادر المتاحة (GitHub Repos)
     */
    async listSources(): Promise<JulesSource[]> {
        try {
            const response = await fetch(`${JULES_API_BASE}/sources`, {
                headers: this.headers,
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();
            return data.sources || [];
        } catch (error) {
            logger.error("❌ Failed to list Jules sources:", error);
            return [];
        }
    }

    /**
     * إنشاء جلسة جديدة
     */
    async createSession(params: {
        prompt: string;
        source: string;
        title: string;
        branch?: string;
        autoCreatePR?: boolean;
    }): Promise<JulesSession | null> {
        try {
            const response = await fetch(`${JULES_API_BASE}/sessions`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    prompt: params.prompt,
                    sourceContext: {
                        source: params.source,
                        githubRepoContext: {
                            startingBranch: params.branch || "main",
                        },
                    },
                    automationMode: params.autoCreatePR ? "AUTO_CREATE_PR" : undefined,
                    title: params.title,
                }),
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            logger.error("❌ Failed to create Jules session:", error);
            return null;
        }
    }

    /**
     * جلب قائمة الجلسات
     */
    async listSessions(pageSize = 10): Promise<JulesSession[]> {
        try {
            const response = await fetch(`${JULES_API_BASE}/sessions?pageSize=${pageSize}`, {
                headers: this.headers,
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();
            return data.sessions || [];
        } catch (error) {
            logger.error("❌ Failed to list Jules sessions:", error);
            return [];
        }
    }

    /**
     * الموافقة على خطة (Plan)
     */
    async approvePlan(sessionId: string): Promise<boolean> {
        try {
            const response = await fetch(`${JULES_API_BASE}/sessions/${sessionId}:approvePlan`, {
                method: "POST",
                headers: this.headers,
            });
            return response.ok;
        } catch (error) {
            logger.error("❌ Failed to approve plan:", error);
            return false;
        }
    }

    /**
     * إرسال رسالة لـ Jules في جلسة معينة
     */
    async sendMessage(sessionId: string, prompt: string): Promise<boolean> {
        try {
            const response = await fetch(`${JULES_API_BASE}/sessions/${sessionId}:sendMessage`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({ prompt }),
            });
            return response.ok;
        } catch (error) {
            logger.error("❌ Failed to send message to Jules:", error);
            return false;
        }
    }

    /**
     * جلب الأنشطة الخاصة بجلسة
     */
    async listActivities(sessionId: string): Promise<JulesActivity[]> {
        try {
            const response = await fetch(`${JULES_API_BASE}/sessions/${sessionId}/activities`, {
                headers: this.headers,
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();
            return data.activities || [];
        } catch (error) {
            logger.error("❌ Failed to list activities:", error);
            return [];
        }
    }
}

export const julesService = new JulesService();
