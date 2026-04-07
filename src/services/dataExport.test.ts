import { describe, it, expect } from "vitest";
import { getStorageSize, getStorageStats } from "@/services/dataExport";

describe("dataExport", () => {
  describe("getStorageSize", () => {
    it("returns a number", () => {
      const size = getStorageSize();
      expect(typeof size).toBe("number");
      expect(size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getStorageStats", () => {
    it("returns stats object with correct shape", async () => {
      const stats = await getStorageStats();
      
      expect(stats).toHaveProperty("nodesCount");
      expect(stats).toHaveProperty("hasJourneyData");
      expect(stats).toHaveProperty("hasMeData");
      expect(stats).toHaveProperty("hasNotificationSettings");
      expect(stats).toHaveProperty("totalSizeKB");
      
      expect(typeof stats.nodesCount).toBe("number");
      expect(typeof stats.hasJourneyData).toBe("boolean");
      expect(typeof stats.hasMeData).toBe("boolean");
      expect(typeof stats.hasNotificationSettings).toBe("boolean");
      expect(typeof stats.totalSizeKB).toBe("number");
    });
  });
});
