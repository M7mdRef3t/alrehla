import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { queueRemoteSet } from "./cloudStore";
import { sendJsonWithResilience } from "../architecture/resilientHttp";

vi.mock("../config/runtimeEnv", () => ({
  runtimeEnv: {
    adminApiBase: "http://localhost:3000",
    isDev: false
  }
}));

vi.mock("../architecture/resilientHttp", () => ({
  sendJsonWithResilience: vi.fn(),
  fetchJsonWithResilience: vi.fn()
}));

vi.mock("../state/authState", () => ({
  getAuthToken: vi.fn(() => "fake-token")
}));

vi.mock("./browserStorage", () => ({
  getFromLocalStorage: vi.fn(() => "fake-device-token"),
  setInLocalStorage: vi.fn()
}));

const originalWindow = globalThis.window;

describe("cloudStore - queueRemoteSet", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    Object.defineProperty(globalThis, "window", {
      value: {
        location: { origin: "http://localhost:3000" },
        crypto: { randomUUID: () => "mock-uuid" }
      },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        writable: true,
        configurable: true
      });
    } else {
      // @ts-expect-error test cleanup
      delete globalThis.window;
    }
  });

  it("should queue a remote set and eventually flush", async () => {
    vi.mocked(sendJsonWithResilience).mockResolvedValue(true);

    queueRemoteSet("dawayir-test-key", "test-value");

    await vi.runAllTimersAsync();

    expect(sendJsonWithResilience).toHaveBeenCalledTimes(1);
    expect(sendJsonWithResilience).toHaveBeenCalledWith(
      "http://localhost:3000/api/user/state",
      { data: { "dawayir-test-key": "test-value" } },
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("should debounce multiple rapid calls to queueRemoteSet", async () => {
    vi.mocked(sendJsonWithResilience).mockResolvedValue(true);

    queueRemoteSet("dawayir-key-1", "value-1");
    queueRemoteSet("dawayir-key-2", "value-2");

    await vi.advanceTimersByTimeAsync(100);

    queueRemoteSet("dawayir-key-3", "value-3");

    await vi.runAllTimersAsync();

    expect(sendJsonWithResilience).toHaveBeenCalledTimes(1);
    expect(sendJsonWithResilience).toHaveBeenCalledWith(
      "http://localhost:3000/api/user/state",
      { data: {
        "dawayir-key-1": "value-1",
        "dawayir-key-2": "value-2",
        "dawayir-key-3": "value-3",
      } },
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("should ignore keys that do not start with 'dawayir-'", async () => {
    queueRemoteSet("other-key", "value");

    await vi.runAllTimersAsync();

    expect(sendJsonWithResilience).not.toHaveBeenCalled();
  });

  it("should ignore keys that are in the excluded list", async () => {
    queueRemoteSet("dawayir-session-id", "value");
    queueRemoteSet("dawayir-theme", "dark");
    queueRemoteSet("dawayir-admin-state", "enabled");
    queueRemoteSet("dawayir-tracking-mode", "strict");
    queueRemoteSet("dawayir-tracking-api-url", "http://example.com");

    await vi.runAllTimersAsync();

    expect(sendJsonWithResilience).not.toHaveBeenCalled();
  });
});

describe("cloudStore - disabled sync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should ignore queueRemoteSet when runtimeEnv.adminApiBase is not provided", async () => {
    vi.resetModules();

    vi.doMock("../config/runtimeEnv", () => ({
      runtimeEnv: {
        adminApiBase: "",
        isDev: false
      }
    }));

    const { queueRemoteSet } = await import("./cloudStore");
    const { sendJsonWithResilience } = await import("../architecture/resilientHttp");

    queueRemoteSet("dawayir-test-key", "test-value");

    await vi.runAllTimersAsync();

    expect(sendJsonWithResilience).not.toHaveBeenCalled();
  });
});
