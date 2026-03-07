import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../../hooks/useDawayirEngine';

const sizeMap = {
    small: 'w-16 h-16 text-[10px] font-bold uppercase tracking-tighter',
    medium: 'w-24 h-24 text-xs font-black uppercase tracking-tight',
    large: 'w-36 h-36 border-2 text-sm font-black shadow-2xl shadow-teal-500/10 uppercase'
};

const colorMap = {
    core: 'bg-teal-500/20 border-teal-400 text-teal-300 backdrop-blur-md',
    danger: 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse-slow backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.2)]',
    ignored: 'bg-slate-800/40 border-slate-700 text-slate-500 opacity-40',
    neutral: 'bg-[var(--soft-teal)]/10 border-[var(--soft-teal)] text-[var(--soft-teal)] backdrop-blur-md'
};

const CustomNode = ({ data }: NodeProps<NodeData>) => {
    return (
        <div
            className={`rounded-full flex items-center justify-center text-center p-3 border transition-all duration-700 font-mono
        custom-drag-handle
        ${sizeMap[data.size]} 
        ${colorMap[data.color]}
      `}
        >
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <div className="relative group">
                <span className="relative z-10">{data.label}</span>
                {data.mass > 7 && (
                    <div className="absolute inset-0 bg-white/5 blur-lg rounded-full animate-pulse pointer-events-none" />
                )}
            </div>
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
        </div>
    );
};

export default memo(CustomNode);



