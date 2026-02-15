function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getStorage(kind: "local" | "session"): Storage | null {
  if (!isBrowser()) return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function getFromLocalStorage(key: string): string | null {
  return getStorage("local")?.getItem(key) ?? null;
}

export function setInLocalStorage(key: string, value: string): void {
  getStorage("local")?.setItem(key, value);
}

export function removeFromLocalStorage(key: string): void {
  getStorage("local")?.removeItem(key);
}

export function clearLocalStorage(): void {
  getStorage("local")?.clear();
}

export function getLocalStorageLength(): number {
  return getStorage("local")?.length ?? 0;
}

export function getLocalStorageKey(index: number): string | null {
  return getStorage("local")?.key(index) ?? null;
}

export function getFromSessionStorage(key: string): string | null {
  return getStorage("session")?.getItem(key) ?? null;
}

export function setInSessionStorage(key: string, value: string): void {
  getStorage("session")?.setItem(key, value);
}

export function removeFromSessionStorage(key: string): void {
  getStorage("session")?.removeItem(key);
}
