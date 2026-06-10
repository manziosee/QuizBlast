import { Server, Socket } from "socket.io";
import { getRoomById, setRoomCategory, lockRoom } from "../services/RoomService";
import { startGame, recordAnswer, checkAndCleanEmptyRooms } from "../services/GameService";
import type { ClientToServerEvents, ServerToClientEvents } from "../types";

// Simple per-socket event rate limiting: tracks last event timestamp per (socketId:event) key
const lastEventTime = new Map<string, number>();
function isRateLimited(socketId: string, event: string, minIntervalMs = 500): boolean {
  const key = `${socketId}:${event}`;
  const now = Date.now();
  if (now - (lastEventTime.get(key) ?? 0) < minIntervalMs) return true;
  lastEventTime.set(key, now);
  return false;
}

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Clean up timers for rooms where all players left — runs every 5 minutes
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupInterval(io: IO): void {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => checkAndCleanEmptyRooms(io), 5 * 60 * 1000);
}

export function registerGameHandlers(io: IO, socket: AppSocket): void {

  socket.on("room:start", async ({ roomId }) => {
    const room = await getRoomById(roomId);
    if (!room || room.hostId !== socket.id) return;

    if (room.players.length === 0) {
      socket.emit("error", "Need at least one player to start.");
      return;
    }

    // In individual mode, check all players have picked a category
    if (room.categoryMode === "individual") {
      const missing = room.players.filter((p) => !p.category);
      if (missing.length > 0) {
        socket.emit("error", `Waiting for ${missing.length} player(s) to pick a category.`);
        return;
      }
    }

    const locked = await lockRoom(room);
    io.to(roomId).emit("room:locked");
    io.to(roomId).emit("room:updated", locked);

    await startGame(io as any, roomId);
  });

  socket.on("game:submit-answer", async ({ roomId, questionId, answer }) => {
    if (isRateLimited(socket.id, "game:submit-answer", 500)) return;
    await recordAnswer(roomId, socket.id, questionId, answer);
    const room = await getRoomById(roomId);
    if (room) {
      const answered = room.players.filter((p) =>
        p.answers.some((a) => a.questionId === questionId)
      ).length;
      io.to(roomId).emit("game:answer-count", { answered, total: room.players.length });
    }
  });

  socket.on("room:set-category", async ({ roomId, mode, category }) => {
    if (isRateLimited(socket.id, "room:set-category", 1000)) return;
    const room = await getRoomById(roomId);
    if (!room || room.hostId !== socket.id) return;
    const updated = await setRoomCategory(room, mode as any, category as any);
    io.to(roomId).emit("room:updated", updated);
  });
}
