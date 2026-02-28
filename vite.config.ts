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

function publicLandingDevProxy() {
  const FOUNDING_COHORT_CAPACITY = 50;
  let getAdminClient:
    | (() => import("@supabase/supabase-js").SupabaseClient | null)
    | null = null;

  const loadAdminClient = async () => {
    if (!getAdminClient) {
      const module = await import("./app/api/_lib/supabaseAdmin");
      getAdminClient = module.getSupabaseAdminClient;
    }
    return getAdminClient;
  };

  const respondJson = (res: import("http").ServerResponse, status: number, payload: unknown) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(payload));
  };

  return {
    name: "public-landing-dev-proxy",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/public/")) return next();

        if (req.method !== "GET" && req.method !== "HEAD") {
          respondJson(res, 405, { error: "Method not allowed" });
          return;
        }

        const path = req.url.split("?")[0] ?? "";
        if (path !== "/api/public/pulse" && path !== "/api/public/scarcity") return next();

        try {
          const adminClientFactory = await loadAdminClient();
          const client = adminClientFactory();

          if (path === "/api/public/pulse") {
            if (!client) {
              respondJson(res, 200, {
                global_phoenix_avg: null,
                generated_at: new Date().toISOString(),
                source: "not_configured",
                is_live: false
              });
              return;
            }

            const { data, error } = await client.rpc("get_public_awareness_pulse");
            const payload = (data ?? null) as { global_phoenix_avg?: number | null; generated_at?: string | null } | null;
            const avg = typeof payload?.global_phoenix_avg === "number" && Number.isFinite(payload.global_phoenix_avg)
              ? payload.global_phoenix_avg
              : null;

            if (error || avg === null) {
              respondJson(res, 200, {
                global_phoenix_avg: null,
                generated_at: new Date().toISOString(),
                source: error ? "query_failed" : "no_data",
                is_live: false
              });
              return;
            }

            respondJson(res, 200, {
              global_phoenix_avg: avg,
              generated_at: payload?.generated_at ?? new Date().toISOString(),
              source: "supabase",
              is_live: true
            });
            return;
          }

          if (!client) {
            respondJson(res, 200, {
              total_seats: FOUNDING_COHORT_CAPACITY,
              seats_left: null,
              source: "unavailable",
              is_live: false
            });
            return;
          }

          const { count, error } = await client
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .gt("awareness_tokens", 0)
            .gt("journey_expires_at", new Date().toISOString());

          if (error) {
            respondJson(res, 200, {
              total_seats: FOUNDING_COHORT_CAPACITY,
              seats_left: null,
              source: "unavailable",
              is_live: false
            });
            return;
          }

          const activePremium = Number(count ?? 0);
          const seatsLeft = Math.max(FOUNDING_COHORT_CAPACITY - activePremium, 0);
          respondJson(res, 200, {
            total_seats: FOUNDING_COHORT_CAPACITY,
            seats_left: seatsLeft,
            source: "supabase",
            is_live: true
          });
        } catch (error) {
          respondJson(res, 200, {
            source: "proxy_error",
            is_live: false,
            path,
            error: String(error)
          });
        }
      });
    }
  };
}

const ANALYZE_SYSTEM_PROMPT = `
أنت "محرك الوعي" لأداة "دواير". حلل 3 إجابات قصيرة وأرجع JSON فقط بالشكل:
{
  "nodes": [{ "id": "user_core", "label": "أنت (المركز)", "size": "medium", "color": "core", "mass": 10 }],
  "edges": [],
  "insight_message": "جملة واحدة قوية",
  "detected_symptoms": []
}

أضف 2-4 عقد من الإجابات، واجعل:
- الاستنزاف العالي (8-10): size=large و color=danger
- الشيء المتجاهَل: size=small و color=ignored
- الباقي: size=medium و color=neutral
- اربط user_core بكل عقدة. واجعل type=draining إذا كان الاستنزاف عاليًا، وإلا stable.
- detected_symptoms من: guilt, not_enough, conditional, emotional_manipulation, exhausted, physical_tension, ruminating, avoidance, self_neglect, walking_eggshells, people_pleasing, lose_identity
`;

function buildAnalyzeFallback(answers: string[]) {
  const firstAnswer = String(answers[0] ?? "").trim();
  const stressScoreRaw = Number.parseInt(String(answers[1] ?? "").trim(), 10);
  const stressScore = Number.isFinite(stressScoreRaw) ? Math.max(1, Math.min(10, stressScoreRaw)) : 6;
  const ignoredAnswer = String(answers[2] ?? "").trim();
  const primaryItems = firstAnswer
    .split(/[،,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  const nodes = [
    { id: "user_core", label: "أنت (المركز)", size: "medium", color: "core", mass: 10 },
    ...primaryItems.map((item, index) => ({
      id: `node_${index + 1}`,
      label: item,
      size: stressScore >= 8 ? "large" : "medium",
      color: stressScore >= 8 ? "danger" : "neutral",
      mass: Math.max(4, stressScore)
    })),
    ...(ignoredAnswer
      ? [{
        id: "ignored_node",
        label: ignoredAnswer,
        size: "small",
        color: "ignored",
        mass: 3
      }]
      : [])
  ] as Array<{ id: string; label: string; size: "small" | "medium" | "large"; color: "core" | "danger" | "ignored" | "neutral"; mass: number }>;

  const edges = nodes
    .filter((node) => node.id !== "user_core")
    .map((node) => ({
      source: "user_core",
      target: node.id,
      type: node.color === "danger" ? "draining" : node.color === "ignored" ? "ignored" : "stable",
      animated: node.color === "danger"
    }));

  const lower = `${firstAnswer} ${ignoredAnswer}`.toLowerCase();
  const detected_symptoms = [
    lower.includes("ذنب") ? "guilt" : null,
    lower.includes("قلق") || lower.includes("توتر") ? "ruminating" : null,
    lower.includes("حدود") || lower.includes("أتجاهل") || lower.includes("اتجاهل") ? "self_neglect" : null,
    stressScore >= 8 ? "exhausted" : null
  ].filter(Boolean);

  return {
    nodes,
    edges,
    insight_message: ignoredAnswer
      ? `الاستنزاف لا يأتي فقط من ${primaryItems[0] || "الضغط"}، بل من تجاهلك المستمر لـ "${ignoredAnswer}".`
      : `الضغط الحالي حول ${primaryItems[0] || "أكثر من جبهة"} يسحب طاقتك أسرع من قدرتك على الاستعادة.`,
    detected_symptoms
  };
}

function analyzeDevProxy(apiKey?: string) {
  const client = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  const respondJson = (res: import("http").ServerResponse, status: number, payload: unknown) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(payload));
  };

  return {
    name: "analyze-dev-proxy",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if ((req.url?.split("?")[0] ?? "") !== "/api/analyze") return next();
        if (req.method !== "POST") return respondJson(res, 405, { error: "Method not allowed" });

        const body = await readJsonBody(req);
        if (body == null || !Array.isArray(body.answers) || body.answers.length === 0) {
          return respondJson(res, 400, { error: "Missing answers payload" });
        }

        const answers = body.answers.map((value: unknown) => String(value ?? ""));
        if (!client) {
          return respondJson(res, 200, { ...buildAnalyzeFallback(answers), source: "fallback", is_live: false });
        }

        try {
          const model = client.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { ...DEFAULT_GENERATION_CONFIG, responseMimeType: "application/json" }
          });
          const prompt = `${ANALYZE_SYSTEM_PROMPT}\n\nUser answers:\n1. ${answers[0]}\n2. ${answers[1]}\n3. ${answers[2] ?? ""}`;
          const result = await model.generateContent(prompt);
          const parsed = JSON.parse(result.response.text());
          return respondJson(res, 200, { ...parsed, source: "gemini-dev-proxy", is_live: true });
        } catch (error) {
          return respondJson(res, 200, { ...buildAnalyzeFallback(answers), source: "fallback_after_error", is_live: false, error: String(error) });
        }
      });
    }
  };
}

function buildGuestChatFallback(body: any) {
  const focusedNodeLabel = String(body?.focusedNode?.label ?? "هذه الدائرة").trim() || "هذه الدائرة";
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const latestMessage = String(messages[messages.length - 1]?.content ?? "").trim();
  const normalized = latestMessage.toLowerCase();

  if (!latestMessage || normalized.includes("مرحب") || normalized.includes("التحدث عن هذه الدائرة")) {
    return {
      reply: `أهلاً بك، لندردش حول "${focusedNodeLabel}". سجّل الدخول عندما تريد حفظ الجلسة واستهلاك التوكنات الفعلية. ما الحقيقة التي تتجنب قولها بوضوح هنا؟`,
      proposedAction: null,
      llm_latency_ms: 0,
      tokens_remaining: null,
      token_warning: null,
      source: "dev_guest_fallback"
    };
  }

  const shortPrompt = latestMessage.length > 120 ? `${latestMessage.slice(0, 120)}...` : latestMessage;
  const probingReply = normalized.includes("حد")
    ? `واضح أن "${focusedNodeLabel}" يرتبط بالحدود. قبل أي حل: ما الثمن الذي تدفعه كل مرة تؤجل فيها هذا الحد؟`
    : normalized.includes("خائف") || normalized.includes("قلق") || normalized.includes("متوتر")
      ? `الخوف حاضر في "${focusedNodeLabel}"، لكن سؤاله الأهم: ماذا يحمي لك هذا الخوف الآن، وماذا يمنعك منه؟`
      : `سمعتك في "${focusedNodeLabel}": "${shortPrompt}". لا أريد شرحًا أطول، أريد تحديدًا أدق: ما السلوك الذي تكرره رغم أنك تعرف ثمنه؟`;

  return {
    reply: probingReply,
    proposedAction: null,
    llm_latency_ms: 0,
    tokens_remaining: null,
    token_warning: null,
    source: "dev_guest_fallback"
  };
}

function chatAgentDevProxy() {
  const respondJson = (res: import("http").ServerResponse, status: number, payload: unknown) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(payload));
  };

  return {
    name: "chat-agent-dev-proxy",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if ((req.url?.split("?")[0] ?? "") !== "/api/chat/agent") return next();
        if (req.method !== "POST") return respondJson(res, 405, { error: "Method not allowed" });

        const body = await readJsonBody(req);
        if (body == null) {
          return respondJson(res, 400, { error: "Invalid JSON" });
        }

        try {
          const { POST } = await import("./app/api/chat/agent/route");
          const origin = `http://${req.headers.host || "localhost:5000"}`;
          const request = new Request(`${origin}/api/chat/agent`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              ...(typeof req.headers.cookie === "string" ? { cookie: req.headers.cookie } : {})
            },
            body: JSON.stringify(body)
          });

          const response = await POST(request);
          if (response.status === 401) {
            return respondJson(res, 200, buildGuestChatFallback(body));
          }
          const text = await response.text();
          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
          res.end(text);
        } catch (error) {
          console.error("[Chat Agent Dev Proxy]", error);
          respondJson(res, 500, {
            error: "Failed to execute chat agent in Vite dev server",
            detail: String(error)
          });
        }
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
    define: {
      __DEFINES__: "({})",
    },
    plugins: [
      react(),
      geminiDevProxy(),
      analyzeDevProxy(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY),
      chatAgentDevProxy(),
      adminDevProxy(),
      publicLandingDevProxy(),
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
