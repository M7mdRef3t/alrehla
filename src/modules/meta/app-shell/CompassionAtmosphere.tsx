"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeState } from "@/domains/consciousness/store/theme.store";
import { Heart } from "lucide-react";

/**
 * ◈ CompassionAtmosphere ◈
 * A global cinematic layer that activates when the Sovereign Admin triggers the Compassion Protocol.
 * It forces a state of absolute serenity, golden aesthetics, and removes sensory distortion.
 */
export const CompassionAtmosphere: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const { updateTokens } = useThemeState();

  useEffect(() => {
    // Initial fetch from Supabase
    import("@/services/supabaseClient").then(async ({ supabase, isSupabaseReady }) => {
      if (!isSupabaseReady || !supabase) return;
      const { data } = await supabase.from("system_settings").select("value").eq("key", "compassion_protocol_active").maybeSingle();
      if (data) {
        setIsActive(!!data.value);
        if (data.value) {
          updateTokens({ 
            chromaticAberration: 0,
            vignetteStrength: 0.2,
            grainOpacity: 0.05,
            primaryColor: "#F59E0B"
          });
        }
      }
    });

    // Listen for global compassion sync events from globalPulse.ts
    const handleSync = (e: any) => {
      const active = !!e.detail?.active;
      setIsActive(active);
      
      if (active) {
        // Force-clean the UI tokens when compassion is active
        updateTokens({ 
          chromaticAberration: 0,
          vignetteStrength: 0.2,
          grainOpacity: 0.05,
          primaryColor: "#F59E0B" // Horus Gold
        });
      }
    };

    window.addEventListener("alrehla-compassion-sync", handleSync);
    return () => window.removeEventListener("alrehla-compassion-sync", handleSync);
  }, [updateTokens]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none select-none z-[9999]"
          style={{ isolation: 'isolate' }}
        >
          {/* Golden Divine Glow */}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-amber-500/10 mix-blend-overlay"
          />
          
          {/* Pulsing Mercy Aura */}
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0%,transparent_70%)]"
          />

          {/* Floating Sacred Geometry (Subtle) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
             <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
               className="w-[800px] h-[800px] border border-amber-500/20 rounded-full flex items-center justify-center"
             >
                <div className="w-[600px] h-[600px] border border-amber-500/10 rounded-full" />
                <div className="w-[400px] h-[400px] border border-amber-500/5 rounded-full" />
             </motion.div>
          </div>

          {/* Mercy Message (Occasional) */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 1.5 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="p-2 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400">
                <Heart size={16} fill="currentColor" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/80">
                Protocol: Compassion Active
              </span>
              <span className="text-[13px] text-amber-200/60 font-medium">
                ◈ طمأنينة من الملاذ ◈
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
