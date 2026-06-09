import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuizBlast 🎮",
  description: "Real-time multiplayer quiz game — 10 questions, 60 seconds each, one winner on a podium.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-display antialiased">{children}</body>
    </html>
  );
}
