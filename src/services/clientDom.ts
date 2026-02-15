import { getDocumentOrNull, getWindowOrNull } from "./clientRuntime";

type AudioContextConstructor = typeof AudioContext;

export function getAudioContextConstructor(): AudioContextConstructor | null {
  const windowRef = getWindowOrNull();
  if (!windowRef) return null;
  const withAudio = windowRef as Window & {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return withAudio.AudioContext ?? withAudio.webkitAudioContext ?? null;
}

export function downloadBlobFile(blob: Blob, filename: string): void {
  const documentRef = getDocumentOrNull();
  if (!documentRef) return;
  const url = URL.createObjectURL(blob);
  const anchor = documentRef.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  documentRef.body.appendChild(anchor);
  anchor.click();
  documentRef.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function getDocumentVisibilityState(): DocumentVisibilityState | null {
  return getDocumentOrNull()?.visibilityState ?? null;
}

export function openInNewTab(url: string): void {
  const windowRef = getWindowOrNull();
  if (!windowRef) return;
  windowRef.open(url, "_blank", "noopener,noreferrer");
}

export function openMailto(address: string): void {
  openInNewTab(`mailto:${address}`);
}

export function setDocumentBodyOverflow(nextOverflow: string): (() => void) | null {
  const documentRef = getDocumentOrNull();
  if (!documentRef) return null;
  const previous = documentRef.body.style.overflow;
  documentRef.body.style.overflow = nextOverflow;
  return () => {
    documentRef.body.style.overflow = previous;
  };
}
