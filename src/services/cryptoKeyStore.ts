const DB_NAME = "dawayir-crypto";
const STORE_NAME = "keys";
const KEY_ID = "device-key";
const LEGACY_LOCAL_KEY = "dawayir-crypto-key";

let cachedKey: CryptoKey | null = null;

function hasWebCrypto(): boolean {
  return typeof window !== "undefined" && !!window.crypto?.subtle;
}

function hasIndexedDB(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function getStoredKeyJwk(): Promise<JsonWebKey | null> {
  if (!hasIndexedDB()) return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(KEY_ID);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve((req.result as JsonWebKey | undefined) ?? null);
  });
}

async function storeKeyJwk(jwk: JsonWebKey): Promise<void> {
  if (!hasIndexedDB()) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(jwk, KEY_ID);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

async function loadLegacyKey(): Promise<CryptoKey | null> {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LEGACY_LOCAL_KEY);
  if (!raw) return null;
  try {
    const jwk = JSON.parse(raw) as JsonWebKey;
    const key = await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
    return key;
  } catch {
    return null;
  }
}

async function storeLegacyKey(jwk: JsonWebKey): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEGACY_LOCAL_KEY, JSON.stringify(jwk));
  } catch {
    // Ignore storage errors
  }
}

export async function getOrCreateDeviceKey(): Promise<CryptoKey | null> {
  if (cachedKey) return cachedKey;
  if (!hasWebCrypto()) return null;

  try {
    if (hasIndexedDB()) {
      const storedJwk = await getStoredKeyJwk();
      if (storedJwk) {
        cachedKey = await window.crypto.subtle.importKey(
          "jwk",
          storedJwk,
          { name: "AES-GCM" },
          true,
          ["encrypt", "decrypt"]
        );
        return cachedKey;
      }
    }

    const legacyKey = await loadLegacyKey();
    if (legacyKey) {
      cachedKey = legacyKey;
      if (hasIndexedDB()) {
        const jwk = await window.crypto.subtle.exportKey("jwk", legacyKey);
        await storeKeyJwk(jwk);
      }
      return cachedKey;
    }

    const key = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    cachedKey = key;
    const jwk = await window.crypto.subtle.exportKey("jwk", key);
    if (hasIndexedDB()) {
      await storeKeyJwk(jwk);
    } else {
      await storeLegacyKey(jwk);
    }
    return cachedKey;
  } catch {
    return null;
  }
}

