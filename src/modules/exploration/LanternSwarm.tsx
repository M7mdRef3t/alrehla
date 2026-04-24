import React from "react";
import { motion } from "framer-motion";
import { useLanternsState, TravelLantern } from "@/domains/consciousness/store/lanterns.store";
import { Flame } from "lucide-react";
import { runtimeEnv } from "@/config/runtimeEnv";

export const LanternSwarm: React.FC = () => {
  const { availableLanterns, openLantern, hasInteractedWithCurrentSwarm } = useLanternsState();

  if (availableLanterns.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: hasInteractedWithCurrentSwarm ? 0 : 1 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    >
      {availableLanterns.map((lantern) => (
        <FloatingLantern 
          key={lantern.id} 
          lantern={lantern} 
          onClick={() => openLantern(lantern.id)} 
        />
      ))}
    </motion.div>
  );
};

const FloatingLantern: React.FC<{ lantern: TravelLantern; onClick: () => void }> = ({ lantern, onClick }) => {
  // Generate random drift animation paths based on intensity
  const randomDriftX = [0, 15, -15, 10, -5, 0];
  const randomDriftY = [0, -20, 10, -10, 15, 0];
  
  return (
    <motion.div
      className="absolute pointer-events-auto cursor-pointer"
      style={{
        left: `${lantern.positionX}%`,
        top: `${lantern.positionY}%`,
      }}
      initial={{ y: 50, opacity: 0, scale: 0.8 }}
      animate={{
        y: randomDriftY,
        x: randomDriftX,
        opacity: [0.6, lantern.intensity, 0.6],
        scale: [0.95, 1.05, 0.95],
      }}
      transition={{
        y: { duration: 12, repeat: Infinity, ease: "easeInOut" },
        x: { duration: 15, repeat: Infinity, ease: "easeInOut" },
        opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
      }}
      onClick={onClick}
      whileHover={{ scale: 1.2, filter: "brightness(1.5)" }}
    >
      {/* The Glow Halo */}
      <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl animate-pulse" style={{ transform: "scale(2.5)" }} />
      
      {/* The Core Lantern Shape */}
      <div className="relative flex items-center justify-center w-12 h-16 rounded-[40%] bg-gradient-to-b from-amber-200/40 to-amber-600/10 backdrop-blur-md border border-amber-300/30 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
        <Flame className="w-5 h-5 text-amber-200 opacity-80" strokeWidth={1.5} />
      </div>
    </motion.div>
  );
};
