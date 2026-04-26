"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /map — Direct deep-link into the Dawayir Relationship Map screen.
 * Sets the boot action in sessionStorage then redirects to /app.
 * This lets users bookmark or share a direct link to the map.
 */
export default function MapDeepLinkPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Set the boot action so AppExperienceShell opens the map screen directly
      window.sessionStorage.setItem("dawayir-app-boot-action", "navigate:map");
    }
    router.replace("/app");
  }, [router]);

  // Minimal loading state while redirecting
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#030712",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "3px solid rgba(45, 212, 191, 0.2)",
          borderTopColor: "rgba(45, 212, 191, 0.9)",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
