import React, { useState, useEffect } from 'react';
import { User, Target, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { IllusionRadar } from '../Command/IllusionRadar';
import { fetchOverviewStats } from '@/services/admin/adminAnalytics';
import type { OverviewStats } from '@/services/admin/adminTypes';

export const MohamedRefaatPanel: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchOverviewStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch overview stats", error);
      } finally {
        setIsLoading(false);
      }
    };
    void loadStats();
  }, []);

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-6 p-6 rounded-3xl bg-gradient-to-r from-teal-500/10 to-indigo-500/10 border border-teal-500/20 shadow-lg">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 p-1">
          <div className="w-full h-full rounded-full bg-[#0B0F19] flex items-center justify-center">
            <User className="w-8 h-8 text-teal-400" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">محمد رفعت</h1>
          <p className="text-teal-400 font-bold tracking-widest uppercase mt-1">المساحة الشخصية | System Architect</p>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Personal Growth */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="p-6 rounded-3xl bg-[#0B0F19] border border-white/5 hover:border-teal-500/30 transition-colors shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">إدارة الأهداف</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            متابعة المهام الشخصية، التوازن بين الحياة العملية والروحية، وإدارة الوقت وفق First Principles.
          </p>
          <div className="h-32 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center">
            <span className="text-xs font-bold text-indigo-500/50 uppercase tracking-widest">قريباً</span>
          </div>
        </motion.div>

        {/* Content & TikTok */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="p-6 rounded-3xl bg-[#0B0F19] border border-white/5 hover:border-rose-500/30 transition-colors shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-rose-400" />
            <h2 className="text-xl font-bold text-white">صناعة المحتوى</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            مساحة التفكير للمحتوى التوعوي، تيك توك، دمج التصميم الجرافيكي مع رسالة المنصة.
          </p>
          <div className="h-32 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-center">
            <span className="text-xs font-bold text-rose-500/50 uppercase tracking-widest">قريباً</span>
          </div>
        </motion.div>

        {/* Mental & Spiritual Resonance */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="p-6 rounded-3xl bg-[#0B0F19] border border-white/5 hover:border-amber-500/30 transition-colors shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">النبض والتوازن</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            تحليل التوازن النفسي، مقاييس الوعي، واتخاذ القرارات المبنية على البيانات.
          </p>
          <div className="h-32 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center">
            <span className="text-xs font-bold text-amber-500/50 uppercase tracking-widest">قريباً</span>
          </div>
        </motion.div>

      </div>

      {/* Illusion Radar Module */}
      <div className="mt-8">
        <IllusionRadar scenarios={stats?.topScenarios ?? null} isLoading={isLoading} />
      </div>

    </div>
  );
};
