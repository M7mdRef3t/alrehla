import { logger } from "../../../../../services/logger";
import type { FC } from "react";
import { useState, useEffect } from "react";
import { FileText, Save, RefreshCw, Sun, Moon, Sunset, Palette, Loader2 } from "lucide-react";
import { runCronReport, saveThemePalette, fetchThemePalette, type ThemePalette } from "../../../../../services/adminApi";

interface AdminToolsProps {
    loading: boolean;
}

const ThemePresetButton: FC<{ label: string; colors: ThemePalette; onSelect: (c: ThemePalette) => void; icon: any }> = ({ label, colors, onSelect, icon: Icon }) => (
    <button
        onClick={() => onSelect(colors)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 transition-colors text-xs font-bold text-slate-300"
    >
        <Icon className="w-3.5 h-3.5" />
        {label}
    </button>
);

export const AdminTools: FC<AdminToolsProps> = ({ loading }) => {
    const [generatingDaily, setGeneratingDaily] = useState(false);
    const [generatingWeekly, setGeneratingWeekly] = useState(false);
    const [savingColors, setSavingColors] = useState(false);

    // Default Colors
    const [colors, setColors] = useState<ThemePalette>({
        primary: "#2dd4bf", // Teal
        accent: "#f59e0b", // Amber
        nebulaBase: "#0f172a", // Slate 900
        nebulaAccent: "#1e293b", // Slate 800
        glassBackground: "rgba(15, 23, 42, 0.6)",
        glassBorder: "rgba(255, 255, 255, 0.05)"
    });

    // Load colors on mount
    useEffect(() => {
        fetchThemePalette().then(palette => {
            if (palette) setColors(prev => ({ ...prev, ...palette }));
        });
    }, []);

    const handleGenerateReport = async (type: 'daily' | 'weekly') => {
        if (type === 'daily') setGeneratingDaily(true);
        else setGeneratingWeekly(true);

        try {
            await runCronReport(type);
        } catch (error) {
            logger.error("Failed to generate report", error);
        } finally {
            if (type === 'daily') setGeneratingDaily(false);
            else setGeneratingWeekly(false);
        }
    };

    const handleColorChange = (key: keyof ThemePalette, value: string) => {
        setColors(prev => {
            const newColors = { ...prev, [key]: value };
            // applyColors(newColors); // In a real app, apply CSS vars here immediately for live preview
            return newColors;
        });
    };

    const handleSaveColors = async () => {
        setSavingColors(true);
        try {
            await saveThemePalette(colors);
            // Optional: Show success toast
        } catch (error) {
            logger.error("Failed to save colors", error);
        } finally {
            setSavingColors(false);
        }
    };

    const presets: Record<string, ThemePalette> = {
        sunrise: {
            primary: "#0ea5e9", // Sky
            accent: "#f97316", // Orange
            nebulaBase: "#fff7ed", // Orange 50
            nebulaAccent: "#ffedd5", // Orange 100
            glassBackground: "rgba(255, 255, 255, 0.8)",
            glassBorder: "rgba(0, 0, 0, 0.05)"
        },
        midnight: {
            primary: "#2dd4bf", // Teal
            accent: "#f59e0b", // Amber
            nebulaBase: "#0f172a", // Slate 900
            nebulaAccent: "#1e293b", // Slate 800
            glassBackground: "rgba(15, 23, 42, 0.6)",
            glassBorder: "rgba(255, 255, 255, 0.05)"
        },
        desert: {
            primary: "#d97706", // Amber 600
            accent: "#059669", // Emerald 600
            nebulaBase: "#292524", // Stone 800
            nebulaAccent: "#44403c", // Stone 700
            glassBackground: "rgba(41, 37, 36, 0.6)",
            glassBorder: "rgba(255, 255, 255, 0.05)"
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 w-full opacity-50 p-6 bg-slate-900/20 rounded-2xl animate-pulse">
                <div className="h-12 bg-slate-800 rounded mb-4" />
                <div className="h-12 bg-slate-800 rounded" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6" dir="rtl">

            {/* Reports Section */}
            <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm space-y-4">
                {/* Daily Report */}
                <div className="flex justify-between items-center p-4 bg-slate-900/40 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <span className="font-bold text-slate-200">التقرير اليومي</span>
                    </div>
                    <button
                        onClick={() => handleGenerateReport('daily')}
                        disabled={generatingDaily}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generatingDaily ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                        {generatingDaily ? "جاري التوليد..." : "توليد التقرير"}
                    </button>
                </div>

                {/* Weekly Report */}
                <div className="flex justify-between items-center p-4 bg-slate-900/40 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <span className="font-bold text-slate-200">التقرير الأسبوعي</span>
                    </div>
                    <button
                        onClick={() => handleGenerateReport('weekly')}
                        disabled={generatingWeekly}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generatingWeekly ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                        {generatingWeekly ? "جاري التوليد..." : "توليد التقرير"}
                    </button>
                </div>
            </div>

            {/* Theme Colors Section */}
            <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Palette className="w-5 h-5 text-slate-400" />
                            <h3 className="text-lg font-bold text-white">ألوان المنصة (Owner)</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                            تحكم في اللون الرئيسي، اللكنة، خلفية السديم، وشفافية الكروت الزجاجية. التغييرات تنطبق على كل المنصة فوراً.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <ThemePresetButton label="وضع الشروق" colors={presets.sunrise} onSelect={setColors} icon={Sun} />
                        <ThemePresetButton label="منتصف الليل" colors={presets.midnight} onSelect={setColors} icon={Moon} />
                        <ThemePresetButton label="وضع الصحراء" colors={presets.desert} onSelect={setColors} icon={Sunset} />
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Primary & Accent */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-white/5">
                            <span className="text-xs font-bold text-slate-300">لون اللكنة (Amber — التنبيهات والهايلايت)</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-500">{colors.accent}</span>
                                <input type="color" value={colors.accent || "#f59e0b"} onChange={(e) => handleColorChange('accent', e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-white/5">
                            <span className="text-xs font-bold text-slate-300">اللون الرئيسي (Teal — الأزرار واللمسات الأساسية)</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-500">{colors.primary}</span>
                                <input type="color" value={colors.primary || "#2dd4bf"} onChange={(e) => handleColorChange('primary', e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none" />
                            </div>
                        </div>
                    </div>

                    {/* Backgrounds */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-white/5">
                            <span className="text-xs font-bold text-slate-300">لون توهج الخلفية (Nebula Accent)</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-500">{colors.nebulaAccent}</span>
                                <input type="color" value={colors.nebulaAccent || "#1e293b"} onChange={(e) => handleColorChange('nebulaAccent', e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-white/5">
                            <span className="text-xs font-bold text-slate-300">خلفية الفضاء (Nebula Base)</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-500">{colors.nebulaBase}</span>
                                <input type="color" value={colors.nebulaBase || "#0f172a"} onChange={(e) => handleColorChange('nebulaBase', e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none" />
                            </div>
                        </div>
                    </div>

                    {/* Glass Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-white/5">
                            <span className="text-xs font-bold text-slate-300">خلفية الكروت الزجاجية (Glass Background)</span>
                            <div className="flex items-center gap-2 w-32">
                                <input
                                    type="text"
                                    value={colors.glassBackground || "rgba(15, 23, 42, 0.6)"}
                                    onChange={(e) => handleColorChange('glassBackground', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 font-mono focus:outline-none focus:border-slate-500"
                                />
                                <div className="w-4 h-4 rounded border border-slate-600" style={{ backgroundColor: colors.glassBackground }} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-white/5">
                            <span className="text-xs font-bold text-slate-300">حدود الكروت الزجاجية (Glass Border)</span>
                            <div className="flex items-center gap-2 w-32">
                                <input
                                    type="text"
                                    value={colors.glassBorder || "rgba(255, 255, 255, 0.05)"}
                                    onChange={(e) => handleColorChange('glassBorder', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 font-mono focus:outline-none focus:border-slate-500"
                                />
                                <div className="w-4 h-4 rounded border border-slate-600" style={{ backgroundColor: colors.glassBorder }} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSaveColors}
                            disabled={savingColors}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-xs font-bold transition-all border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {savingColors ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                            {savingColors ? "جاري الحفظ..." : "حفظ الألوان"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
