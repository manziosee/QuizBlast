"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  isCorrect: boolean;
  explanation: string;
}

export default function ResultBanner({ isCorrect, explanation }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", bounce: 0.3 }}
      className={cn(
        "rounded-2xl p-5 text-center border",
        isCorrect
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-red-500/10 border-red-500/30"
      )}
    >
      <p className={cn("text-2xl font-black", isCorrect ? "text-emerald-400" : "text-red-400")}>
        {isCorrect ? "✅ CORRECT!" : "❌ WRONG"}
      </p>
      {explanation && (
        <p className="text-sm text-white/50 mt-2 leading-relaxed">{explanation}</p>
      )}
    </motion.div>
  );
}
