"use client";
import { motion } from "framer-motion";
import { avatarUrl } from "@/lib/utils";
import type { PlayerRanking } from "@/types";

interface Props {
  rankings: PlayerRanking[];
}

export default function RankingList({ rankings }: Props) {
  if (rankings.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-white/30 text-[11px] font-black uppercase tracking-widest mb-3">
        Other Players
      </p>
      {rankings.map((entry, i) => (
        <motion.div
          key={entry.player.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 + i * 0.08 }}
          className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3 flex items-center gap-3"
        >
          <span className="text-white/25 font-black text-sm w-5 flex-shrink-0 tabular-nums text-right">
            {entry.position}
          </span>
          <img
            src={avatarUrl(entry.player.avatar)}
            alt={entry.player.name}
            className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0 object-cover"
          />
          <span className="font-bold text-sm text-white/70 flex-1 min-w-0 truncate">
            {entry.player.name}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] text-emerald-400 font-black">✅ {entry.correctCount}</span>
            <span className="text-[11px] text-red-400 font-black">❌ {entry.wrongCount}</span>
          </div>
          <span className="text-white/60 font-black text-sm flex-shrink-0 tabular-nums">
            {entry.player.score.toLocaleString()}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
