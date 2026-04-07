"use client";
import { useRouter } from "next/navigation";
import { StoriesScreen } from "@/modules/growth/StoriesScreen";
import { PlatformFooter } from "@/modules/meta/PlatformFooter";

export default function StoriesPage() {
  const router = useRouter();
  return (
    <main style={{ minHeight: "100vh", background: "var(--space-void, #0a0d18)", display: "flex", flexDirection: "column" }}>
      <StoriesScreen onBack={() => router.push("/")} />
      <PlatformFooter />
    </main>
  );
}
