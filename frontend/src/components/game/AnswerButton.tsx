"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const OPTION_STYLES = [
  {
    gradient: "from-violet-600 to-violet-800",
    ring: "ring-violet-400",
    label: "bg-violet-900/60",
  },
  {
    gradient: "from-blue-600 to-blue-800",
    ring: "ring-blue-400",
    label: "bg-blue-900/60",
  },
  {
    gradient: "from-amber-500 to-amber-700",
    ring: "ring-amber-400",
    label: "bg-amber-900/60",
  },
  {
    gradient: "from-rose-600 to-rose-800",
    ring: "ring-rose-400",
    label: "bg-rose-900/60",
  },
];

interface Props {
  option: "A" | "B" | "C" | "D";
  index: number;
  text: string;
  selected: boolean;
  locked: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  revealed: boolean;
  onClick: () => void;
}

export default function AnswerButton({
  option,
  index,
  text,
  selected,
  locked,
  isCorrect,
  isWrong,
  revealed,
  onClick,
}: Props) {
  const style = OPTION_STYLES[index];

  return (
    <motion.button
      whileHover={!locked ? { scale: 1.025, y: -2 } : {}}
      whileTap={!locked ? { scale: 0.975 } : {}}
      onClick={onClick}
      disabled={locked}
      className={cn(
        "relative rounded-2xl p-4 text-left font-bold text-base transition-all overflow-hidden",
        `bg-gradient-to-br ${style.gradient}`,
        // Default: clickable cursor
        !locked && "cursor-pointer hover:shadow-lg hover:shadow-black/40",
        locked && "cursor-default",
        // Selected before reveal
        selected && !revealed && `ring-2 ${style.ring} shadow-lg`,
        // Correct answer revealed
        revealed && isCorrect && "ring-2 ring-green-400 shadow-lg shadow-green-400/20",
        // Wrong answer revealed
        revealed && isWrong && "ring-2 ring-red-400 opacity-60",
        // Unselected options after reveal
        revealed && !isCorrect && !selected && "opacity-30"
      )}
      aria-pressed={selected}
    >
      {/* Option label badge */}
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white",
            style.label
          )}
        >
          {option}
        </span>
        <span className="text-white leading-snug pt-0.5">{text}</span>
      </div>

      {/* Correct tick overlay */}
      {revealed && isCorrect && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-3 right-3 text-green-300 text-lg"
        >
          ✓
        </motion.span>
      )}

      {/* Wrong X overlay */}
      {revealed && isWrong && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-3 right-3 text-red-300 text-lg"
        >
          ✗
        </motion.span>
      )}
    </motion.button>
  );
}
