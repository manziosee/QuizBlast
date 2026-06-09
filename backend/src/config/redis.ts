import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL, {
  retryStrategy: (times) => {
    if (times > 3) return null; // stop retrying after 3 attempts
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
  enableOfflineQueue: false,
});

redis.on("error", (err) => console.error("Redis error:", err.message));

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
    console.log("Redis connected");
  } catch (err) {
    console.warn("Redis unavailable — room state will not persist across restarts:", (err as Error).message);
    // Don't throw — server continues without Redis (degraded mode)
  }
}
