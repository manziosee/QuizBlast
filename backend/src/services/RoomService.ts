import { v4 as uuidv4 } from "uuid";
import { redis } from "../config/redis";
import type { Room, Player, Category, CategoryMode } from "../types";

const TTL = 7200;
const roomKey = (id: string) => `room:${id}`;
const codeKey = (code: string) => `code:${code}`;

function generateCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export async function createRoom(hostSocketId: string): Promise<Room> {
  const id = uuidv4();
  const code = generateCode();
  const room: Room = {
    id, code, hostId: hostSocketId,
    status: "waiting", categoryMode: "group", category: null,
    players: [], currentQuestionIndex: -1, totalQuestions: 10,
    gameStartedAt: null, questionStartedAt: null, timerEndsAt: null,
  };
  await redis.set(roomKey(id), JSON.stringify(room), "EX", TTL);
  await redis.set(codeKey(code), id, "EX", TTL);
  return room;
}

export async function getRoomById(id: string): Promise<Room | null> {
  const data = await redis.get(roomKey(id));
  return data ? (JSON.parse(data) as Room) : null;
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const id = await redis.get(codeKey(code));
  if (!id) return null;
  return getRoomById(id);
}

export async function saveRoom(room: Room): Promise<void> {
  await redis.set(roomKey(room.id), JSON.stringify(room), "EX", TTL);
}

export async function addPlayerToRoom(room: Room, player: Player): Promise<Room> {
  room.players.push(player);
  await saveRoom(room);
  return room;
}

export async function removePlayerFromRoom(room: Room, playerId: string): Promise<Room> {
  room.players = room.players.filter((p) => p.id !== playerId);
  await saveRoom(room);
  return room;
}

export async function lockRoom(room: Room): Promise<Room> {
  room.status = "active";
  await saveRoom(room);
  return room;
}

export async function setRoomCategory(room: Room, mode: CategoryMode, category?: Category): Promise<Room> {
  room.categoryMode = mode;
  room.category = category ?? null;
  room.status = "category-select";
  await saveRoom(room);
  return room;
}

export async function deleteRoom(room: Room): Promise<void> {
  await redis.del(roomKey(room.id));
  await redis.del(codeKey(room.code));
}
