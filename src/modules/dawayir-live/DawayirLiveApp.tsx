"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { assignUrl } from "../../services/navigation";
import { runtimeEnv } from "../../config/runtimeEnv";
import LiveCanvas from "./components/LiveCanvas";
import BreathingGuideOverlay from "./components/BreathingGuideOverlay";
import LiveHUD from "./components/LiveHUD";
import MirrorMomentOverlay from "./components/MirrorMomentOverlay";
import SacredPauseOverlay from "./components/SacredPauseOverlay";
import LiveTranscript from "./components/LiveTranscript";
import LiveSetupScreen from "./components/LiveSetupScreen";
import LivePreJoinScreen from "./components/LivePreJoinScreen";
import ParityOnboardingModal from "./components/ParityOnboardingModal";
import ParityWelcomeScreen from "./components/ParityWelcomeScreen";
import { useDawayirLiveSession } from "./hooks/useDawayirLiveSession";
import { PARITY_ONBOARDING_STEPS } from "./parityContent";
import type { DawayirLiveConfig, LiveLanguage, LiveMode } from "./types";

export default function DawayirLiveApp() {
  const searchParams = useSearchParams();
  const safeSearchParams = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);
  const [mode, setMode] = useState<LiveMode>((safeSearchParams.get("mode") as LiveMode) || "standard");
  const [language, setLanguage] = useState<LiveLanguage>((safeSearchParams.get("lang") as LiveLanguage) || "ar");
  const [showTranscript, setShowTranscript] = useState(false);
  const [composer, setComposer] = useState("");
  const [appView, setAppView] = useState<"welcome" | "setup" | "prejoin" | "live">("welcome");
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<string | null>(null);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [pinnedNote, setPinnedNote] = useState("");
  const [whiteboardTool, setWhiteboardTool] = useState<"pen" | "shape" | "eraser">("pen");
  const [transcriptTab, setTranscriptTab] = useState<"notes" | "transcript" | "summary">("notes");
  const [transcriptQuery, setTranscriptQuery] = useState("");
  const [isVoiceSearchListening, setIsVoiceSearchListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordStartAt, setRecordStartAt] = useState<number | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [showReactionTray, setShowReactionTray] = useState(false);
  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("dawayir-onboarding-seen") !== "true";
  });
  const [onboardingStep, setOnboardingStep] = useState(0);
  const autoMicRef = useRef(false);
  const tenseStartRef = useRef<number | null>(null);
  const breathingCooldownRef = useRef(0);

  const config = useMemo<DawayirLiveConfig>(
    () => ({
      apiKey: runtimeEnv.dawayirLiveApiKey,
      model: runtimeEnv.dawayirLiveModel || undefined,
      voice: runtimeEnv.dawayirLiveVoice || undefined,
      mode,
      language,
      entrySurface: safeSearchParams.get("surface") || "dawayir-live",
      initialContext: {
        nodeId: safeSearchParams.get("nodeId"),
        nodeLabel: safeSearchParams.get("nodeLabel"),
        goalId: safeSearchParams.get("goalId"),
        note: safeSearchParams.get("note"),
      },
    }),
    [language, mode, safeSearchParams],
  );

  const session = useDawayirLiveSession(config);
  const onboardingSteps = PARITY_ONBOARDING_STEPS[language];

  useEffect(() => {
    if ((session.status === "connected" || session.status === "speaking") && autoMicRef.current && !session.isMicActive) {
      autoMicRef.current = false;
      void session.toggleMic();
    }
  }, [session]);

  useEffect(() => {
    if (session.status === "connected" || session.status === "speaking") {
      setAppView("live");
    }
  }, [session.status]);

  useEffect(() => {
    const liveActive = session.status === "connected" || session.status === "speaking";
    if (!liveActive) {
      tenseStartRef.current = null;
      setShowBreathingGuide(false);
      return;
    }

    const isTense = session.metrics.overloadIndex > 0.72 || (session.journeyStage === "Overwhelmed" && session.metrics.overloadIndex > 0.52);
    if (session.isAgentSpeaking || !isTense) {
      tenseStartRef.current = null;
      return;
    }

    if (!tenseStartRef.current) {
      tenseStartRef.current = Date.now();
      return;
    }

    if (Date.now() < breathingCooldownRef.current) return;

    if (Date.now() - tenseStartRef.current >= 3000) {
      setShowBreathingGuide(true);
      breathingCooldownRef.current = Date.now() + 90000;
      tenseStartRef.current = null;
    }
  }, [session.status, session.isAgentSpeaking, session.journeyStage, session.metrics.overloadIndex]);

  const handleJoinSession = useCallback(async () => {
    autoMicRef.current = true;
    await session.connect();
  }, [session]);

  const handleEnd = useCallback(async () => {
    const id = await session.completeSession();
    if (id) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(`dawayir-live-recording:${id}`, JSON.stringify({
          seconds: recordSeconds,
          transcriptCount: session.transcript.length,
          startedAt: recordStartAt,
        }));
      }
      assignUrl(`/dawayir-live/complete/${id}`);
    }
  }, [recordSeconds, recordStartAt, session]);

  const handleSend = useCallback(() => {
    if (!composer.trim()) return;
    session.sendTextMessage(composer);
    setComposer("");
  }, [composer, session]);

  const handleShare = useCallback(async () => {
    const url = await session.createShareLink();
    if (url && typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [session]);

  const handleToggleCamera = useCallback(() => {
    setIsCameraActive((value) => !value);
  }, []);

  const handleToggleHandRaise = useCallback(() => {
    setIsHandRaised((value) => !value);
  }, []);

  const handleCycleReaction = useCallback(() => {
    setCurrentReaction((value) => {
      if (!value) return "👍";
      if (value === "👍") return "🙏";
      if (value === "🙏") return "❤️";
      return null;
    });
    setShowReactionTray(true);
  }, []);

  useEffect(() => {
    if (!currentReaction) return;
    setShowReactionTray(true);
    const timer = window.setTimeout(() => setShowReactionTray(false), 3500);
    return () => window.clearTimeout(timer);
  }, [currentReaction]);

  const handleToggleWhiteboard = useCallback(() => {
    setIsWhiteboardOpen((value) => !value);
  }, []);

  const handleSelectWhiteboardTool = useCallback((tool: "pen" | "shape" | "eraser") => {
    setWhiteboardTool(tool);
    setIsWhiteboardOpen(true);
  }, []);

  const handleToggleRecording = useCallback(() => {
    setIsRecording((value) => {
      const next = !value;
      if (next) {
        const now = Date.now();
        setRecordStartAt(now);
        setRecordSeconds(0);
      } else {
        setRecordStartAt(null);
      }
      return next;
    });
  }, []);

  const handleToggleVoiceSearch = useCallback(() => {
    setIsVoiceSearchListening((value) => !value);
  }, []);

  const handlePinNote = useCallback(() => {
    if (!notesDraft.trim()) return;
    setPinnedNote(notesDraft.trim());
  }, [notesDraft]);

  const handleBack = useCallback(() => {
    if (appView === "prejoin") {
      setAppView("setup");
      return;
    }
    if (appView === "setup") {
      setAppView("welcome");
      return;
    }
    if (typeof window !== "undefined") {
      window.history.back();
    }
  }, [appView]);

  const handleContinueToPreJoin = useCallback(() => {
    setAppView("prejoin");
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("dawayir-onboarding-seen", "true");
    }
  }, []);

  const advanceOnboarding = useCallback(() => {
    setOnboardingStep((current) => {
      if (current >= onboardingSteps.length - 1) {
        dismissOnboarding();
        return current;
      }
      return current + 1;
    });
  }, [dismissOnboarding, onboardingSteps.length]);

  const isIdle = session.status === "idle" || session.status === "disconnected";
  const isConnecting =
    session.status === "bootstrapping" ||
    session.status === "connecting" ||
    session.status === "setup";
  const isLive = session.status === "connected" || session.status === "speaking";

  useEffect(() => {
    if (!isRecording || !recordStartAt) return;
    const timer = window.setInterval(() => {
      setRecordSeconds(Math.floor((Date.now() - recordStartAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRecording, recordStartAt]);

  return (
    <div className="dawayir-parity-shell dawayir-group-shell" dir={language === "ar" ? "rtl" : "ltr"} lang={language}>
      <a className="skip-link" href="#main-canvas-content">
        {language === "ar" ? "تخطي إلى المحتوى الرئيسي" : "Skip to main content"}
      </a>

      <div className="dawayir-live-hero-shell">
        <div className="dawayir-live-hero">
          <span className="dawayir-live-hero-kicker">Live Group Counseling</span>
          <h1>{language === "ar" ? "جلسة جماعية مباشرة" : "Live Group Session"}</h1>
          <p>
            {language === "ar"
              ? "تجربة زجاجية غامرة تربط بين المجال، الحضور، والدردشة الحية مع نفس هوية المجموعة."
              : "A glassmorphic live room that keeps the field, attendance, and chat in one cohesive experience."}
          </p>
        </div>
      </div>

      {appView === "welcome" && (
        <ParityWelcomeScreen
          language={language}
          isTransitioningToSetup={false}
          isLaunching={false}
          voiceTattoo={session.voiceTattoo}
          onEnterSetup={() => setAppView("setup")}
          onSetLanguage={setLanguage}
          onGoToCouple={() => assignUrl("/dawayir-live/couple")}
          onGoToTeacher={() => assignUrl("/coach?tab=dawayir-live")}
        />
      )}

      {(appView === "setup" || (isIdle && appView !== "welcome")) && !isLive && (
        <LiveSetupScreen
          language={language}
          mode={mode}
          isConnecting={isConnecting}
          model={config.model || "gemini-2.5-flash-native-audio-latest"}
          voice={config.voice || "Aoede"}
          nodeLabel={config.initialContext?.nodeLabel}
          onContinue={handleContinueToPreJoin}
          onToggleLanguage={setLanguage}
          onToggleMode={setMode}
        />
      )}

      {appView === "prejoin" && !isLive && (
        <LivePreJoinScreen
          language={language}
          model={config.model || "gemini-2.5-flash-native-audio-latest"}
          voice={config.voice || "Aoede"}
          nodeLabel={config.initialContext?.nodeLabel}
          isJoining={isConnecting}
          onJoinSession={handleJoinSession}
          onBackToSetup={() => setAppView("setup")}
          onOpenHistory={() => assignUrl("/dawayir-live/history")}
          onOpenCouple={() => assignUrl("/dawayir-live/couple")}
          onOpenTeacher={() => assignUrl("/coach?tab=dawayir-live")}
        />
      )}

      {isLive && (
        <>
          <BreathingGuideOverlay
            active={showBreathingGuide}
            language={language}
            onComplete={() => setShowBreathingGuide(false)}
          />
          <MirrorMomentOverlay
            moment={session.mirrorMoment}
            language={language}
            onDismiss={session.dismissMirrorMoment}
          />
          <SacredPauseOverlay
            language={language}
            isLive={isLive}
            isAgentSpeaking={session.isAgentSpeaking}
            transcript={session.transcript}
          />

          <LiveCanvas
            circles={session.circles}
            spawnedOthers={session.spawnedOthers}
            spawnedTopics={session.spawnedTopics}
            topicConnections={session.topicConnections}
            thoughtMap={session.thoughtMap}
            whyNowLine={session.whyNowLine}
            isAgentSpeaking={session.isAgentSpeaking}
            journeyStage={session.journeyStage}
            language={language}
          />

          <AnimatePresence>
            {showReactionTray && (
              <motion.div
                className="live-reaction-tray"
                aria-label={language === "ar" ? "شريط ردود الفعل" : "Reaction tray"}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                {(["❤️", "✨", "🙏", "💡", "👍"] as const).map((reaction, index) => (
                  <motion.button
                    key={reaction}
                    type="button"
                    className={`live-reaction-chip ${currentReaction === reaction ? "active" : ""}`}
                    onClick={() => setCurrentReaction(reaction)}
                    initial={{ y: 0 }}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, delay: index * 0.12 }}
                  >
                    {reaction}
                  </motion.button>
                ))}
                <button
                  type="button"
                  className="live-reaction-chip live-reaction-chip--close"
                  onClick={() => setShowReactionTray(false)}
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <LiveHUD
            language={language}
            status={session.status}
            isMicActive={session.isMicActive}
            isAgentSpeaking={session.isAgentSpeaking}
            isTranscriptVisible={showTranscript}
            metrics={session.metrics}
            journeyStage={session.journeyStage}
            whyNowLine={session.whyNowLine}
            latestTruthContract={session.latestTruthContract}
            latestSummary={session.latestSummary}
            composer={composer}
            onComposerChange={setComposer}
            onSendText={handleSend}
          onToggleTranscript={() => setShowTranscript((value) => !value)}
            onToggleMic={session.toggleMic}
            onToggleCamera={handleToggleCamera}
            onToggleHandRaise={handleToggleHandRaise}
            onCycleReaction={handleCycleReaction}
            onToggleWhiteboard={handleToggleWhiteboard}
            onSelectWhiteboardTool={handleSelectWhiteboardTool}
            onPinNote={handlePinNote}
            onToggleRecording={handleToggleRecording}
            notesDraft={notesDraft}
            onNotesDraftChange={setNotesDraft}
            transcriptCount={session.transcript.length}
            transcriptTab={transcriptTab}
            onChangeTranscriptTab={setTranscriptTab}
            transcriptQuery={transcriptQuery}
            onTranscriptQueryChange={setTranscriptQuery}
            isVoiceSearchListening={isVoiceSearchListening}
            onToggleVoiceSearch={handleToggleVoiceSearch}
            onToggleSilentMirror={session.toggleSilentMirror}
            onEndSession={handleEnd}
            onOpenHistory={() => assignUrl("/dawayir-live/history")}
            onShare={handleShare}
            onBack={handleBack}
            showBreathingGuide={showBreathingGuide}
            isSilentMirrorMode={session.isSilentMirrorMode}
            isCameraActive={isCameraActive}
            isHandRaised={isHandRaised}
            currentReaction={currentReaction}
            isWhiteboardOpen={isWhiteboardOpen}
            pinnedNote={pinnedNote}
            whiteboardTool={whiteboardTool}
            isRecording={isRecording}
            recordSeconds={recordSeconds}
          />

          <LiveTranscript
            entries={session.transcript}
            isVisible={showTranscript}
            onToggle={() => setShowTranscript((value) => !value)}
            showToggle={false}
            language={language}
            searchQuery={transcriptQuery}
            onSearchQueryChange={setTranscriptQuery}
            isVoiceSearchListening={isVoiceSearchListening}
            onToggleVoiceSearch={handleToggleVoiceSearch}
            latestSummary={session.latestSummary}
            latestTranscriptLine={session.transcript.at(-1)?.text ?? null}
          />
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
                onClick={() => assignUrl("/onboarding")}
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
              onClick={handleJoinSession}
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

      {!isLive && (
        <div className="absolute left-4 top-4 z-30 flex gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-200 backdrop-blur-xl"
          >
            <ArrowRight className="h-4 w-4" />
            {appView === "setup" ? "رجوع" : "Back"}
          </button>
          <button
            type="button"
            onClick={() => assignUrl("/dawayir-live/history")}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-200 backdrop-blur-xl"
          >
            <History className="h-4 w-4" />
            History
          </button>
        </div>
      )}

      {showOnboarding && appView === "setup" && (
        <ParityOnboardingModal
          language={language}
          step={onboardingStep}
          steps={onboardingSteps}
          onSkip={dismissOnboarding}
          onNext={advanceOnboarding}
        />
      )}
    </div>
  );
}
