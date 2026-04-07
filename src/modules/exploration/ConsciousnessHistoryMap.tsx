import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useConsciousnessHistory } from '@/state/consciousnessHistoryState';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, Sparkles, MessageCircle } from 'lucide-react';

type HoverPoint = {
  state: string;
  pattern: string;
};

export const ConsciousnessHistoryMap: React.FC = () => {
  const history = useConsciousnessHistory((s) => s.history);
  const [hoveredPoint, setHoveredPoint] = useState<HoverPoint | null>(null);

  if (history.length < 1) {
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
    pattern: p.pattern,
    timestamp: p.timestamp
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-teal-100 relative overflow-hidden"
    >
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-teal-900 font-bold text-lg leading-tight">خارطة الوعي</h3>
            <p className="text-teal-600/60 text-[10px] font-medium uppercase tracking-wider">تتبع المسار الشعوري</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-600 rounded-full border border-teal-100/50">
            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold">مباشر</span>
          </div>
        </div>
      </div>

      <div className="h-56 w-full mb-8 relative">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
          <AreaChart 
            data={chartData}
            onMouseMove={(e: unknown) => {
              const payload = (e as { activePayload?: Array<{ payload?: HoverPoint }> } | null)?.activePayload?.[0]?.payload;
              if (payload) setHoveredPoint(payload);
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="time" hide />
            <YAxis hide domain={[0, 10]} />
            <Tooltip content={<></>} />
            <Area 
              type="monotone" 
              dataKey="intensity" 
              stroke="#0D9488" 
              strokeWidth={4}
              dot={{ r: 4, fill: '#0D9488', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#0D9488', strokeWidth: 2, stroke: '#fff' }}
              fillOpacity={1} 
              fill="url(#colorIntensity)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>

        <AnimatePresence>
          {hoveredPoint && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute top-0 left-0 right-0 pointer-events-none flex justify-center"
            >
              <div className="bg-teal-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-teal-700/50 text-center">
                <p className="text-white font-bold text-sm">{hoveredPoint.state}</p>
                <p className="text-teal-300 text-[10px]">{hoveredPoint.pattern}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-50 rounded-lg">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-xs font-bold text-gray-700">تحليل العمق الحالي</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {history.slice(-2).reverse().map((point, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: i === 0 ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-teal-50/30 p-4 rounded-3xl border border-teal-100/50 group hover:bg-teal-50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-3 h-3 text-teal-500" />
                <span className="text-[10px] text-teal-600 font-bold">{new Date(point.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-teal-900 font-bold text-xs mb-1 group-hover:text-teal-700 transition-colors">{point.emotionalState}</p>
              <p className="text-teal-600/70 text-[10px] leading-tight line-clamp-2">{point.pattern}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
