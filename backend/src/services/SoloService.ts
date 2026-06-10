import { v4 as uuidv4 } from "uuid";
import { generateSoloQuestion } from "./AIQuestionService";
import type { Question, Category } from "../types";

export type SoloDifficulty = "easy" | "medium" | "hard" | "mixed";

export interface SoloSession {
  id: string;
  socketId: string;
  category: Category;
  difficulty: SoloDifficulty;
  questions: Question[];           // questions already generated (grow as game progresses)
  pendingQuestion: Promise<Question> | null; // prefetch for next question
  currentIndex: number;
  score: number;
  correctCount: number;
  timerRef: NodeJS.Timeout | null;
  resultTimerRef: NodeJS.Timeout | null;
  createdAt: number;
  usedIds: string[];               // question IDs already served — prevents MMLU repeats
}

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

const TOTAL_QUESTIONS = 10;
const QUESTION_MS     = 30_000; // 30 seconds per question in solo mode
const RESULT_MS       = 4_000;  // show result for 4 seconds before next question

const sessions = new Map<string, SoloSession>();

// Clean up stale sessions every 10 minutes (sessions older than 30 min)
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, s] of sessions.entries()) {
    if (s.createdAt < cutoff) {
      if (s.timerRef) clearTimeout(s.timerRef);
      if (s.resultTimerRef) clearTimeout(s.resultTimerRef);
      sessions.delete(id);
    }
  }
}, 10 * 60 * 1000);

export function getSession(id: string): SoloSession | null {
  return sessions.get(id) ?? null;
}

export function getSessionBySocket(socketId: string): SoloSession | null {
  for (const s of sessions.values()) {
    if (s.socketId === socketId) return s;
  }
  return null;
}

export function deleteSession(id: string): void {
  const s = sessions.get(id);
  if (s) {
    if (s.timerRef) clearTimeout(s.timerRef);
    if (s.resultTimerRef) clearTimeout(s.resultTimerRef);
    sessions.delete(id);
  }
}

// Create a session and pre-generate the first 2 questions
export async function createSession(socketId: string, category: Category, difficulty: SoloDifficulty): Promise<SoloSession> {
  // Delete any existing session for this socket
  const existing = getSessionBySocket(socketId);
  if (existing) deleteSession(existing.id);

  const q1 = await generateSoloQuestion(category, difficulty, []);

  const session: SoloSession = {
    id: uuidv4(),
    socketId,
    category,
    difficulty,
    questions: [q1],
    pendingQuestion: generateSoloQuestion(category, difficulty, [q1.id]),
    currentIndex: 0,
    score: 0,
    correctCount: 0,
    timerRef: null,
    resultTimerRef: null,
    createdAt: Date.now(),
    usedIds: [q1.id],
  };

  sessions.set(session.id, session);
  return session;
}

// Get current question for a session (already loaded)
export function getCurrentQuestion(session: SoloSession): Question {
  return session.questions[session.currentIndex];
}

// Record a player answer — returns the result payload
export function recordSoloAnswer(
  session: SoloSession,
  answer: "A" | "B" | "C" | "D" | null
): SoloResult {
  const question = getCurrentQuestion(session);
  const isCorrect = answer !== null && answer === question.correctAnswer;
  if (isCorrect) {
    session.score += 100;
    session.correctCount += 1;
  }
  return { isCorrect, correctAnswer: question.correctAnswer, explanation: question.explanation, score: session.score };
}

// Advance to next question — awaits the prefetched question
export async function advanceSession(session: SoloSession): Promise<Question | null> {
  session.currentIndex += 1;
  if (session.currentIndex >= TOTAL_QUESTIONS) return null;

  // Await the prefetched question if not already in list
  if (session.currentIndex >= session.questions.length) {
    const q = await (session.pendingQuestion ?? generateSoloQuestion(session.category, session.difficulty, session.usedIds));
    session.questions.push(q);
    session.usedIds.push(q.id);
  }

  const current = session.questions[session.currentIndex];
  // Pre-fetch the question after this one
  if (session.currentIndex + 1 < TOTAL_QUESTIONS) {
    session.pendingQuestion = generateSoloQuestion(session.category, session.difficulty, session.usedIds);
  } else {
    session.pendingQuestion = null;
  }

  return current;
}

export function buildEndedPayload(session: SoloSession): SoloEnded {
  const maxScore = TOTAL_QUESTIONS * 100;
  return {
    score:          session.score,
    correctCount:   session.correctCount,
    totalQuestions: TOTAL_QUESTIONS,
    maxScore,
    percentage: Math.round((session.score / maxScore) * 100),
  };
}

export { TOTAL_QUESTIONS, QUESTION_MS, RESULT_MS };
