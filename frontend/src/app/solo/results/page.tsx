"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useSoloStore } from "@/store/soloStore";
import { useGameStore } from "@/store/gameStore";
import { avatarUrl } from "@/lib/utils";

const RANK_MESSAGES: { min: number; emoji: string; title: string; sub: string }[] = [
  { min: 90, emoji: "🏆", title: "Perfect!",           sub: "Absolutely unbeatable. The system bows to you." },
  { min: 70, emoji: "🎉", title: "Excellent!",         sub: "That was impressive — you really know your stuff." },
  { min: 50, emoji: "👍", title: "Good Job!",          sub: "Solid effort. Practice more and you'll dominate." },
  { min: 30, emoji: "💪", title: "Keep Going!",        sub: "You're getting there. Study up and try again!" },
  { min:  0, emoji: "😅", title: "Better luck next time!", sub: "The questions fought back hard. Don't give up." },
];

function getRankMessage(percentage: number) {
  return RANK_MESSAGES.find((r) => percentage >= r.min) ?? RANK_MESSAGES[RANK_MESSAGES.length - 1];
}

export default function SoloResultsPage() {
  const router = useRouter();
  const { ended, bot, reset } = useSoloStore();
  const { myName, myAvatar } = useGameStore();

  useEffect(() => {
    if (!ended) { router.push("/solo"); return; }
    if (ended.percentage >= 50) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      if (ended.percentage >= 80) {
        setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.4, x: 0.2 }, angle: 60 }), 400);
        setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.4, x: 0.8 }, angle: 120 }), 700);
      }
    }
  }, [ended, router]);

  if (!ended) return null;

  const rank = getRankMessage(ended.percentage);
  const botScore = bot?.score ?? 0;
  const iWon = ended.score >= botScore;

  function playAgain() { reset(); router.push("/solo"); }
  function goHome()    { reset(); router.push("/"); }

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto space-y-5 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-48 bg-amber-400/8 rounded-full blur-3xl pointer-events-none" />

      {/* Result header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.1 }} className="text-6xl">
          {rank.emoji}
        </motion.div>
        <h1 className="text-4xl font-black">{rank.title}</h1>
        <p className="text-white/50 text-sm max-w-xs mx-auto">{rank.sub}</p>
      </motion.div>

      {/* Score card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 space-y-4">

        {/* You vs Bot */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-2xl p-4 text-center space-y-1 border ${iWon ? "bg-violet-500/10 border-violet-500/30" : "bg-white/[0.04] border-white/[0.08]"}`}>
            {myAvatar && <img src={avatarUrl(myAvatar)} alt="you" className="w-12 h-12 rounded-full mx-auto bg-white/10" />}
            <p className="font-black text-sm text-white/70 truncate">{myName ?? "You"}</p>
            <p className={`text-3xl font-black tabular-nums ${iWon ? "text-violet-300" : "text-white/60"}`}>
              {ended.score.toLocaleString()}
            </p>
            {iWon && <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Winner 🏆</p>}
          </div>

          {bot && (
            <div className={`rounded-2xl p-4 text-center space-y-1 border ${!iWon ? "bg-red-500/10 border-red-500/30" : "bg-white/[0.04] border-white/[0.08]"}`}>
              <img src={avatarUrl(bot.avatar)} alt={bot.name} className="w-12 h-12 rounded-full mx-auto bg-white/10" />
              <p className="font-black text-sm text-white/70 truncate">{bot.name}</p>
              <p className={`text-3xl font-black tabular-nums ${!iWon ? "text-red-300" : "text-white/60"}`}>
                {botScore.toLocaleString()}
              </p>
              {!iWon && <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Winner 🏆</p>}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06]">
          {[
            { label: "Correct",  value: `${ended.correctCount}/${ended.totalQuestions}` },
            { label: "Score",    value: ended.score.toLocaleString() },
            { label: "Accuracy", value: `${ended.percentage}%` },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-black text-white">{s.value}</p>
              <p className="text-[10px] text-white/35 font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="grid grid-cols-2 gap-3">
        <button type="button" onClick={playAgain}
          className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black text-lg py-4 rounded-2xl transition-all shadow-lg">
          🔄 Play Again
        </button>
        <button type="button" onClick={goHome}
          className="bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-white font-black text-lg py-4 rounded-2xl transition-all">
          🏠 Home
        </button>
      </motion.div>

      {/* Motivational tip */}
      {ended.percentage < 70 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-center text-white/25 text-xs px-4">
          💡 Tip: Try a different category or easier difficulty to build confidence!
        </motion.p>
      )}
    </main>
  );
}
