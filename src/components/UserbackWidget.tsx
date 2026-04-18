'use client';

/* eslint-disable no-console */
import { useEffect } from 'react';
import Userback from '@userback/widget';
import { runtimeEnv } from '@/config/runtimeEnv';
import { useAuthState } from '@/domains/auth/store/auth.store';

/**
 * UserbackWidget
 * -----------------
 * المكون المسئول عن تشغيل أداة Userback لأخذ سكرين شوت وتقديم الملاحظات.
 * بيقوم بتعريف المستخدم تلقائياً لو مسجل دخول عشان نعرف مين اللى باعت الملاحظة.
 */
export function UserbackWidget() {
  const token = runtimeEnv.userbackToken;
  const { user, displayName, status } = useAuthState();

  useEffect(() => {
    // لو مفيش token أو بيئة dev والتوكن مش production — لا تشغل الـ Widget
    if (!token) return;

    // في بيئة الـ localhost، الـ Userback بيرجع server error عادي
    // نشغله بس في Production لتجنب الضجيج في الـ console
    if (runtimeEnv.isDev) return;

    async function initUserback() {
      try {
        const result = Userback(token as string, {
          autohide: false,
          on_load: () => {
            console.log('[Userback] Widget loaded successfully.');
          }
        });

        if (result && typeof (result as Promise<unknown>).catch === 'function') {
          await result;
        }
      } catch {
        // Silently ignore — Userback fails on localhost by design (traffic permission)
      }
    }

    void initUserback();

    return () => {
      // No destroy API available for Userback
    };
  }, [token]);

  // Identify the user whenever auth state changes
  useEffect(() => {
    if (status === 'ready' && user && token) {
      Userback(token)
        .then((instance) => {
          instance.identify(user.id, {
            email: user.email || '',
            name: displayName || 'Traveler',
            tier: useAuthState.getState().tier,
            role: useAuthState.getState().role
          });
        })
        .catch((error) => {
          console.error('[Userback] Failed to identify user.', error);
        });
    }
  }, [user, displayName, status, token]);

  return null; // Side-effect only component
}
