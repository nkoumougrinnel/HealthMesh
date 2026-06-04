import "dotenv/config";

function bool(v, def = false) {
  if (v === undefined) return def;
  return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || "0.0.0.0",
  corsOrigin: (process.env.CORS_ORIGIN || "*")
    .split(",")
    .map((s) => s.trim()),

  databaseUrl: process.env.DATABASE_URL,

  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-me-please-change-me",
    accessTtl: process.env.ACCESS_TOKEN_TTL || "15m",
    refreshTtl: process.env.REFRESH_TOKEN_TTL || "7d",
    offlineTtl: process.env.OFFLINE_TOKEN_TTL || "7d",
  },

  redisUrl: process.env.REDIS_URL || "",

  ia: {
    engine: (process.env.IA_ENGINE || "rules").toLowerCase(), // rules | llm
    anthropicKey: process.env.ANTHROPIC_API_KEY || "",
    openaiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.LLM_MODEL || "claude-3-5-sonnet-latest",
  },

  simulator: {
    defaultIntervalMs: Number(process.env.SIMULATOR_DEFAULT_INTERVAL_MS || 2000),
  },

  isProd: process.env.NODE_ENV === "production",
};
