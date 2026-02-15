import { getOrCreateDeviceKey } from "./cryptoKeyStore";
import { getRemoteValue, queueRemoteSet } from "./cloudStore";
import {
  getFromLocalStorage,
  getLocalStorageKey,
  getLocalStorageLength,
  removeFromLocalStorage,
  setInLocalStorage
} from "./browserStorage";

const ENCRYPTED_PREFIX = "v1:";

const SENSITIVE_KEYS = new Set([
  "dawayir-map-nodes",
  "dawayir-me",
  "dawayir-journey",
  "dawayir-notification-settings",
  "dawayir-last-activity"
]);

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toWebCryptoBuffer(bytes: Uint8Array): Uint8Array {
  // Ensure the typed array is backed by a plain ArrayBuffer for Web Crypto typing.
  return Uint8Array.from(bytes);
}

function isEncryptedValue(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}

async function encryptString(plaintext: string): Promise<string> {
  const key = await getOrCreateDeviceKey();
  if (!key || !window.crypto?.subtle) return plaintext;

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encoded = encoder.encode(plaintext);
  const cipher = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const cipherBytes = new Uint8Array(cipher);
  return `${ENCRYPTED_PREFIX}${toBase64(iv)}:${toBase64(cipherBytes)}`;
}

async function decryptString(value: string): Promise<string> {
  if (!isEncryptedValue(value)) return value;
  const key = await getOrCreateDeviceKey();
  if (!key || !window.crypto?.subtle) return value;

  const parts = value.slice(ENCRYPTED_PREFIX.length).split(":");
  if (parts.length !== 2) return value;
  const iv = toWebCryptoBuffer(fromBase64(parts[0]));
  const data = toWebCryptoBuffer(fromBase64(parts[1]));
  const plainBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    data as unknown as BufferSource
  );
  return new TextDecoder().decode(plainBuffer);
}

export async function getItem(key: string): Promise<string | null> {
  if (!isBrowser()) return null;
  const remote = await getRemoteValue(key);
  if (remote != null) {
    if (!isSensitiveKey(key)) {
      setInLocalStorage(key, remote);
      return remote;
    }

    let plain: string | null = remote;
    if (isEncryptedValue(remote)) {
      try {
        plain = await decryptString(remote);
        queueRemoteSet(key, plain);
      } catch {
        plain = null;
      }
    }

    if (plain) {
      try {
        const encrypted = await encryptString(plain);
        setInLocalStorage(key, encrypted);
      } catch {
        setInLocalStorage(key, plain);
      }
      return plain;
    }
  }
  const raw = getFromLocalStorage(key);
  if (raw == null) return null;
  if (!isSensitiveKey(key)) return raw;

  if (isEncryptedValue(raw)) {
    try {
      return await decryptString(raw);
    } catch {
      return null;
    }
  }

  // Migrate plaintext to encrypted storage
  try {
    const encrypted = await encryptString(raw);
    setInLocalStorage(key, encrypted);
  } catch {
    // Ignore migration errors
  }
  return raw;
}

export async function setItem(key: string, value: string): Promise<void> {
  if (!isBrowser()) return;
  if (!isSensitiveKey(key)) {
    setInLocalStorage(key, value);
    queueRemoteSet(key, value);
    return;
  }
  try {
    const encrypted = await encryptString(value);
    setInLocalStorage(key, encrypted);
    queueRemoteSet(key, value);
  } catch {
    // Ignore storage errors
  }
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await setItem(key, serialized);
  } catch {
    // Ignore serialization/storage errors
  }
}

export function clearLocalData(): void {
  if (!isBrowser()) return;
  const keys: string[] = [];
  for (let i = 0; i < getLocalStorageLength(); i += 1) {
    const key = getLocalStorageKey(i);
    if (key) keys.push(key);
  }
  keys.forEach((key) => {
    if (key.startsWith("dawayir-")) {
      removeFromLocalStorage(key);
    }
  });
}
