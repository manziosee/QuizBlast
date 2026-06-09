"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export default function Button({ variant = "primary", className, children, disabled, ...props }: Props) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      disabled={disabled}
      className={cn(
        "font-black text-xl py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" && "bg-gradient-to-r from-purple-600 to-orange-500 text-white shadow-lg",
        variant === "ghost" && "bg-white/10 hover:bg-white/20 text-white",
        className
      )}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
