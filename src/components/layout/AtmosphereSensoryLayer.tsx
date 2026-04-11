import React from "react";
import { useThemeState } from "@/domains/consciousness/store/theme.store";

/**
 * ⛈️ AtmosphereSensoryLayer
 * Provides the visual "Soul" of the OS through film grain, vignettes, and lens effects.
 * Values are controlled via Design Lab tokens.
 */
export const AtmosphereSensoryLayer: React.FC = () => {
  const { liteMode } = useThemeState();
  
  // No sensory effects in lite mode for performance
  if (liteMode) return null;

  return (
    <div className="atmosphere-sensory-layer">
      {/* 🌑 Focus Vignette */}
      <div className="atmosphere-vignette" />
      
      {/* 🎞️ Cinematic Grain */}
      <div className="atmosphere-grain" />
      
      {/* 🕶️ Lens Aberration / Glitch Layer */}
      <div className="atmosphere-aberration" />
      
      {/* 📡 Radar Sweep (Subtle Background Pulse) */}
      <div className="radar-sweep" />
    </div>
  );
};
