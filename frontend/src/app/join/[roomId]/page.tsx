"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { AVATARS } from "@/lib/constants";
import { avatarUrl } from "@/lib/utils";
import type { AvatarSeed } from "@/types";

const avatarContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const avatarItem = {
  hidden: { opacity: 0, scale: 0.75 },
  show: { opacity: 1, scale: 1, transition: { type: "spring" as const, bounce: 0.4 } },
};

export default function JoinPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const { setMyInfo, setRoom } = useGameStore();

  const [name, setName]     = useState("");
  const [avatar, setAvatar] = useState<AvatarSeed>("naruto");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function handleJoin() {
    if (!name.trim()) { setError("Enter a nickname first!"); return; }
    setLoading(true);
    setError("");

    // Mock: set the player info in store and navigate to the room lobby
    const mySocketId = `player-me-${Date.now()}`;
    setMyInfo(mySocketId, name.trim(), avatar);

    // Seed a minimal room so the lobby has something to show
    setRoom({
      id: roomId,
      code: roomId.toUpperCase(),
      hostId: "host",
      status: "waiting",
      categoryMode: "group",
      category: null,
      players: [],
      currentQuestionIndex: -1,
      totalQuestions: 10,
      gameStartedAt: null,
      questionStartedAt: null,
      timerEndsAt: null,
    });

    router.push(`/room/${roomId}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute top-1/3 right-1/4 w-56 h-56 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md space-y-5"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
            className="text-5xl"
          >
            🎮
          </motion.div>
          <h1 className="text-3xl font-black">Join the Chaos</h1>
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-amber-400 font-black text-sm tracking-[0.15em]">
              {roomId?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Nickname */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 space-y-3">
          <label htmlFor="nickname" className="text-[11px] font-black text-white/35 uppercase tracking-widest block">
            Your Nickname
          </label>
          <input
            id="nickname"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            maxLength={20}
            placeholder="e.g. Peter, Kaka…"
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-bold placeholder-white/20 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
          />
        </div>

        {/* Avatar picker */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 space-y-4">
          <label className="text-[11px] font-black text-white/35 uppercase tracking-widest block">
            Pick Your Character
          </label>
          <motion.div variants={avatarContainer} initial="hidden" animate="show" className="grid grid-cols-4 gap-2">
            {AVATARS.map((a) => (
              <motion.button
                key={a.seed}
                variants={avatarItem}
                onClick={() => setAvatar(a.seed)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${
                  avatar === a.seed
                    ? "bg-white border-2 border-white shadow-lg"
                    : "bg-white/[0.05] border border-white/[0.08] hover:bg-white/10"
                }`}
                aria-label={`Select ${a.label}`}
                aria-pressed={avatar === a.seed}
              >
                <img
                  src={avatarUrl(a.seed)}
                  alt={a.label}
                  width={48}
                  height={48}
                  className={`w-12 h-12 rounded-full ${avatar === a.seed ? "bg-violet-100" : "bg-white/10"}`}
                />
                <span className={`text-[10px] font-black truncate w-full text-center ${avatar === a.seed ? "text-black" : "text-white/45"}`}>
                  {a.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold text-center rounded-2xl py-3 px-4"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.97 } : {}}
          onClick={handleJoin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Joining…
            </span>
          ) : "⚡ Join Now"}
        </motion.button>
      </motion.div>
    </main>
  );
}
