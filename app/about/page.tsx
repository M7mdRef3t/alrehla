"use client";
import { useRouter } from "next/navigation";
import { AboutScreen } from "@/modules/growth/AboutScreen";
import { PlatformFooter } from "@/modules/meta/PlatformFooter";

export default function AboutPage() {
  const router = useRouter();
  return (
    <main style={{ minHeight: "100vh", background: "var(--space-void, #0a0d18)", display: "flex", flexDirection: "column" }}>
      <AboutScreen
        onBack={() => router.push("/")}
        onStart={() => router.push("/onboarding")}
      />
      <PlatformFooter />
    </main>
  );
}
