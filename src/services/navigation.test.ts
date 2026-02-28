import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getPathname,
  getSearch,
  getHash,
  getHref,
  getOrigin,
  createCurrentUrl,
  isAdminPath,
  isAnalyticsPath,
  pushUrl,
  replaceUrl,
  subscribePopstate,
  assignUrl,
  reloadPage,
} from "./navigation";

describe("navigation", () => {
  let originalWindow: typeof window | undefined;

  beforeEach(() => {
    // Keep a reference to the original window object if we need it
    originalWindow = global.window;
  });

  afterEach(() => {
    // Restore the window object and vi mocks after each test
    vi.restoreAllMocks();
  });

  describe("when window is defined", () => {
    beforeEach(() => {
      // Setup default mock location
      Object.defineProperty(window, "location", {
        writable: true,
        value: {
          pathname: "/test-path",
          search: "?q=test",
          hash: "#section-1",
          href: "http://localhost:3000/test-path?q=test#section-1",
          origin: "http://localhost:3000",
          assign: vi.fn(),
          reload: vi.fn(),
        },
      });

      // Setup default mock history
      Object.defineProperty(window, "history", {
        writable: true,
        value: {
          pushState: vi.fn(),
          replaceState: vi.fn(),
          state: { foo: "bar" },
        },
      });

      // Spy on dispatchEvent and addEventListener
      vi.spyOn(window, "dispatchEvent").mockImplementation(() => true);
      vi.spyOn(window, "addEventListener").mockImplementation(() => {});
      vi.spyOn(window, "removeEventListener").mockImplementation(() => {});
    });

    it("getPathname returns the current pathname", () => {
      expect(getPathname()).toBe("/test-path");
    });

    it("getSearch returns the current search string", () => {
      expect(getSearch()).toBe("?q=test");
    });

    it("getHash returns the current hash", () => {
      expect(getHash()).toBe("#section-1");
    });

    it("getHref returns the current href", () => {
      expect(getHref()).toBe("http://localhost:3000/test-path?q=test#section-1");
    });

    it("getOrigin returns the current origin", () => {
      expect(getOrigin()).toBe("http://localhost:3000");
    });

    it("createCurrentUrl returns a valid URL object", () => {
      const url = createCurrentUrl();
      expect(url).toBeInstanceOf(URL);
      expect(url?.pathname).toBe("/test-path");
      expect(url?.search).toBe("?q=test");
    });

    it("createCurrentUrl returns null for invalid URL strings", () => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: { href: "invalid-url-that-cannot-be-parsed" },
      });
      expect(createCurrentUrl()).toBeNull();
    });

    it("isAdminPath returns true if pathname starts with /admin", () => {
      expect(isAdminPath("/admin/dashboard")).toBe(true);
      expect(isAdminPath("/admin")).toBe(true);
      expect(isAdminPath("/user")).toBe(false);

      // Default to getPathname()
      Object.defineProperty(window, "location", {
        writable: true,
        value: { pathname: "/admin/settings" },
      });
      expect(isAdminPath()).toBe(true);
    });

    it("isAnalyticsPath returns true if pathname is exactly /analytics", () => {
      expect(isAnalyticsPath("/analytics")).toBe(true);
      expect(isAnalyticsPath("/analytics/dashboard")).toBe(false);

      // Default to getPathname()
      Object.defineProperty(window, "location", {
        writable: true,
        value: { pathname: "/analytics" },
      });
      expect(isAnalyticsPath()).toBe(true);
    });

    it("pushUrl updates history and dispatches event", () => {
      pushUrl("/new-path", { data: 123 });

      expect(window.history.pushState).toHaveBeenCalledWith({ data: 123 }, "", "/new-path");
      expect(window.dispatchEvent).toHaveBeenCalledTimes(1);

      const eventArg = vi.mocked(window.dispatchEvent).mock.calls[0][0] as PopStateEvent;
      expect(eventArg.type).toBe("popstate");
      expect(eventArg.state).toEqual({ data: 123 });
    });

    it("replaceUrl updates history with provided state", () => {
      replaceUrl("/replace-path", { updated: true });
      expect(window.history.replaceState).toHaveBeenCalledWith({ updated: true }, "", "/replace-path");
    });

    it("replaceUrl falls back to current history state if state is undefined", () => {
      replaceUrl("/replace-path");
      expect(window.history.replaceState).toHaveBeenCalledWith({ foo: "bar" }, "", "/replace-path");
    });

    it("subscribePopstate adds an event listener and returns an unsubscribe function", () => {
      const handler = vi.fn();
      const unsubscribe = subscribePopstate(handler);

      expect(window.addEventListener).toHaveBeenCalledWith("popstate", handler);

      unsubscribe();
      expect(window.removeEventListener).toHaveBeenCalledWith("popstate", handler);
    });

    it("assignUrl calls window.location.assign", () => {
      assignUrl("http://example.com");
      expect(window.location.assign).toHaveBeenCalledWith("http://example.com");
    });

    it("reloadPage calls window.location.reload", () => {
      reloadPage();
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe("when window is undefined", () => {
    let windowSpy: any;

    beforeEach(() => {
      // The best way to mock typeof window === "undefined" in vitest (jsdom)
      // without breaking other tests is to temporarily redefine window as undefined
      windowSpy = vi.spyOn(global, "window", "get").mockReturnValue(undefined as any);
    });

    afterEach(() => {
      windowSpy.mockRestore();
    });

    it("getPathname returns empty string", () => {
      expect(getPathname()).toBe("");
    });

    it("getSearch returns empty string", () => {
      expect(getSearch()).toBe("");
    });

    it("getHash returns empty string", () => {
      expect(getHash()).toBe("");
    });

    it("getHref returns empty string", () => {
      expect(getHref()).toBe("");
    });

    it("getOrigin returns empty string", () => {
      expect(getOrigin()).toBe("");
    });

    it("createCurrentUrl returns null", () => {
      expect(createCurrentUrl()).toBeNull();
    });

    it("pushUrl does nothing", () => {
      expect(() => pushUrl("/path")).not.toThrow();
    });

    it("replaceUrl does nothing", () => {
      expect(() => replaceUrl("/path")).not.toThrow();
    });

    it("subscribePopstate returns a no-op function", () => {
      const unsubscribe = subscribePopstate(vi.fn());
      expect(typeof unsubscribe).toBe("function");
      expect(() => unsubscribe()).not.toThrow();
    });

    it("assignUrl does nothing", () => {
      expect(() => assignUrl("http://example.com")).not.toThrow();
    });

    it("reloadPage does nothing", () => {
      expect(() => reloadPage()).not.toThrow();
    });
  });
});
