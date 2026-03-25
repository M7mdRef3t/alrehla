"use client";
import { useRouter } from "next/navigation";
import { StoriesScreen } from "../../src/components/StoriesScreen";
import { PlatformFooter } from "../../src/components/PlatformFooter";

export default function StoriesPage() {
  const router = useRouter();
  return (
    <main style={{ minHeight: "100vh", background: "var(--space-void, #0a0d18)", display: "flex", flexDirection: "column" }}>
      <StoriesScreen onBack={() => router.push("/")} />
      <PlatformFooter />
    </main>
  );
}
