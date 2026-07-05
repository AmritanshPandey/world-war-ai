"use client";

import DecisionCards from "@/components/find-the-pattern/DecisionCards";
import ScoreDisplay from "@/components/find-the-pattern/ScoreDisplay";
import type { GameState } from "@/components/find-the-pattern/hooks/useGameState";
import {
  ROUND_COPY,
  type DecisionId,
} from "@/components/find-the-pattern/lib/game-config";
import { formatElapsed } from "@/components/find-the-pattern/lib/game-utils";
import { cn } from "@/lib/utils";

type GameHudProps = {
  state: GameState;
  onLock: () => void;
  onChooseDecision: (decisionId: DecisionId) => void;
  onPreviewDecision: (decisionId: DecisionId | null) => void;
};

function getRoundHeader(state: GameState) {
  if (state.activeRound === 1) {
    return {
      label: ROUND_COPY[1].label,
      prompt: ROUND_COPY[1].prompt,
    };
  }

  if (state.activeRound === 2) {
    return {
      label: ROUND_COPY[2].label,
      prompt: ROUND_COPY[2].prompt,
    };
  }

  return {
    label: ROUND_COPY[3].label,
    prompt:
      state.status === "round3-final-scan"
        ? "Trace the coherent signal."
        : ROUND_COPY[3].prompt,
  };
}

function getQualityLabel(state: GameState) {
  if (state.lockQuality === "clean") {
    return "Clean lock";
  }

  if (state.lockQuality === "steady") {
    return "Steady lock";
  }

  if (state.lockQuality === "rushed") {
    return "Late lock";
  }

  if (state.lockQuality === "decoy") {
    return "Decoy hit";
  }

  if (state.lockQuality === "decision") {
    return "Judgment call";
  }

  return "No lock yet";
}

function getRoundState(state: GameState, round: 1 | 2 | 3) {
  if (state.status === "results" || state.activeRound > round) {
    return "complete";
  }

  if (state.activeRound === round) {
    return "active";
  }

  return "pending";
}

function formatGain(gain: number) {
  if (gain > 0) {
    return `+${gain}`;
  }

  return String(gain);
}

export default function GameHud({
  state,
  onLock,
  onChooseDecision,
  onPreviewDecision,
}: GameHudProps) {
  const visible = state.status !== "intro" && state.status !== "results";
  const round = getRoundHeader(state);
  const lockReady =
    state.status === "round1-lock-ready" ||
    state.status === "round2-lock-ready" ||
    (state.status === "round2-scanning" && state.scannerTarget === "false");
  const decisionMode = state.status === "round3-decision";

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between px-5 py-6 md:px-10 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d3170c] md:text-xs">
            08 / FIND THE PATTERN
          </p>
          <h2 className="title-display mt-4 text-3xl font-bold leading-none text-[#f2efe6] md:text-5xl">
            {round.label}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/62 md:text-lg">
            {round.prompt}
          </p>
          <div className="mt-5 flex max-w-sm gap-2" aria-label="Round progress">
            {[1, 2, 3].map((item) => {
              const progressState = getRoundState(state, item as 1 | 2 | 3);

              return (
                <span
                  key={item}
                  className={cn(
                    "h-1.5 flex-1 border border-white/10 transition-colors",
                    progressState === "complete"
                      ? "bg-[#d8b35f]"
                      : progressState === "active"
                        ? "bg-[#d3170c]"
                        : "bg-white/5",
                  )}
                />
              );
            })}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <ScoreDisplay score={state.score} />
          <div className="grid w-full min-w-[9.5rem] grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
            <div className="border border-white/10 bg-black/45 px-3 py-2">
              <p className="text-white/34">Streak</p>
              <p className="mt-1 text-[#d8b35f]">x{state.streak}</p>
            </div>
            <div
              className={cn(
                "border bg-black/45 px-3 py-2",
                state.lastGain < 0
                  ? "border-[#d3170c]/35 text-[#d3170c]"
                  : "border-white/10 text-[#d8b35f]",
              )}
            >
              <p className="text-white/34">Last</p>
              <p className="mt-1">{formatGain(state.lastGain)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end">
        <div className="pointer-events-auto max-w-4xl">
          {decisionMode ? (
            <DecisionCards
              onChoose={onChooseDecision}
              onPreview={onPreviewDecision}
            />
          ) : (
            <div className="max-w-xl border border-white/12 bg-black/50 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-[0.24em]",
                    state.scannerTarget === "true"
                      ? "text-[#d8b35f]"
                      : "text-[#d3170c]",
                  )}
                >
                  {state.scanLabel}
                </p>
                <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                  <span>Elapsed {formatElapsed(state.elapsedMs)}</span>
                  <span
                    className={cn(
                      state.lockQuality === "decoy"
                        ? "text-[#d3170c]"
                        : state.lockQuality === "idle"
                          ? "text-white/35"
                          : "text-[#d8b35f]",
                    )}
                  >
                    {getQualityLabel(state)}
                  </span>
                </div>
              </div>

              <div className="mt-4 h-2 border border-white/10 bg-white/5">
                <div
                  className={cn(
                    "h-full transition-[width,background-color] duration-150",
                    state.scannerTarget === "false"
                      ? "bg-[#d3170c]"
                      : "bg-[#d8b35f]",
                  )}
                  style={{
                    width: `${Math.round(state.scannerConfidence * 100)}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-white/28">
                <span>Drift</span>
                <span>{Math.round(state.scannerConfidence * 100)}%</span>
                <span>Lock</span>
              </div>

              <p
                className="mt-4 min-h-6 text-sm leading-6 text-white/62"
                aria-live="polite"
              >
                {state.statusMessage}
              </p>
              {state.lesson ? (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/38">
                  {state.lesson}
                </p>
              ) : null}

              <button
                type="button"
                onClick={onLock}
                disabled={!lockReady}
                className={cn(
                  "mt-5 min-h-10 border px-4 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8b35f]",
                  lockReady
                    ? "border-[#d8b35f]/70 bg-[#d8b35f]/10 text-[#f2efe6] hover:border-[#f2efe6]"
                    : "border-white/10 bg-white/[0.03] text-white/25",
                )}
              >
                Lock Pattern
              </button>
            </div>
          )}
        </div>

        <div className="hidden border border-white/12 bg-black/45 p-4 backdrop-blur-sm md:block">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
            Scanner Control
          </p>
          <div className="mt-4 grid grid-cols-3 gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/36">
            <span />
            <span className="border border-white/10 py-2 text-center">Up</span>
            <span />
            <span className="border border-white/10 py-2 text-center">Left</span>
            <span className="border border-white/10 py-2 text-center">Scan</span>
            <span className="border border-white/10 py-2 text-center">Right</span>
            <span />
            <span className="border border-white/10 py-2 text-center">Down</span>
            <span />
          </div>
          <p className="mt-4 text-xs leading-5 text-white/42">
            Arrows or WASD move the scanner. Space pulses. Enter locks when the
            signal is coherent.
          </p>
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {round.label}. {state.scanLabel}. Signal score {state.score} out of
        100. Streak {state.streak}. {state.statusMessage}
      </div>
    </div>
  );
}
