"use client";

import { useEffect, useRef, useState } from "react";
import { formatScore } from "@/components/spot-the-human/lib/scoring";

type ScoreDisplayProps = {
  accuracy: number;
  round: number;
  score: number;
};

export default function ScoreDisplay({
  accuracy,
  round,
  score,
}: ScoreDisplayProps) {
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
    <div className="min-w-[11rem] border border-white/15 bg-black/60 px-4 py-3 shadow-[0_0_34px_rgba(0,0,0,0.42)] backdrop-blur-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
        Observation Score
      </p>
      <p className="mt-2 font-mono text-3xl leading-none tracking-[0.06em] text-[#d8b35f]">
        {formatScore(displayScore)}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 font-mono text-[10px] uppercase tracking-[0.2em]">
        <div>
          <span className="block text-white/36">Accuracy</span>
          <span className="mt-1 block text-[#f2efe6]">{accuracy}%</span>
        </div>
        <div>
          <span className="block text-white/36">Round</span>
          <span className="mt-1 block text-[#f2efe6]">
            {String(round).padStart(2, "0")} / 03
          </span>
        </div>
      </div>
    </div>
  );
}
