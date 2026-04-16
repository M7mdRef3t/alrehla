"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { opsLinks, revenueConfig } from "@/config/opsLinks";
import {
  CheckCircle,
  TrendingUp,
  Link as LinkIcon,
  Database,
  Terminal,
  Copy,
  FileText,
  Users,
  Cpu,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { runtimeEnv } from "@/config/runtimeEnv";

type OpsCounts = {
  pending_proofs: number;
  open_tickets: number;
  unanalyzed_leads: number;
};

type CapiSummary = {
  total: number;
  success: number;
  failed: number;
  events: Record<string, number>;
};

function CountBadge({ value, warn }: { value: number; warn?: boolean }) {
  if (value === null || value === undefined) return <span className="text-neutral-600">—</span>;
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full text-sm font-black tabular-nums ${
        value > 0 && warn
          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          : value > 0
          ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
          : "bg-neutral-800 text-neutral-500"
      }`}
    >
      {value}
    </span>
  );
}

export default function OpsCockpit() {
  const [copied, setCopied] = useState(false);
  const [counts, setCounts] = useState<OpsCounts | null>(null);
  const [countsLoading, setCountsLoading] = useState(true);
  const [capiStats, setCapiStats] = useState<CapiSummary | null>(null);
  const [capiLoading, setCapiLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const adminCode = runtimeEnv.adminCode ?? "";
      const res = await fetch("/api/admin/ops/counts", {
        headers: { Authorization: `Bearer ${adminCode}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    } catch {
      // silent — counters will stay null
    } finally {
      setCountsLoading(false);
    }
  }, []);

  const fetchCapiStats = useCallback(async () => {
    setCapiLoading(true);
    try {
      const adminCode = runtimeEnv.adminCode ?? "";
      const res = await fetch("/api/admin/ops/capi-stats", {
        headers: { Authorization: `Bearer ${adminCode}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setCapiStats(data);
      }
    } catch {
      // silent
    } finally {
      setCapiLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCounts();
    void fetchCapiStats();
  }, [fetchCounts, fetchCapiStats]);

  const handleCopy = () => {
    navigator.clipboard.writeText(revenueConfig.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const capiSuccessRate = capiStats && capiStats.total > 0 
    ? Math.round((capiStats.success / capiStats.total) * 100) 
    : 100;
  const showHealthAlert = capiStats && (capiSuccessRate < 90 || capiStats.failed > 0);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">

        {showHealthAlert && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between text-red-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">Meta CAPI Alert</h3>
                <p className="text-xs text-red-400/80">
                  Telemetry health is compromised ({capiSuccessRate}% success). {capiStats.failed} failure(s) detected.
                </p>
              </div>
            </div>
            <Link 
              href="/admin/radar"
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-xs font-bold transition-all"
            >
              Investigate Signals
            </Link>
          </div>
        )}

        {/* Header */}
        <header className="flex justify-between items-center bg-black/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Operations Cockpit
            </h1>
            <p className="text-neutral-400 mt-2">
              Centralized links, revenue bridges, and execution pipelines.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchCounts}
              title="Refresh counts"
              className="p-2 rounded-lg border border-white/10 hover:border-white/20 text-neutral-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${countsLoading ? "animate-spin" : ""}`} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              System Active
            </div>
          </div>
        </header>

        {/* Live Counts */}
        <section>
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">
            Live Queue Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/admin/ops/proofs"
              className="bg-neutral-800/50 hover:bg-neutral-800 border border-white/5 hover:border-amber-500/30 rounded-2xl p-6 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium">Pending Proofs</p>
                  <p className="text-sm text-white font-semibold mt-0.5">Payment reviews</p>
                </div>
              </div>
              <CountBadge value={counts?.pending_proofs ?? 0} warn />
            </Link>

            <div className="bg-neutral-800/50 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium">Open Tickets</p>
                  <p className="text-sm text-white font-semibold mt-0.5">Support queue</p>
                </div>
              </div>
              <CountBadge value={counts?.open_tickets ?? 0} />
            </div>

            <Link
              href="/admin/intelligence"
              className="bg-neutral-800/50 hover:bg-neutral-800 border border-white/5 hover:border-purple-500/30 rounded-2xl p-6 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium">Unanalyzed Leads</p>
                  <p className="text-sm text-white font-semibold mt-0.5">Oracle queue</p>
                </div>
              </div>
              <CountBadge value={counts?.unanalyzed_leads ?? 0} />
            </Link>
          </div>
        </section>

        {/* CAPI Performance Monitor */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Meta CAPI Monitoring (24h)
            </h2>
            <div className="h-[1px] flex-1 bg-white/5 ml-4" />
          </div>
          <CapiStatsCard stats={capiStats} loading={capiLoading} />
        </section>

        {/* Revenue Config + System Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Bridge Config */}
          <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4 text-emerald-400">
                <Database className="w-5 h-5" />
                <h2 className="text-lg font-semibold text-white">Revenue Bridge Config</h2>
              </div>
              <p className="text-sm text-neutral-400 mb-4">
                Active payment method — single source of truth for /activation.
              </p>
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
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-white/10 rounded border border-white/10 text-xs flex items-center gap-1 transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-neutral-400" />
                  )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {opsLinks.map((category) => (
                <div key={category.category} className="space-y-3">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    {category.category}
                  </h3>
                  <ul className="space-y-2">
                    {category.items.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.url}
                          target={item.url.startsWith("http") ? "_blank" : "_self"}
                          rel="noopener noreferrer"
                          className="text-sm text-neutral-300 hover:text-white hover:underline decoration-white/30 underline-offset-4 transition-colors flex items-center gap-1 group"
                        >
                          {item.name}
                          <span className="text-neutral-600 group-hover:text-neutral-400 transition-colors">
                            {item.url.startsWith("http") ? "↗" : "›"}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/discovery"
            className="p-6 bg-neutral-800/50 hover:bg-neutral-800 border border-white/5 hover:border-white/10 rounded-2xl transition-all group flex flex-col items-center text-center gap-3"
          >
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                Discovery Engine
              </h3>
              <p className="text-xs text-neutral-500 mt-1">Inbox → Prioritize → Shipped</p>
            </div>
          </Link>

          <Link
            href="/admin/radar"
            className="p-6 bg-neutral-800/50 hover:bg-neutral-800 border border-white/5 hover:border-white/10 rounded-2xl transition-all group flex flex-col items-center text-center gap-3"
          >
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                Admin Radar
              </h3>
              <p className="text-xs text-neutral-500 mt-1">Analytics & event telemetry</p>
            </div>
          </Link>

          <Link
            href="/admin/intelligence"
            className="p-6 bg-neutral-800/50 hover:bg-neutral-800 border border-white/5 hover:border-white/10 rounded-2xl transition-all group flex flex-col items-center text-center gap-3"
          >
            <div className="w-12 h-12 bg-violet-500/10 text-violet-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">
                Oracle Intelligence
              </h3>
              <p className="text-xs text-neutral-500 mt-1">AI lead grading & auto-ignition</p>
            </div>
          </Link>

          <Link
            href="/activation"
            className="p-6 bg-neutral-800/50 hover:bg-neutral-800 border border-white/5 hover:border-white/10 rounded-2xl transition-all group flex flex-col items-center text-center gap-3"
          >
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                Test Activation
              </h3>
              <p className="text-xs text-neutral-500 mt-1">Simulate revenue bridge flow</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function CapiStatsCard({ stats, loading }: { stats: CapiSummary | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-neutral-800/50 rounded-2xl border border-white/5" />
        ))}
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="bg-neutral-800/30 border border-dashed border-white/10 rounded-2xl p-6 flex items-center justify-center text-neutral-500 text-sm">
        No CAPI events recorded in the last 24h.
      </div>
    );
  }

  const successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div className="bg-neutral-800/50 border border-white/5 rounded-2xl p-4">
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Total Signals</p>
        <p className="text-xl font-black text-white">{stats.total}</p>
      </div>
      
      <div className="bg-neutral-800/50 border border-white/5 rounded-2xl p-4">
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Success Rate</p>
        <div className="flex items-center gap-2">
          <p className={`text-xl font-black ${successRate > 90 ? "text-emerald-400" : "text-amber-400"}`}>
            {successRate}%
          </p>
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full ${successRate > 90 ? "bg-emerald-500" : "bg-amber-500"} transition-all duration-1000`}
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-neutral-800/50 border border-white/5 rounded-2xl p-4">
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Purchase Conversion</p>
        <p className="text-xl font-black text-blue-400">{stats.events["Purchase"] || 0}</p>
      </div>

      <div className="bg-neutral-800/50 border border-white/5 rounded-2xl p-4">
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Delivery Failures</p>
        <p className={`text-xl font-black ${stats.failed > 0 ? "text-red-400" : "text-neutral-500"}`}>
          {stats.failed}
        </p>
      </div>
    </div>
  );
}
