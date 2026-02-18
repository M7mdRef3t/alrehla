import { FC } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Shield, Crown } from "lucide-react";

interface LeaderboardUser {
    rank: number;
    codeName: string; // Anonymous name e.g. "Commander-X9"
    xp: number;
    level: string; // "Commander", "Captain"
    isCurrentUser?: boolean;
}

// Mock Data for Prototype
const LEADERBOARD_DATA: LeaderboardUser[] = [
    { rank: 1, codeName: "Falcon-1", xp: 2450, level: "Warlord" },
    { rank: 2, codeName: "Echo-Base", xp: 1890, level: "Commander" },
    { rank: 3, codeName: "Nebula-7", xp: 1650, level: "Commander" },
    { rank: 4, codeName: "YOU", xp: 0, level: "Scout", isCurrentUser: true }, // Will be updated with real data
    { rank: 5, codeName: "Dust-Mote", xp: 420, level: "Captain" },
];

export const LeaderboardWidget: FC<{ currentXP: number, currentRank: string }> = ({ currentXP, currentRank }) => {
    // Update current user in list
    const displayList = LEADERBOARD_DATA.map(u =>
        u.isCurrentUser ? { ...u, xp: currentXP, level: currentRank } : u
    ).sort((a, b) => b.xp - a.xp);

    return (
        <div className="w-full max-w-sm mx-auto mb-12">
            <div className="flex items-center gap-2 mb-4 px-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Top Commanders</h3>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800/60 overflow-hidden">
                {displayList.map((user, idx) => (
                    <div
                        key={user.codeName}
                        className={`flex items-center justify-between p-3 border-b border-slate-800/50 last:border-0 ${user.isCurrentUser ? "bg-teal-500/10" : "hover:bg-white/5"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-mono font-bold w-4 text-center ${idx === 0 ? "text-amber-400" :
                                    idx === 1 ? "text-slate-300" :
                                        idx === 2 ? "text-amber-700" : "text-slate-500"
                                }`}>
                                {idx + 1}
                            </span>

                            <div className="flex flex-col">
                                <span className={`text-xs font-bold ${user.isCurrentUser ? "text-teal-300" : "text-slate-200"}`}>
                                    {user.codeName}
                                    {user.isCurrentUser && <span className="ml-2 text-[10px] bg-teal-500/20 px-1.5 rounded text-teal-400">ME</span>}
                                </span>
                                <span className="text-[10px] text-slate-500">{user.level}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono text-slate-400">{user.xp}</span>
                            <span className="text-[9px] text-slate-600">XP</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
