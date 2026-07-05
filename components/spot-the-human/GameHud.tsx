"use client";

import HintButton from "@/components/spot-the-human/HintButton";
import RoundPrompt from "@/components/spot-the-human/RoundPrompt";
import ScoreDisplay from "@/components/spot-the-human/ScoreDisplay";
import type { SpotTheHumanState } from "@/components/spot-the-human/hooks/useSpotTheHumanGame";
import { isActiveRoundStatus } from "@/components/spot-the-human/lib/game-config";
import { formatDuration } from "@/components/spot-the-human/lib/scoring";
import { cn } from "@/lib/utils";

type GameHudProps = {
  onHint: () => void;
  state: SpotTheHumanState;
};

function isVisible(status: SpotTheHumanState["status"]) {
  return isActiveRoundStatus(status) || status.endsWith("Success");
}

export default function GameHud({ onHint, state }: GameHudProps) {
  if (!isVisible(state.status)) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between px-5 py-6 md:px-10 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d3170c] md:text-xs">
            WORLD WAR AI / FINAL TEST
          </p>
          <h2 className="title-display mt-4 text-4xl font-bold leading-none text-[#f2efe6] md:text-6xl">
            SPOT THE HUMAN
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/62 md:text-lg">
            Notice the one behavior the outbreak cannot imitate.
          </p>
        </div>
        <ScoreDisplay
          accuracy={state.accuracy}
          round={state.currentRound}
          score={state.score}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end">
        <div>
          <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
            <div className="border border-white/12 bg-black/45 p-4 backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
                Timer
              </p>
              <p className="mt-2 font-mono text-2xl leading-none text-[#d8b35f]">
                {formatDuration(state.timeRemainingMs)}
              </p>
            </div>
            <div className="border border-white/12 bg-black/45 p-4 backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
                Swarm density
              </p>
              <p className="mt-2 font-mono text-2xl leading-none text-[#f2efe6]">
                {String(state.scene.figures.length).padStart(3, "0")}
              </p>
            </div>
            <div className="border border-white/12 bg-black/45 p-4 backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
                Threat
              </p>
              <p
                className={cn(
                  "mt-2 font-mono text-2xl leading-none",
                  state.threat > 0.72 ? "text-[#d3170c]" : "text-[#f2efe6]",
                )}
              >
                {Math.round(state.threat * 100)}%
              </p>
            </div>
          </div>

          <div className="mt-4">
            <RoundPrompt state={state} />
          </div>

          <div className="mt-4 max-w-3xl border border-white/12 bg-black/55 p-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                className={cn(
                  "font-mono text-[10px] uppercase tracking-[0.24em]",
                  state.feedbackTone === "coherence" ||
                    state.feedbackTone === "success"
                    ? "text-[#d8b35f]"
                    : state.feedbackTone === "warning"
                      ? "text-[#d3170c]"
                      : "text-white/38",
                )}
              >
                {state.scannerFeedback}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/36">
                Confidence {Math.round(state.scannerConfidence * 100)}%
              </p>
            </div>
            <p className="mt-3 min-h-6 text-sm leading-6 text-white/68" aria-live="polite">
              {state.statusMessage}
            </p>
          </div>

          <div className="mt-4 flex max-w-3xl flex-wrap items-center gap-3">
            <HintButton
              disabled={state.hintUsedRounds.includes(state.currentRound)}
              onRequest={onHint}
              visible={state.hintAvailable}
            />
            <div className="border border-white/10 bg-black/35 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/38">
              Mouse / tap to lock
            </div>
            <div className="border border-white/10 bg-black/35 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/38">
              Arrows move scanner
            </div>
            <div className="border border-white/10 bg-black/35 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/38">
              Enter confirms
            </div>
          </div>
        </div>

        <div className="border border-white/15 bg-black/55 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em]">
            <span className="text-white/36">Observation</span>
            <span className="text-[#d8b35f]">
              {Math.round(state.scannerConfidence * 100)}%
            </span>
          </div>
          <div className="mt-3 h-2 border border-white/10 bg-white/5">
            <div
              className="h-full bg-[#d8b35f] transition-[width] duration-150"
              style={{ width: `${state.scannerConfidence * 100}%` }}
            />
          </div>
          <div className="mt-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em]">
            <span className="text-white/36">Wrong locks</span>
            <span className="text-[#f2efe6]">{state.wrongClicks}</span>
          </div>
          <div className="mt-5 h-2 border border-white/10 bg-white/5">
            <div
              className="h-full bg-[#d3170c] transition-[width] duration-300"
              style={{ width: `${state.threat * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {state.statusMessage}. Score {state.score}. Accuracy {state.accuracy}
        percent. Round {state.currentRound} of 3.
      </div>
    </div>
  );
}
