"use client";
import { useState, useEffect } from "react";

export function useTimer(timerEndsAt: number | null) {
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    if (!timerEndsAt) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timerEndsAt]);

  return {
    secondsLeft,
    percentage: (secondsLeft / 60) * 100,
    isUrgent: secondsLeft <= 10,
  };
}
