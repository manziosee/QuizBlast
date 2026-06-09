import QRCode from "qrcode";
import type { Player, Question, PlayerRanking, AvatarSeed, Category } from "@/types";
import { AVATARS, CATEGORIES } from "./constants";

// ── helpers ───────────────────────────────────────────────────────────────────

function randomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ── QR generation (browser, canvas → dataURL) ─────────────────────────────────

export async function generateMockRoom(): Promise<{
  code: string;
  joinUrl: string;
  qrCodeBase64: string;
}> {
  const code = randomCode();
  const joinUrl = `${window.location.origin}/join/${code}`;
  const qrCodeBase64 = await QRCode.toDataURL(joinUrl, {
    width: 300,
    margin: 2,
    color: { dark: "#1a1b27", light: "#ffffff" },
  });
  return { code, joinUrl, qrCodeBase64 };
}

// ── fake players ──────────────────────────────────────────────────────────────

const MOCK_NAMES = ["Kaka", "Peter", "Lisa", "Amani", "Bosco", "Diane", "Eric", "Fatou"];

export function generateMockPlayers(count = 4): Player[] {
  const seeds = shuffle(AVATARS).slice(0, count);
  const names = shuffle(MOCK_NAMES).slice(0, count);
  return seeds.map((a, i) => ({
    id: `mock-player-${i}`,
    name: names[i],
    avatar: a.seed as AvatarSeed,
    score: 0,
    answers: [],
    isHost: false,
    isConnected: true,
  }));
}

// ── mock questions ─────────────────────────────────────────────────────────────

const MOCK_QUESTIONS: Question[] = [
  {
    id: "q1", category: "math", difficulty: "easy",
    text: "What is 12 × 12?",
    options: { A: "132", B: "144", C: "124", D: "148" },
    correctAnswer: "B", explanation: "12 × 12 = 144. A perfect square.",
  },
  {
    id: "q2", category: "science", difficulty: "easy",
    text: "What is the chemical symbol for water?",
    options: { A: "WA", B: "H₂O", C: "HO₂", D: "W" },
    correctAnswer: "B", explanation: "Water is 2 hydrogen + 1 oxygen: H₂O.",
  },
  {
    id: "q3", category: "history", difficulty: "easy",
    text: "In which year did World War II end?",
    options: { A: "1943", B: "1944", C: "1945", D: "1946" },
    correctAnswer: "C", explanation: "WWII ended in 1945.",
  },
  {
    id: "q4", category: "geography", difficulty: "easy",
    text: "What is the capital city of Rwanda?",
    options: { A: "Butare", B: "Gisenyi", C: "Kigali", D: "Musanze" },
    correctAnswer: "C", explanation: "Kigali is the capital of Rwanda.",
  },
  {
    id: "q5", category: "common", difficulty: "medium",
    text: "How many bones are in the adult human body?",
    options: { A: "186", B: "196", C: "206", D: "216" },
    correctAnswer: "C", explanation: "The adult human body has 206 bones.",
  },
  {
    id: "q6", category: "math", difficulty: "medium",
    text: "What is the square root of 225?",
    options: { A: "13", B: "14", C: "15", D: "16" },
    correctAnswer: "C", explanation: "15 × 15 = 225.",
  },
  {
    id: "q7", category: "science", difficulty: "medium",
    text: "What gas do plants absorb during photosynthesis?",
    options: { A: "Oxygen", B: "Nitrogen", C: "Carbon dioxide", D: "Hydrogen" },
    correctAnswer: "C", explanation: "Plants absorb CO₂ and release oxygen.",
  },
  {
    id: "q8", category: "geography", difficulty: "hard",
    text: "Which African country has the most pyramids?",
    options: { A: "Egypt", B: "Libya", C: "Sudan", D: "Ethiopia" },
    correctAnswer: "C", explanation: "Sudan has ~200–255 pyramids, more than Egypt.",
  },
  {
    id: "q9", category: "history", difficulty: "hard",
    text: "The French Revolution began in which year?",
    options: { A: "1776", B: "1789", C: "1799", D: "1804" },
    correctAnswer: "B", explanation: "The French Revolution began in 1789.",
  },
  {
    id: "q10", category: "math", difficulty: "hard",
    text: "What is the derivative of f(x) = x³ + 2x?",
    options: { A: "3x + 2", B: "3x² + 2", C: "x² + 2", D: "3x² + 2x" },
    correctAnswer: "B", explanation: "d/dx(x³) = 3x², d/dx(2x) = 2 → f′(x) = 3x² + 2.",
  },
];

export function getMockQuestions(category?: Category): Question[] {
  if (!category || category === "common") return MOCK_QUESTIONS;
  const filtered = MOCK_QUESTIONS.filter((q) => q.category === category);
  // pad with any questions if category has fewer than 10
  const padded = [...filtered];
  while (padded.length < 10) padded.push(pick(MOCK_QUESTIONS));
  return padded.slice(0, 10);
}

// ── mock game loop ─────────────────────────────────────────────────────────────

export interface MockGameCallbacks {
  onQuestion: (q: Omit<Question, "correctAnswer" | "explanation">, index: number, timerEndsAt: number) => void;
  onResult: (result: {
    questionId: string;
    correctAnswer: "A" | "B" | "C" | "D";
    explanation: string;
    playerResults: { playerId: string; selectedOption: "A" | "B" | "C" | "D" | null; isCorrect: boolean }[];
  }) => void;
  onEnded: (rankings: PlayerRanking[]) => void;
  getMyAnswer: () => "A" | "B" | "C" | "D" | null;
  getPlayers: () => Player[];
  updatePlayers: (players: Player[]) => void;
  // called by the game page when player clicks "Next →"
  onSkipReady: (skipFn: () => void) => void;
}

const QUESTION_MS = 30_000;
const RESULT_MS   = 5_000;

export function runMockGame(questions: Question[], cb: MockGameCallbacks): () => void {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  function addTimer(fn: () => void, ms: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => { if (!cancelled) fn(); }, ms);
    timers.push(id);
    return id;
  }

  function runQuestion(index: number) {
    if (index >= questions.length || cancelled) return;

    const q = questions[index];
    const timerEndsAt = Date.now() + QUESTION_MS;
    const { correctAnswer: _c, explanation: _e, ...publicQ } = q;
    cb.onQuestion(publicQ, index, timerEndsAt);

    // timer that fires when 30 s runs out — can be cancelled by skip
    let resolveTimerId = addTimer(() => resolveQuestion(q, index), QUESTION_MS);

    // expose a skip function so the game page can call it
    cb.onSkipReady(() => {
      // cancel the pending auto-resolve and fire immediately
      clearTimeout(resolveTimerId);
      if (!cancelled) resolveQuestion(q, index);
    });
  }

  function resolveQuestion(q: Question, index: number) {
    const players = cb.getPlayers().map((p) => {
      const guessed = Math.random() > 0.4 ? q.correctAnswer : pick(["A", "B", "C", "D"] as const);
      const isCorrect = guessed === q.correctAnswer;
      return {
        ...p,
        score: p.score + (isCorrect ? 100 : 0),
        answers: [...p.answers, { questionId: q.id, selectedOption: guessed, isCorrect, answeredAt: Date.now() }],
      };
    });
    cb.updatePlayers(players);

    const myAnswer = cb.getMyAnswer();
    const playerResults = [
      ...players.map((p) => ({
        playerId: p.id,
        selectedOption: p.answers.at(-1)?.selectedOption ?? null,
        isCorrect: p.answers.at(-1)?.isCorrect ?? false,
      })),
      { playerId: "me", selectedOption: myAnswer, isCorrect: myAnswer === q.correctAnswer },
    ];

    cb.onResult({ questionId: q.id, correctAnswer: q.correctAnswer, explanation: q.explanation, playerResults });

    // after result is shown, wait then advance — or wait for player to click Next
    let nextTimerId = addTimer(() => advance(index, players), RESULT_MS);

    cb.onSkipReady(() => {
      clearTimeout(nextTimerId);
      if (!cancelled) advance(index, players);
    });
  }

  function advance(index: number, players: Player[]) {
    if (index + 1 < questions.length) runQuestion(index + 1);
    else endGame(players);
  }

  function endGame(players: Player[]) {
    const rankings: PlayerRanking[] = [...players]
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({
        position: i + 1,
        player: p,
        correctCount: p.answers.filter((a) => a.isCorrect).length,
        wrongCount: p.answers.filter((a) => !a.isCorrect).length,
      }));
    cb.onEnded(rankings);
  }

  runQuestion(0);

  return () => {
    cancelled = true;
    timers.forEach(clearTimeout);
  };
}
