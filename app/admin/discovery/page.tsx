import React from "react";
import DiscoveryBoard from "./_components/DiscoveryBoard";
import { Plus, Search, Filter } from "lucide-react";


export default function DiscoveryPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 font-sans flex flex-col">
      {/* Header */}
      <header className="flex-none px-6 py-4 border-b border-white/5 bg-black/40 flex justify-between items-center backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Discovery Engine
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest font-mono">
            Signal Pipeline & Prioritization
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-neutral-900 border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-purple-500/50 transition-colors">
            <Search className="w-4 h-4 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search signals..." 
              className="bg-transparent border-none outline-none text-sm w-48 text-white placeholder:text-neutral-600 focus:ring-0"
            />
          </div>

          <button className="p-2 bg-neutral-900 border border-white/10 hover:border-white/20 rounded-lg transition-colors text-neutral-400 hover:text-white">
            <Filter className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-purple-900/20 transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            Capture Signal
          </button>
        </div>
      </header>

      {/* Board Container */}
      <main className="flex-1 overflow-hidden">
        <DiscoveryBoard />
      </main>
    </div>
  );
}
