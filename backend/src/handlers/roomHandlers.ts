import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { generateQRCode } from "../services/QRService";
import {
  createRoom, getRoomByCode, getRoomById,
  addPlayerToRoom, removePlayerFromRoom, deleteRoom,
} from "../services/RoomService";
import { clearRoomTimers } from "../services/GameService";
import { env } from "../config/env";
import type { AvatarSeed, Player, ClientToServerEvents, ServerToClientEvents, Room } from "../types";

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerRoomHandlers(io: IO, socket: AppSocket): void {
  socket.on("room:create", async (callback) => {
    try {
      const room = await createRoom(socket.id);
      const joinUrl = `${env.CLIENT_URL}/join/${room.code}`;
      const qrCodeBase64 = await generateQRCode(joinUrl);
      await socket.join(room.id);
      callback({ code: room.code, joinUrl, qrCodeBase64, playerCount: 0 });
    } catch {
      socket.emit("error", "Failed to create room");
    }
  });

  socket.on("room:join", async ({ roomCode, name, avatar }, callback) => {
    try {
      const room = await getRoomByCode(roomCode.toUpperCase());

      if (!room)
        return callback({ success: false, error: "Room not found. Check the code." });
      if (room.status === "active" || room.status === "ended")
        return callback({ success: false, error: "Game already started — you cannot join now." });

      const player: Player = {
        id: socket.id,
        name: name.trim().slice(0, 20),
        avatar: avatar as AvatarSeed,
        score: 0,
        answers: [],
        isHost: false,
        isConnected: true,
      };

      const updated = await addPlayerToRoom(room, player);
      await socket.join(room.id);
      socket.data.roomId = room.id;

      io.to(room.id).emit("player:joined", player);
      io.to(room.id).emit("room:updated", updated);

      callback({ success: true, room: updated });
    } catch {
      callback({ success: false, error: "Failed to join room" });
    }
  });

  socket.on("disconnect", async () => {
    const roomId = socket.data.roomId as string | undefined;
    if (!roomId) return;

    const room = await getRoomById(roomId);
    if (!room) return;

    if (room.hostId === socket.id) {
      clearRoomTimers(roomId);
      await deleteRoom(room);
      io.to(roomId).emit("error", "Host disconnected. Game has ended.");
      return;
    }

    const updated = await removePlayerFromRoom(room, socket.id);
    io.to(roomId).emit("player:left", socket.id);
    io.to(roomId).emit("room:updated", updated);
  });
}
