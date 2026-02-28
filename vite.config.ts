/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sentryVitePlugin } from "@sentry/vite-plugin";

const DEFAULT_MODEL_ORDER: string[] = [
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192
};

function isRetryableModelError(error: unknown): boolean {
  const msg = error && typeof error === "object" && "message" in error
    ? String((error as { message?: string }).message)
    : "";
  const lower = msg.toLowerCase();
  return (
    lower.includes("429") ||
    lower.includes("quota") ||
    lower.includes("resource_exhausted") ||
    lower.includes("permission") ||
    lower.includes("denied") ||
    lower.includes("403") ||
    lower.includes("404") ||
    lower.includes("not found") ||
    lower.includes("model") ||
    lower.includes("unsupported")
  );
}

async function readJsonBody(req: import("http").IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(null);
      }
    });
  });
}

function geminiDevProxy() {
  let client: GoogleGenerativeAI | null = null;

  const getClient = () => {
    if (!client) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return null;
      client = new GoogleGenerativeAI(apiKey);
    }
    return client;
  };

  return {
    name: "gemini-dev-proxy",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/gemini/")) return next();

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        const body = await readJsonBody(req);
        if (body == null) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Invalid JSON" }));
          return;
        }

        const clientInstance = getClient();
        if (!clientInstance) {
          res.statusCode = 503;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Gemini not configured" }));
          return;
        }

        const path = req.url.split("?")[0] ?? "";

        if (path === "/api/gemini/generate") {
          const { prompt, generationConfig, modelOrder } = body ?? {};
          if (!prompt || typeof prompt !== "string") {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing prompt" }));
            return;
          }
          const config = generationConfig ?? DEFAULT_GENERATION_CONFIG;
          const models: string[] = Array.isArray(modelOrder) && modelOrder.length > 0 ? modelOrder : DEFAULT_MODEL_ORDER;
          let lastError: unknown = null;
          for (let i = 0; i < models.length; i += 1) {
            try {
              const model = clientInstance.getGenerativeModel({ model: models[i], generationConfig: config });
              const result = await model.generateContent(prompt);
              const text = result.response.text();
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ text }));
              return;
            } catch (error) {
              lastError = error;
              if (isRetryableModelError(error)) continue;
              break;
            }
          }
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Generation failed", detail: lastError ? String(lastError) : undefined }));
          return;
        }

        if (path === "/api/gemini/stream") {
          const { prompt, generationConfig, modelOrder } = body ?? {};
          if (!prompt || typeof prompt !== "string") {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing prompt" }));
            return;
          }
          const config = generationConfig ?? DEFAULT_GENERATION_CONFIG;
          const models: string[] = Array.isArray(modelOrder) && modelOrder.length > 0 ? modelOrder : DEFAULT_MODEL_ORDER;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          let lastError: unknown = null;
          for (let i = 0; i < models.length; i += 1) {
            try {
              const model = clientInstance.getGenerativeModel({ model: models[i], generationConfig: config });
              const result = await model.generateContentStream(prompt);
              for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) res.write(text);
              }
              res.end();
              return;
            } catch (error) {
              lastError = error;
              if (isRetryableModelError(error)) continue;
              break;
            }
          }
          res.statusCode = 500;
          res.end(lastError ? String(lastError) : "Stream failed");
          return;
        }

        if (path === "/api/gemini/tool") {
          const { contents, tools, systemInstruction, generationConfig, modelOrder } = body ?? {};
          if (!Array.isArray(contents)) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing contents" }));
            return;
          }
          const config = generationConfig ?? DEFAULT_GENERATION_CONFIG;
          const models: string[] = Array.isArray(modelOrder) && modelOrder.length > 0 ? modelOrder : DEFAULT_MODEL_ORDER;
          const toolConfig = { functionCallingConfig: { mode: "AUTO" as const } };
          let lastError: unknown = null;
          for (let i = 0; i < models.length; i += 1) {
            try {
              const model = clientInstance.getGenerativeModel({ model: models[i], generationConfig: config });
              const result = await model.generateContent({
                contents,
                tools,
                systemInstruction: systemInstruction ?? undefined,
                toolConfig
              });
              const response = result.response;
              const functionCalls = response.functionCalls?.() ?? [];
              const modelContent = response.candidates?.[0]?.content ?? { role: "model", parts: [] };

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              if (functionCalls.length === 0) {
                res.end(JSON.stringify({ text: response.text(), modelContent }));
                return;
              }
              res.end(JSON.stringify({ functionCalls, modelContent }));
              return;
            } catch (error) {
              lastError = error;
              if (isRetryableModelError(error)) continue;
              break;
            }
          }
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Tool generation failed", detail: lastError ? String(lastError) : undefined }));
          return;
        }

        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Not found" }));
      });
    }
  };
}

function adminDevProxy() {
  return {
    name: "admin-dev-proxy",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/admin")) return next();

        const url = new URL(req.url, `http://localhost`);
        const query = Object.fromEntries(url.searchParams.entries());
        const path = query.path || "overview";

        // Read body for non-GET
        let body: any = null;
        if (req.method !== "GET" && req.method !== "HEAD") {
          body = await readJsonBody(req);
        }

        // In dev mode, inject the admin secret so requests pass auth
        const adminSecret = process.env.ADMIN_API_SECRET || "alrehla-admin";
        const headers = { ...req.headers, "x-admin-code": adminSecret };

        const mockReq: any = {
          method: req.method,
          url: req.url,
          query,
          headers,
          body
        };

        let status = 200;
        let jsonResponse: any = {};
        const mockRes: any = {
          status: (s: number) => { status = s; return mockRes; },
          json: (data: any) => { jsonResponse = data; return mockRes; },
          setHeader: () => mockRes,
          end: () => mockRes
        };

        try {
          // Dynamic import to keep server code out of client bundle
          const { overviewRouter } = await import("./server/admin/overview");
          const { handleConfig } = await import("./server/admin/config");
          const { handleUsers } = await import("./server/admin/users");
          const { handleContent } = await import("./server/admin/content");
          const { handleRoles } = await import("./server/admin/roles");
          const { handleMissions } = await import("./server/admin/missions");
          const { handleBroadcasts } = await import("./server/admin/broadcasts");
          const { handleAiLogs } = await import("./server/admin/ai-logs");
          const { handleJourneyMap } = await import("./server/admin/journey-map");

          const ROUTES: Record<string, any> = {
            overview: overviewRouter,
            config: handleConfig,
            users: handleUsers,
            content: handleContent,
            roles: handleRoles,
            missions: handleMissions,
            broadcasts: handleBroadcasts,
            "ai-logs": handleAiLogs,
            "journey-map": handleJourneyMap
          };

          const handler = ROUTES[path] || overviewRouter;
          await handler(mockReq, mockRes);
        } catch (error: any) {
          console.error(`[Admin Dev Proxy] ${path}:`, error?.message || error);
          status = 500;
          jsonResponse = { error: "Internal Server Error", message: error?.message ?? "unknown" };
        }

        res.statusCode = status;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(jsonResponse));
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const hasSupabaseEnv = Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN || "";
  const sentryOrg = env.SENTRY_ORG || process.env.SENTRY_ORG || "";
  const sentryProject = env.SENTRY_PROJECT || process.env.SENTRY_PROJECT || "";
  const shouldUploadSourceMaps = Boolean(mode === "production" && sentryAuthToken && sentryOrg && sentryProject);
  if (!process.env.GEMINI_API_KEY && env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }

  // Populate process.env for server-side code running in adminDevProxy
  if (!process.env.SUPABASE_URL && env.SUPABASE_URL) process.env.SUPABASE_URL = env.SUPABASE_URL;
  if (!process.env.VITE_SUPABASE_URL && env.VITE_SUPABASE_URL) process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY) process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!process.env.ADMIN_API_SECRET && env.ADMIN_API_SECRET) process.env.ADMIN_API_SECRET = env.ADMIN_API_SECRET;
  if (!process.env.ADMIN_ALLOWED_ROLES && env.ADMIN_ALLOWED_ROLES) process.env.ADMIN_ALLOWED_ROLES = env.ADMIN_ALLOWED_ROLES;

  return {

    plugins: [
      react(),
      geminiDevProxy(),
      adminDevProxy(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        includeAssets: ["icons/*.png", "icons/*.svg"],
        manifest: false,
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /\/api\/gemini\/.*/i,
              handler: "NetworkOnly"
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "gstatic-fonts-cache",
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ]
        },
        devOptions: { enabled: false }
      }),
      ...(shouldUploadSourceMaps
        ? [
          sentryVitePlugin({
            authToken: sentryAuthToken,
            org: sentryOrg,
            project: sentryProject,
            sourcemaps: {
              assets: "./dist/**"
            }
          })
        ]
        : [])
    ],
    server: {
      port: 5000,
      host: "0.0.0.0",
      allowedHosts: true,
      watch: {
        ignored: ["**/*.log"]
      }
    },
    build: {
      target: "esnext",
      minify: "esbuild",
      sourcemap: shouldUploadSourceMaps ? "hidden" : false,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("preload-helper")) return "vendor";
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("@vercel/analytics") || id.includes("@vercel/speed-insights")) return "vercel";
            if (hasSupabaseEnv && (id.includes("@supabase/") || id.includes("supabase-js"))) return "supabase";
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/scheduler/") ||
              id.includes("/use-sync-external-store/")
            ) return "react-core";
            if (id.includes("motion-dom") || id.includes("motion-utils") || id.includes("es-toolkit")) return "motion";
            if (id.includes("core-js")) return "polyfills";
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("@dnd-kit/core")) return "dnd";
            if (id.includes("zustand")) return "state";
            if (id.includes("recharts")) return "charts";
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("dompurify")) return "ai-utils";
            if (
              id.includes("canvg") ||
              id.includes("stackblur-canvas") ||
              id.includes("svg-pathdata") ||
              id.includes("rgbcolor") ||
              id.includes("fflate")
            ) return "pdf-utils";
            if (id.includes("html2canvas")) return "html2canvas";
            if (id.includes("jspdf")) return "jspdf";
            if (id.includes("@google/generative-ai")) return "gemini";
            return "vendor";
          }
        }
      }
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "src/test/",
          "**/*.d.ts",
          "scripts/",
        ]
      }
    }
  };
});
