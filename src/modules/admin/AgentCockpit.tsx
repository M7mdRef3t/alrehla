import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Shield, Cpu, Activity } from 'lucide-react';

const AgentCockpit: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    // Simulated connection to OpenClaw Gateway
    setStatus('connecting');
    const timer = setTimeout(() => {
      setStatus('connected');
      setLogs(prev => [...prev, '[System] Local Gateway connected on ws://127.0.0.1:18789']);
      setLogs(prev => [...prev, '[Agent] Rehla AI Bot is now active on Telegram']);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans p-8 pt-24 overflow-hidden relative">
      <div className="max-w-6xl mx-auto z-10 relative">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent mb-2 font-display">
              لوحة قيادة وكيل الرحلة (Agent Cockpit)
            </h1>
            <p className="text-zinc-500 text-lg">مراقبة حية لوكيل الذكاء الاصطناعي والتكامل مع تليجرام</p>
          </div>
          <div className={`px-4 py-2 rounded-full border ${status === 'connected' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'} flex items-center gap-2`}>
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium uppercase tracking-wider">{status}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-xl hover:border-red-500/30 transition-all duration-500 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-500/10 rounded-xl group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">حالة الأمان</h3>
                  <p className="text-xs text-zinc-500 uppercase">Gateway Security</p>
                </div>
              </div>
              <div className="text-3xl font-bold font-mono text-green-400">ENCRYPTED</div>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-xl hover:border-blue-500/30 transition-all duration-500 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">نموذج الذكاء</h3>
                  <p className="text-xs text-zinc-500 uppercase">Provider Status</p>
                </div>
              </div>
              <div className="text-3xl font-bold font-mono text-blue-400">GEMINI 1.5</div>
            </div>
          </div>

          {/* Console Section */}
          <div className="lg:col-span-2">
            <div className="bg-black/80 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-2xl h-[500px] flex flex-col shadow-2xl">
              <div className="bg-zinc-900/80 px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-mono text-zinc-400">openclaw-gateway-logs</span>
                <div className="flex gap-1.5 ml-auto">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30" />
                </div>
              </div>
              <div className="p-6 font-mono text-sm overflow-y-auto flex-1 space-y-2">
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`${log.includes('[System]') ? 'text-zinc-500' : 'text-red-400/90'}`}
                  >
                    <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    {log}
                  </motion.div>
                ))}
                {status === 'connected' && (
                  <motion.div
                    animate={{ opacity: [0, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-2 h-4 bg-red-500/50 inline-block ml-1 align-middle"
                  />
                )}
              </div>
              <div className="p-4 bg-zinc-900/30 border-t border-white/5">
                <input 
                  type="text"
                  placeholder="Enter command to AI Agent..."
                  className="w-full bg-transparent border-none outline-none text-red-500 placeholder-zinc-700 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
    </div>
  );
};

export default AgentCockpit;
