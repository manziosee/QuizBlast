import { Server, Socket } from "socket.io";
import {
  createSession, getSession, deleteSession,
  getCurrentQuestion, recordSoloAnswer, advanceSession, buildEndedPayload,
  QUESTION_MS, RESULT_MS,
} from "../services/SoloService";
import type { ClientToServerEvents, ServerToClientEvents } from "../types";

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerSoloHandlers(io: IO, socket: AppSocket): void {

  // ── solo:start ────────────────────────────────────────────────────────────
  socket.on("solo:start", async ({ category, difficulty }, callback) => {
    try {
      const session = await createSession(socket.id, category, difficulty);
      const question = getCurrentQuestion(session);
      const timerEndsAt = Date.now() + QUESTION_MS;

      // Start the question timer (time out if player doesn't answer)
      session.timerRef = setTimeout(async () => {
        await handleTimeout(io, socket, session.id);
      }, QUESTION_MS);

      callback({ sessionId: session.id, question, index: 0, total: 10, timerEndsAt, totalMs: QUESTION_MS });
    } catch (err) {
      console.error("[solo:start] error:", (err as Error).message);
      socket.emit("error", "Failed to start solo game. Please try again.");
    }
  });

  // ── solo:answer ───────────────────────────────────────────────────────────
  socket.on("solo:answer", async ({ sessionId, answer }) => {
    const session = getSession(sessionId);
    if (!session || session.socketId !== socket.id) return;

    // Cancel the question timer
    if (session.timerRef) { clearTimeout(session.timerRef); session.timerRef = null; }

    const result = recordSoloAnswer(session, answer);
    socket.emit("solo:result", result);

    // Schedule next question after result display
    session.resultTimerRef = setTimeout(async () => {
      await sendNextOrEnd(socket, session.id);
    }, RESULT_MS);
  });

  // ── solo:abandon ──────────────────────────────────────────────────────────
  socket.on("solo:abandon", ({ sessionId }) => {
    const session = getSession(sessionId);
    if (!session || session.socketId !== socket.id) return;
    deleteSession(sessionId);
  });

  // Clean up sessions on disconnect
  socket.on("disconnect", () => {
    // Sessions auto-expire after 30 min; no need to delete immediately
    // (player might reconnect). The cleanup interval handles garbage collection.
  });
}

// Shared logic: send next question or emit solo:ended
async function sendNextOrEnd(socket: AppSocket, sessionId: string) {
  const session = getSession(sessionId);
  if (!session) return;

  try {
    const next = await advanceSession(session);
    if (!next) {
      const ended = buildEndedPayload(session);
      socket.emit("solo:ended", ended);
      deleteSession(sessionId);
      return;
    }

    const timerEndsAt = Date.now() + QUESTION_MS;
    session.timerRef = setTimeout(async () => {
      await handleTimeout(null, socket, sessionId);
    }, QUESTION_MS);

    socket.emit("solo:question", {
      sessionId,
      question: next,
      index: session.currentIndex,
      total: 10,
      timerEndsAt,
      totalMs: QUESTION_MS,
    });
  } catch (err) {
    console.error("[sendNextOrEnd] error:", (err as Error).message);
    socket.emit("error", "Failed to load next question.");
    deleteSession(sessionId);
  }
}

// Handle question timeout (player ran out of time)
async function handleTimeout(_io: IO | null, socket: AppSocket, sessionId: string) {
  const session = getSession(sessionId);
  if (!session) return;

  session.timerRef = null;
  const result = recordSoloAnswer(session, null); // null = no answer
  socket.emit("solo:result", result);

  session.resultTimerRef = setTimeout(async () => {
    await sendNextOrEnd(socket, sessionId);
  }, RESULT_MS);
}
