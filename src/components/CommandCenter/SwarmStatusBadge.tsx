import React from 'react';

interface SwarmStatusBadgeProps {
    tension: number;
    momentum: number;
    label?: string;
    isInsulated?: boolean;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({ tension, momentum, label, isInsulated }) => {
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {label || 'Active'}
        </span>
    );
};
