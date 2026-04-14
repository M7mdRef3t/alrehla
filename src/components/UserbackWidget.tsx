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
    if (!token) {
      if (runtimeEnv.isDev) {
        console.warn('[Userback] Access token is missing. Feedback widget will not be initialized.');
      }
      return;
    }

    async function initUserback() {
      try {
        const result = Userback(token as string, {
          autohide: false,
          on_load: () => {
            if (runtimeEnv.isDev) console.log('[Userback] Widget loaded successfully.');
          }
        });

        if (result && typeof (result as Promise<unknown>).catch === 'function') {
          await result;
        }
      } catch (error) {
        console.error('[Userback] Failed to initialize feedback widget.', error);
      }
    }

    initUserback();

    return () => {
      // Userback widget doesn't have a standard `destroy` API.
      // Let it remain at the app root, or call a hide method here once available.
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
