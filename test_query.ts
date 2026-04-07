import { config } from "dotenv";
config({ path: ".env.local" });

import { runtimeEnv } from "./src/config/runtimeEnv";
console.log("Supabase URL:", runtimeEnv.supabaseUrl);
