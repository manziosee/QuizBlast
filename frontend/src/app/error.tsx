"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push("/"), 5000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.4 }}
        className="text-6xl"
      >
        💥
      </motion.div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black">Something went wrong</h1>
        <p className="text-white/40 text-sm max-w-sm">{error.message}</p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="bg-white text-black font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
        >
          Go home
        </button>
      </div>
      <p className="text-white/20 text-xs">Redirecting home in 5 seconds…</p>
    </main>
  );
}
