export type Rank =
    | "Recruit"
    | "Awareness Lieutenant"
    | "Border Commander"
    | "Master General";

export type Zone =
    | "Green" // Oasis / Charging Station
    | "Yellow" // Buffer Zone
    | "Red" // Minefield / Hostile
    | "Gray"; // Archive / Past Stations

export type ThreatLevel =
    | "Safe"
    | "Stable"
    | "Hostile"
    | "Critical";

export interface CommanderStats {
    user_id: string;
    rank: Rank;
    energy_level: number; // 1-10
    shield_integrity: number; // 0-100%
    last_promotion_date?: string;
    missions_completed: number;
}

export interface FieldAsset {
    id: string;
    user_id: string;
    name: string;
    deployment_zone: Zone;
    threat_level: ThreatLevel;
    last_engagement?: string;
    is_muted: boolean;
}

export interface TacticalJournalEntry {
    id: string;
    user_id: string;
    mission_id: string; // Question ID
    content: string;
    breach_detected: boolean; // Guilt detected?
    created_at: string;
}

export interface Medal {
    id: string;
    type: "Steel Shield" | "Noise Sniper" | "Wall Puritan" | "Safe Withdrawal" | "First Strike";
    earned_at: string;
    description: string;
}
