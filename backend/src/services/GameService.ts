import { Server } from "socket.io";
import { getRoomById, saveRoom } from "./RoomService";
import { selectQuestionsForGame, selectQuestionsPerPlayer } from "./QuestionService";
import type { Room, Question, PlayerRanking, ClientToServerEvents, ServerToClientEvents } from "../types";

const QUESTION_MS = 60_000;
const RESULT_MS   = 5_000;

type IO = Server<ClientToServerEvents, ServerToClientEvents>;

// roomId → questions for group mode, or playerId → questions for individual mode
const roomQuestions    = new Map<string, Question[]>();
const playerQuestions  = new Map<string, Map<string, Question[]>>(); // roomId → Map<playerId, Question[]>
const roomTimers       = new Map<string, NodeJS.Timeout>();

// ── Start ─────────────────────────────────────────────────────────────────────

export async function startGame(io: IO, roomId: string): Promise<void> {
  const room = await getRoomById(roomId);
  if (!room) return;

  if (room.categoryMode === "individual") {
    const perPlayer = await selectQuestionsPerPlayer(room.players);
    playerQuestions.set(roomId, perPlayer);
    // Use first player's questions as the "shared" list for timing — all 10 questions run on same clock
    const first = room.players[0];
    const questions = perPlayer.get(first.id) ?? await selectQuestionsForGame("common");
    roomQuestions.set(roomId, questions);
  } else {
    const questions = await selectQuestionsForGame(room.category ?? "common");
    roomQuestions.set(roomId, questions);
  }

  room.status = "active";
  room.currentQuestionIndex = 0;
  room.gameStartedAt = Date.now();
  await saveRoom(room);

  sendQuestion(io, room, 0);
}

// ── Send question ─────────────────────────────────────────────────────────────

async function sendQuestion(io: IO, room: Room, index: number): Promise<void> {
  const questions = roomQuestions.get(room.id) ?? [];
  const question  = questions[index];
  if (!question) return;

  const timerEndsAt = Date.now() + QUESTION_MS;
  room.questionStartedAt = Date.now();
  room.timerEndsAt       = timerEndsAt;
  room.currentQuestionIndex = index;
  await saveRoom(room);

  if (room.categoryMode === "individual") {
    // Send each player their own question
    const perPlayer = playerQuestions.get(room.id);
    if (perPlayer) {
      for (const player of room.players) {
        const pq = perPlayer.get(player.id);
        if (!pq) continue;
        const pQuestion = pq[index];
        if (!pQuestion) continue;
        const { correctAnswer: _c, explanation: _e, ...pub } = pQuestion;
        io.to(player.id).emit("game:question", { question: pub, index, total: questions.length, timerEndsAt });
      }
    }
  } else {
    const { correctAnswer: _c, explanation: _e, ...pub } = question;
    io.to(room.id).emit("game:question", { question: pub, index, total: questions.length, timerEndsAt });
  }

  const timer = setTimeout(() => resolveQuestion(io, room.id, index), QUESTION_MS);
  roomTimers.set(`${room.id}:${index}`, timer);
}

// ── Resolve question ──────────────────────────────────────────────────────────

async function resolveQuestion(io: IO, roomId: string, index: number): Promise<void> {
  const room = await getRoomById(roomId);
  if (!room) return;

  const questions  = roomQuestions.get(roomId) ?? [];
  const question   = questions[index];
  if (!question) return;

  const playerResults = room.players.map((player) => {
    // In individual mode, get the correct answer for this player's question
    let correctAnswer = question.correctAnswer;
    if (room.categoryMode === "individual") {
      const pq = playerQuestions.get(roomId)?.get(player.id);
      if (pq) correctAnswer = pq[index]?.correctAnswer ?? correctAnswer;
    }
    const ans = player.answers.find((a) => a.questionId === (
      room.categoryMode === "individual"
        ? playerQuestions.get(roomId)?.get(player.id)?.[index]?.id ?? question.id
        : question.id
    ));
    return {
      playerId: player.id,
      selectedOption: ans?.selectedOption ?? null,
      isCorrect: ans?.isCorrect ?? false,
    };
  });

  // Emit result — in individual mode each player gets their own question's answer
  if (room.categoryMode === "individual") {
    const perPlayer = playerQuestions.get(roomId);
    for (const player of room.players) {
      const pq = perPlayer?.get(player.id);
      const pQuestion = pq?.[index];
      if (!pQuestion) continue;
      io.to(player.id).emit("game:question-result", {
        questionId: pQuestion.id,
        correctAnswer: pQuestion.correctAnswer,
        explanation: pQuestion.explanation,
        playerResults,
      });
    }
  } else {
    io.to(roomId).emit("game:question-result", {
      questionId: question.id,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      playerResults,
    });
  }

  // Live leaderboard after each question
  const leaderboard = buildRankings(room);
  io.to(roomId).emit("game:leaderboard", leaderboard);

  const nextIndex = index + 1;
  const nextTimer = setTimeout(async () => {
    const fresh = await getRoomById(roomId);
    if (!fresh) return;
    if (nextIndex < questions.length) {
      sendQuestion(io, fresh, nextIndex);
    } else {
      endGame(io, roomId);
    }
  }, RESULT_MS);
  roomTimers.set(`${roomId}:next:${index}`, nextTimer);
}

// ── Record answer ─────────────────────────────────────────────────────────────

export async function recordAnswer(
  roomId: string,
  playerId: string,
  questionId: string,
  selectedOption: "A" | "B" | "C" | "D"
): Promise<void> {
  const room = await getRoomById(roomId);
  if (!room) return;

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return;
  if (player.answers.some((a) => a.questionId === questionId)) return; // no double answers

  // Find correct answer — group mode uses shared questions, individual uses per-player
  let isCorrect = false;
  if (room.categoryMode === "individual") {
    const pq = playerQuestions.get(roomId)?.get(playerId);
    const q = pq?.find((q) => q.id === questionId);
    isCorrect = q?.correctAnswer === selectedOption;
  } else {
    const q = (roomQuestions.get(roomId) ?? []).find((q) => q.id === questionId);
    isCorrect = q?.correctAnswer === selectedOption;
  }

  player.answers.push({ questionId, selectedOption, isCorrect, answeredAt: Date.now() });
  if (isCorrect) player.score += 100;

  await saveRoom(room);
}

// ── End game ──────────────────────────────────────────────────────────────────

async function endGame(io: IO, roomId: string): Promise<void> {
  const room = await getRoomById(roomId);
  if (!room) return;

  fillMissingAnswers(room);
  room.status = "ended";
  await saveRoom(room);

  io.to(roomId).emit("game:ended", buildRankings(room));

  roomQuestions.delete(roomId);
  playerQuestions.delete(roomId);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getQuestionIdForPlayer(roomId: string, room: Room, playerId: string, index: number): string | null {
  if (room.categoryMode === "individual") {
    return playerQuestions.get(roomId)?.get(playerId)?.[index]?.id ?? null;
  }

  return roomQuestions.get(roomId)?.[index]?.id ?? null;
}

function fillMissingAnswers(room: Room): void {
  for (const player of room.players) {
    for (let i = 0; i < room.totalQuestions; i++) {
      const questionId = getQuestionIdForPlayer(room.id, room, player.id, i);
      if (!questionId || player.answers.some((answer) => answer.questionId === questionId)) continue;
      player.answers.push({
        questionId,
        selectedOption: null,
        isCorrect: false,
        answeredAt: Date.now(),
      });
    }
  }
}

function buildRankings(room: Room): PlayerRanking[] {
  return [...room.players]
    .sort((a, b) => b.score - a.score)
    .map((player, i) => ({
      position: i + 1,
      player,
      correctCount: player.answers.filter((a) => a.isCorrect).length,
      wrongCount:   player.answers.filter((a) => !a.isCorrect).length,
    }));
}

export function clearRoomTimers(roomId: string): void {
  for (const [key, timer] of roomTimers.entries()) {
    if (key.startsWith(roomId)) {
      clearTimeout(timer);
      roomTimers.delete(key);
    }
  }
  roomQuestions.delete(roomId);
  playerQuestions.delete(roomId);
}

// Called periodically — cleans up rooms where all players left mid-game
export function checkAndCleanEmptyRooms(io: IO): void {
  for (const [roomId] of roomQuestions.entries()) {
    const sockets = io.sockets.adapter.rooms.get(roomId);
    if (!sockets || sockets.size === 0) {
      clearRoomTimers(roomId);
    }
  }
}
