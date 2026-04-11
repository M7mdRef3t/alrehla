"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { useThemeState } from "@/domains/consciousness/store/theme.store";

function ThemeSync() {
  const { setTheme } = useTheme();
  const resolvedStateTheme = useThemeState((s) => s.resolvedTheme);

  // Sync from our OS State (`useThemeState`) to `next-themes`
  React.useEffect(() => {
    setTheme(resolvedStateTheme);
  }, [resolvedStateTheme, setTheme]);

  // Sync from custom events (if consciousness engine overrides)
  React.useEffect(() => {
    const handleConsciousnessThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isDark: boolean }>;
      const isDark = customEvent.detail.isDark;
      setTheme(isDark ? "dark" : "light");
      useThemeState.getState().setTheme(isDark ? "dark" : "light");
    };

    window.addEventListener("consciousness-theme-changed", handleConsciousnessThemeChange);
    return () => {
      window.removeEventListener("consciousness-theme-changed", handleConsciousnessThemeChange);
    };
  }, [setTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}
