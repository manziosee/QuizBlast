"use client";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/hooks/useSocket";
import { useTimer } from "@/hooks/useTimer";
import { useGameStore } from "@/store/gameStore";
import TimerBar from "@/components/game/TimerBar";
import AnswerButton from "@/components/game/AnswerButton";
import ResultBanner from "@/components/game/ResultBanner";
import { CATEGORIES } from "@/lib/constants";

const OPTIONS = ["A", "B", "C", "D"] as const;

function getCategoryMeta(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? { label: id, emoji: "📚" };
}

export default function GamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const socket = useSocket(roomId);
  const {
    room,
    currentQuestion,
    questionIndex,
    timerEndsAt,
    myAnswer,
    lastResult,
    myId,
    setAnswer,
    skipFn,
    setSkipFn,
  } = useGameStore();
  const { secondsLeft, percentage, isUrgent } = useTimer(timerEndsAt);

  function submitAnswer(answer: (typeof OPTIONS)[number]) {
    if (myAnswer || !currentQuestion || !room) return;
    setAnswer(answer);
    socket.emit("game:submit-answer", {
      roomId: room.id,
      questionId: currentQuestion.id,
      answer,
    });
    // In mock mode: immediately trigger question resolution so result shows at once
    skipFn?.();
    setSkipFn(null);
  }

  if (!currentQuestion) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-white/15 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-white/35 font-bold">Loading question…</p>
      </main>
    );
  }

  const myResult = lastResult?.playerResults.find((r) => r.playerId === myId);
  const totalQ = room?.totalQuestions ?? 10;
  const myScore = room?.players.find((p) => p.id === myId)?.score ?? 0;
  const catMeta = getCategoryMeta(currentQuestion.category);

  return (
    <main className="min-h-screen px-4 py-5 max-w-2xl mx-auto flex flex-col gap-4">
      {/* Top bar: category + timer */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.08] rounded-full px-3 py-1 text-xs font-black text-white/60">
            {catMeta.emoji} {catMeta.label}
          </span>
          <span className="bg-white/[0.06] border border-white/[0.08] rounded-full px-3 py-1 text-xs font-black text-white/40 capitalize">
            {currentQuestion.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-white/30 text-xs font-bold tabular-nums">
            Q&nbsp;{questionIndex + 1}/{totalQ}
          </span>
          <motion.span
            animate={{ color: isUrgent ? "#ef4444" : "#a78bfa" }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-black tabular-nums min-w-[3ch] text-right"
          >
            {secondsLeft}s
          </motion.span>
        </div>
      </div>

      {/* Timer bar */}
      <TimerBar percentage={percentage} isUrgent={isUrgent} />

      {/* Progress dots */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: totalQ }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < questionIndex
                  ? "h-1.5 w-4 bg-violet-500"
                  : i === questionIndex
                  ? "h-2 w-5 bg-amber-400"
                  : "h-1.5 w-3 bg-white/10"
              }`}
            />
          ))}
        </div>
        <span className="text-white/35 text-[11px] font-black tabular-nums">
          🏆 {myScore.toLocaleString()} pts
        </span>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.35 }}
          className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6"
        >
          <p className="text-xl sm:text-2xl font-black leading-snug text-white">
            {currentQuestion.text}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Answer grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OPTIONS.map((opt, i) => (
          <AnswerButton
            key={opt}
            option={opt}
            index={i}
            text={currentQuestion.options[opt]}
            selected={myAnswer === opt}
            locked={!!myAnswer}
            isCorrect={lastResult?.correctAnswer === opt}
            isWrong={myAnswer === opt && !!lastResult && !myResult?.isCorrect}
            revealed={!!lastResult}
            onClick={() => submitAnswer(opt)}
          />
        ))}
      </div>

      {/* Status / Result */}
      <AnimatePresence mode="wait">
        {lastResult && myResult ? (
          <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <ResultBanner isCorrect={myResult.isCorrect} explanation={lastResult.explanation} />
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { skipFn?.(); setSkipFn(null); }}
              className="w-full bg-white text-black font-black text-lg py-3.5 rounded-2xl hover:bg-white/90 transition-colors shadow-lg"
            >
              {questionIndex + 1 >= (room?.totalQuestions ?? 10) ? "See Results 🏆" : "Next Question →"}
            </motion.button>
          </motion.div>
        ) : myAnswer ? (
          <motion.div
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-2"
          >
            <div className="inline-flex items-center gap-2 text-amber-400/70">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="font-bold text-sm">Answer locked — waiting for others…</span>
            </div>
          </motion.div>
        ) : (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-white/25 text-sm font-bold py-2"
          >
            Tap an answer before time runs out!
          </motion.p>
        )}
      </AnimatePresence>
    </main>
  );
}
