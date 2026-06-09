import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL, {
  retryStrategy: (times) => Math.min(times * 100, 3000),
  lazyConnect: true,
});

redis.on("error", (err) => console.error("Redis error:", err));

export async function connectRedis(): Promise<void> {
  await redis.connect();
  console.log("Redis connected");
}
