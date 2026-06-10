"use client";
import { useState, useEffect } from "react";

export function useTimer(timerEndsAt: number | null, totalMs = 60_000) {
  const [secondsLeft, setSecondsLeft] = useState(totalMs / 1000);

  useEffect(() => {
    if (!timerEndsAt) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timerEndsAt]);

  const totalSeconds = totalMs / 1000;
  return {
    secondsLeft,
    percentage: (secondsLeft / totalSeconds) * 100,
    isUrgent: secondsLeft <= 10,
  };
}
