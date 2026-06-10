import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV:            process.env.NODE_ENV              ?? "development",
  PORT:                parseInt(process.env.PORT ?? "4000", 10),
  DATABASE_URL:        process.env.DATABASE_URL          ?? "",
  REDIS_URL:           process.env.REDIS_URL             ?? "redis://localhost:6379",
  CLIENT_URL:          process.env.CLIENT_URL            ?? "http://localhost:3000",
  GROQ_API_KEY:        process.env.GROQ_API_KEY          ?? "",
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY   ?? "",
};

const missing = (["DATABASE_URL"] as const).filter((k) => !env[k]);
if (missing.length) {
  throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}

if (env.NODE_ENV === "production" && env.REDIS_URL.startsWith("redis://")) {
  console.warn(
    "[QuizBlast] WARNING: REDIS_URL uses plain redis:// in production. " +
    "Set the REDIS_URL secret on Fly.io to a rediss:// Upstash URL for TLS. " +
    "Continuing without Redis — room state will not persist across restarts."
  );
}
