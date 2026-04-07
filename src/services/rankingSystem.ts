import { Rank } from "@/types/tactical";

export const calculateRank = (missionCount: number): Rank => {
    if (missionCount >= 26) return "Master General";
    if (missionCount >= 16) return "Border Commander";
    if (missionCount >= 6) return "Awareness Lieutenant";
    return "Recruit";
};

export const getNextRankThreshold = (currentRank: Rank): number => {
    switch (currentRank) {
        case "Recruit": return 6;
        case "Awareness Lieutenant": return 16;
        case "Border Commander": return 26;
        default: return 0;
    }
};
