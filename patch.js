const fs = require('fs');

const file = 'src/ai/revenueAutomation.ts';
let code = fs.readFileSync(file, 'utf8');

// Ensure supabase is imported
if (!code.includes('import { supabase } from "../services/supabaseClient"')) {
    code = code.replace(
        'import { geminiClient } from "../services/geminiClient";',
        'import { geminiClient } from "../services/geminiClient";\nimport { supabase } from "../services/supabaseClient";'
    );
}

// Replace analyzeCurrentMetrics body
const newAnalyzeCurrentMetrics = `  async analyzeCurrentMetrics(): Promise<RevenueMetrics | null> {
    console.warn("📊 Fetching real revenue metrics from Supabase...");

    try {
      // 1. Fetch user profiles to determine tiers
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("role, subscription_status");

      if (error) {
        console.error("❌ Error fetching profiles from Supabase:", error);
        return null;
      }

      if (!profiles || profiles.length === 0) {
        console.warn("⚠️ No profiles found in Supabase.");
        return null;
      }

      // 2. Aggregate user counts by tier
      let freeCount = 0;
      let premiumCount = 0;
      let coachCount = 0;

      for (const profile of profiles) {
        if (profile.role === "enterprise_admin") {
          coachCount++;
        } else if (
          profile.subscription_status === "active" ||
          profile.subscription_status === "trialing"
        ) {
          premiumCount++;
        } else {
          freeCount++;
        }
      }

      const totalUsers = profiles.length;
      const premiumPrice = TIER_PRICES_USD.premium.monthly;
      const coachPrice = TIER_PRICES_USD.coach.monthly;

      // 3. Calculate Revenue Metrics
      const mrr = premiumCount * premiumPrice + coachCount * coachPrice;
      const arr = mrr * 12;

      // Temporary estimates for churn and conversion until event tracking is fully integrated
      const estimatedChurnRate = 0.05; // 5% monthly churn estimate
      const estimatedFreeToPremium =
        freeCount + premiumCount > 0
          ? premiumCount / (freeCount + premiumCount)
          : 0;
      const estimatedPremiumToCoach =
        premiumCount + coachCount > 0
          ? coachCount / (premiumCount + coachCount)
          : 0;

      const avgRevenuePerUser = totalUsers > 0 ? mrr / totalUsers : 0;

      // LTV = ARPU / Churn Rate
      const lifetimeValue = estimatedChurnRate > 0 ? avgRevenuePerUser / estimatedChurnRate : 0;

      const actualData: RevenueMetrics = {
        timestamp: Date.now(),
        totalUsers,
        breakdown: {
          free: freeCount,
          premium: premiumCount,
          coach: coachCount,
        },
        mrr,
        arr,
        churnRate: estimatedChurnRate,
        conversionRate: {
          freeToPremium: estimatedFreeToPremium,
          premiumToCoach: estimatedPremiumToCoach,
        },
        avgRevenuePerUser,
        lifetimeValue,
      };

      console.warn("✅ Real revenue metrics calculated:", actualData);
      return actualData;
    } catch (error) {
      console.error("❌ Failed to analyze metrics:", error);
      return null;
    }
  }`;

const oldAnalyzeCurrentMetricsRegex = /async analyzeCurrentMetrics\(\): Promise<RevenueMetrics \| null> \{[\s\S]*?return mockData;\n    \} catch \(error\) \{\n      console\.error\("❌ Failed to analyze metrics:", error\);\n      return null;\n    \}\n  \}/;

code = code.replace(oldAnalyzeCurrentMetricsRegex, newAnalyzeCurrentMetrics);

fs.writeFileSync(file, code);
console.log('Patch applied.');
