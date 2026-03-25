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

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

interface PushState {
  isSupported: boolean;
  permission: PushPermission;
  isSubscribed: boolean;
  isLoading: boolean;
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

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    const perm = supported ? (Notification.permission as PushPermission) : "unsupported";
    setState((prev) => ({ ...prev, isSupported: supported, permission: perm }));

    if (!supported) return;

    // Check existing subscription
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setState((prev) => ({ ...prev, isSubscribed: Boolean(sub) }));
      });
    });
  }, []);

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
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-behavioral-alerts`, {
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
  }, [state.isSupported, vapidKey]);

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
