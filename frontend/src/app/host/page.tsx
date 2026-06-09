"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { generateMockPlayers, getMockQuestions, runMockGame } from "@/lib/mock";
import { avatarUrl } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import type { Category, CategoryMode, Player } from "@/types";

function HostContent() {
  const params  = useSearchParams();
  const code    = params.get("code") ?? "";
  const qr      = params.get("qr")   ?? "";
  const joinUrl = params.get("url")  ?? "";

  const router = useRouter();
  const { setRoom, setQuestion, setResult, setRankings, setSkipFn } = useGameStore();

  const [categoryMode, setCategoryMode] = useState<CategoryMode>("group");
  const [category, setCategory]         = useState<Category>("math");
  const [players, setPlayers]           = useState<Player[]>([]);
  const [copied, setCopied]             = useState(false);
  const [started, setStarted]           = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Mock players trickle in
  useEffect(() => {
    const mockPlayers = generateMockPlayers(4);
    const timers: ReturnType<typeof setTimeout>[] = [];
    mockPlayers.forEach((p, i) => {
      timers.push(setTimeout(() => setPlayers((prev) => [...prev, p]), 1200 + i * 800));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // Keep room store in sync
  useEffect(() => {
    setRoom({
      id: code, code, hostId: "host",
      status: started ? "active" : "waiting",
      categoryMode,
      category: categoryMode === "group" ? category : null,
      players,
      currentQuestionIndex: -1, totalQuestions: 10,
      gameStartedAt: null, questionStartedAt: null, timerEndsAt: null,
    });
  }, [players, code, started, categoryMode, category, setRoom]);

  function copyCode() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyUrl() {
    navigator.clipboard.writeText(decodeURIComponent(joinUrl)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleBegin() {
    if (players.length === 0 || started) return;
    setStarted(true);

    // For "each picks own" mock mode we randomise category per question
    const questions = getMockQuestions(categoryMode === "group" ? category : undefined);
    let currentPlayers = [...players];

    const cancelFn = runMockGame(questions, {
      onQuestion: (q, index, timerEndsAt) => {
        setQuestion(q as any, index, timerEndsAt);
        router.push(`/room/${code}/game`);
      },
      onResult:      (result)   => setResult(result),
      onEnded:       (rankings) => { setRankings(rankings); router.push(`/room/${code}/results`); },
      getMyAnswer:   ()         => useGameStore.getState().myAnswer,
      getPlayers:    ()         => currentPlayers,
      updatePlayers: (updated)  => { currentPlayers = updated; },
      onSkipReady:   (fn)       => setSkipFn(fn),
    });

    cleanupRef.current = cancelFn;
  }

  useEffect(() => () => { cleanupRef.current?.(); }, []);

  const decodedUrl = decodeURIComponent(joinUrl);
  const canBegin   = players.length > 0 && !started;

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-5"
      >
        {/* Header */}
        <div className="text-center">
          <p className="text-white/35 text-xs font-black uppercase tracking-widest">Game Room</p>
          <h1 className="text-3xl font-black mt-1">Your room is live 🎉</h1>
          <p className="text-white/40 text-sm mt-1">Share the code or QR — friends can join now</p>
        </div>

        {/* QR + Code + URL */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1 space-y-3 w-full">
            {/* Room code */}
            <div>
              <p className="text-white/35 text-[11px] font-black uppercase tracking-widest mb-1">Room Code</p>
              <button
                onClick={copyCode}
                className="group flex items-center gap-3 focus:outline-none"
                aria-label="Copy room code"
              >
                <span className="text-5xl font-black tracking-[0.2em] text-amber-400">{code}</span>
                <span className="text-white/30 group-hover:text-white/60 transition-colors text-lg">
                  {copied ? "✅" : "📋"}
                </span>
              </button>
            </div>
            {/* Join URL */}
            <div>
              <p className="text-white/35 text-[11px] font-black uppercase tracking-widest mb-1">Join URL</p>
              <button
                onClick={copyUrl}
                className="text-left w-full text-violet-400 text-xs font-mono break-all hover:text-violet-300 transition-colors focus:outline-none"
              >
                {decodedUrl}
              </button>
            </div>
          </div>

          {qr && (
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className="p-2.5 bg-white rounded-2xl shadow-lg">
                <img
                  src={decodeURIComponent(qr)}
                  alt="QR Code"
                  width={130}
                  height={130}
                  className="block"
                />
              </div>
              <p className="text-white/30 text-[11px] font-bold">Scan to join</p>
            </div>
          )}
        </div>

        {/* Category Mode */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 space-y-4">
          <p className="text-white/35 text-[11px] font-black uppercase tracking-widest">Category Mode</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCategoryMode("group")}
              className={`py-3 px-4 rounded-xl font-bold text-sm transition-all text-left space-y-0.5 ${
                categoryMode === "group"
                  ? "bg-white text-black"
                  : "bg-white/[0.06] text-white/50 hover:bg-white/10 border border-white/[0.08]"
              }`}
            >
              <div>🌐 Same for all</div>
              <div className={`text-[10px] font-normal ${categoryMode === "group" ? "text-black/50" : "text-white/25"}`}>
                You pick one category for everyone
              </div>
            </button>
            <button
              onClick={() => setCategoryMode("individual")}
              className={`py-3 px-4 rounded-xl font-bold text-sm transition-all text-left space-y-0.5 ${
                categoryMode === "individual"
                  ? "bg-white text-black"
                  : "bg-white/[0.06] text-white/50 hover:bg-white/10 border border-white/[0.08]"
              }`}
            >
              <div>🎯 Each picks own</div>
              <div className={`text-[10px] font-normal ${categoryMode === "individual" ? "text-black/50" : "text-white/25"}`}>
                Players choose in the lobby
              </div>
            </button>
          </div>

          {/* Group: host picks the category */}
          <AnimatePresence>
            {categoryMode === "group" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <p className="text-white/35 text-[11px] font-black uppercase tracking-widest mb-2 pt-1">
                  Pick the category
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                        category === c.id
                          ? `bg-gradient-to-r ${c.color} text-white ring-1 ring-white/20`
                          : "bg-white/[0.06] text-white/50 hover:bg-white/10 border border-white/[0.08]"
                      }`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Individual: inform host that players will pick themselves */}
            {categoryMode === "individual" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 text-sm text-violet-300 font-bold">
                  ✅ Each player will pick their own category from the lobby before the game starts.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Players */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/35 text-[11px] font-black uppercase tracking-widest">Players</p>
            <span className="bg-violet-500/15 text-violet-300 text-xs font-black px-3 py-1 rounded-full border border-violet-500/20">
              {players.length} joined
            </span>
          </div>

          {players.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/30 font-bold text-sm">Waiting for players to join…</p>
              <p className="text-white/20 text-xs mt-1">Share the QR or URL above</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <AnimatePresence>
                {players.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", bounce: 0.35 }}
                    className="bg-white/[0.06] border border-white/[0.08] rounded-2xl p-3 flex items-center gap-3"
                  >
                    <img src={avatarUrl(p.avatar)} alt={p.name} className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
                    <span className="font-bold text-sm truncate text-white/75">{p.name}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Begin */}
        <div className="space-y-2">
          <motion.button
            whileHover={canBegin ? { scale: 1.02 } : {}}
            whileTap={canBegin ? { scale: 0.97 } : {}}
            onClick={handleBegin}
            disabled={!canBegin}
            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            🚀 BEGIN GAME
          </motion.button>
          {players.length === 0 && (
            <p className="text-center text-white/25 text-xs">Need at least one player to start</p>
          )}
        </div>
      </motion.div>
    </main>
  );
}

export default function HostPage() {
  return (
    <Suspense>
      <HostContent />
    </Suspense>
  );
}
