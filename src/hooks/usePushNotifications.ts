/**
 * usePushNotifications — Web Push subscription hook
 * 
 * Usage:
 *   const { isSupported, permission, subscribe, unsubscribe } = usePushNotifications();
 * 
 * Environment variable required:
 *   VITE_VAPID_PUBLIC_KEY=<your-vapid-public-key>
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { runtimeEnv } from "../config/runtimeEnv";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

interface PushState {
  isSupported: boolean;
  permission: PushPermission;
  isSubscribed: boolean;
  isLoading: boolean;
}

function readPublicEnv(key: string): string | undefined {
  try {
    if (typeof process !== "undefined" && process.env) {
      const value = process.env[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  } catch {
    // Ignore unavailable process.env in browser-like contexts.
  }
  return undefined;
}

// Convert VAPID base64 key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Store push subscription in Supabase (push_subscriptions table)
async function savePushSubscription(userId: string, sub: PushSubscription): Promise<void> {
  if (!supabase) return;
  await supabase.from("push_subscriptions").upsert({
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))),
    auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,endpoint" });
}

async function deletePushSubscription(userId: string, endpoint: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("push_subscriptions").delete()
    .eq("user_id", userId).eq("endpoint", endpoint);
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
    isLoading: false,
  });

  const vapidKey =
    readPublicEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY") ??
    readPublicEnv("VITE_VAPID_PUBLIC_KEY");
  const pushFunctionsBaseUrl = runtimeEnv.supabaseUrl;
  const isPushConfigured = Boolean(vapidKey && pushFunctionsBaseUrl);

  useEffect(() => {
    const browserSupportsPush =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    const supported = browserSupportsPush && isPushConfigured;
    const perm = supported ? (Notification.permission as PushPermission) : "unsupported";
    setState((prev) => ({ ...prev, isSupported: supported, permission: perm }));

    if (browserSupportsPush && !isPushConfigured && runtimeEnv.isDev) {
      console.warn("[push] Push notifications disabled: missing VAPID public key or Supabase URL.");
    }

    if (!supported) return;

    // Check existing subscription
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setState((prev) => ({ ...prev, isSubscribed: Boolean(sub) }));
      });
    });
  }, [isPushConfigured]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !vapidKey) return false;

    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission: permission as PushPermission }));

      if (permission !== "granted") {
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });

      // Save to Supabase
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) await savePushSubscription(session.user.id, sub);
      }

      // Trigger first alert generation
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        await fetch(`${pushFunctionsBaseUrl}/functions/v1/generate-behavioral-alerts`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
      } catch (_) { /* non-critical */ }

      setState((prev) => ({ ...prev, isSubscribed: true, isLoading: false }));
      return true;
    } catch (err) {
      console.error("[push] subscribe error:", err);
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.isSupported, vapidKey, pushFunctionsBaseUrl]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) await deletePushSubscription(session.user.id, sub.endpoint);
        }
        await sub.unsubscribe();
      }
      setState((prev) => ({ ...prev, isSubscribed: false, isLoading: false }));
    } catch (err) {
      console.error("[push] unsubscribe error:", err);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  return { ...state, subscribe, unsubscribe };
}
