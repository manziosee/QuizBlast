import { io, Socket } from "socket.io-client";
import { backendUrl } from "./env";

export type ServerToClientEvents = {
  "room:updated":         (room: any) => void;
  "room:locked":          () => void;
  "player:joined":        (player: any) => void;
  "player:left":          (playerId: string) => void;
  "game:question":        (data: { question: any; index: number; total: number; timerEndsAt: number; totalMs: number }) => void;
  "game:question-result": (result: any) => void;
  "game:leaderboard":     (rankings: any[]) => void;
  "game:answer-count":    (data: { answered: number; total: number }) => void;
  "game:ended":           (rankings: any[]) => void;
  "game:tick":            (secondsLeft: number) => void;
  "error":                (message: string) => void;
  // Solo mode
  "solo:question":        (data: { sessionId: string; question: any; index: number; total: number; timerEndsAt: number; totalMs: number }) => void;
  "solo:result":          (data: { isCorrect: boolean; correctAnswer: "A" | "B" | "C" | "D"; explanation: string; score: number }) => void;
  "solo:ended":           (data: { score: number; correctCount: number; totalQuestions: number; maxScore: number; percentage: number }) => void;
};

export type ClientToServerEvents = {
  "room:create":          (callback: (result: any) => void) => void;
  "room:join":            (data: { roomCode: string; name: string; avatar: string }, callback: (result: any) => void) => void;
  "room:host-reconnect":  (data: { roomId: string }, callback: (result: any) => void) => void;
  "room:start":           (data: { roomId: string }) => void;
  "room:set-category":    (data: { roomId: string; mode: string; category?: string }) => void;
  "room:kick":            (data: { roomId: string; playerId: string }) => void;
  "player:set-category":  (data: { roomId: string; category: string }) => void;
  "game:submit-answer":   (data: { roomId: string; questionId: string; answer: string }) => void;
  // Solo mode
  "solo:start":           (data: { category: string; difficulty: string }, callback: (result: any) => void) => void;
  "solo:answer":          (data: { sessionId: string; answer: "A" | "B" | "C" | "D" }) => void;
  "solo:abandon":         (data: { sessionId: string }) => void;
};

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 5000,
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
