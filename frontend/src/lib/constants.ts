import type { AvatarSeed, Category } from "@/types";

export const AVATARS: { seed: AvatarSeed; label: string }[] = [
  { seed: "naruto",   label: "Naruto" },
  { seed: "luffy",    label: "Luffy" },
  { seed: "goku",     label: "Goku" },
  { seed: "saitama",  label: "Saitama" },
  { seed: "mikasa",   label: "Mikasa" },
  { seed: "nezuko",   label: "Nezuko" },
  { seed: "tanjiro",  label: "Tanjiro" },
  { seed: "zoro",     label: "Zoro" },
  { seed: "ichigo",   label: "Ichigo" },
  { seed: "killua",   label: "Killua" },
  { seed: "gon",      label: "Gon" },
  { seed: "todoroki", label: "Todoroki" },
];

export const CATEGORIES: { id: Category; label: string; emoji: string; color: string }[] = [
  { id: "math",      label: "Mathematics",       emoji: "➗", color: "from-purple-600 to-purple-900" },
  { id: "science",   label: "Science",            emoji: "🔬", color: "from-blue-600 to-blue-900" },
  { id: "history",   label: "History",            emoji: "📜", color: "from-amber-600 to-amber-900" },
  { id: "geography", label: "Geography",          emoji: "🌍", color: "from-green-600 to-green-900" },
  { id: "common",    label: "General Knowledge",  emoji: "💡", color: "from-rose-600 to-rose-900" },
];

export const QUESTION_TIME_SECONDS = 60;
export const TOTAL_QUESTIONS = 10;
