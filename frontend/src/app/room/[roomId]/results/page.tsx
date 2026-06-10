"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/store/gameStore";
import { avatarUrl } from "@/lib/utils";
import PodiumStage from "@/components/results/PodiumStage";
import RankingList from "@/components/results/RankingList";

export default function ResultsPage() {
  const { roomId } = useParams<{ roomId: string }>();
  useSocket(roomId);
  const { rankings, myId, reset } = useGameStore();
  const router = useRouter();

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);
  const winner = rankings[0];

  // Fire confetti if this player won
  useEffect(() => {
    if (rankings.length === 0) return;
    if (rankings[0].player.id === myId) {
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.55 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.4, x: 0.2 }, angle: 60 }), 400);
      setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.4, x: 0.8 }, angle: 120 }), 600);
    }
  }, [rankings, myId]);

  function handlePlayAgain() {
    reset();
    router.push("/");
  }

  if (rankings.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-white/15 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-white/35 font-bold">Loading results…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto space-y-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-64 bg-amber-400/8 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
          className="text-5xl"
        >
          🏆
        </motion.div>
        <h1 className="text-4xl font-black">Game Over!</h1>
        <p className="text-white/50 text-sm">
          {winner.player.id === myId ? (
            <span className="text-amber-400 font-black">🎉 You won! Absolute legend!</span>
          ) : (
            <>
              <span className="text-amber-400 font-black">{winner.player.name}</span>
              {" "}takes the crown! 👑
            </>
          )}
        </p>
      </motion.div>

      {/* Podium */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white/[0.04] border border-white/[0.07] rounded-3xl py-6 px-4"
      >
        <PodiumStage top3={top3} />
      </motion.div>

      {/* 4th+ rankings */}
      {rest.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <RankingList rankings={rest} />
        </motion.div>
      )}

      {/* Full score board */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="bg-white/[0.04] border border-white/[0.07] rounded-3xl p-5"
      >
        <p className="text-[11px] font-black text-white/30 uppercase tracking-widest mb-4">
          Full Scoreboard
        </p>
        <div className="space-y-2.5">
          {rankings.map((r, i) => (
            <motion.div
              key={r.player.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.07 }}
              className={`flex items-center gap-3 ${r.player.id === myId ? "opacity-100" : "opacity-70"}`}
            >
              <span className="text-white/25 text-xs font-black w-5 text-right tabular-nums flex-shrink-0">
                {r.position}
              </span>
              <img
                src={avatarUrl(r.player.avatar)}
                alt={r.player.name}
                className="w-8 h-8 rounded-full bg-white/10 object-cover flex-shrink-0"
              />
              <span className="text-sm font-bold text-white/65 flex-1 min-w-0 truncate">
                {r.player.name}
                {r.player.id === myId && <span className="text-violet-400 text-[10px] ml-1">(you)</span>}
              </span>
              <span className="text-white/30 text-[11px] font-bold flex-shrink-0">
                {r.correctCount}/{r.correctCount + r.wrongCount}
              </span>
              <span className="text-white font-black text-sm flex-shrink-0 tabular-nums">
                {r.player.score.toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Play again */}
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handlePlayAgain}
        className="w-full bg-white text-black hover:bg-white/90 font-black text-xl py-4 rounded-2xl transition-colors shadow-lg"
      >
        🔄 Play Again
      </motion.button>
    </main>
  );
}
