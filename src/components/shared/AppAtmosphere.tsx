import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface AppAtmosphereProps {
    mode?: 'default' | 'radar' | 'minimal';
    intensity?: number;
    className?: string;
}

/**
 * AppAtmosphere — المكون الموحد للأجواء البصرية
 * ============================================
 * يدمج بين منطق الـ AmbientBackground والـ RadarBackground
 * لضمان أداء عالٍ (GPU Accelerated) وتجربة بصرية متسقة.
 */
export const AppAtmosphere: React.FC<AppAtmosphereProps> = ({ 
    mode = 'default', 
    intensity = 1,
    className = "" 
}) => {
    const isRadar = mode === 'radar';
    const isMinimal = mode === 'minimal';

    // طبقة السديم (Nebula)
    const nebulaLayer = useMemo(() => (
        <motion.div
            className="absolute inset-0 z-[-2] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ 
                opacity: isMinimal ? 0.3 : 0.6 * intensity,
                background: isRadar 
                    ? 'radial-gradient(circle at 50% 50%, rgba(13, 148, 136, 0.15) 0%, transparent 70%)'
                    : 'radial-gradient(circle at 50% 50%, rgba(45, 27, 105, 0.4) 0%, #02040a 100%)'
            }}
            transition={{ duration: 2 }}
        />
    ), [isRadar, isMinimal, intensity]);

    // طبقة الجزيئات (Particles)
    const particleLayer = useMemo(() => {
        if (isMinimal) return null;
        return (
            <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none opacity-40">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        initial={{ 
                            x: Math.random() * 100 + "%", 
                            y: Math.random() * 100 + "%",
                            opacity: Math.random() * 0.5 + 0.2
                        }}
                        animate={{ 
                            y: ["-10%", "110%"],
                            opacity: [0, 1, 1, 0]
                        }}
                        transition={{ 
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            delay: Math.random() * 20,
                            ease: "linear"
                        }}
                    />
                ))}
            </div>
        );
    }, [isMinimal]);

    // طبقة الرادار (Radar Scan)
    const radarLayer = useMemo(() => {
        if (!isRadar) return null;
        return (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
                {/* Circular Scan */}
                <motion.div 
                    className="absolute w-[800px] h-[800px] border-[1px] border-teal-500/20 rounded-full"
                    animate={{ scale: [0.8, 1.2], opacity: [0.5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div 
                    className="absolute w-[400px] h-[400px] border-[1px] border-teal-500/30 rounded-full"
                    animate={{ scale: [0.5, 1.5], opacity: [0.3, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeOut", delay: 1 }}
                />
            </div>
        );
    }, [isRadar]);

    return (
        <div className={`fixed inset-0 w-full h-full overflow-hidden select-none touch-none ${className}`} style={{ zIndex: -10 }}>
            {nebulaLayer}
            {particleLayer}
            {radarLayer}
            
            {/* Overlay Gradient for contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />
        </div>
    );
};

export default AppAtmosphere;
