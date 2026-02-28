import React from 'react';

export interface SwarmStatusBadgeProps {
    tension?: number;
    momentum?: number;
    label?: string;
    isInsulated?: boolean;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({ _tension, _momentum, label, isInsulated }) => {
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {label || "Swarm Active"} {isInsulated ? "(Insulated)" : ""}
        </span>
    );
};
export default SwarmStatusBadge;
