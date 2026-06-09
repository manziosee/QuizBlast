import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { generateQRCode } from "../services/QRService";
import {
  createRoom, getRoomByCode, getRoomById,
  addPlayerToRoom, removePlayerFromRoom, deleteRoom, saveRoom,
} from "../services/RoomService";
import { clearRoomTimers } from "../services/GameService";
import { env } from "../config/env";
import type { AvatarSeed, Player, Category, ClientToServerEvents, ServerToClientEvents } from "../types";

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const VALID_AVATARS: AvatarSeed[] = [
  "naruto","luffy","goku","saitama","mikasa",
  "nezuko","tanjiro","zoro","ichigo","killua","gon","todoroki",
];

export function registerRoomHandlers(io: IO, socket: AppSocket): void {

  // ── room:create ─────────────────────────────────────────
  socket.on("room:create", async (callback) => {
    try {
      const room = await createRoom(socket.id);
      const joinUrl = `${env.CLIENT_URL}/join/${room.code}`;
      const qrCodeBase64 = await generateQRCode(joinUrl);
      await socket.join(room.id);
      socket.data.roomId = room.id;
      callback({ id: room.id, code: room.code, joinUrl, qrCodeBase64, playerCount: 0 });
    } catch {
      socket.emit("error", "Failed to create room");
    }
  });

  // ── room:join ───────────────────────────────────────────
  socket.on("room:join", async ({ roomCode, name, avatar }, callback) => {
    try {
      const room = await getRoomByCode(roomCode.toUpperCase());

      if (!room)
        return callback({ success: false, error: "Room not found. Check the code." });
      if (room.status === "active" || room.status === "ended")
        return callback({ success: false, error: "Game already started — you cannot join now." });

      const trimmedName = name.trim().slice(0, 20);
      if (!trimmedName)
        return callback({ success: false, error: "Nickname cannot be empty." });
      if (!VALID_AVATARS.includes(avatar as AvatarSeed))
        return callback({ success: false, error: "Invalid avatar." });
      if (room.players.some((p) => p.name.toLowerCase() === trimmedName.toLowerCase()))
        return callback({ success: false, error: "That name is already taken in this room." });

      const player: Player = {
        id: socket.id,
        name: trimmedName,
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

  // ── player:set-category ─────────────────────────────────
  socket.on("player:set-category", async ({ roomId, category }) => {
    const room = await getRoomById(roomId);
    if (!room || room.categoryMode !== "individual") return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    player.category = category as Category;
    await saveRoom(room);
    io.to(roomId).emit("room:updated", room);
  });

  // ── room:kick ───────────────────────────────────────────
  socket.on("room:kick", async ({ roomId, playerId }) => {
    const room = await getRoomById(roomId);
    if (!room || room.hostId !== socket.id) return;
    if (room.status !== "waiting" && room.status !== "category-select") return;

    const updated = await removePlayerFromRoom(room, playerId);
    const kickedSocket = io.sockets.sockets.get(playerId);
    io.to(playerId).emit("error", "You were removed from the room by the host.");
    kickedSocket?.leave(roomId);
    io.to(roomId).emit("player:left", playerId);
    io.to(roomId).emit("room:updated", updated);
  });

  // ── disconnect ──────────────────────────────────────────
  socket.on("disconnect", async () => {
    const roomId = socket.data.roomId as string | undefined;
    if (!roomId) return;

    const room = await getRoomById(roomId);
    if (!room) return;

    // Host disconnects → end room for everyone
    if (room.hostId === socket.id) {
      clearRoomTimers(roomId);
      await deleteRoom(room);
      io.to(roomId).emit("error", "Host disconnected — game has ended.");
      return;
    }

    // Player disconnects during active game → mark as disconnected, keep score intact
    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      player.isConnected = false;

      if (room.status === "active") {
        await saveRoom(room);
        io.to(roomId).emit("player:left", socket.id);
        io.to(roomId).emit("room:updated", room);
        if (room.players.every((p) => !p.isConnected)) {
          clearRoomTimers(roomId);
          await deleteRoom(room);
          io.to(roomId).emit("error", "All players disconnected — game has ended.");
        }
      } else {
        const updated = await removePlayerFromRoom(room, socket.id);
        io.to(roomId).emit("player:left", socket.id);
        io.to(roomId).emit("room:updated", updated);
      }
    }
  });
}
