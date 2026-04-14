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
export function SovereignThemeSync() {
  const { activeThemeId } = useGamification();

  useEffect(() => {
    if (!activeThemeId) {
       document.documentElement.removeAttribute("data-sovereign-theme");
       return;
    }

    // Apply the theme attribute
    document.documentElement.setAttribute("data-sovereign-theme", activeThemeId);
    
    // Log for debug (Sovereign Context)
    console.log(`[Sovereign OS] Theme Injected: ${activeThemeId}`);

    // Optional: Trigger a custom event for other engines (like Atmosphere)
    window.dispatchEvent(new CustomEvent("sovereign-theme-changed", { 
      detail: { themeId: activeThemeId } 
    }));

  }, [activeThemeId]);

  return null;
}
