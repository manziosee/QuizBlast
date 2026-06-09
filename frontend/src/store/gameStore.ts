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
  lastResult: QuestionResult | null;
  myAnswer: "A" | "B" | "C" | "D" | null;
  rankings: PlayerRanking[];
  skipFn: (() => void) | null;   // set by mock engine, called by game page

  setMyInfo: (id: string, name: string, avatar: AvatarSeed) => void;
  setRoom: (room: Room) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setQuestion: (q: Omit<Question, "correctAnswer" | "explanation">, index: number, timerEndsAt: number) => void;
  setAnswer: (answer: "A" | "B" | "C" | "D") => void;
  setResult: (result: QuestionResult) => void;
  setRankings: (rankings: PlayerRanking[]) => void;
  setSkipFn: (fn: (() => void) | null) => void;
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
  lastResult: null,
  myAnswer: null,
  rankings: [],
  skipFn: null,

  setMyInfo: (id, name, avatar) => set({ myId: id, myName: name, myAvatar: avatar }),
  setRoom: (room) => set({ room }),
  addPlayer: (player) =>
    set((s) => ({ room: s.room ? { ...s.room, players: [...s.room.players, player] } : null })),
  removePlayer: (playerId) =>
    set((s) => ({ room: s.room ? { ...s.room, players: s.room.players.filter((p) => p.id !== playerId) } : null })),
  setQuestion: (q, index, timerEndsAt) =>
    set({ currentQuestion: q, questionIndex: index, timerEndsAt, myAnswer: null, lastResult: null, skipFn: null }),
  setAnswer: (answer) => set({ myAnswer: answer }),
  setResult: (result) => set({ lastResult: result }),
  setRankings: (rankings) => set({ rankings }),
  setSkipFn: (fn) => set({ skipFn: fn }),
  reset: () => set({ room: null, currentQuestion: null, questionIndex: 0, timerEndsAt: null, lastResult: null, myAnswer: null, rankings: [], skipFn: null }),
}));
