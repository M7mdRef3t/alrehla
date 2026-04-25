"use client";

/* eslint-disable no-console */
import { useEffect } from "react";
import { useGamification } from "@/domains/gamification";

/**
 * SovereignThemeSync
 * 
 * المكون المسؤول عن ربط الثيم "السِيادي" (المشترى من المتجر) 
 * مع واجهة التطبيق عبر حقن attributes في الـ HTML.
 */
export function CommandThemeSync() {
  const { activeThemeId } = useGamification();

  useEffect(() => {
    if (!activeThemeId) {
       document.documentElement.removeAttribute("data-command-theme");
       return;
    }

    // Apply the theme attribute
    document.documentElement.setAttribute("data-command-theme", activeThemeId);
    
    // Log for debug (Command Context)
    console.log(`[Command OS] Theme Injected: ${activeThemeId}`);

    // Optional: Trigger a custom event for other engines (like Atmosphere)
    window.dispatchEvent(new CustomEvent("command-theme-changed", { 
      detail: { themeId: activeThemeId } 
    }));

  }, [activeThemeId]);

  return null;
}
