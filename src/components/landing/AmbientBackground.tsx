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

export const RadarSweep: FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_12s_linear_infinite]"
      style={{
        width: "120vh",
        height: "120vh",
        background: "conic-gradient(from 0deg, rgba(45,212,191,0.15) 0deg, rgba(45,212,191,0) 60deg, transparent 360deg)",
        borderRadius: "50%",
        filter: "blur(40px)"
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
    {showHeavyAmbientLayers && <FloatingParticles />}
    {!reduceMotion && <OrbitalRings />}
    {showHeavyAmbientLayers && <RadarSweep />}
  </div>
);
