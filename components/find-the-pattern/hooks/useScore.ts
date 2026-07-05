"use client";

import { useEffect, useRef, useState } from "react";
import { SCORE_LIMITS } from "@/components/find-the-pattern/lib/game-config";
import { clampRange } from "@/components/find-the-pattern/lib/game-utils";

export type ResultCategory = {
  title: string;
  description: string;
};

export function calculateTimeBonus(
  elapsedMs: number,
  maxBonus: number,
  fullBonusAtMs: number,
  noBonusAtMs: number,
) {
  if (elapsedMs <= fullBonusAtMs) {
    return maxBonus;
  }

  if (elapsedMs >= noBonusAtMs) {
    return 0;
  }

  const progress =
    1 - (elapsedMs - fullBonusAtMs) / (noBonusAtMs - fullBonusAtMs);

  return Math.round(maxBonus * clampRange(progress, 0, 1));
}

export function clampScore(score: number) {
  return clampRange(score, 0, SCORE_LIMITS.max);
}

export function getResultCategory(score: number): ResultCategory {
  if (score >= 90) {
    return {
      title: "PATTERN ARCHITECT",
      description: "You found coherence before the noise could define the system.",
    };
  }

  if (score >= 70) {
    return {
      title: "SIGNAL HUNTER",
      description: "You found the signal. Next time, trust your observation sooner.",
    };
  }

  if (score >= 40) {
    return {
      title: "NOISE NAVIGATOR",
      description: "You kept looking. That is where judgment begins.",
    };
  }

  return {
    title: "SYSTEM OBSERVER",
    description: "Chaos is easier to read when you slow down and study behavior.",
  };
}

export function useAnimatedScore(score: number) {
  const [animatedScore, setAnimatedScore] = useState(score);
  const animatedScoreRef = useRef(score);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const from = animatedScoreRef.current;
    const delta = score - from;

    if (delta === 0) {
      return undefined;
    }

    const tick = (now: number) => {
      const progress = clampRange((now - start) / 520, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextScore = from + delta * eased;

      animatedScoreRef.current = nextScore;
      setAnimatedScore(nextScore);

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [score]);

  return animatedScore;
}
