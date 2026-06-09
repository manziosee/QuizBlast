import { Server } from "socket.io";
import { getRoomById, saveRoom } from "./RoomService";
import { selectQuestionsForGame } from "./QuestionService";
import type { Room, Question, PlayerRanking, Category, ClientToServerEvents, ServerToClientEvents } from "../types";

const QUESTION_MS = 60_000;
const RESULT_MS = 5_000;

type IO = Server<ClientToServerEvents, ServerToClientEvents>;

const roomQuestions = new Map<string, Question[]>();
const roomTimers = new Map<string, NodeJS.Timeout>();

export async function startGame(io: IO, roomId: string): Promise<void> {
  const room = await getRoomById(roomId);
  if (!room) return;

  const category: Category = room.category ?? "common";
  const questions = await selectQuestionsForGame(category);
  roomQuestions.set(roomId, questions);

  room.status = "active";
  room.currentQuestionIndex = 0;
  room.gameStartedAt = Date.now();
  await saveRoom(room);

  sendQuestion(io, room, questions, 0);
}

async function sendQuestion(io: IO, room: Room, questions: Question[], index: number): Promise<void> {
  const question = questions[index];
  if (!question) return;

  const timerEndsAt = Date.now() + QUESTION_MS;
  room.questionStartedAt = Date.now();
  room.timerEndsAt = timerEndsAt;
  room.currentQuestionIndex = index;
  await saveRoom(room);

  // Never send correctAnswer or explanation to clients
  const { correctAnswer: _c, explanation: _e, ...publicQuestion } = question;

  io.to(room.id).emit("game:question", {
    question: publicQuestion,
    index,
    total: questions.length,
    timerEndsAt,
  });

  const timer = setTimeout(() => resolveQuestion(io, room.id, question), QUESTION_MS);
  roomTimers.set(`${room.id}:${index}`, timer);
}

async function resolveQuestion(io: IO, roomId: string, question: Question): Promise<void> {
  const room = await getRoomById(roomId);
  if (!room) return;

  const playerResults = room.players.map((player) => {
    const ans = player.answers.find((a) => a.questionId === question.id);
    return {
      playerId: player.id,
      selectedOption: ans?.selectedOption ?? null,
      isCorrect: ans?.isCorrect ?? false,
    };
  });

  io.to(roomId).emit("game:question-result", {
    questionId: question.id,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    playerResults,
  });

  const questions = roomQuestions.get(roomId) ?? [];
  const nextIndex = room.currentQuestionIndex + 1;

  setTimeout(async () => {
    if (nextIndex < questions.length) {
      const fresh = await getRoomById(roomId);
      if (fresh) sendQuestion(io, fresh, questions, nextIndex);
    } else {
      endGame(io, roomId);
    }
  }, RESULT_MS);
}

export async function recordAnswer(
  roomId: string,
  playerId: string,
  questionId: string,
  selectedOption: "A" | "B" | "C" | "D"
): Promise<void> {
  const room = await getRoomById(roomId);
  if (!room) return;

  const questions = roomQuestions.get(roomId) ?? [];
  const question = questions.find((q) => q.id === questionId);
  if (!question) return;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return;

  if (player.answers.some((a) => a.questionId === questionId)) return;

  const isCorrect = selectedOption === question.correctAnswer;
  player.answers.push({ questionId, selectedOption, isCorrect, answeredAt: Date.now() });
  if (isCorrect) player.score += 100;

  await saveRoom(room);
}

async function endGame(io: IO, roomId: string): Promise<void> {
  const room = await getRoomById(roomId);
  if (!room) return;

  room.status = "ended";
  await saveRoom(room);

  const rankings: PlayerRanking[] = [...room.players]
    .sort((a, b) => b.score - a.score)
    .map((player, i) => ({
      position: i + 1,
      player,
      correctCount: player.answers.filter((a) => a.isCorrect).length,
      wrongCount: player.answers.filter((a) => !a.isCorrect).length,
    }));

  io.to(roomId).emit("game:ended", rankings);
  roomQuestions.delete(roomId);
}

export function clearRoomTimers(roomId: string): void {
  for (const [key, timer] of roomTimers.entries()) {
    if (key.startsWith(roomId)) {
      clearTimeout(timer);
      roomTimers.delete(key);
    }
  }
}
