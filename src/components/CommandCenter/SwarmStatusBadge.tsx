import React from 'react';

export const SwarmStatusBadge: React.FC<{
    tension?: unknown;
    momentum?: number;
    label?: string;
    isInsulated?: boolean;
    status?: string;
}> = ({ tension, momentum, label, isInsulated, status }) => {
    return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {status || label || 'Active'}
        </div>
    );
};
