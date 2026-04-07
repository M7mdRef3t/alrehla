import { useCallback, useState } from "react";
import type { PublicBroadcast } from "@/services/broadcasts";

export function useAppBroadcastState() {
  const [activeBroadcast, setActiveBroadcast] = useState<PublicBroadcast | null>(null);

  const handlePublicBroadcast = useCallback((broadcast: PublicBroadcast) => {
    setActiveBroadcast(broadcast);
  }, []);

  const dismissActiveBroadcast = useCallback(() => {
    setActiveBroadcast(null);
  }, []);

  return {
    activeBroadcast,
    handlePublicBroadcast,
    dismissActiveBroadcast
  };
}
