import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminTooltipProps {
    content: string | React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    className?: string;
    children?: React.ReactNode;
}

export const AdminTooltip: React.FC<AdminTooltipProps> = ({ content, position = "top", className = "", children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLSpanElement>(null);

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top,
                left: rect.left,
            });
        }
    };

    useEffect(() => {
        if (isVisible) {
            updateCoords();
            window.addEventListener('scroll', updateCoords);
            window.addEventListener('resize', updateCoords);
        }
        return () => {
            window.removeEventListener('scroll', updateCoords);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isVisible]);

    const getTooltipStyles = () => {
        const offset = 12;
        const triggerRect = triggerRef.current?.getBoundingClientRect() || { width: 0, height: 0 };
        
        switch (position) {
            case "top":
                return {
                    top: coords.top - offset,
                    left: coords.left + triggerRect.width / 2,
                    transform: "translate(-50%, -100%)"
                };
            case "bottom":
                return {
                    top: coords.top + triggerRect.height + offset,
                    left: coords.left + triggerRect.width / 2,
                    transform: "translate(-50%, 0)"
                };
            case "left":
                return {
                    top: coords.top + triggerRect.height / 2,
                    left: coords.left - offset,
                    transform: "translate(-100%, -50%)"
                };
            case "right":
                return {
                    top: coords.top + triggerRect.height / 2,
                    left: coords.left + triggerRect.width + offset,
                    transform: "translate(0, -50%)"
                };
            default:
                return {};
        }
    };

    return (
        <span 
            ref={triggerRef}
            className={`relative inline-flex items-center justify-center group/tooltip ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children ? (
                children
            ) : (
                <span className="text-slate-500 hover:text-teal-400 cursor-help transition-colors p-0.5 rounded-full hover:bg-teal-500/10 active:bg-teal-500/20 inline-block">
                    <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
            )}

            {isVisible && typeof document !== "undefined" && createPortal(
                <div 
                    className="fixed z-[99999] pointer-events-none"
                    style={getTooltipStyles() as any}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: position === "top" ? 5 : -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: position === "top" ? 5 : -5 }}
                        className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 p-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-teal-500/20 text-slate-200 font-medium leading-relaxed min-w-[200px] max-w-[280px] relative overflow-hidden"
                        dir="rtl"
                    >
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-50" />
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-teal-400/10 blur-[30px] rounded-full" />
                        
                        <div className="relative z-10 font-sans text-[11px] font-normal">
                            {content}
                        </div>
                        
                        {/* Improved Arrow with proper orientation */}
                        <div className={`absolute w-3 h-3 bg-slate-900 border-white/10 rotate-45 transform 
                            ${position === "top" ? "-bottom-1.5 left-1/2 -translate-x-1/2 border-b border-r" : ""}
                            ${position === "bottom" ? "-top-1.5 left-1/2 -translate-x-1/2 border-t border-l" : ""}
                            ${position === "left" ? "-right-1.5 top-1/2 -translate-y-1/2 border-t border-r" : ""}
                            ${position === "right" ? "-left-1.5 top-1/2 -translate-y-1/2 border-b border-l" : ""}
                        `} />
                    </motion.div>
                </div>,
                document.body
            )}
        </span>
    );
};
