import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { env } from "./config/env";
import { registerRoomHandlers } from "./handlers/roomHandlers";
import { registerGameHandlers } from "./handlers/gameHandlers";
import type { ClientToServerEvents, ServerToClientEvents } from "./types";

export function createSocketServer(httpServer: HTTPServer): Server {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: env.CLIENT_URL, methods: ["GET", "POST"], credentials: true },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`+ socket connected: ${socket.id}`);
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    socket.on("disconnect", () => console.log(`- socket disconnected: ${socket.id}`));
  });

  return io;
}
