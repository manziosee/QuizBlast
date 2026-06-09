import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  console.log("PostgreSQL connected");
}
