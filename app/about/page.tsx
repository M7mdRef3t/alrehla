"use client";
import { useRouter } from "next/navigation";
import { AboutScreen } from "../../src/components/AboutScreen";
import { PlatformFooter } from "../../src/components/PlatformFooter";

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
