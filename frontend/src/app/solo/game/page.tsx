"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { useTimer } from "@/hooks/useTimer";
import { useSoloStore } from "@/store/soloStore";
import { useGameStore } from "@/store/gameStore";
import { avatarUrl } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import TimerBar from "@/components/game/TimerBar";
import AnswerButton from "@/components/game/AnswerButton";
import ResultBanner from "@/components/game/ResultBanner";

const OPTIONS = ["A", "B", "C", "D"] as const;

// Bot accuracy by difficulty: probability bot gets it right
const BOT_ACCURACY: Record<string, number> = { easy: 0.45, medium: 0.60, hard: 0.78, mixed: 0.60 };
// Bot answer delay range in ms: [min, max]
const BOT_DELAY: Record<string, [number, number]> = {
  easy:   [3_000,  12_000],
  medium: [5_000,  20_000],
  hard:   [8_000,  28_000],
  mixed:  [4_000,  22_000],
};

function getCatMeta(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? { label: id, emoji: "📚" };
}

function pickBotAnswer(correctAnswer: "A" | "B" | "C" | "D", isCorrect: boolean): "A" | "B" | "C" | "D" {
  if (isCorrect) return correctAnswer;
  const wrong = OPTIONS.filter((o) => o !== correctAnswer);
  return wrong[Math.floor(Math.random() * wrong.length)];
}

export default function SoloGamePage() {
  const router = useRouter();
  const {
    sessionId, difficulty,
    currentQuestion, questionIndex, timerEndsAt, totalMs,
    myAnswer, lastResult, myScore, bot,
    setAnswer, setBotAnswer,
  } = useSoloStore();
  const { myId, myName, myAvatar } = useGameStore();
  const { secondsLeft, percentage, isUrgent } = useTimer(timerEndsAt, totalMs);

  const [showScorePopup, setShowScorePopup] = useState(false);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect if no session
  useEffect(() => {
    if (!sessionId) { router.push("/solo"); }
  }, [sessionId, router]);

  // Schedule bot answer when question changes
  useEffect(() => {
    if (!currentQuestion || !bot || lastResult) return;
    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    const [min, max] = BOT_DELAY[difficulty] ?? [5_000, 20_000];
    const delay = min + Math.random() * (max - min);
    const acc   = BOT_ACCURACY[difficulty] ?? 0.6;
    const isCorrect = Math.random() < acc;
    const botAnswer = pickBotAnswer(currentQuestion.correctAnswer, isCorrect);

    botTimerRef.current = setTimeout(() => {
      if (!useSoloStore.getState().myAnswer && !useSoloStore.getState().lastResult) {
        setBotAnswer(botAnswer, isCorrect);
      }
    }, delay);

    return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current); };
  }, [currentQuestion?.id, bot, difficulty]);

  // Trigger +100 popup on correct answer
  useEffect(() => {
    if (!lastResult) return;
    // Show bot answer if it hasn't been revealed yet
    if (bot && bot.lastAnswer === null && currentQuestion) {
      const acc = BOT_ACCURACY[difficulty] ?? 0.6;
      const isCorrect = Math.random() < acc;
      setBotAnswer(pickBotAnswer(currentQuestion.correctAnswer, isCorrect), isCorrect);
    }
    if (lastResult.isCorrect) {
      setShowScorePopup(true);
      const t = setTimeout(() => setShowScorePopup(false), 1800);
      return () => clearTimeout(t);
    }
  }, [lastResult]);

  function submitAnswer(answer: (typeof OPTIONS)[number]) {
    if (myAnswer || !currentQuestion || !sessionId) return;
    setAnswer(answer);
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    try {
      getSocket().emit("solo:answer", { sessionId, answer });
    } catch {}
  }

  if (!currentQuestion) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-white/15 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-white/35 font-bold">Loading question…</p>
      </main>
    );
  }

  const myResult  = lastResult;
  const catMeta   = getCatMeta(currentQuestion.category);
  const botScore  = bot?.score ?? 0;
  const totalQ    = 10;

  return (
    <main className="min-h-screen px-4 py-5 max-w-2xl mx-auto flex flex-col gap-4 relative">
      {/* +100 popup */}
      <AnimatePresence>
        {showScorePopup && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.8 }} animate={{ opacity: 1, y: -60, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }} transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <span className="text-4xl font-black text-emerald-400 drop-shadow-lg">+100</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score header: You vs Bot */}
      <div className="flex items-center gap-3">
        {/* My score */}
        <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-2xl px-3 py-2 flex-1">
          {myAvatar && <img src={avatarUrl(myAvatar)} alt="you" className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />}
          <div className="min-w-0">
            <p className="text-[10px] font-black text-violet-300 uppercase tracking-widest">You</p>
            <p className="text-base font-black tabular-nums">{myScore.toLocaleString()}</p>
          </div>
        </div>

        {/* VS */}
        <span className="text-white/20 font-black text-sm flex-shrink-0">VS</span>

        {/* Bot score */}
        {bot && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-3 py-2 flex-1">
            <img src={avatarUrl(bot.avatar)} alt={bot.name} className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-red-300 uppercase tracking-widest truncate">{bot.name}</p>
              <p className="text-base font-black tabular-nums">{botScore.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Category + timer */}
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
          <span className="text-white/30 text-xs font-bold tabular-nums">Q {questionIndex + 1}/{totalQ}</span>
          <motion.span
            animate={{ color: isUrgent ? "#ef4444" : "#a78bfa" }} transition={{ duration: 0.3 }}
            className="text-2xl font-black tabular-nums min-w-[3ch] text-right"
          >
            {secondsLeft}s
          </motion.span>
        </div>
      </div>

      <TimerBar percentage={percentage} isUrgent={isUrgent} />

      {/* Progress dots */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalQ }).map((_, i) => (
          <div key={i} className={`rounded-full transition-all duration-300 ${
            i < questionIndex ? "h-1.5 w-4 bg-violet-500" : i === questionIndex ? "h-2 w-5 bg-amber-400" : "h-1.5 w-3 bg-white/10"
          }`} />
        ))}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.35 }}
          className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6"
        >
          <p className="text-xl sm:text-2xl font-black leading-snug text-white">{currentQuestion.text}</p>
        </motion.div>
      </AnimatePresence>

      {/* Answers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OPTIONS.map((opt, i) => (
          <AnswerButton
            key={opt} option={opt} index={i}
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

      {/* Bot answer indicator */}
      {bot && (
        <AnimatePresence>
          {lastResult && bot.lastAnswer ? (
            <motion.div key="bot-answered" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
                bot.lastAnswer === lastResult.correctAnswer
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}
            >
              <img src={avatarUrl(bot.avatar)} alt={bot.name} className="w-6 h-6 rounded-full" />
              <span>{bot.name} answered {bot.lastAnswer}</span>
              <span className="ml-auto">{bot.lastAnswer === lastResult.correctAnswer ? "✅" : "❌"}</span>
            </motion.div>
          ) : !lastResult && !myAnswer ? (
            <motion.div key="bot-thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-white/30 text-sm font-bold"
            >
              <img src={avatarUrl(bot.avatar)} alt={bot.name} className="w-5 h-5 rounded-full opacity-50" />
              <span>{bot.name} is thinking</span>
              {[0, 1, 2].map((i) => (
                <motion.span key={i} animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
                  className="w-1 h-1 bg-white/30 rounded-full"
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}

      {/* Result / status */}
      <AnimatePresence mode="wait">
        {lastResult ? (
          <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ResultBanner isCorrect={lastResult.isCorrect} explanation={lastResult.explanation} />
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-center text-white/30 text-sm font-bold mt-3 flex items-center justify-center gap-2"
            >
              <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" />
              {questionIndex + 1 >= totalQ ? "Tallying final scores…" : "Next question coming up…"}
            </motion.p>
          </motion.div>
        ) : myAnswer ? (
          <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-amber-400/70">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="font-bold text-sm">Answer locked — waiting for result…</span>
            </div>
          </motion.div>
        ) : (
          <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center text-white/25 text-sm font-bold py-2"
          >
            Tap an answer before time runs out!
          </motion.p>
        )}
      </AnimatePresence>
    </main>
  );
}
