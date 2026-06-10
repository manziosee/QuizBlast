import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { env } from "./config/env";
import { registerRoomHandlers } from "./handlers/roomHandlers";
import { registerGameHandlers, startCleanupInterval } from "./handlers/gameHandlers";
import { registerSoloHandlers } from "./handlers/soloHandlers";
import type { ClientToServerEvents, ServerToClientEvents } from "./types";

export function createSocketServer(httpServer: HTTPServer): Server {
  const allowedOrigins = env.NODE_ENV === "production"
    ? [env.CLIENT_URL, /^https:\/\/.*\.vercel\.app$/]
    : true; // allow all in dev

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true },
    transports: ["websocket", "polling"],
  });

  startCleanupInterval(io);

  io.on("connection", (socket) => {
    console.log(`+ socket connected: ${socket.id}`);
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerSoloHandlers(io, socket);
    socket.on("disconnect", () => console.log(`- socket disconnected: ${socket.id}`));
  });

  return io;
}
