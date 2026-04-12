import { FC, useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { getTrackingSessionId } from "@/services/journeyTracking";
import { getAuthDisplayName, getAuthUserId } from "@/domains/auth/store/auth.store";
import { LiveStatusBar } from '@/modules/meta/shared/LiveStatusBar';

const RANK_LABELS: Record<string, string> = {
    Scout: "كشاف",
    Vanguard: "طليعة",
    Captain: "قائد فريق",
    Commander: "قائد",
    Warlord: "قائد أعلى"
};

const RANK_ORDER = ["Scout", "Vanguard", "Captain", "Commander", "Warlord"];

interface LeaderboardWidgetProps {
    currentXP: number;
    currentRank: string;
    completedMissions: number;
    streakDays: number;
    achievementsCount: number;
}

interface LeaderboardEntry {
    sessionId: string;
    userId: string | null;
    label: string;
    score: number;
    rank: string;
    isCurrentUser: boolean;
    subtitle?: string;
}

interface LeaderboardApiResponse {
    leaderboard?: Array<{
        sessionId: string;
        userId: string | null;
        displayName: string;
        score: number;
        rankLabel: string;
    }>;
    window?: string;
    scoring?: string;
}

type LeaderboardWindow = "7d" | "30d";

export const LeaderboardWidget: FC<LeaderboardWidgetProps> = ({
    currentXP,
    currentRank,
    completedMissions: _completedMissions,
    streakDays: _streakDays,
    achievementsCount: _achievementsCount
}) => {
    const [rows, setRows] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [windowRange, setWindowRange] = useState<LeaderboardWindow>("7d");
    const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
    const [scoringModel, setScoringModel] = useState<string>("achievement_points_model");

    useEffect(() => {
        let mounted = true;
        let timer: ReturnType<typeof setInterval> | null = null;

        const loadLeaderboard = async (silent = false) => {
            if (!silent && mounted) setIsLoading(true);
            try {
                const res = await fetch(`/api/user/leaderboard?window=${windowRange}`, { method: "GET", cache: "no-store" });
                if (!res.ok) throw new Error("leaderboard_api_failed");
                const data = (await res.json()) as LeaderboardApiResponse;
                const apiRows = data.leaderboard ?? [];

                const currentSessionId = getTrackingSessionId();
                const authUserId = getAuthUserId();
                const authDisplayName = getAuthDisplayName();

                const computed = apiRows
                    .map((row) => {
                        const sessionId = String(row.sessionId ?? "");
                        const userId = typeof row.userId === "string" ? row.userId : null;
                        const displayName = String(row.displayName ?? "لاعب");
                        const score = Number.isFinite(row.score) ? row.score : 0;
                        const rankLabel = String(row.rankLabel ?? "كشاف");
                        const isCurrent =
                            (currentSessionId != null && sessionId === currentSessionId) ||
                            (authUserId != null && userId === authUserId);

                        return {
                            sessionId,
                            userId,
                            label: isCurrent ? (authDisplayName?.trim() || "أنت") : displayName,
                            score,
                            rank: rankLabel,
                            isCurrentUser: isCurrent
                        } satisfies LeaderboardEntry;
                    })
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 20);

                if (!mounted) return;
                setRows(computed);
                setLastUpdatedAt(Date.now());
                setScoringModel(data.scoring ?? "achievement_points_model");
            } catch {
                if (!mounted) return;
                setRows([]);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        void loadLeaderboard();
        timer = setInterval(() => {
            void loadLeaderboard(true);
        }, 30_000);

        return () => {
            mounted = false;
            if (timer) clearInterval(timer);
        };
    }, [windowRange]);

    const fallbackRows = useMemo<LeaderboardEntry[]>(() => {
        const localizedRank = RANK_LABELS[currentRank] ?? currentRank;
        const rankIndex = Math.max(0, RANK_ORDER.indexOf(currentRank));
        return [{
            sessionId: "local-current-user",
            userId: null,
            label: "أنت",
            score: currentXP,
            rank: localizedRank,
            isCurrentUser: true,
            subtitle: `ترتيبك بين الرتب ${rankIndex + 1}/${RANK_ORDER.length}`
        }];
    }, [currentRank, currentXP]);

    const displayRows = rows.length > 0 ? rows : fallbackRows;

    return (
        <div className="w-full max-w-sm mx-auto mb-12">
            <div className="flex items-center gap-2 mb-4 px-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-300 tracking-wider">ترتيب اللاعبين الحقيقي</h3>
            </div>
            <div className="flex items-center gap-2 mb-3 px-2">
                <button
                    type="button"
                    onClick={() => setWindowRange("7d")}
                    className={`text-[10px] px-2.5 py-1 rounded-full border ${windowRange === "7d" ? "bg-teal-500/20 text-teal-300 border-teal-500/30" : "text-slate-400 border-white/10"}`}
                >
                    آخر 7 أيام
                </button>
                <button
                    type="button"
                    onClick={() => setWindowRange("30d")}
                    className={`text-[10px] px-2.5 py-1 rounded-full border ${windowRange === "30d" ? "bg-teal-500/20 text-teal-300 border-teal-500/30" : "text-slate-400 border-white/10"}`}
                >
                    آخر 30 يوم
                </button>
            </div>
            <LiveStatusBar
                title="مصدر الترتيب"
                mode={rows.length > 0 ? "live" : "fallback"}
                isLoading={isLoading}
                lastUpdatedAt={lastUpdatedAt}
            />

            <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800/60 overflow-hidden">
                {isLoading && (
                    <div className="p-3 text-xs text-slate-500">جاري تحميل ترتيب اللاعبين...</div>
                )}
                {!isLoading && rows.length === 0 && (
                    <div className="p-3 text-xs text-slate-500">تعذّر تحميل بيانات اللاعبين الآن، جاري عرض بياناتك المحلية.</div>
                )}
                {displayRows.map((row, idx) => (
                    <div
                        key={row.sessionId}
                        className={`flex items-center justify-between p-3 border-b border-slate-800/50 last:border-0 ${idx === 0 ? "bg-teal-500/10" : "hover:bg-white/5"}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold w-4 text-center text-slate-500">
                                {idx + 1}
                            </span>

                            <div className="flex flex-col">
                                <span className={`text-xs font-bold ${row.isCurrentUser ? "text-teal-300" : "text-slate-200"}`}>
                                    {row.label}
                                    {row.isCurrentUser && <span className="ml-2 text-[10px] bg-teal-500/20 px-1.5 rounded text-teal-400">أنا</span>}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                    {row.subtitle ?? row.rank}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono text-slate-300">{row.score.toLocaleString("ar-EG")}</span>
                            <span className="text-[9px] text-slate-600">نقطة</span>
                        </div>
                    </div>
                ))}
            </div>
            <p className="px-2 mt-2 text-[10px] text-slate-600">
                {scoringModel === "achievement_points_model"
                    ? "النقاط محسوبة بنفس منطق نقاط الإنجاز الرسمية."
                    : "نموذج نقاط مخصص."}
            </p>
        </div>
    );
};
