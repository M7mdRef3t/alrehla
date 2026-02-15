export function isClientRuntime(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function getWindowOrNull(): Window | null {
  return typeof window !== "undefined" ? window : null;
}

export function getDocumentOrNull(): Document | null {
  return typeof document !== "undefined" ? document : null;
}
