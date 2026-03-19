"use client";

import { useCallback } from "react";
import { ClientAppShell } from "./client-app-shell";
import { captureUtmFromCurrentUrl } from "../src/services/marketingAttribution";
import { recordFlowEvent } from "../src/services/journeyTracking";

export default function ClientApp() {
  const handleBeforeInit = useCallback(() => {
    const utm = captureUtmFromCurrentUrl();
    if (utm) {
      recordFlowEvent("utm_captured", { meta: utm });
    }
  }, []);

  return <ClientAppShell onBeforeInit={handleBeforeInit} />;
}
