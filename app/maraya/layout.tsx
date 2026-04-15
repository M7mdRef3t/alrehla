/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Maraya | Alrehla",
  description:
    "Maraya is an emotional mirror that unfolds as a cinematic storytelling ritual inside Alrehla.",
};

import { runtimeEnv } from "@/config/runtimeEnv";

function isMarayaEnabled() {
  if (runtimeEnv.isDev) {
    return true;
  }

  return runtimeEnv.marayaEnabled === "true";
}

export default function MarayaLayout({ children }: { children: ReactNode }) {
  if (!isMarayaEnabled()) {
    notFound();
  }

  return (
    <div
      className="maraya-route-shell"
      style={{
        minHeight: "100vh",
        background: "#05070d",
        color: "#f5efe2",
      }}
    >
      {children}
    </div>
  );
}
