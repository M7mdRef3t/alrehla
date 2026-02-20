type AppEventMap = {
  "live_data_fetch_started": { key: "metrics" | "testimonials" };
  "live_data_fetch_succeeded": { key: "metrics" | "testimonials"; source: "live" | "fallback" };
  "live_data_fetch_failed": { key: "metrics" | "testimonials"; reason: string };
};

type AppEventKey = keyof AppEventMap;
type Listener<K extends AppEventKey> = (payload: AppEventMap[K]) => void;

class AppEventBus {
  private listeners: Partial<Record<AppEventKey, Set<(payload: unknown) => void>>> = {};

  emit<K extends AppEventKey>(key: K, payload: AppEventMap[K]): void {
    const group = this.listeners[key];
    if (!group) return;
    for (const listener of group) {
      listener(payload as unknown);
    }
  }

  on<K extends AppEventKey>(key: K, listener: Listener<K>): () => void {
    const group = (this.listeners[key] ??= new Set<(payload: unknown) => void>());
    group.add(listener as unknown as (payload: unknown) => void);
    return () => {
      group.delete(listener as unknown as (payload: unknown) => void);
    };
  }
}

export const appEventBus = new AppEventBus();
