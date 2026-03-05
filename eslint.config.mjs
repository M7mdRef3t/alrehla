import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "scripts", ".next", "playwright-report", "test-results"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Relax some rules for development speed
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  }
  ,
  {
    files: [
      "src/components/admin/dashboard/**/*.{ts,tsx}",
      "src/components/admin/AIDecisionLog.tsx",
      "src/components/PulseCheckModal.tsx",
      "src/hooks/useGeminiLive.ts",
      "src/ai/**/*.{ts,tsx}"
    ],
    rules: {
      // Temporary relaxation for high-churn R&D/admin surfaces.
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/exhaustive-deps": "off",
      "no-console": "off"
    }
  },
  {
    files: [
      "src/hooks/**/*.{ts,tsx}",
      "src/services/**/*.{ts,tsx}",
      "src/modules/**/*.{ts,tsx}",
      "src/types/**/*.{ts,tsx}",
      "src/components/enterprise/**/*.{ts,tsx}",
      "src/components/SovereignProfile.tsx",
      "src/components/Landing.tsx"
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off"
    }
  }
);
