"use client";

import type { GameState } from "@/components/find-the-pattern/hooks/useGameState";
import { formatScore } from "@/components/find-the-pattern/lib/game-utils";

type GameResultsProps = {
  state: GameState;
  onReplay: () => void;
};

export default function GameResults({ state, onReplay }: GameResultsProps) {
  const visible = state.status === "results";

  return (
    <div
      className={
        visible
          ? "pointer-events-auto absolute inset-0 z-30 flex items-center px-5 py-24 opacity-100 transition-opacity duration-500 md:px-10"
          : "pointer-events-none absolute inset-0 z-30 flex items-center px-5 py-24 opacity-0 transition-opacity duration-500 md:px-10"
      }
    >
      <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-[minmax(0,1fr)_20rem] md:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d8b35f]">
            {state.result.title}
          </p>
          <p className="title-display mt-6 max-w-4xl text-4xl font-bold uppercase leading-[1.06] text-[#f2efe6] sm:text-5xl md:text-6xl">
            You didn&apos;t win by moving faster.
          </p>
          <p className="title-display mt-8 max-w-4xl text-3xl font-bold uppercase leading-[1.1] text-white/88 sm:text-4xl md:text-5xl">
            You won by noticing
            <span className="block text-[#d8b35f]">what others missed.</span>
          </p>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-white/62">
            {state.result.description}
          </p>
          <div className="mt-12 font-mono text-[11px] uppercase tracking-[0.26em] text-white/58">
            <p className="text-[#f2efe6]">World War AI</p>
            <p className="mt-4">Observe the chaos.</p>
            <p>Find the pattern.</p>
            <p className="text-[#d3170c]">Design what matters.</p>
          </div>
        </div>

        <div className="border border-white/15 bg-black/55 p-5 backdrop-blur-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
            Final Signal Score
          </p>
          <p className="mt-4 font-mono text-5xl leading-none tracking-[0.06em] text-[#d8b35f]">
            {formatScore(state.score)}
          </p>
          <p className="mt-2 font-mono text-[11px] text-white/38">/ 100</p>
          <dl className="mt-6 grid gap-3 border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[0.2em]">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/36">Best streak</dt>
              <dd className="text-[#d8b35f]">x{state.bestStreak}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/36">Decoy locks</dt>
              <dd className={state.falseAttempts > 0 ? "text-[#d3170c]" : "text-white/60"}>
                {state.falseAttempts}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/36">Decision misses</dt>
              <dd
                className={
                  state.wrongDecisionCount > 0 ? "text-[#d3170c]" : "text-white/60"
                }
              >
                {state.wrongDecisionCount}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={onReplay}
            className="mt-8 min-h-11 w-full border border-white/25 bg-black/50 px-4 font-mono text-[11px] uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-[#d8b35f] hover:text-[#f2efe6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8b35f]"
          >
            Replay the Test
          </button>
        </div>
      </div>
    </div>
  );
}
