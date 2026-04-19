import type { FC } from "react";

export const FloatingParticles: FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
    <div className="absolute top-[20%] left-[30%] w-2 h-2 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.6)] animate-pulse" style={{ animationDuration: "3s" }} />
    <div className="absolute top-[60%] left-[80%] w-1.5 h-1.5 rounded-full bg-indigo-300 shadow-[0_0_8px_rgba(167,139,250,0.6)] animate-pulse" style={{ animationDuration: "4s" }} />
    <div className="absolute top-[80%] left-[20%] w-2.5 h-2.5 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.6)] animate-pulse" style={{ animationDuration: "5s" }} />
    <div className="absolute top-[10%] left-[70%] w-1 h-1 rounded-full bg-teal-200 shadow-[0_0_6px_rgba(45,212,191,0.4)] animate-pulse" style={{ animationDuration: "2.5s" }} />
  </div>
);

export const OrbitalRings: FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
    <div className="absolute rounded-full border border-dashed border-teal-500/10 w-[320px] h-[320px] animate-[spin_40s_linear_infinite]" />
    <div className="absolute rounded-full border border-dashed border-indigo-500/10 w-[480px] h-[480px] animate-[spin_60s_linear_infinite_reverse]" />
  </div>
);

export const NebulaLayer: FC = () => (
   <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
     <div 
       className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] animate-[pulse_10s_ease-in-out_infinite]"
       style={{
         background: "radial-gradient(circle at 30% 70%, rgba(0, 240, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)",
         filter: "blur(60px)"
       }} 
     />
   </div>
 );

export const RadarSweep: FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_15s_linear_infinite]"
      style={{
        width: "140vh",
        height: "140vh",
        background: "conic-gradient(from 0deg, rgba(0, 240, 255, 0.15) 0deg, rgba(0, 240, 255, 0) 40deg, transparent 360deg)",
        borderRadius: "50%",
        filter: "blur(50px)"
      }}
    />
  </div>
);

interface AmbientBackgroundProps {
  ambientBackground: string;
  showHeavyAmbientLayers: boolean;
  reduceMotion: boolean | null;
}

export const AmbientBackground: FC<AmbientBackgroundProps> = ({
  ambientBackground,
  showHeavyAmbientLayers,
  reduceMotion
}) => (
  <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
    <div className="absolute inset-0" style={{ background: ambientBackground }} />
    {/* Clean up: Removed heavy blur layers (Nebula/Radar) to achieve maximum clarity */}
    {showHeavyAmbientLayers && <FloatingParticles />}
    {!reduceMotion && <OrbitalRings />}
  </div>
);
