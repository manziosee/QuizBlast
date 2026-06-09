import { AnimatePresence } from "framer-motion";
import PlayerCard from "./PlayerCard";
import type { Player } from "@/types";

interface Props {
  players: Player[];
  myId: string | null;
}

export default function PlayerGrid({ players, myId }: Props) {
  if (players.length === 0) {
    return <p className="text-gray-500 text-sm">Waiting for players to join…</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <AnimatePresence>
        {players.map((p) => (
          <PlayerCard key={p.id} player={p} isMe={p.id === myId} />
        ))}
      </AnimatePresence>
    </div>
  );
}
