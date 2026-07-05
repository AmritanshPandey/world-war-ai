"use client";

import { useAnimatedScore } from "@/components/find-the-pattern/hooks/useScore";
import { SCORE_LIMITS } from "@/components/find-the-pattern/lib/game-config";
import { formatScore } from "@/components/find-the-pattern/lib/game-utils";
import { cn } from "@/lib/utils";

type ScoreDisplayProps = {
  score: number;
};

export default function ScoreDisplay({ score }: ScoreDisplayProps) {
  const animatedScore = useAnimatedScore(score);
  const roundedScore = Math.round(animatedScore);
  const meterValue = Math.min(1, Math.max(0, roundedScore / SCORE_LIMITS.max));

  return (
    <div className="min-w-[9.5rem] border border-white/15 bg-black/55 px-4 py-3 shadow-[0_0_34px_rgba(0,0,0,0.36)] backdrop-blur-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
        Signal Score
      </p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p
          className={cn(
            "font-mono text-2xl leading-none tracking-[0.08em] transition-colors",
            roundedScore > 0 ? "text-[#d8b35f]" : "text-[#d3170c]",
          )}
        >
          {formatScore(roundedScore)}
        </p>
        <p className="font-mono text-[11px] leading-none text-white/40">/ 100</p>
      </div>
      <div className="mt-3 grid grid-cols-10 gap-1" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, index) => {
          const filled = (index + 1) / 10 <= meterValue + 0.001;

          return (
            <span
              key={index}
              className={cn(
                "h-1.5 border border-white/10 transition-colors",
                filled
                  ? roundedScore >= 70
                    ? "bg-[#d8b35f]"
                    : "bg-[#d3170c]"
                  : "bg-white/5",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
