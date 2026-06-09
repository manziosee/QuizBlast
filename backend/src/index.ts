import http from "http";
import app from "./app";
import { createSocketServer } from "./socket";
import { connectDatabase } from "./config/database";
import { connectRedis } from "./config/redis";
import { env } from "./config/env";

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  const httpServer = http.createServer(app);
  createSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`QuizBlast backend running at http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});
