"use client";

import React, { useState } from "react";
import Link from "next/link";
import { opsLinks, revenueConfig } from "@/config/opsLinks";
import { CheckCircle, AlertCircle, TrendingUp, Settings, Link as LinkIcon, Database, Terminal, Copy } from "lucide-react";

export default function OpsCockpit() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(revenueConfig.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex justify-between items-center bg-black/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Operations Cockpit
            </h1>
            <p className="text-neutral-400 mt-2">Centralized links, revenue bridges, and execution pipelines.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                System Active
             </div>
          </div>
        </header>

        {/* Top Action Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Bridge Config */}
          <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
               <div className="flex items-center gap-3 mb-4 text-emerald-400">
                  <Database className="w-5 h-5" />
                  <h2 className="text-lg font-semibold text-white">Revenue Bridge Config</h2>
               </div>
               <p className="text-sm text-neutral-400 mb-4">Active payment method mapped directly to the /activation frontend.</p>
            </div>
            
            <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-3 relative group">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-neutral-400">Method</span>
                 <span className="font-medium text-white">{revenueConfig.currentMethod}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-neutral-400">Number</span>
                 <span className="font-mono text-emerald-400 font-bold">{revenueConfig.number}</span>
               </div>
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={handleCopy} className="p-1.5 hover:bg-white/10 rounded border border-white/10 text-xs flex items-center gap-1 transition-colors">
                   {copied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                 </button>
               </div>
            </div>
          </div>

          {/* Links Directory */}
          <div className="md:col-span-2 bg-gradient-to-br from-neutral-800 to-neutral-900 p-6 rounded-2xl border border-white/5">
             <div className="flex items-center gap-3 mb-6 text-cyan-400">
                <LinkIcon className="w-5 h-5" />
                <h2 className="text-lg font-semibold text-white">System Links</h2>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {opsLinks.map((category) => (
                  <div key={category.category} className="space-y-3">
                     <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{category.category}</h3>
                     <ul className="space-y-2">
                        {category.items.map((item) => (
                          <li key={item.name}>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" 
                               className="text-sm text-neutral-300 hover:text-white hover:underline decoration-white/30 underline-offset-4 transition-colors flex items-center gap-1 group">
                               {item.name}
                               <span className="text-neutral-600 group-hover:text-neutral-400 transition-colors">↗</span>
                            </a>
                          </li>
                        ))}
                     </ul>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Quick Actions & Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/discovery" className="p-6 bg-neutral-800/50 hover:bg-neutral-800 border border-white/5 hover:border-white/10 rounded-2xl transition-all group flex flex-col items-center text-center gap-3">
               <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Terminal className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">Discovery Engine</h3>
                  <p className="text-xs text-neutral-500 mt-1">Inbox &rarr; Prioritize &rarr; Shipped</p>
               </div>
            </Link>

            <Link href="/admin/radar" className="p-6 bg-neutral-800/50 hover:bg-neutral-800 border border-white/5 hover:border-white/10 rounded-2xl transition-all group flex flex-col items-center text-center gap-3">
               <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">Admin Radar</h3>
                  <p className="text-xs text-neutral-500 mt-1">Analytics & Event telemetry</p>
               </div>
            </Link>
            
            <Link href="/activation" className="p-6 bg-neutral-800/50 hover:bg-neutral-800 border border-white/5 hover:border-white/10 rounded-2xl transition-all group flex flex-col items-center text-center gap-3">
               <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">Test Activation</h3>
                  <p className="text-xs text-neutral-500 mt-1">Simulate Revenue Bridge User Flow</p>
               </div>
            </Link>
        </div>

      </div>
    </div>
  );
}
