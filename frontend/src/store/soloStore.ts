import { create } from "zustand";
import type { Question, AvatarSeed } from "@/types";

export type SoloDifficulty = "easy" | "medium" | "hard" | "mixed";

export interface SoloResult {
  isCorrect: boolean;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  score: number;
}

export interface SoloEnded {
  score: number;
  correctCount: number;
  totalQuestions: number;
  maxScore: number;
  percentage: number;
}

interface BotState {
  name: string;
  avatar: AvatarSeed;
  score: number;
  lastAnswer: "A" | "B" | "C" | "D" | null;
  answeredAt: number | null; // ms from question start when bot "answered"
}

interface SoloState {
  // Session
  sessionId: string | null;
  category: string | null;
  difficulty: SoloDifficulty;
  // In-game
  currentQuestion: Question | null;
  questionIndex: number;
  timerEndsAt: number | null;
  totalMs: number;
  myAnswer: "A" | "B" | "C" | "D" | null;
  lastResult: SoloResult | null;
  myScore: number;
  // Bot
  bot: BotState | null;
  // End
  ended: SoloEnded | null;

  // Actions
  setSession: (sessionId: string, category: string, difficulty: SoloDifficulty) => void;
  setBot: (bot: BotState) => void;
  setQuestion: (q: Question, index: number, timerEndsAt: number, totalMs: number) => void;
  setAnswer: (answer: "A" | "B" | "C" | "D") => void;
  setResult: (result: SoloResult) => void;
  setBotAnswer: (answer: "A" | "B" | "C" | "D" | null, isCorrect: boolean) => void;
  setEnded: (ended: SoloEnded) => void;
  reset: () => void;
}

const BOT_NAMES: string[] = ["QuizBot", "Brainy", "Smarty", "Genius", "IQ-9000", "BrainCell"];
const BOT_AVATARS: AvatarSeed[] = ["goku", "saitama", "todoroki", "ichigo", "killua"];

function randomBot(): BotState {
  return {
    name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
    avatar: BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)],
    score: 0,
    lastAnswer: null,
    answeredAt: null,
  };
}

export const useSoloStore = create<SoloState>((set) => ({
  sessionId: null,
  category: null,
  difficulty: "mixed",
  currentQuestion: null,
  questionIndex: 0,
  timerEndsAt: null,
  totalMs: 30_000,
  myAnswer: null,
  lastResult: null,
  myScore: 0,
  bot: null,
  ended: null,

  setSession: (sessionId, category, difficulty) =>
    set({ sessionId, category, difficulty, bot: randomBot(), myScore: 0, ended: null }),

  setBot: (bot) => set({ bot }),

  setQuestion: (q, index, timerEndsAt, totalMs) =>
    set((s) => ({
      currentQuestion: q,
      questionIndex: index,
      timerEndsAt,
      totalMs,
      myAnswer: null,
      lastResult: null,
      bot: s.bot ? { ...s.bot, lastAnswer: null, answeredAt: null } : null,
    })),

  setAnswer: (answer) => set({ myAnswer: answer }),

  setResult: (result) =>
    set((s) => ({ lastResult: result, myScore: result.score })),

  setBotAnswer: (answer, isCorrect) =>
    set((s) => ({
      bot: s.bot
        ? { ...s.bot, lastAnswer: answer, answeredAt: Date.now(), score: s.bot.score + (isCorrect ? 100 : 0) }
        : null,
    })),

  setEnded: (ended) => set({ ended }),

  reset: () =>
    set({
      sessionId: null, category: null, difficulty: "mixed",
      currentQuestion: null, questionIndex: 0, timerEndsAt: null, totalMs: 30_000,
      myAnswer: null, lastResult: null, myScore: 0, bot: null, ended: null,
    }),
}));

export { randomBot };
