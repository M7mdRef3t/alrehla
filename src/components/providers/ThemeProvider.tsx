"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { useThemeState } from "@/domains/consciousness/store/theme.store";

function ThemeSync() {
  const { setTheme } = useTheme();
  const resolvedStateTheme = useThemeState((s) => s.resolvedTheme);

  // One-way sync: Zustand store → next-themes
  // When resolvedTheme changes in our Zustand store, push to next-themes
  React.useEffect(() => {
    setTheme(resolvedStateTheme);
  }, [resolvedStateTheme, setTheme]);

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
