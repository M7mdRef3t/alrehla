import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useConsciousnessHistory } from '../state/consciousnessHistoryState';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, History } from 'lucide-react';

export const ConsciousnessHistoryMap: React.FC = () => {
  const history = useConsciousnessHistory((s) => s.history);

  if (history.length < 2) {
    return (
      <div className="p-8 text-center bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-teal-200">
        <Brain className="w-12 h-12 text-teal-200 mx-auto mb-3" />
        <p className="text-teal-600 text-sm">ابدأ رحلتك لتظهر خارطة وعيك هنا</p>
      </div>
    );
  }

  const chartData = history.map(p => ({
    time: new Date(p.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    intensity: p.intensity,
    state: p.emotionalState,
    pattern: p.pattern
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-teal-100 shadow-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          <h3 className="text-teal-900 font-bold">مسار الوعي التفاعلي</h3>
        </div>
        <div className="text-[10px] bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-bold">
          تحديث لحظي
        </div>
      </div>

      <div className="h-48 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="time" hide />
            <YAxis hide domain={[0, 10]} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-xl shadow-lg border border-teal-50 text-right">
                      <p className="text-teal-900 font-bold text-xs mb-1">{data.state}</p>
                      <p className="text-gray-500 text-[10px]">{data.pattern}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="intensity" 
              stroke="#0D9488" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorIntensity)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-400">
          <History className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">آخر المحطات</span>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {history.slice(-3).reverse().map((point, i) => (
            <div key={i} className="shrink-0 bg-teal-50/50 p-3 rounded-2xl border border-teal-100 min-w-[140px]">
              <p className="text-teal-900 font-bold text-[10px] mb-1">{point.emotionalState}</p>
              <p className="text-teal-600 text-[9px] line-clamp-1">{point.pattern}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
