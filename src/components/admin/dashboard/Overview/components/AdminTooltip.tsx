import React, { useState } from "react";
import { HelpCircle } from "lucide-react";

interface AdminTooltipProps {
    content: string | React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    className?: string;
    children?: React.ReactNode;
}

export const AdminTooltip: React.FC<AdminTooltipProps> = ({ content, position = "top", className = "", children }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
        bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
        left: "right-full mr-2 top-1/2 -translate-y-1/2",
        right: "left-full ml-2 top-1/2 -translate-y-1/2"
    };

    return (
        <span 
            className={`relative inline-flex items-center justify-center group/tooltip ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {/* The Trigger Icon or Wrapping Element */}
            {children ? (
                children
            ) : (
                <span className="text-slate-500 hover:text-cyan-400 cursor-help transition-colors p-0.5 rounded-full hover:bg-cyan-500/10 active:bg-cyan-500/20 inline-block">
                    <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
            )}

            {/* The Tooltip Popup */}
            <span
                className={`absolute z-[99] ${positionClasses[position]} 
                transition-all duration-300 pointer-events-none block
                ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 translate-y-1"}`}
                style={{ width: "220px", pointerEvents: isVisible ? "auto" : "none" }}
            >
                {/* Visual Glassmorphism Panel */}
                <span className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] shadow-cyan-900/20 ring-1 ring-cyan-500/10 text-xs text-slate-300 font-medium leading-relaxed relative overflow-hidden block" dir="rtl">
                    {/* Glowing Accent */}
                    <span className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 block" />
                    <span className="absolute -top-10 -right-10 w-20 h-20 bg-cyan-400/10 blur-[20px] rounded-full pointer-events-none block" />
                    
                    <span className="relative z-10 block font-normal text-[11px] font-sans">
                        {content}
                    </span>
                    
                    {/* Triangle Arrow */}
                    {position === "top" && <span className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border-b border-r border-white/10 rotate-45 transform block" />}
                    {position === "bottom" && <span className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border-t border-l border-white/10 rotate-45 transform block" />}
                </span>
            </span>
        </span>
    );
};
