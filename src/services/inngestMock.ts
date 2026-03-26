/**
 * Mock Inngest Client
 * Simulates event-driven background job processing.
 */

export interface InngestEvent {
  name: string;
  data: unknown;
  user?: string;
  timestamp?: number;
}

type InngestHandler = (data: unknown) => void;

class MockInngest {
  private listeners: Map<string, InngestHandler[]> = new Map();

  async send(event: InngestEvent) {
    console.log(`[Mock Inngest] Sending event: ${event.name}`, event.data);
    
    // Simulate background processing time
    setTimeout(() => {
      this.trigger(event.name, event.data);
    }, 1000);

    return { ids: [Math.random().toString(36).substr(2, 9)] };
  }

  // Helper for mock "functions"
  on(eventName: string, handler: InngestHandler) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)?.push(handler);
  }

  private trigger(eventName: string, data: unknown) {
    console.log(`[Mock Inngest] Background job triggered for: ${eventName}`);
    const handlers = this.listeners.get(eventName) || [];
    handlers.forEach(h => h(data));
  }
}

export const inngestMock = new MockInngest();
