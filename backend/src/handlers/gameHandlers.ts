import { Server, Socket } from "socket.io";
import { getRoomById, setRoomCategory, lockRoom } from "../services/RoomService";
import { startGame, recordAnswer } from "../services/GameService";
import type { ClientToServerEvents, ServerToClientEvents } from "../types";

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerGameHandlers(io: IO, socket: AppSocket): void {
  socket.on("room:set-category", async ({ roomId, mode, category }) => {
    const room = await getRoomById(roomId);
    if (!room || room.hostId !== socket.id) return;
    const updated = await setRoomCategory(room, mode, category);
    io.to(roomId).emit("room:updated", updated);
  });

  socket.on("room:start", async ({ roomId }) => {
    const room = await getRoomById(roomId);
    if (!room || room.hostId !== socket.id) return;

    if (room.players.length === 0) {
      socket.emit("error", "Need at least one player to start.");
      return;
    }

    const locked = await lockRoom(room);
    io.to(roomId).emit("room:locked");
    io.to(roomId).emit("room:updated", locked);

    await startGame(io as any, roomId);
  });

  socket.on("game:submit-answer", async ({ roomId, questionId, answer }) => {
    await recordAnswer(roomId, socket.id, questionId, answer);
  });
}
