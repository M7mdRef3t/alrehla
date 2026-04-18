"use client";

import React, { useState, useCallback } from "react";
import { Plus, Search, Filter } from "lucide-react";
import DiscoveryBoard from "./_components/DiscoveryBoard";
import CaptureSignalModal from "./_components/CaptureSignalModal";
import { DiscoveryItem } from "@/types/discovery";

export default function DiscoveryPage() {
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState<DiscoveryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    priority: "all",
    source: "all",
    funnel_stage: "all",
  });

  const handleSignalCaptured = useCallback((item: unknown) => {
    setNewItem(item as DiscoveryItem);
  }, []);

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
          {/* Filters */}
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-neutral-900/50 border border-white/5 rounded-xl">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Priority</span>
                <select 
                  value={activeFilters.priority}
                  onChange={(e) => setActiveFilters(f => ({ ...f, priority: e.target.value }))}
                  className="bg-transparent text-xs font-bold text-neutral-300 outline-none border-none focus:ring-0 cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
             </div>
             <div className="w-[1px] h-4 bg-white/10" />
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Source</span>
                <select 
                  value={activeFilters.source}
                  onChange={(e) => setActiveFilters(f => ({ ...f, source: e.target.value }))}
                  className="bg-transparent text-xs font-bold text-neutral-300 outline-none border-none focus:ring-0 cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="user_signal">User</option>
                  <option value="ops_insight">Ops</option>
                  <option value="direct_feedback">Feedback</option>
                </select>
             </div>
             <div className="w-[1px] h-4 bg-white/10" />
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Funnel</span>
                <select 
                  value={activeFilters.funnel_stage}
                  onChange={(e) => setActiveFilters(f => ({ ...f, funnel_stage: e.target.value }))}
                  className="bg-transparent text-xs font-bold text-neutral-300 outline-none border-none focus:ring-0 cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="awareness">Awareness</option>
                  <option value="conversion">Conversion</option>
                  <option value="retention">Retention</option>
                </select>
             </div>
          </div>

          <div className="flex items-center gap-2 bg-neutral-900 border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-purple-500/50 transition-colors">
            <Search className="w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search signals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-48 text-white placeholder:text-neutral-600 focus:ring-0"
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-purple-900/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Capture Signal
          </button>
        </div>
      </header>

      {/* Board Container */}
      <main className="flex-1 overflow-hidden">
        <DiscoveryBoard 
          searchQuery={searchQuery} 
          latestItem={newItem} 
          filters={activeFilters}
        />
      </main>

      {/* Capture Signal Modal */}
      {showModal && (
        <CaptureSignalModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSignalCaptured}
        />
      )}
    </div>
  );
}
