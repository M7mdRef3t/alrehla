type Handler<T = unknown> = (payload: T) => void | Promise<void>;

const handlers = new Map<string, Handler>();

export const inngestMock = {
  on<T = unknown>(event: string, handler: Handler<T>) {
    handlers.set(event, handler as Handler);
  },
  async send<T = unknown>(event: string, payload: T) {
    const handler = handlers.get(event);
    if (!handler) return;
    await handler(payload);
  },
};

