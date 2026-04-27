"use client";

import ClientAppEntry from "../client-app-entry";
import { useEffect } from "react";

/**
 * /map — Direct entry into the Relationship Map.
 * Instead of redirecting to /app, we render the app shell directly here
 * so the URL remains /map in the browser.
 */
export default function MapPage() {
  useEffect(() => {
    // We still set this so if the user refreshes, the shell knows to stay on map
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("dawayir-app-boot-action", "navigate:map");
    }
  }, []);

  return <ClientAppEntry />;
}
