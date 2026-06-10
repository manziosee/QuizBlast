import { create } from "zustand";
import type { Room, Player, Question, QuestionResult, PlayerRanking, AvatarSeed } from "@/types";

interface GameState {
  myId: string | null;
  myName: string | null;
  myAvatar: AvatarSeed | null;
  room: Room | null;
  currentQuestion: Omit<Question, "correctAnswer" | "explanation"> | null;
  questionIndex: number;
  timerEndsAt: number | null;
  totalMs: number;
  lastResult: QuestionResult | null;
  myAnswer: "A" | "B" | "C" | "D" | null;
  rankings: PlayerRanking[];
  liveLeaderboard: PlayerRanking[];
  answeredCount: number;
  isReconnecting: boolean;

  setMyInfo: (id: string, name: string, avatar: AvatarSeed) => void;
  setRoom: (room: Room) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setQuestion: (q: Omit<Question, "correctAnswer" | "explanation">, index: number, timerEndsAt: number, totalMs: number) => void;
  setAnswer: (answer: "A" | "B" | "C" | "D") => void;
  setResult: (result: QuestionResult) => void;
  setRankings: (rankings: PlayerRanking[]) => void;
  setLiveLeaderboard: (rankings: PlayerRanking[]) => void;
  setAnsweredCount: (answered: number, total: number) => void;
  setReconnecting: (v: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  myId: null,
  myName: null,
  myAvatar: null,
  room: null,
  currentQuestion: null,
  questionIndex: 0,
  timerEndsAt: null,
  totalMs: 60_000,
  lastResult: null,
  myAnswer: null,
  rankings: [],
  liveLeaderboard: [],
  answeredCount: 0,
  isReconnecting: false,

  setMyInfo: (id, name, avatar) => set({ myId: id, myName: name, myAvatar: avatar }),
  setRoom: (room) => set({ room }),
  addPlayer: (player) =>
    set((s) => ({ room: s.room ? { ...s.room, players: [...s.room.players, player] } : null })),
  removePlayer: (playerId) =>
    set((s) => ({ room: s.room ? { ...s.room, players: s.room.players.filter((p) => p.id !== playerId) } : null })),
  setQuestion: (q, index, timerEndsAt, totalMs) =>
    set({ currentQuestion: q, questionIndex: index, timerEndsAt, totalMs, myAnswer: null, lastResult: null, answeredCount: 0 }),
  setAnswer: (answer) => set({ myAnswer: answer }),
  setResult: (result) => set({ lastResult: result }),
  setRankings: (rankings) => set({ rankings }),
  setLiveLeaderboard: (rankings) => set({ liveLeaderboard: rankings }),
  setAnsweredCount: (answered) => set({ answeredCount: answered }),
  setReconnecting: (v) => set({ isReconnecting: v }),
  reset: () => set({
    room: null, currentQuestion: null, questionIndex: 0, timerEndsAt: null, totalMs: 60_000,
    lastResult: null, myAnswer: null, rankings: [], liveLeaderboard: [], answeredCount: 0, isReconnecting: false,
  }),
}));
