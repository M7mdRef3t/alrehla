'use client';

import { useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { consciousnessTheme } from '@/ai/consciousnessThemeEngine';
import { useThemeState } from '@/domains/consciousness/store/theme.store';
import { injectWhisper } from '@/components/ui/WhisperOverlay';
import { triggerHapticIntervention } from '@/components/providers/sensoryHaptics';

export function SovereignReceiver() {
  useEffect(() => {
    // 1. Subscribe to the global 'sovereign_control' channel
    // In a prod environment, this should be scoped: e.g., `sovereign_control_${clientId}`
    if (!supabase) return;
    const channel = supabase.channel('sovereign_control');
    let isSubscribed = false;

    channel
      .on('broadcast', { event: 'OVERRIDE' }, (payload) => {
        const cmd = payload.payload;

        if (cmd.type === 'FORCE_STATE') {
          // Send direct state application to Theme Engine
          // generate a synthetic theme ignoring local emotion
          const fakeTheme = consciousnessTheme.generateTheme({
            emotionalState: cmd.state,
            timeOfDay: 'afternoon',
            sessionDuration: 30,
            preferredMode: 'auto'
          });
          consciousnessTheme.applyTheme(fakeTheme, { smooth: true });
          
          // Also explicitly update the Atmoshere Engine custom tokens
          useThemeState.getState().updateTokens({
            vignetteStrength: parseFloat(fakeTheme.cssVariables["--atmosphere-vignette"] || "0.1"),
            grainOpacity: parseFloat(fakeTheme.cssVariables["--atmosphere-grain"] || "0.05"),
            chromaticAberration: parseFloat(fakeTheme.cssVariables["--atmosphere-aberration"] || "0")
          });
        } else if (cmd.type === 'INJECT_WHISPER') {
          injectWhisper(cmd.text);
        } else if (cmd.type === 'TRIGGER_HAPTIC') {
          triggerHapticIntervention(cmd.severity || 'crisis');
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') isSubscribed = true;
      });

    return () => {
      // Cleanup on unmount, but only if we actually joined to prevent WS warnings
      if (isSubscribed) {
        supabase?.removeChannel(channel);
      }
    };
  }, []);

  return null;
}
