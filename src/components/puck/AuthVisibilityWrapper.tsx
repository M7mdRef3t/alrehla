import React from "react";
import { useAuth } from "../../hooks/useAuth";

type VisibilityMode = "all" | "guests" | "users";

interface AuthVisibilityWrapperProps {
  visibility: VisibilityMode;
  children: React.ReactNode;
}

export function AuthVisibilityWrapper({ visibility, children }: AuthVisibilityWrapperProps) {
  const { user, loading } = useAuth();

  // If editor is active, we should generally always render the content so the admin can edit it.
  // We can determine if we are in the editor by checking window.location inside a useEffect or just loosely checking.
  // For safety and SSR, we'll try to check typeof window
  const isBrowser = typeof window !== "undefined";
  const isEditor = isBrowser && window.location.pathname.includes("/editor");

  if (isEditor) {
    // In Editor, always render but perhaps add a slight visual indicator if we want.
    // For now, just render so it doesn't break drag and drop.
    return <>{children}</>;
  }

  // Handle visibility logic for the live landing page
  if (loading) {
    return null; // Avoid flashing content while checking auth
  }

  if (visibility === "guests" && user) {
    return null;
  }

  if (visibility === "users" && !user) {
    return null;
  }

  // "all" or specific conditions met
  return <>{children}</>;
}
