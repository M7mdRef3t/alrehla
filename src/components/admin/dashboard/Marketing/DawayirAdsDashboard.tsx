import React, { FC } from "react";
import { 
  Rocket, 
  Target, 
  BarChart3, 
  Globe, 
  TrendingUp, 
  Zap, 
  Users,
  MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";

/**
 * DawayirAdsDashboard — مركز انتشار الرحلة 🚀
 * ---------------------------------------
 * واجهة تحكم في حملات الانتشار والوصول الإبداعي.
 */
const DawayirAdsDashboard: FC = () => {
  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8 animate-in fade-in duration-700">
      {/* 🚀 Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
               <Rocket className="w-6 h-6" />
             </div>
             <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Sovereign Ad Growth</h1>
          </div>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            مراقبة وتحليل محركات انتشار "الرحلة" في الفضاء الرقمي. نتحكم هنا في وصول الرسالة لمن يحتاجها.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase rounded-xl transition-all shadow-lg shadow-rose-900/40 border border-rose-400/30 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            إطلاق حملة ذكية
          </button>
        </div>
      </div>

      {/* 📊 High-Level Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الوصول", value: "1.2M", icon: <Globe />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "معدل التحويل", value: "4.8%", icon: <TrendingUp />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "نقرة/قيادة", value: "24.5K", icon: <Zap />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { label: "تكلفة الاستحواذ", value: "$0.12", icon: <Target />, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`admin-glass-card p-5 space-y-3 ${stat.bg} ${stat.border}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{stat.label}</span>
              <div className={`${stat.color} opacity-80`}>{stat.icon}</div>
            </div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* 🧪 Main Insight Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ad Performance Graph Placeholder */}
        <div className="lg:col-span-2 admin-glass-card p-6 h-[400px] flex flex-col justify-between overflow-hidden group">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-400" />
              منحنى الانتشار العضوي vs الممول
            </h3>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <div className="w-3 h-3 rounded-full bg-rose-500" />
            </div>
          </div>
          
          <div className="flex-1 flex items-end justify-around gap-2 pb-4 pt-10">
            {[40, 70, 45, 90, 65, 80, 50, 100, 75, 40, 60, 95].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                className={`w-full max-w-[12px] rounded-t-lg transition-all duration-500 ${i % 3 === 0 ? 'bg-rose-500/40 group-hover:bg-rose-500' : 'bg-teal-500/20 group-hover:bg-teal-500/60'}`}
              />
            ))}
          </div>
          
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 pt-4 border-t border-white/5">
            <span>Mars</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
          </div>
        </div>

        {/* Channels/Audience Insight */}
        <div className="admin-glass-card p-6 flex flex-col gap-6 bg-indigo-500/5 border-indigo-500/10">
          <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            تركيبة الجمهور المستهدف
          </h3>
          
          <div className="space-y-5">
            {[
              { label: "المستكشفون (Search)", val: 65, color: "bg-teal-400" },
              { label: "رواد المعنى (Social)", val: 45, color: "bg-indigo-400" },
              { label: "المسافرون الدائمون (Direct)", val: 80, color: "bg-amber-400" },
              { label: "رفقاء الطريق (Referral)", val: 30, color: "bg-rose-400" },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-300">
                  <span>{item.label}</span>
                  <span>{item.val}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.val}%` }}
                    className={`h-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
               <MessageSquare className="w-4 h-4 text-teal-400 mt-1" />
               <p className="text-[10px] text-slate-400 italic leading-relaxed">
                 "الوصول العضوي في تزايد ملحوظ نتيجة نشاط 'طقس العلاقات' الأخير." — AI Observer
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DawayirAdsDashboard;
export { DawayirAdsDashboard };
