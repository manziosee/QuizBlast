import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "4000", 10),
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:3000",
};

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required — copy .env.example to .env");
}
