"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocket, connectSocket } from "@/lib/socket";
import { useGameStore } from "@/store/gameStore";

// Returns a socket that may or may not be connected.
// When no backend is running the mock engine drives everything,
// so we just attach listeners silently and never error out.
export function useSocket(roomId?: string) {
  const { setRoom, addPlayer, removePlayer, setQuestion, setResult, setRankings } = useGameStore();
  const router = useRouter();

  useEffect(() => {
    let socket: ReturnType<typeof getSocket>;
    try {
      socket = getSocket();
      if (!socket.connected) connectSocket();
    } catch {
      return;
    }

    socket.on("room:updated", setRoom);
    socket.on("player:joined", addPlayer);
    socket.on("player:left", removePlayer);
    socket.on("room:locked", () => {});
    socket.on("game:question", ({ question, index, timerEndsAt }) => {
      setQuestion(question, index, timerEndsAt);
      if (roomId) router.push(`/room/${roomId}/game`);
    });
    socket.on("game:question-result", setResult);
    socket.on("game:ended", (rankings) => {
      setRankings(rankings);
      if (roomId) router.push(`/room/${roomId}/results`);
    });
    socket.on("error", (msg) => console.warn("Socket error:", msg));

    return () => {
      socket.off("room:updated");
      socket.off("player:joined");
      socket.off("player:left");
      socket.off("room:locked");
      socket.off("game:question");
      socket.off("game:question-result");
      socket.off("game:ended");
      socket.off("error");
    };
  }, [roomId, setRoom, addPlayer, removePlayer, setQuestion, setResult, setRankings, router]);

  try {
    return getSocket();
  } catch {
    // return a no-op socket-like object so callers don't crash
    return { emit: () => {}, connected: false } as any;
  }
}
