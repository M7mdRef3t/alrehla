"use client";

import { ClientAppShell } from "./client-app-shell";

export default function ClientAppEntry({ puckData }: { puckData?: any }) {
  return <ClientAppShell puckData={puckData} />;
}
