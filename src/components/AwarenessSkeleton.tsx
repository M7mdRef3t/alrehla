import React from 'react';


export const AwarenessSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col space-y-4 p-4 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
            <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/6"></div>
            </div>
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
        </div>
    );
};

export default AwarenessSkeleton;
