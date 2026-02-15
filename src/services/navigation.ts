export function getPathname(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname;
}

export function getSearch(): string {
  if (typeof window === "undefined") return "";
  return window.location.search;
}

export function getHash(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash;
}

export function getHref(): string {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

export function getOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function createCurrentUrl(): URL | null {
  const href = getHref();
  if (!href) return null;
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

export function isAdminPath(pathname = getPathname()): boolean {
  return pathname.startsWith("/admin");
}

export function isAnalyticsPath(pathname = getPathname()): boolean {
  return pathname === "/analytics";
}

export function pushUrl(url: string | URL, state: unknown = {}): void {
  if (typeof window === "undefined") return;
  window.history.pushState(state, "", url.toString());
  window.dispatchEvent(new PopStateEvent("popstate", { state }));
}

export function replaceUrl(url: string | URL, state?: unknown): void {
  if (typeof window === "undefined") return;
  const nextState = state === undefined ? window.history.state : state;
  window.history.replaceState(nextState, "", url.toString());
}

export function subscribePopstate(handler: (event: PopStateEvent) => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", handler as EventListener);
  return () => window.removeEventListener("popstate", handler as EventListener);
}

export function assignUrl(url: string): void {
  if (typeof window === "undefined") return;
  window.location.assign(url);
}

export function reloadPage(): void {
  if (typeof window === "undefined") return;
  window.location.reload();
}
