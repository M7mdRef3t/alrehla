"use client";

import { memo } from "react";
import { Ghost, Mail, MessageCircle, Phone, Send } from "lucide-react";

type QuickSendLead = {
  email: string;
  lead_id: string | null;
  phone: string | null;
  name: string | null;
  personalLink: string;
  emailSent: boolean;
};

type QuickSendRowProps = {
  lead: QuickSendLead;
  onMarkContacted: (email: string) => void;
  isGhostMode: boolean;
};

function QuickSendRowImpl({ lead, onMarkContacted, isGhostMode }: QuickSendRowProps) {
  const whatsappHref = lead.phone
    ? `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(lead.personalLink)}`
    : null;

  const mailHref = `mailto:${lead.email}?subject=${encodeURIComponent("رابطك الشخصي")}&body=${encodeURIComponent(lead.personalLink)}`;

  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">{lead.name || lead.email}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{lead.email}</p>
          {lead.phone ? <p className="mt-1 text-[11px] text-slate-500">{lead.phone}</p> : null}
        </div>
        {isGhostMode ? <Ghost className="h-4 w-4 shrink-0 text-fuchsia-300" /> : null}
      </div>

      <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
        <p className="line-clamp-2 break-all text-[11px] text-slate-400">{lead.personalLink}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={mailHref}
          onClick={() => {
            setTimeout(() => onMarkContacted(lead.email), 500);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
        >
          <Mail className="h-3.5 w-3.5" />
          Email
        </a>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              setTimeout(() => onMarkContacted(lead.email), 500);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/5 px-3 py-2 text-xs text-slate-500">
            <Phone className="h-3.5 w-3.5" />
            بدون رقم
          </span>
        )}
        <button
          type="button"
          onClick={() => onMarkContacted(lead.email)}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-teal-300"
        >
          <Send className="h-3.5 w-3.5" />
          تم التواصل
        </button>
      </div>
    </div>
  );
}

export const QuickSendRow = memo(QuickSendRowImpl);
