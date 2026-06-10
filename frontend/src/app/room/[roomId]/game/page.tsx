"use client";
import { useEffect, useState } from "react";
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
    totalMs,
    myAnswer,
    lastResult,
    myId,
    answeredCount,
    isReconnecting,
    setAnswer,
  } = useGameStore();
  const { secondsLeft, percentage, isUrgent } = useTimer(timerEndsAt, totalMs);

  const [showScorePopup, setShowScorePopup] = useState(false);

  // Trigger +100 popup when a correct result arrives
  useEffect(() => {
    if (!lastResult) return;
    const myResult = lastResult.playerResults.find((r) => r.playerId === myId);
    if (myResult?.isCorrect) {
      setShowScorePopup(true);
      const t = setTimeout(() => setShowScorePopup(false), 1800);
      return () => clearTimeout(t);
    }
  }, [lastResult, myId]);

  function submitAnswer(answer: (typeof OPTIONS)[number]) {
    if (myAnswer || !currentQuestion || !room) return;
    setAnswer(answer);
    socket.emit("game:submit-answer", {
      roomId: room.id,
      questionId: currentQuestion.id,
      answer,
    });
  }

  if (isReconnecting) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
        <p className="text-amber-400 font-bold">Reconnecting…</p>
        <p className="text-white/25 text-sm">Hold tight, we're getting you back in</p>
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-white/15 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-white/35 font-bold">Loading question…</p>
      </main>
    );
  }

  const myResult  = lastResult?.playerResults.find((r) => r.playerId === myId);
  const totalQ    = room?.totalQuestions ?? 10;
  const myScore   = room?.players.find((p) => p.id === myId)?.score ?? 0;
  const totalPlayers = room?.players.length ?? 0;
  const catMeta   = getCategoryMeta(currentQuestion.category);

  return (
    <main className="min-h-screen px-4 py-5 max-w-2xl mx-auto flex flex-col gap-4 relative">
      {/* +100 score popup */}
      <AnimatePresence>
        {showScorePopup && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -60, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <span className="text-4xl font-black text-emerald-400 drop-shadow-lg">+100</span>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Progress dots + answered counter */}
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
        <div className="flex items-center gap-3 flex-shrink-0">
          {totalPlayers > 0 && (
            <span className="text-white/30 text-[11px] font-bold tabular-nums">
              ✅ {answeredCount}/{totalPlayers} answered
            </span>
          )}
          <span className="text-white/35 text-[11px] font-black tabular-nums">
            🏆 {myScore.toLocaleString()} pts
          </span>
        </div>
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
          <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ResultBanner isCorrect={myResult.isCorrect} explanation={lastResult.explanation} />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-white/30 text-sm font-bold mt-3 flex items-center justify-center gap-2"
            >
              <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" />
              {questionIndex + 1 >= totalQ ? "Calculating final scores…" : "Next question coming up…"}
            </motion.p>
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
