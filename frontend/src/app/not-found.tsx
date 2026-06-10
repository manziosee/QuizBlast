"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function NotFoundPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push("/"), 4000);
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
        🔍
      </motion.div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black">Page not found</h1>
        <p className="text-white/40 text-sm">This room or page doesn't exist.</p>
      </div>
      <button
        type="button"
        onClick={() => router.push("/")}
        className="bg-white text-black font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
      >
        Back to home
      </button>
      <p className="text-white/20 text-xs">Redirecting in 4 seconds…</p>
    </main>
  );
}
