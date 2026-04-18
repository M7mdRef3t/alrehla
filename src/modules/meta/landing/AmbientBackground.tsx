import type { FC } from "react";

export const FloatingParticles: FC = () => {
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 4 + 2,
    delay: Math.random() * 5,
    color: i % 3 === 0 ? "bg-teal-400" : i % 3 === 1 ? "bg-indigo-400" : "bg-sky-400",
    glow: i % 3 === 0 ? "rgba(45,212,191,0.5)" : i % 3 === 1 ? "rgba(167,139,250,0.5)" : "rgba(125,211,252,0.5)"
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
      {particles.map((p) => (
        <div 
          key={p.id}
          className={`absolute rounded-full ${p.color} animate-pulse`}
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            boxShadow: `0 0 ${p.size * 4}px ${p.glow}`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
    </div>
  );
};

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
    {showHeavyAmbientLayers && <NebulaLayer />}
    {showHeavyAmbientLayers && <FloatingParticles />}
    {!reduceMotion && <OrbitalRings />}
    {showHeavyAmbientLayers && <RadarSweep />}
  </div>
);
