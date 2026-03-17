"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, History, Link2, Users } from "lucide-react";
import { assignUrl } from "../../services/navigation";
import { runtimeEnv } from "../../config/runtimeEnv";
import LiveCanvas from "./components/LiveCanvas";
import LiveHUD from "./components/LiveHUD";
import LiveTranscript from "./components/LiveTranscript";
import LiveWelcome from "./components/LiveWelcome";
import { useDawayirLiveSession } from "./hooks/useDawayirLiveSession";
import type { DawayirLiveConfig, LiveLanguage, LiveMode } from "./types";

const MODES: Array<{ value: LiveMode; label: string; hint: string }> = [
  { value: "standard", label: "جلسة فردية", hint: "النسخة الأساسية للتفريغ والتركيز." },
  { value: "hybrid", label: "جلسة معمّقة", hint: "تولّد تقارير وأدوات أكثر أثناء الجلسة." },
  { value: "couple", label: "Couple Mode", hint: "تمهيد لمسار المشاركة الثنائية." },
];

const LANGUAGES: Array<{ value: LiveLanguage; label: string }> = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
];

export default function DawayirLiveApp() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<LiveMode>((searchParams.get("mode") as LiveMode) || "standard");
  const [language, setLanguage] = useState<LiveLanguage>((searchParams.get("lang") as LiveLanguage) || "ar");
  const [showTranscript, setShowTranscript] = useState(false);
  const [composer, setComposer] = useState("");
  const autoMicRef = useRef(false);

  const config = useMemo<DawayirLiveConfig>(
    () => ({
      apiKey: runtimeEnv.dawayirLiveApiKey,
      model: runtimeEnv.dawayirLiveModel || undefined,
      voice: runtimeEnv.dawayirLiveVoice || undefined,
      mode,
      language,
      entrySurface: searchParams.get("surface") || "dawayir-live",
      initialContext: {
        nodeId: searchParams.get("nodeId"),
        nodeLabel: searchParams.get("nodeLabel"),
        goalId: searchParams.get("goalId"),
        note: searchParams.get("note"),
      },
    }),
    [language, mode, searchParams],
  );

  const session = useDawayirLiveSession(config);

  useEffect(() => {
    if ((session.status === "connected" || session.status === "speaking") && autoMicRef.current && !session.isMicActive) {
      autoMicRef.current = false;
      void session.toggleMic();
    }
  }, [session]);

  const handleStart = useCallback(async () => {
    autoMicRef.current = true;
    await session.connect();
  }, [session]);

  const handleEnd = useCallback(async () => {
    const id = await session.completeSession();
    if (id) {
      assignUrl(`/dawayir-live/complete/${id}`);
    }
  }, [session]);

  const handleSend = useCallback(() => {
    if (!composer.trim()) return;
    session.sendTextMessage(composer);
    setComposer("");
  }, [composer, session]);

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  }, []);

  const isIdle = session.status === "idle" || session.status === "disconnected";
  const isConnecting =
    session.status === "bootstrapping" ||
    session.status === "connecting" ||
    session.status === "setup";
  const isLive = session.status === "connected" || session.status === "speaking";

  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-950 text-white">
      {(isIdle || isConnecting) && (
        <>
          <LiveWelcome onStartSession={handleStart} onBack={handleBack} isConnecting={isConnecting} />

          <div className="absolute inset-x-0 bottom-4 z-30 mx-auto grid w-[min(92vw,72rem)] gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Onboarding</p>
              <ol className="mt-3 space-y-2 text-sm text-slate-200">
                <li>1. ادخل الجلسة بصوتك أو بالكتابة.</li>
                <li>2. راقب الدوائر والموضوعات وهي تتكوّن.</li>
                <li>3. اختم الجلسة لتحصل على report + truth contract + replay.</li>
              </ol>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Session Mode</p>
              <div className="mt-3 space-y-2">
                {MODES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMode(item.value)}
                    className={`w-full rounded-2xl border px-3 py-3 text-right transition ${
                      mode === item.value
                        ? "border-teal-400 bg-teal-400/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <div className="font-semibold">{item.label}</div>
                    <div className="mt-1 text-xs text-slate-400">{item.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Settings</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {LANGUAGES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setLanguage(item.value)}
                    className={`rounded-full border px-3 py-2 text-sm ${
                      language === item.value
                        ? "border-amber-300 bg-amber-300/15 text-amber-100"
                        : "border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                <p>Model: {config.model || "gemini-2.5-flash-native-audio-preview-12-2025"}</p>
                <p className="mt-1">Voice: {config.voice || "Aoede"}</p>
                {config.initialContext?.nodeLabel && (
                  <p className="mt-1">Start context: {config.initialContext.nodeLabel}</p>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => assignUrl("/dawayir-live/history")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200"
                >
                  <History className="h-4 w-4" />
                  السجل
                </button>
                <button
                  type="button"
                  onClick={() => assignUrl("/dawayir-live/couple")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200"
                >
                  <Users className="h-4 w-4" />
                  Couple
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {isLive && (
        <>
          <LiveCanvas
            circles={session.circles}
            spawnedOthers={session.spawnedOthers}
            spawnedTopics={session.spawnedTopics}
            topicConnections={session.topicConnections}
            thoughtMap={session.thoughtMap}
            whyNowLine={session.whyNowLine}
            isAgentSpeaking={session.isAgentSpeaking}
          />

          <LiveHUD
            status={session.status}
            isMicActive={session.isMicActive}
            isAgentSpeaking={session.isAgentSpeaking}
            metrics={session.metrics}
            journeyStage={session.journeyStage}
            onToggleMic={session.toggleMic}
            onEndSession={handleEnd}
          />

          <div className="absolute bottom-6 left-1/2 z-30 flex w-[min(92vw,44rem)] -translate-x-1/2 items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/70 p-3 shadow-2xl backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setShowTranscript((value) => !value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
            >
              {showTranscript ? "إخفاء النص" : "إظهار النص"}
            </button>
            <input
              value={composer}
              onChange={(event) => setComposer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSend();
              }}
              placeholder="اكتب ما تريد قوله لو لم تستخدم الميكروفون..."
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={handleSend}
              className="rounded-2xl bg-teal-400 px-4 py-3 text-sm font-bold text-slate-950"
            >
              إرسال
            </button>
          </div>

          <LiveTranscript entries={session.transcript} isVisible={showTranscript} onToggle={() => setShowTranscript((value) => !value)} />
        </>
      )}

      {session.status === "auth-required" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/95 p-6">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/75 p-8 text-center shadow-2xl backdrop-blur-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-amber-300/80">Authentication Required</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white">ابدأ بعد تسجيل الدخول</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Dawayir Live مرتبط بجلساتك وartifacts وإعادة التشغيل، لذلك يحتاج حساباً فعلياً داخل المنصة.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => assignUrl("/")}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200"
              >
                الرجوع للرئيسية
              </button>
              <button
                type="button"
                onClick={() => assignUrl("/profile")}
                className="rounded-2xl bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950"
              >
                الذهاب للحساب
              </button>
            </div>
          </div>
        </div>
      )}

      {session.status === "error" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/95 p-6">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/75 p-8 text-center shadow-2xl backdrop-blur-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-rose-300/80">Live Error</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white">تعذّر بدء الجلسة</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">
              {session.errorMessage || "حدث خطأ غير متوقع أثناء بدء Dawayir Live."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={handleStart}
                className="rounded-2xl bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950"
              >
                حاول مرة أخرى
              </button>
              <button
                type="button"
                onClick={() => assignUrl("/dawayir-live/history")}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200"
              >
                افتح السجل
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute left-4 top-4 z-30 flex gap-2">
        <button
          type="button"
          onClick={() => assignUrl("/dawayir-live/history")}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-200 backdrop-blur-xl"
        >
          <History className="h-4 w-4" />
          History
        </button>
        <button
          type="button"
          onClick={() => assignUrl("/coach?tab=dawayir-live")}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-200 backdrop-blur-xl"
        >
          <ArrowRight className="h-4 w-4" />
          Coach
        </button>
        <button
          type="button"
          onClick={async () => {
            const url = await session.createShareLink();
            if (url) window.open(url, "_blank", "noopener,noreferrer");
          }}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-200 backdrop-blur-xl"
        >
          <Link2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </div>
  );
}
