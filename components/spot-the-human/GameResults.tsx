"use client";

import type { SpotTheHumanState } from "@/components/spot-the-human/hooks/useSpotTheHumanGame";
import { formatDuration, formatScore } from "@/components/spot-the-human/lib/scoring";

type GameResultsProps = {
  onContinue: () => void;
  onReplay: () => void;
  state: SpotTheHumanState;
};

export default function GameResults({
  onContinue,
  onReplay,
  state,
}: GameResultsProps) {
  const visible = state.status === "results";

  return (
    <div
      className={
        visible
          ? "pointer-events-auto absolute inset-0 z-50 flex items-center px-5 py-20 opacity-100 transition-opacity duration-500 md:px-10"
          : "pointer-events-none absolute inset-0 z-50 flex items-center px-5 py-20 opacity-0 transition-opacity duration-500 md:px-10"
      }
    >
      <div className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-[minmax(0,1fr)_22rem] md:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d8b35f]">
            OUTLIER CONFIRMED
          </p>
          <p className="title-display mt-6 max-w-4xl text-4xl font-bold uppercase leading-[1.06] text-[#f2efe6] sm:text-5xl md:text-6xl">
            You didn&apos;t survive by reacting faster.
          </p>
          <p className="title-display mt-8 max-w-4xl text-3xl font-bold uppercase leading-[1.1] text-white/88 sm:text-4xl md:text-5xl">
            You survived by seeing
            <span className="block text-[#d8b35f]">what the swarm missed.</span>
          </p>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-white/62">
            {state.finalRankCopy}
          </p>
          <div className="mt-12 font-mono text-[11px] uppercase tracking-[0.26em] text-white/58">
            <p className="text-[#f2efe6]">World War AI</p>
            <p className="mt-4">Observe the chaos.</p>
            <p>Find the human.</p>
            <p className="text-[#d3170c]">Design what matters.</p>
          </div>
        </div>

        <div className="border border-white/15 bg-black/60 p-5 backdrop-blur-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
            Final Observation Score
          </p>
          <p className="mt-4 font-mono text-5xl leading-none tracking-[0.04em] text-[#d8b35f]">
            {formatScore(state.score)}
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#f2efe6]">
            {state.finalRank}
          </p>
          <dl className="mt-6 grid gap-3 border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[0.2em]">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/36">Accuracy</dt>
              <dd className="text-[#d8b35f]">{state.accuracy}%</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/36">Wrong locks</dt>
              <dd className="text-[#f2efe6]">{state.wrongClicks}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/36">Hints used</dt>
              <dd className="text-[#f2efe6]">{state.hintUsedRounds.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/36">Time taken</dt>
              <dd className="text-[#f2efe6]">{formatDuration(state.totalTimeMs)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
              <dt className="text-white/36">Personal best</dt>
              <dd className="text-white/70">
                {formatScore(state.personalBestScore)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/36">Best rank</dt>
              <dd className="text-white/70">{state.personalBestRank}</dd>
            </div>
          </dl>
          <div className="mt-8 grid gap-3">
            <button
              type="button"
              onClick={onReplay}
              aria-label="Replay Spot The Human"
              className="min-h-11 w-full border border-white/25 bg-black/50 px-4 font-mono text-[11px] uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-[#d8b35f] hover:text-[#f2efe6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8b35f]"
            >
              Replay Observation
            </button>
            <button
              type="button"
              onClick={onContinue}
              aria-label="Continue to final manifesto"
              className="min-h-11 w-full border border-[#d3170c]/55 bg-[#d3170c]/10 px-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[#f2efe6] transition-colors hover:border-[#d8b35f] hover:bg-[#d8b35f]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8b35f]"
            >
              Continue to Manifesto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
