"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { generateMockRoom } from "@/lib/mock";
import { CATEGORIES } from "@/lib/constants";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleStart() {
    setLoading(true);
    try {
      const { code, joinUrl, qrCodeBase64 } = await generateMockRoom();
      router.push(
        `/host?code=${code}&qr=${encodeURIComponent(qrCodeBase64)}&url=${encodeURIComponent(joinUrl)}`
      );
    } catch {
      alert("Failed to generate room. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-16 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-16 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-lg w-full text-center"
      >
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
          Embarrass your friends publicly in real-time.&nbsp;
          10 questions. 60 seconds each. One winner on a podium.
        </motion.p>

        <motion.div variants={item}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStart}
            disabled={loading}
            className="inline-flex items-center justify-center gap-3 bg-white text-black font-black text-xl px-12 py-4 rounded-2xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors w-full sm:w-auto"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Creating room…
              </>
            ) : "🚀 Start a Game"}
          </motion.button>
          <p className="text-white/25 text-xs mt-4">No sign-up needed · Just scan &amp; play</p>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-3 gap-3 mt-10">
          {[
            { value: "10", label: "Questions" },
            { value: "60s", label: "Per question" },
            { value: "5",  label: "Categories" },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl py-4">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-[11px] text-white/35 font-bold mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div variants={item} className="flex flex-wrap justify-center gap-2 mt-8">
          {CATEGORIES.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-bold text-white/50"
            >
              {c.emoji} {c.label}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </main>
  );
}
