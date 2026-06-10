"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { getSocket } from "@/lib/socket";
import { avatarUrl } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import type { Category, CategoryMode, Player, PlayerRanking } from "@/types";

function CountdownOverlay({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="text-[10rem] font-black leading-none"
        >
          {count > 0 ? count : "🚀"}
        </motion.div>
      </AnimatePresence>
      <p className="text-white/50 font-bold text-xl mt-4">
        {count > 0 ? "Game starting…" : "Let's go!"}
      </p>
    </motion.div>
  );
}

function HostContent() {
  const params  = useSearchParams();
  const roomId  = params.get("roomId") ?? "";
  const code    = params.get("code")   ?? "";
  const qr      = params.get("qr")     ?? "";
  const joinUrl = params.get("url")    ?? "";

  const router = useRouter();
  const { room, setRoom, liveLeaderboard } = useGameStore();

  const [categoryMode, setCategoryMode] = useState<CategoryMode>("group");
  const [category, setCategory]         = useState<Category>("math");
  const [copied, setCopied]             = useState(false);
  const [countdown, setCountdown]       = useState<number | null>(null);
  const [gameStarted, setGameStarted]   = useState(false);
  const [currentQ, setCurrentQ]         = useState<{ text: string; index: number; total: number } | null>(null);

  // Sync category mode to server when changed
  const syncCategory = useCallback((mode: CategoryMode, cat?: Category) => {
    if (!roomId) return;
    try {
      const socket = getSocket();
      socket.emit("room:set-category", { roomId, mode, category: mode === "group" ? (cat ?? category) : undefined });
    } catch {}
  }, [roomId, category]);

  // Listen to socket events directly (host sees game progress, not player view)
  useEffect(() => {
    if (!roomId) return;
    let socket: ReturnType<typeof getSocket>;
    try { socket = getSocket(); } catch { return; }

    socket.on("room:updated", setRoom);
    socket.on("game:question", ({ question, index, total }: any) => {
      setGameStarted(true);
      setCountdown(null);
      setCurrentQ({ text: question.text, index, total });
    });
    socket.on("game:ended", (rankings: PlayerRanking[]) => {
      router.push(`/room/${roomId}/results`);
    });
    socket.on("error", (msg: string) => {
      if (msg.includes("Waiting for") || msg.includes("Need at least")) {
        alert(msg);
      }
    });

    return () => {
      socket.off("room:updated");
      socket.off("game:question");
      socket.off("game:ended");
      socket.off("error");
    };
  }, [roomId, setRoom, router]);

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

  function handleChangeCategoryMode(mode: CategoryMode) {
    setCategoryMode(mode);
    syncCategory(mode);
  }

  function handleChangeCategory(cat: Category) {
    setCategory(cat);
    syncCategory(categoryMode, cat);
  }

  function handleBegin() {
    if (!roomId || countdown !== null || gameStarted) return;
    const players = room?.players ?? [];
    if (players.length === 0) return;

    let n = 3;
    setCountdown(n);
    const tick = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(tick);
        setCountdown(0);
        setTimeout(() => {
          try {
            getSocket().emit("room:start", { roomId });
          } catch {}
        }, 500);
      } else {
        setCountdown(n);
      }
    }, 1000);
  }

  function handleKick(playerId: string) {
    if (!roomId) return;
    try { getSocket().emit("room:kick", { roomId, playerId }); } catch {}
  }

  const decodedUrl = decodeURIComponent(joinUrl);
  const players    = room?.players ?? [];
  const canBegin   = players.length > 0 && countdown === null && !gameStarted;

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <AnimatePresence>
        {countdown !== null && <CountdownOverlay count={countdown} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-5"
      >
        {/* Header */}
        <div className="text-center">
          <p className="text-white/35 text-xs font-black uppercase tracking-widest">Game Room</p>
          <h1 className="text-3xl font-black mt-1">
            {gameStarted ? "Game in progress 🎮" : "Your room is live 🎉"}
          </h1>
          {gameStarted && currentQ && (
            <p className="text-white/40 text-sm mt-1">
              Question {currentQ.index + 1} of {currentQ.total}
            </p>
          )}
          {!gameStarted && (
            <p className="text-white/40 text-sm mt-1">Share the code or QR — friends can join now</p>
          )}
        </div>

        {/* QR + Code + URL — only show before game starts */}
        {!gameStarted && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 space-y-3 w-full">
              <div>
                <p className="text-white/35 text-[11px] font-black uppercase tracking-widest mb-1">Room Code</p>
                <button type="button" onClick={copyCode} className="group flex items-center gap-3 focus:outline-none" aria-label="Copy room code">
                  <span className="text-5xl font-black tracking-[0.2em] text-amber-400">{code}</span>
                  <span className="text-white/30 group-hover:text-white/60 transition-colors text-lg">
                    {copied ? "✅" : "📋"}
                  </span>
                </button>
              </div>
              <div>
                <p className="text-white/35 text-[11px] font-black uppercase tracking-widest mb-1">Join URL</p>
                <button type="button"
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
                  <img src={decodeURIComponent(qr)} alt="QR Code" width={130} height={130} className="block" />
                </div>
                <p className="text-white/30 text-[11px] font-bold">Scan to join</p>
              </div>
            )}
          </div>
        )}

        {/* Category Mode — only configurable before game starts */}
        {!gameStarted && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5 space-y-4">
            <p className="text-white/35 text-[11px] font-black uppercase tracking-widest">Category Mode</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button"
                onClick={() => handleChangeCategoryMode("group")}
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
              <button type="button"
                onClick={() => handleChangeCategoryMode("individual")}
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
                      <button type="button"
                        key={c.id}
                        onClick={() => handleChangeCategory(c.id)}
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
        )}

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
                {players.map((p: Player) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", bounce: 0.35 }}
                    className="bg-white/[0.06] border border-white/[0.08] rounded-2xl p-3 flex items-center gap-2 group"
                  >
                    <img src={avatarUrl(p.avatar)} alt={p.name} className="w-9 h-9 rounded-full bg-white/10 flex-shrink-0" />
                    <span className="font-bold text-sm truncate text-white/75 flex-1">{p.name}</span>
                    {!gameStarted && (
                      <button type="button"
                        onClick={() => handleKick(p.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400 text-xs font-black px-1 flex-shrink-0"
                        title={`Kick ${p.name}`}
                        aria-label={`Kick ${p.name}`}
                      >
                        ✕
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Live leaderboard during game */}
        {gameStarted && liveLeaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-5"
          >
            <p className="text-[11px] font-black text-white/30 uppercase tracking-widest mb-3">Live Scores</p>
            <div className="space-y-2">
              {liveLeaderboard.slice(0, 5).map((r: PlayerRanking, i: number) => (
                <div key={r.player.id} className="flex items-center gap-3">
                  <span className="text-white/25 text-xs font-black w-5 text-right tabular-nums">{r.position}</span>
                  <img src={avatarUrl(r.player.avatar)} alt={r.player.name} className="w-7 h-7 rounded-full bg-white/10" />
                  <span className="text-sm font-bold text-white/65 flex-1 truncate">{r.player.name}</span>
                  <span className="text-white font-black text-sm tabular-nums">{r.player.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Begin button */}
        {!gameStarted && (
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
        )}
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
