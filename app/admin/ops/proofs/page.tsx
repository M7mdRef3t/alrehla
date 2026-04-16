"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CreditCard,
  Image as ImageIcon,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { runtimeEnv } from "@/config/runtimeEnv";

type ProofMetadata = {
  email?: string;
  phone?: string;
  method?: string;
  amount?: string;
  reference?: string;
  note?: string;
  proof_image?: {
    storage_bucket: string;
    storage_path: string;
    signed_url?: string;
  };
};

type Ticket = {
  id: string;
  created_at: string;
  title: string;
  message: string;
  metadata: ProofMetadata;
};

export default function ProofQueuePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchProofs = async () => {
    setLoading(true);
    try {
      const adminCode = runtimeEnv.adminCode ?? "";
      const res = await fetch("/api/admin/ops/proofs", {
        headers: { Authorization: `Bearer ${adminCode}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch proofs");
      const data = await res.json();
      setTickets(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

  const handleDecision = async (ticketId: string, decision: "approve" | "reject") => {
    setProcessingId(ticketId);
    try {
      const adminCode = runtimeEnv.adminCode ?? "";
      const res = await fetch("/api/admin/ops/proofs/decision", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminCode}`
        },
        body: JSON.stringify({ ticketId, decision }),
      });
      
      if (!res.ok) throw new Error("Action failed");
      
      // Remove from list
      setTickets(prev => prev.filter(t => t.id !== ticketId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Navigation */}
        <Link 
          href="/admin/ops" 
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cockpit
        </Link>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Proof Queue</h1>
          </div>
          <p className="text-neutral-500">
            Review and approve manual payment proofs to activate user accounts.
          </p>
        </header>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-8 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-neutral-900 animate-pulse rounded-3xl border border-white/5" />
            ))}
          </div>
        ) : (
          <>
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-neutral-900/30 rounded-3xl border border-dashed border-white/10">
                <CheckCircle className="w-12 h-12 text-neutral-700 mb-4" />
                <h2 className="text-xl font-bold text-neutral-400">All caught up!</h2>
                <p className="text-neutral-600 mt-1">No pending payment proofs at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map((ticket) => (
                  <ProofCard 
                    key={ticket.id} 
                    ticket={ticket} 
                    processing={processingId === ticket.id}
                    onDecision={handleDecision}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProofCard({ 
  ticket, 
  processing, 
  onDecision 
}: { 
  ticket: Ticket; 
  processing: boolean;
  onDecision: (id: string, d: "approve" | "reject") => void;
}) {
  const { metadata } = ticket;
  const proofImage = metadata.proof_image;

  return (
    <div className="group bg-neutral-900/80 border border-white/5 hover:border-white/10 rounded-3xl p-6 transition-all flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
            Pending Approval
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">
            {new Date(ticket.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* User Info */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-neutral-400">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">User Identifier</p>
              <p className="text-sm font-semibold truncate">{metadata.email || metadata.phone || "Unknown"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Payment Details</p>
              <p className="text-sm font-semibold">
                {metadata.amount || "N/A"} {metadata.method?.replace("_", " ") || "No Method"}
              </p>
              {metadata.reference && (
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Ref: {metadata.reference}</p>
              )}
            </div>
          </div>
        </div>

        {/* Proof Image Preview */}
        {proofImage?.signed_url ? (
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 mb-6 group/img">
            <img 
              src={proofImage.signed_url} 
              alt="Payment proof" 
              className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
              <a 
                href={proofImage.signed_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-white text-black rounded-full"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-neutral-950 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-neutral-600 mb-6 font-medium text-xs">
            <ImageIcon className="w-6 h-6 mb-2 opacity-20" />
            No attachment
          </div>
        )}

        {metadata.note && (
          <div className="bg-white/5 p-3 rounded-xl mb-6">
            <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Note</p>
            <p className="text-xs text-neutral-300 italic">"{metadata.note}"</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onDecision(ticket.id, "reject")}
          disabled={processing}
          className="flex-1 h-11 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500/5 transition-colors font-bold text-xs flex items-center justify-center gap-2 group/btn"
        >
          <XCircle className="w-4 h-4" />
          Reject
        </button>
        <button
          onClick={() => onDecision(ticket.id, "approve")}
          disabled={processing}
          className="flex-1 h-11 rounded-2xl bg-emerald-500 text-black hover:bg-emerald-400 transition-all font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {processing ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Approve
            </>
          )}
        </button>
      </div>
    </div>
  );
}
