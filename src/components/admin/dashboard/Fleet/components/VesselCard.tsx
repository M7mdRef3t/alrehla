
import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Shield, Zap, Palette, Brain, Users as UsersIcon } from 'lucide-react';
import { useFleetState, FleetVessel, FleetState } from '../../../../../state/fleetState';

interface VesselCardProps {
    vessel: FleetVessel;
    isActive: boolean;
    onClick: () => void;
}

export const VesselCard: React.FC<VesselCardProps> = ({ vessel, isActive, onClick }) => {
    const toggleVesselSandbox = useFleetState((s: FleetState) => s.toggleVesselSandbox);

    const getIcon = () => {
        switch (vessel.domain) {
            case 'CREATIVE': return <Palette className="w-4 h-4" />;
            case 'ANALYTICAL': return <Brain className="w-4 h-4" />;
            case 'SOCIAL': return <UsersIcon className="w-4 h-4" />;
            default: return <Rocket className="w-4 h-4" />;
        }
    };

    const getColor = () => {
        switch (vessel.domain) {
            case 'CREATIVE': return 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5';
            case 'ANALYTICAL': return 'text-teal-400 border-teal-500/20 bg-teal-500/5';
            case 'SOCIAL': return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
            default: return 'text-slate-400 border-white/5 bg-white/5';
        }
    };

    return (
        <motion.button
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`w-full p-4 rounded-2xl border transition-all text-right flex flex-col gap-3 relative overflow-hidden group ${isActive ? 'border-teal-500/50 bg-teal-500/10 ring-1 ring-teal-500/30' : 'border-white/5 bg-slate-900/40 hover:bg-slate-900/60'
                }`}
        >
            <div className="flex justify-between items-start">
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getColor()}`}>
                    {vessel.domain}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleVesselSandbox(vessel.id);
                        }}
                        className={`p-1.5 rounded-lg border transition-all ${vessel.isSandboxed ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-rose-400'}`}
                        title={vessel.isSandboxed ? "مشروع معزول" : "تفعيل العزل"}
                    >
                        <Shield className="w-3.5 h-3.5" />
                    </button>
                    <div className={`p-2 rounded-xl bg-white/5 ${isActive ? 'text-teal-400' : 'text-slate-500'}`}>
                        {getIcon()}
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <h4 className="font-bold text-sm text-white group-hover:text-teal-400 transition-colors">{vessel.title}</h4>
                <div className="flex items-center gap-2 justify-end">
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${vessel.energyLevel * 100}%` }}
                            className={`h-full ${vessel.energyLevel > 0.7 ? 'bg-teal-500' : 'bg-slate-600'}`}
                        />
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase">Fuel</span>
                </div>
            </div>

            {isActive && (
                <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
            )}
        </motion.button>
    );
};
