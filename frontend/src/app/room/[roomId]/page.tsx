"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/store/gameStore";
import { avatarUrl } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import type { Category } from "@/types";

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router     = useRouter();
  const socket     = useSocket(roomId);
  const { room, myId } = useGameStore();

  const [myCategory, setMyCategory] = useState<Category | null>(null);
  const [confirmed, setConfirmed]   = useState(false);

  useEffect(() => {
    const id = setTimeout(() => { if (!room) router.push("/"); }, 3000);
    return () => clearTimeout(id);
  }, [room, router]);

  function confirmCategory(cat: Category) {
    setMyCategory(cat);
    setConfirmed(true);
    // When backend is live this emits player:set-category
    socket.emit("player:set-category" as any, { roomId, category: cat });
  }

  if (!room) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-white/15 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-white/35 font-bold text-sm">Connecting…</p>
      </main>
    );
  }

  const isHost    = room.hostId === myId;
  const players   = room.players ?? [];
  const isIndividual = room.categoryMode === "individual";
  const needsPick = isIndividual && !isHost && !confirmed;

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-5"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-4xl">🎮</div>
          <p className="text-white/35 text-[11px] font-black uppercase tracking-widest">Room</p>
          <h1 className="text-4xl font-black tracking-[0.15em] text-amber-400">{room.code}</h1>
          {isHost ? (
            <p className="text-emerald-400 font-bold text-sm">You are the host</p>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-white/45 font-bold text-sm">Waiting for host to start…</p>
            </div>
          )}
        </div>

        {/* Category info banner */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg">
            {isIndividual ? "🎯" : "🌐"}
          </span>
          <div>
            <p className="font-black text-sm text-white/70">
              {isIndividual ? "Individual categories" : "Same category for all"}
            </p>
            {!isIndividual && room.category && (
              <p className="text-xs text-white/35 font-bold">
                {CATEGORIES.find(c => c.id === room.category)?.emoji}{" "}
                {CATEGORIES.find(c => c.id === room.category)?.label}
              </p>
            )}
          </div>
        </div>

        {/* Individual mode: player picks their own category */}
        <AnimatePresence>
          {needsPick && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 space-y-4"
            >
              <div>
                <p className="font-black text-base text-white">Pick your category</p>
                <p className="text-white/35 text-xs mt-0.5">Choose what you want to be quizzed on</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <motion.button
                    key={c.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => confirmCategory(c.id)}
                    className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center gap-2 bg-gradient-to-r ${c.color} hover:opacity-90 transition-opacity`}
                  >
                    {c.emoji} {c.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Confirmed category */}
          {isIndividual && !isHost && confirmed && myCategory && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/25 rounded-2xl p-4 flex items-center gap-3"
            >
              <span className="text-2xl">{CATEGORIES.find(c => c.id === myCategory)?.emoji}</span>
              <div>
                <p className="font-black text-green-400 text-sm">
                  {CATEGORIES.find(c => c.id === myCategory)?.label} selected ✓
                </p>
                <p className="text-white/35 text-xs">Waiting for the host to begin…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-black text-white/35 uppercase tracking-widest">Players</p>
            <span className="bg-violet-500/15 text-violet-300 text-xs font-black px-3 py-1 rounded-full border border-violet-500/20">
              {players.length} joined
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AnimatePresence>
              {players.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: i * 0.05, type: "spring", bounce: 0.3 }}
                  className={`bg-white/[0.06] border rounded-2xl p-3 flex items-center gap-3 overflow-hidden ${
                    p.id === myId ? "border-violet-500/40" : "border-white/[0.08]"
                  }`}
                >
                  <img src={avatarUrl(p.avatar)} alt={p.name} className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate text-white/75">{p.name}</p>
                    {p.id === myId && <p className="text-[10px] text-violet-400 font-black">You</p>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Waiting dots */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-white/25 rounded-full"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
              />
            ))}
          </div>
          <p className="text-white/25 text-xs font-bold">
            {isHost ? "Go to the host screen to begin the game" : "Sit tight — the host will start soon"}
          </p>
        </div>
      </motion.div>
    </main>
  );
}
