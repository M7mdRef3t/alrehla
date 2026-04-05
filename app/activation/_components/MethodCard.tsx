"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, Copy } from "lucide-react";

type MethodCardProps = {
  title: string;
  subtitle: string;
  value?: string;
  valueLabel?: string;
  actionLabel: string;
  href: string;
  onAction: () => void;
  icon: ReactNode;
  secondaryValue?: string;
  badge?: string;
};

export function MethodCard({
  title,
  subtitle,
  value,
  valueLabel,
  actionLabel,
  href,
  onAction,
  icon,
  secondaryValue,
  badge,
}: MethodCardProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_-42px_rgba(20,184,166,0.35)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-400/25 bg-teal-400/10 text-teal-200">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-white">{title}</h3>
            {badge ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-300">{subtitle}</p>
          {value ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-3">
              {valueLabel ? <p className="mb-1 text-[11px] font-black text-slate-500">{valueLabel}</p> : null}
              <p className="break-all font-mono text-sm text-teal-100">{value}</p>
              {secondaryValue ? <p className="mt-2 break-all font-mono text-xs text-slate-400">{secondaryValue}</p> : null}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {value ? (
              <button
                type="button"
                onClick={onAction}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <Copy className="h-4 w-4" />
                نسخ البيانات
              </button>
            ) : null}
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-teal-300"
            >
              <ArrowUpRight className="h-4 w-4" />
              {actionLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
