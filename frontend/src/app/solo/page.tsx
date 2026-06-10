"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket, connectSocket } from "@/lib/socket";
import { useSoloStore, type SoloDifficulty } from "@/store/soloStore";
import { useGameStore } from "@/store/gameStore";
import { AVATARS, CATEGORIES } from "@/lib/constants";
import { avatarUrl } from "@/lib/utils";
import type { AvatarSeed, Category } from "@/types";

const DIFFICULTIES: { id: SoloDifficulty; label: string; emoji: string; desc: string; color: string }[] = [
  { id: "easy",   label: "Easy",   emoji: "🌱", desc: "Warm up your brain",      color: "from-emerald-600 to-green-600" },
  { id: "medium", label: "Medium", emoji: "🔥", desc: "Some knowledge required",  color: "from-amber-600 to-orange-600" },
  { id: "hard",   label: "Hard",   emoji: "💀", desc: "Only the bold survive",    color: "from-red-600 to-rose-700" },
  { id: "mixed",  label: "Mixed",  emoji: "🎲", desc: "All difficulties, random", color: "from-violet-600 to-blue-600" },
];

const avatarContainer = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const avatarItem = { hidden: { opacity: 0, scale: 0.75 }, show: { opacity: 1, scale: 1, transition: { type: "spring" as const, bounce: 0.4 } } };

function sanitizeName(raw: string): string {
  return raw.replace(/[​-‍﻿ -]/g, "").replace(/<[^>]*>/g, "").trim().slice(0, 20);
}

export default function SoloSetupPage() {
  const router = useRouter();
  const { setSession, setQuestion, setEnded, reset } = useSoloStore();
  const { setMyInfo } = useGameStore();

  const [name, setName]           = useState("");
  const [avatar, setAvatar]       = useState<AvatarSeed>("naruto");
  const [category, setCategory]   = useState<Category>("math");
  const [difficulty, setDifficulty] = useState<SoloDifficulty>("mixed");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  async function handlePlay() {
    const clean = sanitizeName(name);
    if (!clean) { setError("Enter your name first!"); return; }
    setLoading(true);
    setError("");
    reset();

    try {
      const socket = getSocket();
      if (!socket.connected) connectSocket();

      const result = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Connection timeout — is the server running?")), 10_000);
        socket.emit("solo:start", { category, difficulty }, (res) => {
          clearTimeout(timeout);
          resolve(res);
        });
      });

      setMyInfo(socket.id ?? "", clean, avatar);
      setSession(result.sessionId, category, difficulty);
      setQuestion(result.question, result.index, result.timerEndsAt, result.totalMs);

      // Listen for solo events
      socket.on("solo:question", ({ question, index, timerEndsAt, totalMs }) => {
        setQuestion(question, index, timerEndsAt, totalMs);
      });
      socket.on("solo:result", (res) => {
        useSoloStore.getState().setResult(res);
      });
      socket.on("solo:ended", (ended) => {
        setEnded(ended);
        socket.off("solo:question");
        socket.off("solo:result");
        socket.off("solo:ended");
        router.push("/solo/results");
      });

      router.push("/solo/game");
    } catch (err: any) {
      setError(err?.message ?? "Failed to start solo game.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-xl mx-auto space-y-5 relative overflow-hidden">
      <div className="absolute top-1/4 -left-16 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-16 w-72 h-72 bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <div className="text-5xl">🎯</div>
        <h1 className="text-3xl font-black">Solo Challenge</h1>
        <p className="text-white/40 text-sm">Play against the system — 10 questions, new every time</p>
      </motion.div>

      {/* Name */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 space-y-3">
        <label className="text-[11px] font-black text-white/35 uppercase tracking-widest block">Your Name</label>
        <input
          type="text" value={name} maxLength={20}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePlay()}
          placeholder="e.g. Osee, Peter…"
          className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-bold placeholder-white/20 outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
        />
      </motion.div>

      {/* Avatar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 space-y-4">
        <label className="text-[11px] font-black text-white/35 uppercase tracking-widest block">Pick Your Character</label>
        <motion.div variants={avatarContainer} initial="hidden" animate="show" className="grid grid-cols-4 gap-2">
          {AVATARS.map((a) => (
            <motion.button key={a.seed} type="button" variants={avatarItem}
              onClick={() => setAvatar(a.seed)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${
                avatar === a.seed ? "bg-white border-2 border-white shadow-lg" : "bg-white/[0.05] border border-white/[0.08] hover:bg-white/10"
              }`}>
              <img src={avatarUrl(a.seed)} alt={a.label} className={`w-12 h-12 rounded-full ${avatar === a.seed ? "bg-violet-100" : "bg-white/10"}`} />
              <span className={`text-[10px] font-black truncate w-full text-center ${avatar === a.seed ? "text-black" : "text-white/45"}`}>{a.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Category */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 space-y-3">
        <label className="text-[11px] font-black text-white/35 uppercase tracking-widest block">Category</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" onClick={() => setCategory(c.id)}
              className={`py-2.5 px-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                category === c.id
                  ? `bg-gradient-to-r ${c.color} text-white ring-1 ring-white/20`
                  : "bg-white/[0.06] text-white/50 hover:bg-white/10 border border-white/[0.08]"
              }`}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Difficulty */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 space-y-3">
        <label className="text-[11px] font-black text-white/35 uppercase tracking-widest block">Difficulty</label>
        <div className="grid grid-cols-2 gap-2">
          {DIFFICULTIES.map((d) => (
            <button key={d.id} type="button" onClick={() => setDifficulty(d.id)}
              className={`py-3 px-4 rounded-xl font-bold text-sm text-left space-y-0.5 transition-all ${
                difficulty === d.id
                  ? `bg-gradient-to-r ${d.color} text-white ring-1 ring-white/20`
                  : "bg-white/[0.06] text-white/50 hover:bg-white/10 border border-white/[0.08]"
              }`}>
              <div>{d.emoji} {d.label}</div>
              <div className={`text-[10px] font-normal ${difficulty === d.id ? "text-white/70" : "text-white/25"}`}>{d.desc}</div>
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold text-center rounded-2xl py-3 px-4">
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button" whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.97 } : {}}
        onClick={handlePlay} disabled={loading}
        className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating questions…
          </span>
        ) : "🚀 Play Now"}
      </motion.button>
    </main>
  );
}
