// ── Player ────────────────────────────────────────────────
export type AvatarSeed =
  | "naruto" | "luffy" | "goku" | "saitama" | "mikasa"
  | "nezuko" | "tanjiro" | "zoro" | "ichigo" | "killua"
  | "gon"    | "todoroki";

export interface Player {
  id: string;
  name: string;
  avatar: AvatarSeed;
  score: number;
  answers: PlayerAnswer[];
  isHost: boolean;
  isConnected: boolean;
}

export interface PlayerAnswer {
  questionId: string;
  selectedOption: "A" | "B" | "C" | "D" | null;
  isCorrect: boolean;
  answeredAt: number;
}

export interface PlayerRanking {
  position: number;
  player: Player;
  correctCount: number;
  wrongCount: number;
}

// ── Question ──────────────────────────────────────────────
export type Category = "math" | "science" | "history" | "geography" | "common";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  category: Category;
  difficulty: Difficulty;
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface QuestionResult {
  questionId: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  playerResults: {
    playerId: string;
    selectedOption: "A" | "B" | "C" | "D" | null;
    isCorrect: boolean;
  }[];
}

// ── Room ──────────────────────────────────────────────────
export type RoomStatus = "waiting" | "category-select" | "active" | "ended";
export type CategoryMode = "group" | "individual";

export interface Room {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  categoryMode: CategoryMode;
  category: Category | null;
  players: Player[];
  currentQuestionIndex: number;
  totalQuestions: number;
  gameStartedAt: number | null;
  questionStartedAt: number | null;
  timerEndsAt: number | null;
}

export interface RoomSummary {
  code: string;
  joinUrl: string;
  qrCodeBase64: string;
  playerCount: number;
}
