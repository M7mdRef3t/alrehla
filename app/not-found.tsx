"use client";

import { motion } from "framer-motion";
import { AlrehlaIcon } from "../src/components/logo/AlrehlaIcon";
import { Home, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0b0c10] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full -z-10" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8 max-w-md w-full"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <AlrehlaIcon size={80} />
          </motion.div>
          <h1 className="text-8xl font-black text-white/10 tracking-tighter">404</h1>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white">تاهت الرحلة؟</h2>
          <p className="text-slate-400 text-lg">
            الصفحة اللي بتدور عليها مش موجودة أو اتنقلت لمسار تاني.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <a
            href="/"
            className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-teal-500 text-slate-950 font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_32px_rgba(20,184,166,0.3)]"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            <Home className="w-5 h-5" />
            <span>الرجوع للرئيسية</span>
          </a>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-slate-400 font-semibold hover:bg-white/5 hover:text-white transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للخلف</span>
          </button>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 text-slate-600 text-sm font-medium tracking-widest uppercase">
        Alrehla Platform • 2026
      </div>
    </div>
  );
}
