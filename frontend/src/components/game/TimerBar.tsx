"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  percentage: number;
  isUrgent: boolean;
}

export default function TimerBar({ percentage, isUrgent }: Props) {
  return (
    <div className="h-3 bg-white/[0.08] rounded-full overflow-hidden">
      <motion.div
        className={cn(
          "h-full rounded-full transition-colors",
          isUrgent
            ? "bg-gradient-to-r from-orange-500 to-red-500"
            : "bg-gradient-to-r from-violet-500 to-blue-500"
        )}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "linear" }}
      />
    </div>
  );
}
