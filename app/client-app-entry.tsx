"use client";

import type { Data } from "@measured/puck";
import { ClientAppShell } from "./client-app-shell";

export default function ClientAppEntry({
  puckData,
  forceLanding = false,
}: {
  puckData?: Data | null;
  forceLanding?: boolean;
}) {
  return <ClientAppShell puckData={puckData} forceLanding={forceLanding} />;
}
