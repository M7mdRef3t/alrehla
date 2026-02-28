import React from 'react';

export const SwarmStatusBadge: React.FC<any> = ({ status }) => {
    return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {status}
        </div>
    );
};
