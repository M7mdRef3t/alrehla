import { memo, useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { Star, Quote, ArrowLeft, TrendingUp, Users, Target, Loader2, Zap as Sparkles, Heart } from "lucide-react";
import { supabase } from "@/services/supabaseClient";

export interface Story {
  id: string;
  name: string;
  age: number;
  city: string;
  category: string;
  quote: string;
  outcome: string;
  stars: number;
  avatar: string;
  color: string;
  created_at?: string;
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const getFakeLikesCount = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 800 + 120; // returns a number between 120 and 919
};

const item: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

interface StoriesScreenProps {
  onBack?: () => void;
}

export const StoriesScreen = memo(function StoriesScreen({ onBack }: StoriesScreenProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set());

  // Load liked stories from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alrehla_liked_stories');
      if (saved) {
        setLikedStories(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  const toggleLike = (id: string) => {
    setLikedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('alrehla_liked_stories', JSON.stringify(Array.from(newSet)));
      } catch (e) {
        // Ignore errors
      }
      
      return newSet;
    });
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchStories() {
      try {
        if (!supabase) {
          console.error("Supabase client is not available.");
          return;
        }

        const { data, error } = await supabase
          .from('success_stories')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching stories:", error);
          return;
        }

        if (isMounted && data) {
          setStories(data);
        }
      } catch (err) {
        console.error("Unexpected error fetching stories:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchStories();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-[#03050a] selection:bg-teal-500/30 selection:text-teal-200">
      {/* ── Background Elements ── */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-teal-900/10 via-emerald-900/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 -right-64 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.015] pointer-events-none mix-blend-overlay" />

      {/* ── Header ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 flex items-center justify-between relative z-10">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="group flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
          >
            <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.08] group-hover:border-white/[0.15] group-hover:shadow-[0_0_15px_rgba(20,184,166,0.2)] transition-all duration-300">
              <ArrowLeft className="w-4 h-4" />
            </div>
            رجوع للمنصة
          </button>
        )}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-slate-300 text-xs font-semibold tracking-wide">القصص الحقيقية</span>
        </div>
      </div>

      {/* ── Hero Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl mx-auto text-center mt-12 mb-20 md:mb-28 relative px-4 z-10"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 backdrop-blur-md mb-8 shadow-[0_0_30px_rgba(20,184,166,0.1)]"
        >
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span className="text-teal-200 text-sm font-bold tracking-wide">مختبر الوعي الذاتي</span>
        </motion.div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.2] md:leading-[1.1] mb-6 tracking-tight">
          خلف كل اسم، 
          <br />
          <span className="relative inline-block mt-3 text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-400 to-cyan-300">
            حكاية انتصار حقيقية
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
              className="absolute -bottom-3 left-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent rounded-full"
            />
          </span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium mt-8">
          ليسوا "مؤثرين" أو حملات إعلانية. هؤلاء بشر خاضوا المواجهة مع أنفسهم 
          ليخرجوا بنسخة أكثر صدقاً ووضوحاً. اقرأ تجاربهم لتدرك أنك لست وحدك.
        </p>
      </motion.div>

      {/* ── Dashboard of Impact ── */}
      <div className="max-w-5xl mx-auto mb-20 md:mb-28 px-4 z-10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent rounded-[2rem] -z-10 blur-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 p-2 bg-white/[0.01] border border-white/[0.05] rounded-[2rem] backdrop-blur-xl">
          {[
            { icon: Users, label: "رحلات مكتملة", val: "٢,٤٢١", color: "text-blue-400" },
            { icon: TrendingUp, label: "تحسن ملموس", val: "٩٤٪", color: "text-emerald-400" },
            { icon: Target, label: "أهداف محققة", val: "١٥,٨٠٠", color: "text-amber-400" },
            { icon: Star, label: "تقييم الرضا", val: "٤.٩/٥", color: "text-rose-400" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.5, ease: "backOut" }}
              className="group p-6 rounded-3xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center text-center"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <stat.icon className={`w-6 h-6 ${stat.color} mb-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300`} />
              <div className="text-3xl font-black text-white mb-1 tracking-tight drop-shadow-md">{stat.val}</div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Stories Grid ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 px-4 z-10 relative">
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-6" />
          <p className="text-teal-200/70 text-sm font-semibold tracking-wide">جاري استحضار القصص الحقيقية...</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 px-4 z-10 relative">
          <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-6">
             <Quote className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-slate-400 text-lg font-medium">القصص تُكتب الآن، وتُنسج في صمت. عد قريباً.</p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-6 mb-32 z-10 relative"
        >
          {stories.map((story) => (
            <motion.article
              key={story.id}
              variants={item}
              className="group relative rounded-[32px] overflow-hidden bg-[#0A0D14] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-500 flex flex-col hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(20,184,166,0.15)]"
            >
              {/* Top ambient glow */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${story.color} opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${story.color} rounded-full blur-[60px] opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-500`} />

              <div className="p-8 flex flex-col h-full z-10">
                {/* Category & Rating */}
                <div className="flex justify-between items-start mb-6">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-slate-300 text-xs font-bold shadow-sm`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${story.color}`} />
                    {story.category}
                  </div>
                  <div className="flex gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    {Array.from({ length: story.stars }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.4)]" />
                    ))}
                  </div>
                </div>

                {/* Quote */}
                <div className="relative mb-6 flex-grow">
                  <Quote className="w-8 h-8 text-white/[0.03] absolute -top-2 -right-2 transform -scale-x-100" />
                  <p className="text-slate-200 text-[15px] leading-[1.8] pr-2 font-medium">
                    "{story.quote}"
                  </p>
                </div>

                {/* Outcome */}
                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 mb-8 group-hover:bg-white/[0.04] transition-colors duration-300 relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${story.color} opacity-40`} />
                  <p className="text-teal-100 text-[13px] leading-[1.7] font-semibold pr-2">
                    <span className="text-teal-400/80 mr-1.5 font-bold">النتيجة:</span>
                    {story.outcome}
                  </p>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-4 mt-auto pt-6 border-t border-white/[0.04] relative">
                  <div className="relative">
                    <span className={`w-12 h-12 rounded-full bg-gradient-to-br ${story.color} flex items-center justify-center text-white font-black text-lg shadow-[0_4px_15px_rgba(0,0,0,0.2)]`}>
                      {story.avatar}
                    </span>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0A0D14] rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold mb-0.5">{story.name}</p>
                    <p className="text-slate-500 text-xs font-semibold">{story.age} عاماً · {story.city}</p>
                  </div>
                  {/* Interaction element: Like Button */}
                  <button 
                    onClick={() => toggleLike(story.id)}
                    className="mr-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] transition-colors group/like"
                  >
                    <Heart 
                      className={`w-3.5 h-3.5 transition-all duration-300 ${
                        likedStories.has(story.id) 
                          ? "fill-rose-500 text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" 
                          : "text-slate-400 group-hover/like:text-rose-400"
                      }`} 
                    />
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className={`text-xs ${likedStories.has(story.id) ? "text-rose-400" : "text-slate-500 group-hover/like:text-slate-400"}`}>
                        {likedStories.has(story.id) ? "أعجبني" : "إعجاب"}
                      </span>
                      <div className="w-[1px] h-3 bg-white/[0.1] mx-0.5" />
                      <span className={`text-[11px] tabular-nums ${likedStories.has(story.id) ? "text-rose-300" : "text-slate-400"}`}>
                        {getFakeLikesCount(story.id) + (likedStories.has(story.id) ? 1 : 0)}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}

      {/* ── Call to Action ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-4xl mx-auto text-center mb-24 relative py-20 px-6 md:px-12 mx-4 md:mx-auto rounded-[40px] overflow-hidden z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/[0.03] to-emerald-500/[0.01]" />
        <div className="absolute inset-0 border border-teal-500/10 rounded-[40px]" />
        
        <div className="w-16 h-16 mx-auto rounded-full bg-teal-500/10 flex items-center justify-center mb-8">
           <Sparkles className="w-8 h-8 text-teal-400" />
        </div>
        
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">قصتك هي البداية الحقيقية</h2>
        <p className="text-slate-400 mb-12 text-lg md:text-xl max-w-xl mx-auto leading-relaxed font-medium">
          انضم لآلاف الأشخاص الذين قرروا التوقف عن الهرب، والبدء في مواجهة أنفسهم لبناء النسخة الأصدق من حياتهم.
        </p>
        
        <button
          type="button"
          onClick={onBack}
          className="group relative px-10 py-5 rounded-full bg-white text-slate-950 font-black shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] hover:scale-[1.02] transition-all duration-300 text-lg overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-teal-100 to-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative z-10 flex items-center justify-center gap-3">
             ابدأ رحلتك الآن
             <motion.span 
               animate={{ x: [0, 6, 0] }}
               transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
             >
               →
             </motion.span>
          </span>
        </button>
      </motion.div>
    </div>
  );
});
