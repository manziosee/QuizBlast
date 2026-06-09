"use client";
import { motion } from "framer-motion";
import { avatarUrl } from "@/lib/utils";
import type { PlayerRanking } from "@/types";

interface PodiumEntry {
  position: number;
  platformHeight: string;
  gradient: string;
  avatarSize: string;
  avatarRing: string;
  medal: string;
  labelColor: string;
  visualOrder: number;
  animDelay: number;
}

const PODIUM_CONFIG: PodiumEntry[] = [
  {
    position: 2,
    platformHeight: "h-20",
    gradient: "from-slate-600 to-slate-800",
    avatarSize: "w-14 h-14",
    avatarRing: "ring-2 ring-slate-400",
    medal: "🥈",
    labelColor: "text-slate-300",
    visualOrder: 1,
    animDelay: 0.3,
  },
  {
    position: 1,
    platformHeight: "h-32",
    gradient: "from-amber-400 to-amber-600",
    avatarSize: "w-20 h-20",
    avatarRing: "ring-4 ring-amber-400 shadow-lg shadow-amber-400/30",
    medal: "🥇",
    labelColor: "text-amber-300",
    visualOrder: 2,
    animDelay: 0.1,
  },
  {
    position: 3,
    platformHeight: "h-12",
    gradient: "from-orange-700 to-orange-900",
    avatarSize: "w-12 h-12",
    avatarRing: "ring-2 ring-orange-500",
    medal: "🥉",
    labelColor: "text-orange-400",
    visualOrder: 3,
    animDelay: 0.5,
  },
];

interface Props {
  top3: PlayerRanking[];
}

export default function PodiumStage({ top3 }: Props) {
  if (top3.length === 0) return null;

  // Display order: 2nd (left) · 1st (center) · 3rd (right)
  const orderedConfig = [...PODIUM_CONFIG].sort((a, b) => a.visualOrder - b.visualOrder);

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4">
      {orderedConfig.map((cfg) => {
        const ranking = top3.find((r) => r.position === cfg.position);
        if (!ranking) {
          return (
            <div
              key={cfg.position}
              className={`w-24 sm:w-28 ${cfg.platformHeight} bg-white/5 rounded-t-2xl`}
            />
          );
        }

        return (
          <motion.div
            key={cfg.position}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: cfg.animDelay, type: "spring", bounce: 0.3 }}
            className="flex flex-col items-center gap-1.5"
          >
            {/* Avatar + info */}
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-2xl">{cfg.medal}</span>
              <motion.img
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: cfg.animDelay + 0.15, type: "spring", bounce: 0.5 }}
                src={avatarUrl(ranking.player.avatar)}
                alt={ranking.player.name}
                className={`rounded-full bg-white/10 object-cover ${cfg.avatarSize} ${cfg.avatarRing}`}
              />
              <p
                className={`font-black max-w-[80px] truncate ${
                  cfg.position === 1 ? "text-white text-sm" : "text-white/70 text-xs"
                }`}
              >
                {ranking.player.name}
              </p>
              <p className={`text-[10px] font-black ${cfg.labelColor}`}>
                {ranking.player.score.toLocaleString()} pts
              </p>
              <p className="text-[10px] text-white/30 font-bold">
                {ranking.correctCount} / {ranking.correctCount + ranking.wrongCount} ✓
              </p>
            </div>

            {/* Platform */}
            <div
              className={`w-24 sm:w-28 ${cfg.platformHeight} bg-gradient-to-b ${cfg.gradient} rounded-t-2xl flex items-center justify-center`}
            >
              <span className={`font-black text-sm ${cfg.labelColor}`}>
                {cfg.position === 1 ? "1st" : cfg.position === 2 ? "2nd" : "3rd"}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
