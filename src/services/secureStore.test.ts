import { describe, it, expect, beforeEach } from "vitest";
import { getItem, setItem, getJSON, setJSON, clearLocalData } from "@/services/secureStore";

describe("secureStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("encrypts and decrypts sensitive keys", async () => {
    const key = "dawayir-me";
    const value = JSON.stringify({ battery: "okay" });
    await setItem(key, value);

    const stored = window.localStorage.getItem(key);
    expect(stored).toBeTruthy();
    expect(stored?.startsWith("v1:")).toBe(true);

    const read = await getItem(key);
    expect(read).toBe(value);
  });

  it("migrates plaintext values to encrypted format", async () => {
    const key = "dawayir-journey";
    const plain = JSON.stringify({ currentStepId: "baseline" });
    window.localStorage.setItem(key, plain);

    const read = await getItem(key);
    expect(read).toBe(plain);

    const stored = window.localStorage.getItem(key);
    expect(stored?.startsWith("v1:")).toBe(true);
  });

  it("roundtrips JSON helpers", async () => {
    const key = "dawayir-notification-settings";
    const value = { enabled: true };
    await setJSON(key, value);

    const read = await getJSON<typeof value>(key);
    expect(read).toEqual(value);
  });

  it("clears dawayir keys only", async () => {
    await setItem("dawayir-me", "x");
    window.localStorage.setItem("other-key", "y");

    clearLocalData();

    expect(window.localStorage.getItem("dawayir-me")).toBeNull();
    expect(window.localStorage.getItem("other-key")).toBe("y");
  });
});
