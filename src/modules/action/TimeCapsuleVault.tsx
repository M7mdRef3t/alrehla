import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Plus, Calendar, Award, X } from "lucide-react";
import { LegacyEngine, WisdomCapsule } from "@/services/legacyEngine";
import { useMapState } from "@/state/mapState";
import { usePulseState } from "@/state/pulseState";
import { ChronicleGenerator } from "@/services/chronicleGenerator";

interface TimeCapsuleVaultProps {
    onClose: () => void;
}

export function TimeCapsuleVault({ onClose }: TimeCapsuleVaultProps) {
    const [capsules, setCapsules] = useState<WisdomCapsule[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newContent, setNewContent] = useState("");
    const [unlockDate, setUnlockDate] = useState("");
    const [minRank, setMinRank] = useState<number>(0);

    // Mock rank for now, replace with actual user rank if available in props/store
    const currentRank = 5;

    useEffect(() => {
        loadCapsules();
    }, []);

    const loadCapsules = () => {
        const list = LegacyEngine.getAllCapsules(currentRank);
        setCapsules(list);
    };

    const handleCreate = () => {
        if (!newContent.trim()) return;

        LegacyEngine.createCapsule(
            newContent,
            unlockDate || undefined,
            minRank > 0 ? minRank : undefined
        );

        setNewContent("");
        setUnlockDate("");
        setMinRank(0);
        setShowCreate(false);
        loadCapsules();
    };

    const { nodes } = useMapState();
    const { logs } = usePulseState();

    const handleArchiveChronicle = () => {
        const text = ChronicleGenerator.generateChronicle(nodes, logs);
        LegacyEngine.createCapsule(text, undefined, undefined, "stoic");
        loadCapsules();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md">
            <button
                onClick={onClose}
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 to-slate-800">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 mb-1">
                        Legacy Vault: Wisdom Capsules
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Immortalize your insights for the future Commander.
                    </p>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <AnimatePresence>
                        {capsules.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-center py-12 text-slate-500"
                            >
                                <Lock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No wisdom recorded yet.</p>
                            </motion.div>
                        )}

                        {capsules.map((capsule) => (
                            <motion.div
                                key={capsule.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-xl border ${capsule.isLocked ? "bg-slate-800/50 border-slate-700/50" : "bg-emerald-900/10 border-emerald-500/20"}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        {capsule.isLocked ? (
                                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                                <Lock className="w-4 h-4" />
                                                <span className="font-mono text-xs uppercase tracking-wider">Encrypted Signal</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                                <Unlock className="w-4 h-4" />
                                                <span className="font-mono text-xs uppercase tracking-wider">Decrypted Wisdom</span>
                                            </div>
                                        )}

                                        <p className={`text-sm leading-relaxed ${capsule.isLocked ? "blur-sm select-none opacity-50" : "text-slate-200"}`}>
                                            {capsule.isLocked ? "This wisdom is waiting for the right moment to be revealed." : capsule.content}
                                        </p>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {capsule.unlockConditions.date && (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 text-[10px] text-slate-400">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(capsule.unlockConditions.date).toLocaleDateString()}
                                                </span>
                                            )}
                                            {capsule.unlockConditions.rank && (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 text-[10px] text-slate-400">
                                                    <Award className="w-3 h-3" />
                                                    Rank {capsule.unlockConditions.rank}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-500 self-center ml-auto">
                                                Encoded: {new Date(capsule.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 flex gap-3">
                    <button
                        onClick={handleArchiveChronicle}
                        className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                    >
                        <Award className="w-5 h-5" />
                        Archive Chronicle
                    </button>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold shadow-lg shadow-teal-900/20 hover:shadow-teal-900/40 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Record New Legacy
                    </button>
                </div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
                    >
                        <div className="w-full max-w-md bg-slate-800 border border-slate-600 rounded-2xl p-6 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-4">Transmission to the Future</h3>

                            <textarea
                                id="time-capsule-content"
                                name="timeCapsuleContent"
                                placeholder="What wisdom have you gained, Commander?"
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 mb-4 h-32 resize-none"
                            />

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Unlock Date (Optional)</label>
                                    <input
                                        id="time-capsule-unlock-date"
                                        name="timeCapsuleUnlockDate"
                                        type="date"
                                        value={unlockDate}
                                        onChange={(e) => setUnlockDate(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Min Rank (Optional)</label>
                                    <input
                                        id="time-capsule-min-rank"
                                        name="timeCapsuleMinRank"
                                        type="number"
                                        placeholder="e.g. 10"
                                        value={minRank || ""}
                                        onChange={(e) => setMinRank(parseInt(e.target.value) || 0)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-teal-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newContent.trim()}
                                    className="flex-1 py-2.5 rounded-lg bg-teal-500 text-white font-bold hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Encrypt & Lock
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
