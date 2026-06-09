import { io, Socket } from "socket.io-client";

export type ServerToClientEvents = {
  "room:updated": (room: any) => void;
  "room:locked": () => void;
  "player:joined": (player: any) => void;
  "player:left": (playerId: string) => void;
  "game:question": (data: { question: any; index: number; total: number; timerEndsAt: number }) => void;
  "game:question-result": (result: any) => void;
  "game:ended": (rankings: any[]) => void;
  "game:tick": (secondsLeft: number) => void;
  "error": (message: string) => void;
};

export type ClientToServerEvents = {
  "room:create": (callback: (result: any) => void) => void;
  "room:join": (data: { roomCode: string; name: string; avatar: string }, callback: (result: any) => void) => void;
  "room:start": (data: { roomId: string }) => void;
  "room:set-category": (data: { roomId: string; mode: string; category?: string }) => void;
  "game:submit-answer": (data: { roomId: string; questionId: string; answer: string }) => void;
};

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000", {
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: false,   // don't spam reconnect attempts when backend is offline
      timeout: 3000,
    });
  }
  return socket;
}

export function connectSocket(): void {
  getSocket().connect();
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
