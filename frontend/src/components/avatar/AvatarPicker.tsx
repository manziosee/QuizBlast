import { AVATARS } from "@/lib/constants";
import { avatarUrl } from "@/lib/utils";
import type { AvatarSeed } from "@/types";

interface Props {
  selected: AvatarSeed;
  onSelect: (seed: AvatarSeed) => void;
}

export default function AvatarPicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATARS.map((a) => (
        <button
          key={a.seed}
          onClick={() => onSelect(a.seed)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            selected === a.seed
              ? "bg-purple-600 ring-2 ring-purple-400"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <img src={avatarUrl(a.seed)} alt={a.label} className="w-12 h-12 rounded-full bg-white/20" />
          <span className="text-xs font-bold">{a.label}</span>
        </button>
      ))}
    </div>
  );
}
