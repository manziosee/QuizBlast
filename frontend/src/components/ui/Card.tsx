import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  children: React.ReactNode;
}

export default function Card({ className, children }: Props) {
  return (
    <div className={cn("bg-white/5 rounded-2xl p-5", className)}>
      {children}
    </div>
  );
}
