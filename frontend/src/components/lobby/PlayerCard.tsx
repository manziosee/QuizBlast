import { motion } from "framer-motion";
import Avatar from "@/components/avatar/Avatar";
import type { Player } from "@/types";

interface Props {
  player: Player;
  isMe: boolean;
}

export default function PlayerCard({ player, isMe }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`bg-white/10 rounded-xl p-3 flex items-center gap-3 ${isMe ? "ring-2 ring-purple-500" : ""}`}
    >
      <Avatar seed={player.avatar} size={40} />
      <div>
        <p className="font-bold text-sm truncate">{player.name}</p>
        {isMe && <p className="text-xs text-purple-400">You</p>}
      </div>
    </motion.div>
  );
}
