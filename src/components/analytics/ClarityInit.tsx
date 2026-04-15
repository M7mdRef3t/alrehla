"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";
import { runtimeEnv } from "@/config/runtimeEnv";
import { isUserMode } from "@/config/appEnv";

export default function ClarityInit() {
  useEffect(() => {
    const projectId = runtimeEnv.clarityProjectId;
    
    // P0: Only initialize if we have a project ID and we are in User Mode (production)
    // This prevents noise in development sessions unless explicitly desired.
    if (projectId && (isUserMode || runtimeEnv.isDev)) {
      if (typeof window !== "undefined") {
        Clarity.init(projectId);
      }
    }
  }, []);

  return null;
}
