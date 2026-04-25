import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '@/hooks/useDawayirEngine';
import { useStressAura } from '@/modules/dawayir/hooks/useStressAura';

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

const CustomNode = ({ data }: NodeProps<NodeData & { showLabels?: boolean }>) => {
    const aura = useStressAura();
    const isCore = data.color === 'core';

    return (
        <div
            className={`rounded-full flex items-center justify-center text-center p-3 border transition-all duration-700 font-mono relative
        custom-drag-handle
        ${sizeMap[data.size]} 
        ${colorMap[data.color]}
      `}
        >
            <Handle type="target" position={Position.Top} className="opacity-0" />

            {/* Stress Aura — only on the core "أنا" node */}
            {isCore && aura.isConnected && (
                <>
                    {/* Outer breathing ring */}
                    <div
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                            boxShadow: `0 0 ${20 + aura.stressLevel * 0.4}px ${aura.auraColor}, inset 0 0 ${10 + aura.stressLevel * 0.2}px ${aura.auraColor}`,
                            animation: `pulse ${aura.pulseDuration}s ease-in-out infinite`,
                            opacity: aura.auraIntensity,
                        }}
                    />
                    {/* Inner glow ring */}
                    <div
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            inset: '-4px',
                            border: `2px solid ${aura.auraColor}`,
                            borderRadius: '50%',
                            animation: `pulse ${aura.pulseDuration * 1.3}s ease-in-out infinite alternate`,
                            opacity: aura.auraIntensity * 0.6,
                        }}
                    />
                    {/* Stress level micro-badge */}
                    <div
                        className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[7px] font-black text-white z-10"
                        style={{
                            background: aura.auraColor,
                            boxShadow: `0 0 8px ${aura.auraColor}`,
                        }}
                    >
                        {aura.stressLevel}
                    </div>
                </>
            )}

            <div className="relative group">
                {(data.showLabels || isCore) && <span className="relative z-10">{data.label}</span>}
                {data.mass > 7 && (
                    <div className="absolute inset-0 bg-white/5 blur-lg rounded-full animate-pulse pointer-events-none" />
                )}
            </div>
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
        </div>
    );
};

export default memo(CustomNode);
