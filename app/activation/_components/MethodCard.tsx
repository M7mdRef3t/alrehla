"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, Copy, Check } from "lucide-react";
import { useState } from "react";

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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onAction();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative bg-slate-950/30 p-5 transition-all duration-300 hover:bg-slate-900/60">
      {/* Teal accent on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10" dir="rtl">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-300">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-white">{title}</h3>
              {badge ? (
                <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-teal-300">
                  {badge}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-400 transition-colors group-hover:text-slate-300">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Value block */}
        {value ? (
          <div className="mt-4 rounded-xl border border-white/5 bg-black/30 px-4 py-3">
            {valueLabel ? (
              <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                {valueLabel}
              </p>
            ) : null}
            <p className="break-all font-mono text-sm text-teal-100">{value}</p>
            {secondaryValue ? (
              <p className="mt-1 break-all font-mono text-xs text-slate-500">
                {secondaryValue}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {value ? (
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all duration-300 ${
                copied
                  ? "border-teal-500/40 bg-teal-500/10 text-teal-300"
                  : "border-white/10 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "تم النسخ!" : "نسخ البيانات"}
            </button>
          ) : null}
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            onClick={onAction}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-teal-500/20 transition-all hover:bg-teal-400"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            {actionLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
