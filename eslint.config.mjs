// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const RELAXED_CORE_RULES = {
  "@typescript-eslint/no-unused-vars": "off",
  "@typescript-eslint/no-explicit-any": "off",
  "no-console": "off",
};

const RELAXED_WITH_HOOKS_RULES = {
  ...RELAXED_CORE_RULES,
  "react-hooks/exhaustive-deps": "off",
};

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "scripts",
      ".next",
      ".next/*",
      ".next/**",
      ".next-dev",
      ".next-dev/*",
      ".next-dev/**",
      "playwright-report",
      "test-results"
    ],
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    }
  },
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
  },
  {
    files: [
      "src/components/admin/dashboard/**/*.{ts,tsx}",
      "src/components/admin/AIDecisionLog.tsx",
      "src/components/PulseCheckModal.tsx",
      "src/ai/**/*.{ts,tsx}"
    ],
    // Temporary relaxation for high-churn R&D/admin surfaces.
    rules: RELAXED_WITH_HOOKS_RULES
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
    rules: RELAXED_CORE_RULES
  },
  {
    files: [
      "app/api/**/*.{ts,tsx}",
      "server/**/*.{ts,tsx}",
      "src/server/**/*.{ts,tsx}",
      "src/lib/maraya/**/*.{ts,tsx}"
    ],
    rules: {
      ...RELAXED_CORE_RULES,
      "prefer-const": "off",
    }
  },
  {
    files: [
      "app/client-app-shell.tsx",
      "src/components/admin/**/*.{ts,tsx}",
      "src/components/ResourcesCenter.tsx",
      "src/components/app-shell/**/*.{ts,tsx}",
      "src/state/adminState.ts"
    ],
    rules: {
      ...RELAXED_CORE_RULES,
      "react-refresh/only-export-components": "off",
      "react-hooks/exhaustive-deps": "off",
    }
  },
  storybook.configs["flat/recommended"]
);
