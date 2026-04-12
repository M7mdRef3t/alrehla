'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Shield, Users, Clock, AlertTriangle, MessageCircle, ChevronLeft, Globe } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import '@/styles/consciousness-theme.css';

interface Traveler {
  sessionId: string;
  clientName: string;
  phone: string;
  step: string;
  isTyping: boolean;
  activeField: string | null;
  crisisFlag: boolean;
  timestamp: string;
  lastActive?: number;
}

const STEP_LABELS: Record<string, string> = {
  welcome: 'بداية الرحلة',
  basic: 'تحديد الهوية',
  reason: 'بوصلة المعاناة',
  context: 'تحليل السياق',
  safety: 'بروتوكول الأمان',
  success: 'اكتمال الإرسال'
};

export default function SovereignLiveMonitor() {
  const [travelers, setTravelers] = useState<Record<string, Traveler>>({});
  const [stats, setStats] = useState({ active: 0, crisis: 0 });
  
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    // 1. Initial Fetch from DB
    const fetchInitial = async () => {
      const { data, error } = await client
        .from('session_telemetry')
        .select('*')
        .gt('last_active', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Last 30 mins

      if (data) {
        const initialMap: Record<string, Traveler> = {};
        data.forEach(t => {
          initialMap[t.session_id] = {
            sessionId: t.session_id,
            clientName: t.client_name,
            phone: t.phone,
            step: t.current_step,
            isTyping: t.is_typing,
            activeField: t.active_field,
            crisisFlag: t.crisis_flag,
            timestamp: t.last_active,
            lastActive: new Date(t.last_active).getTime()
          };
        });
        setTravelers(initialMap);
      }
    };

    fetchInitial();

    // 2. Realtime Broadcast Listener (ULTRA LIVE)
    const channel = client.channel('sovereign_control');
    channelRef.current = channel;

    channel.on('broadcast', { event: 'INTAKE_TELEMETRY' }, (payload: any) => {
      const data = payload.payload;
      updateTraveler(data);
    }).subscribe();

    // 3. Cleanup stale travelers every minute
    const interval = setInterval(() => {
      const now = Date.now();
      setTravelers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(sid => {
          if (now - (next[sid].lastActive || 0) > 10 * 60 * 1000) {
            delete next[sid];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 60000);

    return () => {
      client.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const updateTraveler = (data: Traveler) => {
    setTravelers(prev => ({
      ...prev,
      [data.sessionId]: {
        ...data,
        lastActive: Date.now()
      }
    }));
  };

  useEffect(() => {
    const list = Object.values(travelers);
    setStats({
      active: list.length,
      crisis: list.filter(t => t.crisisFlag).length
    });
  }, [travelers]);

  return (
    <main className="min-h-screen bg-[#030712] text-white p-6 md:p-12 font-sans selection:bg-teal-500/30 overflow-hidden relative">
      {/* Cinematic Atmosphere Layer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-500/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="atmosphere-vignette opacity-40" />
        <div className="atmosphere-grain opacity-10" />
        <div className="radar-sweep" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Navigation / Header */}
        <header className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-2 text-teal-400 mb-2">
              <Shield className="w-5 h-5" />
              <span className="text-xs font-black tracking-widest uppercase">Sovereign Control Node</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter">غرفة رصد الرحلة (Live)</h1>
          </div>
          
          <div className="flex gap-4">
            <StatBox label="المسافرون الآن" value={stats.active} icon={<Users className="w-4 h-4" />} color="teal" />
            <StatBox label="إشارات الاستغاثة" value={stats.crisis} icon={<AlertTriangle className="w-4 h-4" />} color="red" pulse={stats.crisis > 0} />
          </div>
        </header>

        {/* Live Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {Object.values(travelers).length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-32 flex flex-col items-center justify-center border border-white/5 bg-white/5 rounded-3xl backdrop-blur-xl"
              >
                <div className="w-16 h-16 rounded-full border border-teal-500/20 flex items-center justify-center animate-pulse mb-4">
                  <Activity className="w-8 h-8 text-teal-500/30" />
                </div>
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Waiting for travelers to join the journey...</p>
              </motion.div>
            ) : (
              Object.values(travelers)
                .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0))
                .map((traveler) => (
                <TravelerCard key={traveler.sessionId} traveler={traveler} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-6 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-2xl z-20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">Realtime Engine: Active</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="text-[10px] text-neutral-500">System Architect Console v2.4.0</div>
      </footer>
    </main>
  );
}

function TravelerCard({ traveler }: { traveler: Traveler }) {
  return (
    <motion.div
      layoutId={traveler.sessionId}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`glass-card p-6 border transition-all duration-500 relative overflow-hidden ${
        traveler.crisisFlag 
          ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)] bg-red-950/20' 
          : 'border-white/10 hover:border-teal-500/30'
      }`}
    >
      {/* Card Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full pointer-events-none ${
        traveler.crisisFlag ? 'bg-red-500/10' : 'bg-teal-500/5'
      }`} />

      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-black mb-1 text-white/90">
            {traveler.clientName || 'مسافر مجهول'}
          </h3>
          <p className="text-[10px] text-neutral-500 font-mono flex items-center gap-1 uppercase tracking-tighter">
            <Clock className="w-3 h-3" />
            Last Active: {new Date(traveler.lastActive || 0).toLocaleTimeString('ar-EG')}
          </p>
        </div>
        <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
          traveler.crisisFlag ? 'bg-red-500 text-white' : 'bg-teal-500/20 text-teal-400'
        }`}>
          {STEP_LABELS[traveler.step] || traveler.step}
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${traveler.isTyping ? 'bg-teal-500/20' : 'bg-white/5'}`}>
               <MessageCircle className={`w-4 h-4 ${traveler.isTyping ? 'text-teal-400' : 'text-neutral-600'}`} />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-tighter font-bold mb-0.5">الحالة الحالية</p>
              <p className="text-xs font-bold text-white/80">
                {traveler.isTyping ? (
                  <span className="flex items-center gap-2">
                    يكتب في {traveler.activeField}
                    <span className="flex gap-1">
                      <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce delay-100" />
                      <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce delay-200" />
                    </span>
                  </span>
                ) : 'في وضع الانتظار'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            Open File
          </button>
          <button className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-teal-900/40">
            Intervene
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatBox({ label, value, icon, color, pulse }: any) {
  const colors: any = {
    teal: 'text-teal-400 border-teal-500/20 bg-teal-500/5',
    red: 'text-red-400 border-red-500/20 bg-red-500/5'
  };
  return (
    <div className={`px-5 py-3 rounded-2xl border backdrop-blur-xl flex items-center gap-4 ${colors[color]} ${pulse ? 'animate-pulse' : ''}`}>
      <div className="p-2 bg-white/5 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-tighter opacity-60 mb-0.5">{label}</p>
        <p className="text-2xl font-black leading-none">{value}</p>
      </div>
    </div>
  );
}
