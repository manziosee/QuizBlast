"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket, connectSocket } from "@/lib/socket";
import { useGameStore } from "@/store/gameStore";
import { CATEGORIES } from "@/lib/constants";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const router = useRouter();
  const { setMyInfo } = useGameStore();

  async function handleMultiplayer() {
    setLoading(true);
    setError("");
    try {
      const socket = getSocket();
      if (!socket.connected) connectSocket();

      const result = await new Promise<{ id: string; code: string; joinUrl: string; qrCodeBase64: string }>(
        (resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Connection timeout — is the server running?")), 8000);
          socket.emit("room:create", (res) => { clearTimeout(timeout); resolve(res); });
        }
      );

      setMyInfo(socket.id ?? "", "Host", "naruto");
      router.push(`/host?roomId=${result.id}&code=${result.code}&qr=${encodeURIComponent(result.qrCodeBase64)}&url=${encodeURIComponent(result.joinUrl)}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create room. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-16 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-16 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div variants={container} initial="hidden" animate="show" className="max-w-lg w-full text-center">
        <motion.div variants={item} className="text-6xl mb-6 inline-block">🎮</motion.div>

        <motion.h1 variants={item} className="text-6xl sm:text-7xl font-black tracking-tight mb-3">
          Quiz
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-orange-400">
            Blast
          </span>
        </motion.h1>

        <motion.p variants={item} className="text-xl font-bold text-white/70 mb-2">
          Think fast. Answer faster.
        </motion.p>
        <motion.p variants={item} className="text-white/35 text-sm mb-10 max-w-sm mx-auto leading-relaxed">
          Embarrass your friends in real-time — or challenge the system solo.&nbsp;
          10 questions. AI-generated. No repeats.
        </motion.p>

        {/* Mode selector */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* 1 Player */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/solo")}
            className="flex flex-col items-center gap-2 bg-gradient-to-br from-violet-600/80 to-blue-600/80 hover:from-violet-500/90 hover:to-blue-500/90 border border-violet-500/30 text-white font-black text-lg px-6 py-5 rounded-2xl shadow-xl transition-all"
          >
            <span className="text-3xl">🎯</span>
            <span>1 Player</span>
            <span className="text-xs font-normal text-white/60">Play solo vs the system</span>
          </motion.button>

          {/* Multiplayer */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleMultiplayer}
            disabled={loading}
            className="flex flex-col items-center gap-2 bg-white hover:bg-white/90 text-black font-black text-lg px-6 py-5 rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <span className="w-7 h-7 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span>Creating room…</span>
              </>
            ) : (
              <>
                <span className="text-3xl">👥</span>
                <span>Play with Friends</span>
                <span className="text-xs font-normal text-black/50">Host a real-time room</span>
              </>
            )}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-red-400 text-sm font-bold mb-4">{error}</motion.p>
          )}
        </AnimatePresence>

        <motion.p variants={item} className="text-white/20 text-xs mb-10">
          No sign-up needed · Just pick and play
        </motion.p>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-3 gap-3 mb-8">
          {[
            { value: "10",  label: "Questions" },
            { value: "30s", label: "Solo timer" },
            { value: "∞",   label: "Unique Qs" },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl py-4">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-[11px] text-white/35 font-bold mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Categories */}
        <motion.div variants={item} className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => (
            <span key={c.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-bold text-white/50">
              {c.emoji} {c.label}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </main>
  );
}
