"use client";

import { useEffect, useState } from "react";
import { getAnalyticsDiagnostics } from "../services/analytics";
import { runtimeEnv } from "../config/runtimeEnv";
import { getWindowOrNull } from "../services/clientRuntime";

const ANALYTICS_DEBUG_FLAG = "dawayir-analytics-debug";

function isDebugEnabled(): boolean {
  const windowRef = getWindowOrNull();
  if (!windowRef) return false;

  const fromQuery = windowRef.location.search.includes("analyticsDebug=1");
  const fromStorage = windowRef.localStorage.getItem(ANALYTICS_DEBUG_FLAG) === "true";

  return fromQuery || fromStorage;
}

export function AnalyticsDiagnosticsOverlay() {
  const [diagnostics, setDiagnostics] = useState(() => getAnalyticsDiagnostics("overlay"));
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!runtimeEnv.isDev) return;

    setEnabled(isDebugEnabled());
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const update = () => setDiagnostics(getAnalyticsDiagnostics("overlay"));
    update();
    const timer = window.setInterval(update, 5000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  if (!runtimeEnv.isDev || !enabled) return null;

  const rows = [
    ["userMode", diagnostics.userMode],
    ["analyticsConsent", diagnostics.analyticsConsent],
    ["metaPixelIdPresent", diagnostics.metaPixelIdPresent],
    ["metaEventsEnabled", diagnostics.metaEventsEnabled],
    ["fbqPresent", diagnostics.fbqPresent],
    ["fbqInitialized", diagnostics.fbqInitialized],
    ["fbqScriptLoaded", diagnostics.fbqScriptLoaded],
    ["gtagPresent", diagnostics.gtagPresent]
  ] as const;

  return (
    <div className="fixed bottom-4 left-4 z-[90] w-[min(92vw,22rem)] rounded-2xl border border-white/15 bg-slate-950/90 p-3 text-xs text-slate-100 shadow-2xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-black uppercase tracking-[0.18em] text-teal-300">Analytics Debug</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
          {diagnostics.context}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2 py-1">
            <span className="text-slate-400">{label}</span>
            <span className={value ? "font-semibold text-emerald-300" : "font-semibold text-rose-300"}>
              {String(value)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-5 text-slate-400">
        لو `analyticsConsent=true` و `metaEventsEnabled=true` ولسه `fbqPresent=false`، يبقى الـ pixel ما اتinitش.
      </p>
    </div>
  );
}
