import React from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface SwarmStatusBadgeProps {
  label?: any;
  isInsulated?: boolean;
  tension: number;
  momentum: number;
  metadata?: any;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({ tension, momentum }) => {
  const getStatus = () => {
    if (tension > 70) return { color: "text-red-400 bg-red-900/20 border-red-500/30", icon: ShieldAlert, text: "High Tension" };
    if (momentum < -20) return { color: "text-yellow-400 bg-yellow-900/20 border-yellow-500/30", icon: Shield, text: "Low Momentum" };
    return { color: "text-emerald-400 bg-emerald-900/20 border-emerald-500/30", icon: ShieldCheck, text: "Stable Orbit" };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${status.color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium uppercase tracking-wider">{status.text}</span>
    </div>
  );
};
