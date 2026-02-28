import React from 'react';
import { motion } from 'framer-motion';

export const AwarenessSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col space-y-4 w-full h-full p-6 animate-pulse bg-surface/50 rounded-xl">
            <div className="h-8 bg-surface-elevated rounded w-1/3"></div>
            <div className="h-4 bg-surface-elevated rounded w-1/2 mt-2"></div>
            <div className="flex-1 min-h-[200px] mt-6 bg-surface-elevated/50 rounded-lg border border-border/50"></div>
            <div className="flex space-x-4 mt-4 rtl:space-x-reverse">
                <div className="h-10 bg-surface-elevated rounded flex-1"></div>
                <div className="h-10 bg-surface-elevated rounded flex-1"></div>
            </div>
        </div>
    );
};

export default AwarenessSkeleton;
