"use client";

import { useEffect, useRef, useState } from "react";
import { formatScore } from "@/components/hold-the-line/lib/scoring";

type ScoreDisplayProps = {
  combo: number;
  score: number;
};

export default function ScoreDisplay({ combo, score }: ScoreDisplayProps) {
  const [displayScore, setDisplayScore] = useState(score);
  const scoreRef = useRef(score);

  useEffect(() => {
    let frame = 0;
    const from = scoreRef.current;
    const delta = score - from;
    const start = performance.now();

    if (delta === 0) {
      return undefined;
    }

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 520);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextScore = from + delta * eased;

      scoreRef.current = nextScore;
      setDisplayScore(nextScore);

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="min-w-[10.5rem] border border-white/15 bg-black/55 px-4 py-3 shadow-[0_0_34px_rgba(0,0,0,0.36)] backdrop-blur-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
        Signal Score
      </p>
      <p className="mt-2 font-mono text-3xl leading-none tracking-[0.06em] text-[#d8b35f]">
        {formatScore(displayScore)}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[10px] uppercase tracking-[0.2em]">
        <span className="text-white/36">Combo</span>
        <span className="text-[#f2efe6]">x{combo}</span>
      </div>
    </div>
  );
}
