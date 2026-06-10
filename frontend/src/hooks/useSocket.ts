"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocket, connectSocket } from "@/lib/socket";
import { useGameStore } from "@/store/gameStore";

export function useSocket(roomId?: string) {
  const {
    setRoom, addPlayer, removePlayer,
    setQuestion, setResult, setRankings,
    setLiveLeaderboard, setAnsweredCount, setReconnecting,
  } = useGameStore();
  const router = useRouter();

  useEffect(() => {
    let socket: ReturnType<typeof getSocket>;
    try {
      socket = getSocket();
      if (!socket.connected) connectSocket();
    } catch {
      return;
    }

    const onRoomUpdated = setRoom;
    const onPlayerJoined = addPlayer;
    const onPlayerLeft = removePlayer;
    const onRoomLocked = () => {};

    const onQuestion = ({ question, index, timerEndsAt, totalMs }: {
      question: any; index: number; total: number; timerEndsAt: number; totalMs: number;
    }) => {
      setQuestion(question, index, timerEndsAt, totalMs);
      if (roomId) router.push(`/room/${roomId}/game`);
    };

    const onResult = setResult;

    const onLeaderboard = (rankings: any[]) => {
      setLiveLeaderboard(rankings);
    };

    const onAnswerCount = ({ answered }: { answered: number; total: number }) => {
      setAnsweredCount(answered, 0);
    };

    const onEnded = (rankings: any[]) => {
      setRankings(rankings);
      if (roomId) router.push(`/room/${roomId}/results`);
    };

    const onError = (msg: string) => {
      // Critical errors that end the session — redirect home
      const fatal = [
        "Host disconnected",
        "All players disconnected",
        "You were removed",
      ].some((s) => msg.includes(s));
      if (fatal && roomId) {
        router.push(`/?error=${encodeURIComponent(msg)}`);
      } else {
        console.warn("Socket error:", msg);
      }
    };

    const onDisconnect      = () => setReconnecting(true);
    const onReconnect       = () => setReconnecting(false);
    const onReconnectFailed = () => { setReconnecting(false); router.push("/"); };

    socket.on("room:updated",          onRoomUpdated);
    socket.on("player:joined",         onPlayerJoined);
    socket.on("player:left",           onPlayerLeft);
    socket.on("room:locked",           onRoomLocked);
    socket.on("game:question",         onQuestion as any);
    socket.on("game:question-result",  onResult);
    socket.on("game:leaderboard",      onLeaderboard);
    socket.on("game:answer-count",     onAnswerCount as any);
    socket.on("game:ended",            onEnded);
    socket.on("error",                 onError);
    socket.on("disconnect",            onDisconnect);
    // reconnect / reconnect_failed are Manager-level events
    socket.io.on("reconnect",         onReconnect);
    socket.io.on("reconnect_failed",  onReconnectFailed);

    return () => {
      socket.off("room:updated",         onRoomUpdated);
      socket.off("player:joined",        onPlayerJoined);
      socket.off("player:left",          onPlayerLeft);
      socket.off("room:locked",          onRoomLocked);
      socket.off("game:question",        onQuestion as any);
      socket.off("game:question-result", onResult);
      socket.off("game:leaderboard",     onLeaderboard);
      socket.off("game:answer-count",    onAnswerCount as any);
      socket.off("game:ended",           onEnded);
      socket.off("error",                onError);
      socket.off("disconnect",           onDisconnect);
      socket.io.off("reconnect",         onReconnect);
      socket.io.off("reconnect_failed",  onReconnectFailed);
    };
  }, [roomId, setRoom, addPlayer, removePlayer, setQuestion, setResult, setRankings, setLiveLeaderboard, setAnsweredCount, setReconnecting, router]);

  try {
    return getSocket();
  } catch {
    return { emit: () => {}, connected: false } as any;
  }
}
