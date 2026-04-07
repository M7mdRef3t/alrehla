import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSyncState } from "@/state/syncState";
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { queueMapSync } from "@/services/mapSync";
import { useMapState } from "@/state/mapState";

export const SyncStatusUI: FC = () => {
    const { status, lastLocalSaveAt, lastSyncAt, error } = useSyncState();
    const [showTooltip, setShowTooltip] = useState(false);
    const nodes = useMapState(s => s.nodes);

    const formatTime = (isoString?: string) => {
        if (!isoString) return "";
        const d = new Date(isoString);
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? '' : 'ص';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        return `${hours}:${minutes} ${ampm}`;
    };

    const currentConfig = () => {
        switch (status) {
            case "idle":
                return {
                    icon: <Cloud className="w-4 h-4 opacity-70" />,
                    text: "",
                    color: "rgba(148,163,184,0.7)"
                };
            case "offline":
                return {
                    icon: <CloudOff className="w-4 h-4 text-slate-400" />,
                    text: lastLocalSaveAt ? `Offline  Saved locally` : "Offline",
                    color: "rgba(148,163,184,0.8)"
                };
            case "local_saved":
                return {
                    icon: <CheckCircle className="w-4 h-4 text-emerald-400/80" />,
                    text: `Saved locally  ${formatTime(lastLocalSaveAt)}`,
                    color: "rgba(52,211,153,0.9)"
                };
            case "syncing":
                return {
                    icon: <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />,
                    text: "Syncing...",
                    color: "rgba(96,165,250,0.9)"
                };
            case "synced":
                return {
                    icon: <Cloud className="w-4 h-4 text-teal-400" />,
                    text: `Synced  ${formatTime(lastSyncAt)}`,
                    color: "rgba(45,212,191,0.9)"
                };
            case "error":
                return {
                    icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
                    text: "Sync failed",
                    color: "rgba(248,113,113,0.9)"
                };
            default:
                return {
                    icon: <Cloud className="w-4 h-4 opacity-50" />,
                    text: "",
                    color: "rgba(148,163,184,0.5)"
                };
        }
    };

    const config = currentConfig();

    // Hide the UI entirely if there is nothing to show and no history
    if (status === "idle" && !lastLocalSaveAt && !lastSyncAt) return null;

    return (
        <div
            className="fixed z-[85] top-[calc(env(safe-area-inset-top)+1rem)] right-4 flex flex-col items-end"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <button
                type="button"
                onClick={() => {
                    if (status === "error" || status === "offline") {
                        queueMapSync(nodes);
                    }
                }}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-md shadow-sm transition-all border border-white/10 cursor-default"
                style={{
                    background: "rgba(15,23,42,0.65)",
                    color: config.color,
                    cursor: (status === "error" || status === "offline") ? "pointer" : "default"
                }}
                aria-label="Map Sync Status"
            >
                <span>{config.icon}</span>
                {config.text && (
                    <span className="text-[11px] font-medium whitespace-nowrap hidden sm:inline-block">
                        {config.text}
                    </span>
                )}
                {(status === "error" || status === "offline") && (
                    <span className="text-[10px] font-bold underline decoration-white/30 ml-1 hidden sm:inline-block">
                        Retry
                    </span>
                )}
            </button>

            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 right-0 rounded-xl px-3 py-2 text-right border border-white/10 shadow-xl"
                        style={{
                            background: "rgba(15,23,42,0.95)",
                            backdropFilter: "blur(12px)",
                            minWidth: "160px"
                        }}
                    >
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                                <span style={{ color: "var(--text-secondary)" }}>Local Save:</span>
                                <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                                    {lastLocalSaveAt ? formatTime(lastLocalSaveAt) : "--"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span style={{ color: "var(--text-secondary)" }}>Cloud Sync:</span>
                                <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                                    {lastSyncAt ? formatTime(lastSyncAt) : "--"}
                                </span>
                            </div>
                            {error && (
                                <div className="mt-2 pt-2 border-t border-white/10 text-[9px] text-red-400">
                                    Error: {error}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
