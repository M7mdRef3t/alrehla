"use client";

import { useEffect, useState } from "react";
import { grantLiveAccess, listLiveSessions } from "../api";
import type { LiveSessionRecord } from "../types";

export default function LiveCouplePage() {
  const [sessions, setSessions] = useState<LiveSessionRecord[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void listLiveSessions()
      .then((result) => {
        setSessions(result.sessions);
        if (result.sessions[0]) setSessionId(result.sessions[0].id);
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "AUTH_REQUIRED"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-teal-300/80">Couple Mode</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">مشاركة الجلسة مع شريك</h1>
        <p className="mt-3 text-sm text-slate-400">
          اختر جلسة موجودة وامنح partner access داخل نفس المنصة عبر البريد المرتبط بالحساب.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
            <label className="text-xs uppercase tracking-[0.28em] text-slate-400">Session</label>
            <select
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
              disabled={sessions.length === 0}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white"
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title || session.id}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-xs uppercase tracking-[0.28em] text-slate-400">Partner Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="partner@example.com"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500"
            />

            <button
              type="button"
              disabled={!sessionId}
              onClick={async () => {
                const result = await grantLiveAccess(sessionId, { role: "partner", email }).catch((err) => {
                  setMessage(err instanceof Error ? err.message : "grant_failed");
                  return null;
                });
                if (result?.access) {
                  setMessage("تم منح الوصول بنجاح.");
                  setEmail("");
                }
              }}
              className="mt-4 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950"
            >
              Grant Partner Access
            </button>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">What happens next</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li>1. الشريك يرى فقط الجلسة الممنوحة له.</li>
              <li>2. replay وsummary وartifacts تبقى على نفس الجلسة.</li>
              <li>3. coach access يستخدم نفس البنية لكن بدور مختلف.</li>
            </ul>
            {message && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-100">
                {message === "AUTH_REQUIRED" ? "سجّل الدخول أولاً لإدارة partner access." : message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
