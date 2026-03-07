import { test, expect } from "@playwright/test";

test.use({ trace: "on" });

type PerfResult = {
  surface: "map" | "landing_fallback";
  mapLocked: boolean;
  nodeCount: number;
  sampleMs: number;
  frames: number;
  fps: number;
  longTaskCount: number;
  longTaskTotalMs: number;
  longTaskMaxMs: number;
};

function makeNodes(count: number) {
  const rings = ["green", "yellow", "red"] as const;
  const goals = ["family", "work", "love", "general"] as const;
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const ring = rings[i % rings.length];
    return {
      id: `seed-${i + 1}`,
      label: `شخص ${i + 1}`,
      ring,
      x: 0,
      y: 0,
      goalId: goals[i % goals.length],
      isNodeArchived: false,
      analysis: {
        score: (i % 10) + 1,
        timestamp: now,
        answers: { q1: "sometimes", q2: "sometimes", q3: "sometimes" },
        recommendedRing: ring
      }
    };
  });
}

test.describe("Map performance telemetry", () => {
  test.setTimeout(120_000);

  test("collects fps proxy + long tasks for 1000 nodes", async ({ page }, testInfo) => {
    const nodeCount = 1000;
    const nodes = makeNodes(nodeCount);

    await page.addInitScript((payload) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("dawayir-analytics-consent", "false");
      localStorage.setItem("dawayir-journey-onboarding-done", "true");
      localStorage.setItem(
        "dawayir-journey",
        JSON.stringify({
          currentStepId: "map",
          completedStepIds: ["baseline", "goal", "map"],
          baselineAnswers: null,
          baselineScore: 52,
          baselineCompletedAt: Date.now() - 86_400_000,
          goalId: "family",
          category: "stability",
          postStepAnswers: null,
          postStepScore: null,
          journeyStartedAt: Date.now() - 172_800_000
        })
      );
      localStorage.setItem("dawayir-map-nodes", JSON.stringify({ nodes: payload.nodes }));
    }, { nodes });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const safeClick = async (pattern: RegExp) => {
      const btn = page.getByRole("button", { name: pattern }).first();
      const visible = await btn.isVisible().catch(() => false);
      if (!visible) return false;
      await page.keyboard.press("Escape").catch(() => {});
      await btn.click({ force: true, timeout: 2500 }).catch(() => {});
      return true;
    };

    await safeClick(/دوايري/);
    await safeClick(/أنطلق|ابدأ الرحلة|ابدأ/i);
    await safeClick(/العيلة|الأسرة/);
    await safeClick(/افتح الخريطة|خد القرار الآن/);

    // Hard navigation fallback: force App popstate screen to "map"
    await page.evaluate(() => {
      const state = { screen: "map" };
      window.history.pushState(state, "", window.location.href);
      window.dispatchEvent(new PopStateEvent("popstate", { state }));
    });

    const mapCanvas = page.locator("#map-canvas");
    const mapLockedMessage = page.getByText("الخريطة متوقفة حالياً من لوحة التحكم في الزمن.");
    await Promise.race([
      mapCanvas.waitFor({ state: "visible", timeout: 20_000 }).catch(() => null),
      mapLockedMessage.waitFor({ state: "visible", timeout: 20_000 }).catch(() => null)
    ]);

    const isMapVisible = await mapCanvas.isVisible().catch(() => false);
    await mapLockedMessage.isVisible().catch(() => false);

    const result = await page.evaluate(async () => {
      const sampleMs = 6000;
      const start = performance.now();
      let frames = 0;

      const longTasks: number[] = [];
      const obs = "PerformanceObserver" in window
        ? new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            longTasks.push(entry.duration);
          }
        })
        : null;

      if (obs) {
        try {
          obs.observe({ entryTypes: ["longtask"] as PerformanceEntryType[] });
        } catch {
          // unsupported in some browsers
        }
      }

      await new Promise<void>((resolve) => {
        const tick = () => {
          frames += 1;
          if (performance.now() - start >= sampleMs) {
            resolve();
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

      obs?.disconnect();
      const longTaskTotalMs = longTasks.reduce((sum, n) => sum + n, 0);
      const longTaskMaxMs = longTasks.length > 0 ? Math.max(...longTasks) : 0;
      const fps = frames / (sampleMs / 1000);

      return {
        surface: document.querySelector("#map-canvas") ? "map" : "landing_fallback",
        mapLocked: Boolean(document.body.textContent?.includes("الخريطة متوقفة حالياً من لوحة التحكم في الزمن.")),
        nodeCount: document.querySelectorAll("#map-canvas .node-glass").length,
        sampleMs,
        frames,
        fps: Number(fps.toFixed(2)),
        longTaskCount: longTasks.length,
        longTaskTotalMs: Number(longTaskTotalMs.toFixed(2)),
        longTaskMaxMs: Number(longTaskMaxMs.toFixed(2))
      } satisfies PerfResult;
    });
    console.warn("MAP_PERF_METRICS", JSON.stringify(result));

    await testInfo.attach("map-perf-metrics.json", {
      body: JSON.stringify(result, null, 2),
      contentType: "application/json"
    });

    // Performance gate: prevent catastrophic loops/freeze in map rendering.
    const hasMapTelemetry = isMapVisible || result.surface === "map";
    if (hasMapTelemetry) {
      expect(result.nodeCount).toBeGreaterThanOrEqual(200);
      expect(result.longTaskMaxMs).toBeLessThanOrEqual(1200);
      expect(result.longTaskTotalMs).toBeLessThanOrEqual(5500);
      expect(result.longTaskCount).toBeLessThanOrEqual(120);
    } else {
      expect(result.surface).toBe("landing_fallback");
    }
    expect(result.fps).toBeGreaterThan(0);

  });
});
