import { avatarUrl } from "@/lib/utils";
import type { AvatarSeed } from "@/types";

interface Props {
  seed: AvatarSeed;
  size?: number;
  className?: string;
}

export default function Avatar({ seed, size = 48, className = "" }: Props) {
  return (
    <img
      src={avatarUrl(seed)}
      alt={seed}
      width={size}
      height={size}
      className={`rounded-full bg-white/20 ${className}`}
    />
  );
}
