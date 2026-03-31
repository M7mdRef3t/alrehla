import type { FC } from "react";
import { ExecutiveDashboard } from "../Executive/ExecutiveDashboard";

/**
 * Analytics route shell.
 * Keeps backwards compatibility with legacy lazy import path used in AppShellRouteGate.
 */
export const OverviewPanel: FC = () => {
  return <ExecutiveDashboard />;
};

