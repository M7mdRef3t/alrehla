import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, Mail, Star } from "lucide-react";
import { landingCopy } from "../copy/landing";
import { getJourneyToolsView } from "../data/journeyTools";
import { useJourneyState } from "../state/journeyState";
import { useMapState } from "../state/mapState";
import { useAchievementState } from "../state/achievementState";
import { getGoalLabel, getLastGoalMeta } from "../utils/goalLabel";
import { getGoalMeta } from "../data/goalMeta";
import type { FeatureFlagKey } from "../config/features";
import { useAuthState } from "../state/authState";
import { signInWithGoogle, signInWithMagicLink, signOut } from "../services/authService";
import { isSupabaseReady } from "../services/supabaseClient";
import { isPrivilegedRole } from "../utils/featureFlags";

interface LandingProps {
  onStartJourney: () => void;
  onOpenTools?: () => void;
  showTopToolsButton?: boolean;
  showPostStartContent?: boolean;
  showToolsSection?: boolean;
  onFeatureLocked?: (feature: FeatureFlagKey) => void;
  availableFeatures?: Partial<Record<FeatureFlagKey, boolean>>;
}

type AuthMessage = {
  kind: "success" | "error" | "info";
  text: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Landing: FC<LandingProps> = ({
  onStartJourney,
  onOpenTools,
  showTopToolsButton = true,
  showPostStartContent = true,
  showToolsSection = true,
  onFeatureLocked,
  availableFeatures
}) => {
  const nodesCount = useMapState((s) => s.nodes.length);
  const baselineCompletedAt = useJourneyState((s) => s.baselineCompletedAt);
  const lastGoalId = useJourneyState((s) => s.goalId);
  const lastGoalCategory = useJourneyState((s) => s.category);
  const lastGoalById = useJourneyState((s) => s.lastGoalById);
  const lastGoalRecord = getLastGoalMeta(lastGoalById, lastGoalId, lastGoalCategory);
  const lastGoalLabel = getGoalLabel(lastGoalRecord?.goalId);
  const lastGoalMeta = getGoalMeta(lastGoalRecord?.goalId);
  const [badgePulse, setBadgePulse] = useState(false);
  const lastGoalRef = useRef<string | null>(lastGoalLabel ?? null);
  const unlockedIds = useAchievementState((s) => s.unlockedIds);
  const hasMissionCompleted = useMapState((s) => s.nodes.some((n) => n.missionProgress?.isCompleted));
  const authStatus = useAuthState((s) => s.status);
  const authUser = useAuthState((s) => s.user);
  const role = useAuthState((s) => s.roleOverride ?? s.role);
  const [magicEmail, setMagicEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<AuthMessage | null>(null);
  const isPrivileged = isPrivilegedRole(role);
  const hasAuthSession = Boolean(authUser);
  const showLaunchAuth = isSupabaseReady && !hasAuthSession && !isPrivileged;
  const showPrivilegedBypass = isSupabaseReady && !hasAuthSession && isPrivileged;
  const canStartJourney = !showLaunchAuth;
  const tools = getJourneyToolsView({
    nodesCount,
    baselineCompletedAt: baselineCompletedAt ?? null,
    unlockedIds,
    hasMissionCompleted,
    availableFeatures
  });

  useEffect(() => {
    if (!lastGoalLabel) return;
    if (lastGoalRef.current && lastGoalRef.current !== lastGoalLabel) {
      setBadgePulse(true);
      const t = setTimeout(() => setBadgePulse(false), 700);
      lastGoalRef.current = lastGoalLabel;
      return () => clearTimeout(t);
    }
    lastGoalRef.current = lastGoalLabel;
  }, [lastGoalLabel]);

  useEffect(() => {
    if (!authUser?.email) return;
    setMagicEmail(authUser.email);
    setAuthMessage(null);
  }, [authUser?.email]);

  const handleStartJourney = () => {
    if (!canStartJourney) {
      setAuthMessage({
        kind: "info",
        text: landingCopy.auth.startBlocked
      });
      return;
    }
    onStartJourney();
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setAuthMessage({
        kind: "error",
        text: landingCopy.auth.googleFailed
      });
    } else {
      setAuthMessage({
        kind: "info",
        text: landingCopy.auth.googleRedirecting
      });
    }
    setAuthLoading(false);
  };

  const handleMagicLinkLogin = async () => {
    const email = magicEmail.trim();
    if (!EMAIL_PATTERN.test(email)) {
      setAuthMessage({
        kind: "error",
        text: landingCopy.auth.emailInvalid
      });
      return;
    }
    setAuthLoading(true);
    setAuthMessage(null);
    const { error } = await signInWithMagicLink(email);
    if (error) {
      setAuthMessage({
        kind: "error",
        text: landingCopy.auth.magicFailed
      });
    } else {
      setAuthMessage({
        kind: "success",
        text: landingCopy.auth.magicSent
      });
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    setAuthMessage(null);
    await signOut();
    setAuthLoading(false);
  };

  const authMessageClass = (() => {
    if (!authMessage) return "";
    if (authMessage.kind === "error") return "text-rose-600";
    if (authMessage.kind === "success") return "text-emerald-600";
    return "text-slate-600";
  })();

  const badgePulseClass = badgePulse ? "animate-bounce" : "";
  const fallbackBadgeClasses =
    "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200";

  return (
    <div className="relative w-full max-w-xl min-h-[70vh] py-10 md:py-14 flex flex-col items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
        <div
          className="w-[min(80vmax,520px)] h-[min(80vmax,520px)] rounded-full blur-2xl dark:hidden animate-pulse"
          style={{
            background:
              "radial-gradient(circle at center, rgba(71,85,105,0.24), rgba(148,163,184,0.16) 42%, rgba(255,255,255,0) 72%)"
          }}
        />
        <div className="hidden w-[min(80vmax,520px)] h-[min(80vmax,520px)] rounded-full bg-teal-900/40 blur-3xl dark:block animate-pulse" />
      </div>

      <main
        className="relative z-10 w-full text-center"
        style={{ willChange: "transform, opacity" }}
        aria-labelledby="landing-title"
      >
        {onOpenTools && showTopToolsButton && (
          <button
            type="button"
            onClick={onOpenTools}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold shadow-sm hover:bg-slate-800 transition-all"
          >
            <span>{landingCopy.toolsCta}</span>
            <span className="text-[10px] text-slate-200">{landingCopy.toolsCtaHint}</span>
          </button>
        )}

        <h1
          id="landing-title"
          className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6 leading-normal"
          style={{ fontFamily: "'Almarai', sans-serif", willChange: "transform, opacity" }}
        >
          <span className="block">{landingCopy.titleLine1}</span>
          <span className="block mt-2">{landingCopy.titleLine2}</span>
        </h1>

        <p
          className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto whitespace-pre-line"
          style={{ willChange: "transform, opacity" }}
        >
          {landingCopy.subtitle}
        </p>

        {isSupabaseReady && (
          <section className="mt-6 max-w-md mx-auto text-right" aria-label="launch-auth">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 p-4 shadow-sm">
              {showLaunchAuth ? (
                <div className="space-y-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {landingCopy.auth.gateTitle}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {landingCopy.auth.gateHint}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={authLoading || authStatus === "loading"}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
                  >
                    <LogIn className="w-4 h-4" />
                    {landingCopy.auth.chooseGoogle}
                  </button>

                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="text-[11px] text-slate-500">{landingCopy.auth.orDivider}</span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="email"
                      dir="ltr"
                      value={magicEmail}
                      onChange={(e) => setMagicEmail(e.target.value)}
                      placeholder="name@email.com"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleMagicLinkLogin}
                      disabled={authLoading || authStatus === "loading"}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
                    >
                      <Mail className="w-4 h-4" />
                      {landingCopy.auth.chooseMagicLink}
                    </button>
                  </div>

                  {authStatus === "loading" && (
                    <p className="text-xs text-slate-500">{landingCopy.auth.sessionCheck}</p>
                  )}
                  {authMessage && <p className={`text-xs ${authMessageClass}`}>{authMessage.text}</p>}
                </div>
              ) : showPrivilegedBypass ? (
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {landingCopy.auth.devBypassTitle}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {landingCopy.auth.devBypassHint}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{landingCopy.auth.securedTitle}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{authUser?.email ?? "حساب مفعل"}</p>
                  </div>
                  {authUser && (
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={authLoading}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      خروج
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        <div className="mt-8">
          <button
            type="button"
            onClick={handleStartJourney}
            disabled={!canStartJourney || authStatus === "loading"}
            className="rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 transition-transform disabled:opacity-60 disabled:hover:bg-teal-600"
          >
            {landingCopy.ctaJourney}
          </button>
          {showLaunchAuth && (
            <p className="mt-2 text-xs text-slate-500">{landingCopy.auth.startBlocked}</p>
          )}
          {showPostStartContent && onOpenTools && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onOpenTools}
                className="text-sm font-semibold text-teal-700 hover:text-teal-800 underline decoration-teal-200"
              >
                {landingCopy.toolsCta}
              </button>
              <p className="text-xs text-slate-500">{landingCopy.toolsCtaHint}</p>
            </div>
          )}
        </div>

        {showPostStartContent && (
          <section className="mt-10 text-right max-w-md mx-auto" aria-labelledby="landing-what-is">
            <h2 id="landing-what-is" className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              {landingCopy.whatIsTitle}
            </h2>
            <ul className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-1.5 list-none pr-0">
              {landingCopy.whatIsPoints.map((point, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-teal-500 mt-0.5 shrink-0" aria-hidden>
                    •
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {showPostStartContent && (
          <section className="mt-6 text-center max-w-md mx-auto" aria-labelledby="landing-trust">
            <p id="landing-trust" className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {landingCopy.trustTitle}
            </p>
            <p className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-0.5">
              {landingCopy.trustCount} {landingCopy.trustSuffix}
            </p>
            <div className="mt-4 space-y-3">
              {landingCopy.testimonials.map((t, i) => (
                <blockquote
                  key={i}
                  className="text-sm text-slate-600 dark:text-slate-400 italic border-r-2 border-teal-200 dark:border-teal-700 pr-3 text-right"
                >
                  "{t.quote}"
                  <cite className="block text-xs not-italic text-slate-500 dark:text-slate-500 mt-1">— {t.author}</cite>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {showPostStartContent && showToolsSection && (
          <section className="mt-8 text-right max-w-md mx-auto" aria-labelledby="landing-tools">
            <h2 id="landing-tools" className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              {landingCopy.toolsTitle}
            </h2>
            <div className="space-y-3">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    if (!tool.locked || !tool.featureKey || !onFeatureLocked) return;
                    onFeatureLocked(tool.featureKey);
                  }}
                  className={`rounded-2xl border px-4 py-3 shadow-sm transition-colors ${
                    tool.locked
                      ? "border-slate-200 bg-white dark:bg-slate-800"
                      : "border-teal-200 bg-teal-50/70 dark:bg-teal-900/20 dark:border-teal-700"
                  } w-full text-right`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                          tool.locked
                            ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                            : "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-200"
                        }`}
                      >
                        <span aria-hidden="true">{tool.icon}</span>
                      </div>
                      <div className="text-right min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{tool.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{tool.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap ${
                          tool.locked
                            ? "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                            : "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-200"
                        }`}
                      >
                        {tool.status}
                      </span>
                      {!tool.locked && tool.id !== "dawayir" && (
                        <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200 whitespace-nowrap">
                          تم فتحها
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{tool.description}</p>
                </button>
              ))}
            </div>
            {showPostStartContent && onOpenTools && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-teal-100 bg-teal-50/80 px-4 py-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-teal-700">{landingCopy.toolsCta}</p>
                  <p className="text-xs text-slate-600">{landingCopy.toolsCtaHint}</p>
                  {lastGoalLabel && (
                    <span
                      className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        lastGoalMeta?.badgeClasses ?? fallbackBadgeClasses
                      } ${badgePulseClass}`}
                    >
                      {lastGoalMeta ? <lastGoalMeta.icon className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                      آخر هدف محفوظ: {lastGoalLabel}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onOpenTools}
                  className="text-sm font-semibold text-teal-700 underline decoration-teal-200"
                >
                  افتح
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
