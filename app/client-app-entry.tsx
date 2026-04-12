"use client";

import type { Data } from "@measured/puck";
import { ClientAppShell } from "./client-app-shell";

export default function ClientAppEntry({ puckData }: { puckData?: Data | null }) {
  return <ClientAppShell puckData={puckData} />;
}
