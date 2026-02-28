import React from 'react';
import { motion } from 'framer-motion';

export interface SwarmStatusBadgeProps {
    tension: number;
    momentum: number;
    label?: string;
    isInsulated?: boolean;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({
    tension,
    momentum,
    label,
    isInsulated
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                isInsulated
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : tension > 0.7
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
        >
            <div className={`w-2 h-2 rounded-full ${
                isInsulated ? 'bg-blue-400' : tension > 0.7 ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'
            }`} />
            <span>
                {label || (isInsulated ? 'معزول' : tension > 0.7 ? 'ضغط عالي' : 'مستقر')}
            </span>
            <span className="opacity-60 pl-2 ml-2 border-l border-current">
                زخم: {(momentum * 100).toFixed(0)}%
            </span>
        </motion.div>
    );
};
