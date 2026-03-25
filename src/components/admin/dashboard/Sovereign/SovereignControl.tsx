import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Send, Zap, Wind, AlertCircle } from "lucide-react";
import { supabase, isSupabaseReady } from "../../../../services/supabaseClient";

export const SovereignControl: FC = () => {
  const [harmonyOverride, setHarmonyOverride] = useState<number>(0.8);
  const [isSaving, setIsSaving] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!isSupabaseReady || !supabase) return;
    void supabase
      .from("system_settings")
      .select("value")
      .eq("key", "global_harmony_override")
      .maybeSingle()
      .then(({ data }) => {
        if (data && typeof data.value === "number") {
          setHarmonyOverride(data.value);
        }
      });
  }, []);

  const handleUpdateHarmony = async (val: number) => {
    setHarmonyOverride(val);
    if (!isSupabaseReady || !supabase) return;
    setIsSaving(true);
    await supabase.from("system_settings").upsert({
      key: "global_harmony_override",
      value: val
    });
    setIsSaving(false);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim() || !isSupabaseReady || !supabase) return;
    setIsSaving(true);
    await supabase.from("system_settings").upsert({
      key: "sovereign_broadcast",
      value: {
        message: broadcastMessage,
        timestamp: Date.now(),
        id: Math.random().toString(36).substr(2, 9)
      }
    });
    setBroadcastMessage("");
    setIsSaving(false);
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-teal-400">
          <Shield className="w-6 h-6" />
          <h1 className="text-3xl font-black uppercase tracking-tighter">Sovereign Control</h1>
        </div>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">تحكم في طاقة الملاذ ورسائل الروح</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Harmony Control */}
        <section className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl space-y-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-white font-bold">
              <Wind className="w-5 h-5 text-teal-400" />
              توازن التناغم العالمي
            </h2>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isSaving ? "bg-teal-500/20 text-teal-400 animate-pulse" : "bg-white/5 text-slate-500"}`}>
              {isSaving ? "Syncing..." : "Fixed State"}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
              <span>ضجيج (Noisy)</span>
              <span>سكينة (Zen)</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.0"
              step="0.05"
              value={harmonyOverride}
              onChange={(e) => handleUpdateHarmony(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <div className="flex items-center gap-2 p-4 bg-teal-400/5 rounded-2xl border border-teal-400/10">
              <Zap className="w-4 h-4 text-teal-400" />
              <p className="text-xs text-teal-300 leading-relaxed">
                هذا التحكم يغير **لون ونبض التنفس** لجميع المستخدمين في نفس اللحظة.
              </p>
            </div>
          </div>
        </section>

        {/* Global Broadcast */}
        <section className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl space-y-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-white font-bold">
              <Sparkles className="w-5 h-5 text-purple-400" />
              نداء الحاكم
            </h2>
          </div>

          <div className="space-y-4">
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="اكتب رسالة نورانية تظهر للجميع..."
              className="w-full h-32 bg-slate-800/50 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500/50 transition-all resize-none"
            />
            <button
              onClick={handleSendBroadcast}
              disabled={!broadcastMessage.trim() || isSaving}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 py-3 rounded-2xl text-white font-bold text-sm shadow-lg shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              <Send className="w-4 h-4" />
              بث الرسالة للعالم
            </button>
            <AnimatePresence>
              {showConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 justify-center text-teal-400 text-[10px] font-black uppercase"
                >
                  <AlertCircle className="w-3 h-3" />
                  تم البث بنجاح
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <footer className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl">
        <p className="text-xs text-rose-400/80 leading-relaxed text-center font-bold italic">
          "تذكر، هذه السلطة مصممة لنشر السكينة، استخدم نداء الحاكم بحكمة لتعزيز الرحلة المشتركة."
        </p>
      </footer>
    </div>
  );
};
