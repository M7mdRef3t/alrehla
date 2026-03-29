import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { AdviceCategory } from "../../data/adviceScripts";
import { recordFlowEvent } from "../../services/journeyTracking";
import { syncLocalMapOnLogin } from "../../services/mapSync";
import { syncLocalPulsesOnLogin } from "../../services/pulseSync";
import { consciousnessService, type ConsciousnessInsight } from "../../services/consciousnessService";
import { geminiClient } from "../../services/geminiClient";
import { supabase } from "../../services/supabaseClient";
import type { UserToneGender } from "../../state/authState";
import type {
  PulseEnergyConfidence,
  PulseEntry,
  PulseFocus,
  PulseMood
} from "../../state/pulseState";
import type { AppScreen } from "../../navigation/navigationMachine";
import { clearPostAuthIntent, getPostAuthIntent, type PostAuthIntent } from "../../utils/postAuthIntent";
import { ensureValidJourneyState } from "../../utils/journeyState";
import type { WelcomeSource } from "../OnboardingWelcomeBubble";

type AuthStatus = "loading" | "ready";
type PulseCheckContext = "regular" | "start_recovery";

type WelcomeState = {
  message: string;
  source: WelcomeSource;
} | null;

type OfflineInterventionPulse = {
  energy: number;
  mood: PulseMood;
  focus: PulseFocus;
  auto?: boolean;
  notes?: string;
  energyReasons?: string[];
  energyConfidence?: PulseEnergyConfidence;
};

interface UseAppAuthRecoveryParams {
  authStatus: AuthStatus;
  authUser: User | null;
  authFirstName: string | null;
  authToneGender: UserToneGender;
  isPhaseOneUserFlow: boolean;
  logPulse: (entry: Omit<PulseEntry, "timestamp">) => void;
  navigateToScreen: (screen: AppScreen) => boolean;
  setPulseCheckContext: (context: PulseCheckContext) => void;
  setShowPulseCheck: (show: boolean) => void;
  setCategory: (category: AdviceCategory) => void;
  setGoalId: (goalId: string) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setShowAuthModal: (show: boolean) => void;
}

function buildStartRecoveryWelcome(firstName: string | null, toneGender: UserToneGender): string {
  const prefix = firstName ? `أهلاً يا ${firstName}` : "أهلاً";
  if (toneGender === "female") return `${prefix}، هل أنتِ مستعدة لبدء الرحلة؟ التعافي مش سحر، هو رحلة بتبدأيها بخطواتك.`;
  if (toneGender === "male") return `${prefix}، هل أنت مستعد لبدء الرحلة؟ التعافي مش سحر، هو رحلة بتبدأها بخطواتك.`;
  return `${prefix}، هل أنت مستعد لبدء الرحلة؟ التعافي مش سحر، هو رحلة بتبدأها بخطواتك.`;
}

function buildWelcomePrompt(firstName: string | null, toneGender: UserToneGender): string {
  const toneLabel = toneGender === "female" ? "مؤنث دافئ" : toneGender === "male" ? "مذكر دافئ" : "محايد ودود";
  const namePart = firstName ? ` لمستخدم اسمه "${firstName}"` : "";
  const tonePart = toneGender === "neutral" ? "بدون تذكير/تأنيث مباشر" : `بصيغة مخاطبة ${toneLabel}`;
  return `اكتب ترحيب قصير وودود باللهجة المصرية${namePart}. جملة واحدة بشكل طبيعي (بدون سؤال منفصل). بدون إيموجي. بدون علامات اقتباس. أقل من 15 كلمة. ${tonePart}. لا تكرر الاسم كثيرًا.`;
}

function cleanSingleLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function cleanWelcomeMessage(text: string | null): string | null {
  if (!text) return null;
  const oneLine = cleanSingleLine(text);
  if (!oneLine) return null;
  const unquoted = oneLine.replace(/^["“]+|["”]+$/g, "").trim();
  if (!unquoted) return null;
  return unquoted.length > 140 ? `${unquoted.slice(0, 140).trim()}...` : unquoted;
}

export function useAppAuthRecovery({
  authStatus,
  authUser,
  authFirstName,
  authToneGender,
  isPhaseOneUserFlow,
  logPulse,
  navigateToScreen,
  setPulseCheckContext,
  setShowPulseCheck,
  setCategory,
  setGoalId,
  setSelectedNodeId,
  setShowAuthModal
}: UseAppAuthRecoveryParams) {
  const [postAuthIntent, setPostAuthIntent] = useState<PostAuthIntent | null>(null);
  const [welcome, setWelcome] = useState<WelcomeState>(null);
  const [consciousnessInsight, setConsciousnessInsight] = useState<ConsciousnessInsight | null>(null);
  const offlineInterventionHydratedForUserRef = useRef<string | null>(null);

  const clearWelcome = useCallback(() => {
    setWelcome(null);
  }, []);

  const clearPostAuthState = useCallback(() => {
    clearPostAuthIntent();
    setPostAuthIntent(null);
    setWelcome(null);
  }, []);

  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!authUser) return;

    const intent = getPostAuthIntent();
    if (!intent) return;

    clearPostAuthIntent();
    recordFlowEvent("auth_login_success", { meta: { intent: intent.kind, userId: authUser.id, email: authUser.email ?? null } });

    if (intent.kind === "login") {
      setPulseCheckContext("regular");
      setShowPulseCheck(false);
      setShowAuthModal(false);
      setPostAuthIntent(null);
      void syncLocalMapOnLogin();
      void syncLocalPulsesOnLogin();
      return;
    }

    if (intent.kind !== "start_recovery") return;

    setPulseCheckContext("regular");
    setShowPulseCheck(false);
    setShowAuthModal(false);
    setPostAuthIntent(null);

    logPulse(intent.pulse);

    setWelcome({ message: buildStartRecoveryWelcome(authFirstName, authToneGender), source: "template" });
    if (isPhaseOneUserFlow) {
      const validJourney = ensureValidJourneyState();
      setGoalId(validJourney.goalId);
      setCategory(validJourney.category);
      setSelectedNodeId(null);
      void navigateToScreen("map");
      recordFlowEvent("post_auth_intent_phase_one_map");
    } else {
      void navigateToScreen("goal");
      recordFlowEvent("post_auth_intent_goal_picker");
    }

    void syncLocalMapOnLogin();
    void syncLocalPulsesOnLogin();

    let cancelled = false;
    void (async () => {
      const insight = await consciousnessService.analyzeConsciousness(`بدأ المستخدم ${authFirstName || ""} رحلة جديدة`);
      if (!cancelled) setConsciousnessInsight(insight);

      if (!geminiClient.isAvailable()) return;
      const prompt = buildWelcomePrompt(authFirstName, authToneGender);
      const out = await geminiClient.generate(prompt);
      if (cancelled) return;
      const cleaned = cleanWelcomeMessage(out);
      if (!cleaned) return;
      setWelcome({ message: cleaned, source: "ai" });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    authFirstName,
    authStatus,
    authToneGender,
    authUser,
    isPhaseOneUserFlow,
    logPulse,
    navigateToScreen,
    setCategory,
    setGoalId,
    setPulseCheckContext,
    setSelectedNodeId,
    setShowAuthModal,
    setShowPulseCheck
  ]);

  useEffect(() => {
    if (authUser) return;
    offlineInterventionHydratedForUserRef.current = null;
  }, [authUser]);

  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!authUser || !supabase) return;
    if (offlineInterventionHydratedForUserRef.current === authUser.id) return;
    offlineInterventionHydratedForUserRef.current = authUser.id;

    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("pending_interventions")
        .select("id, ai_message, trigger_reason, created_at")
        .eq("user_id", authUser.id)
        .eq("status", "unread")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("[OfflineIntervention] fetch failed:", error.message);
        return;
      }

      const intervention = data?.[0];
      if (!intervention || cancelled) return;

      const cleaned = cleanWelcomeMessage(intervention.ai_message);
      if (cleaned) {
        setWelcome({ message: cleaned, source: "offline_intervention" });
      }

      const { error: markError } = await supabase.rpc("mark_pending_interventions_read", {
        p_user_id: authUser.id
      });
      if (markError) {
        console.error("[OfflineIntervention] mark-read failed:", markError.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, authUser]);

  const setStartRecoveryIntent = useCallback((pulse: OfflineInterventionPulse) => {
    setPostAuthIntent({ kind: "start_recovery", pulse, createdAt: Date.now() });
  }, []);

  const setLoginIntent = useCallback(() => {
    setPostAuthIntent({ kind: "login", createdAt: Date.now() });
  }, []);

  return {
    postAuthIntent,
    setPostAuthIntent,
    setStartRecoveryIntent,
    setLoginIntent,
    welcome,
    clearWelcome,
    clearPostAuthState,
    consciousnessInsight
  };
}
