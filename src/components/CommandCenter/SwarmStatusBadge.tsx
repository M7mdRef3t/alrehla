import React from 'react';

export const SwarmStatusBadge: React.FC<{ tension: number, momentum: number, label?: string, isInsulated?: boolean }> = ({ tension, momentum, label, isInsulated }) => {
    return (
        <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div>
                <span className="text-sm font-semibold">Tension: {tension}</span>
                <span className="mx-2">|</span>
                <span className="text-sm font-semibold">Momentum: {momentum}</span>
            </div>
            {label && <span className="ml-auto text-xs opacity-75">{label}</span>}
            {isInsulated && <span className="text-xs text-blue-500">(Insulated)</span>}
        </div>
    );
};
