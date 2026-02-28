import React from 'react';
import { motion } from 'framer-motion';

export interface SwarmStatusBadgeProps {
  tension: number;
  momentum: number;
  label?: string;
  isInsulated?: boolean;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({ tension, momentum, label, isInsulated }) => {
  return (
    <div className="flex items-center space-x-2 space-x-reverse bg-gray-900 rounded-lg p-3 text-sm">
      <div className={`w-3 h-3 rounded-full ${isInsulated ? 'bg-blue-500' : 'bg-green-500'}`} />
      <div className="flex-1">
        <span className="font-semibold text-gray-200">
          {isInsulated ? 'معزول' : 'متصل بالسرب'}
        </span>
        {label && <span className="mr-2 text-gray-400">{label}</span>}
      </div>
      <div className="text-xs text-gray-400">
        الزخم: {(momentum * 100).toFixed(0)}% | التوتر: {(tension * 100).toFixed(0)}%
      </div>
    </div>
  );
};
