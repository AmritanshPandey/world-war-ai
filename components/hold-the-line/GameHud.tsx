"use client";

import AltitudeMeter from "@/components/hold-the-line/AltitudeMeter";
import ScoreDisplay from "@/components/hold-the-line/ScoreDisplay";
import type { HoldTheLineState } from "@/components/hold-the-line/hooks/useHoldTheLineGame";
import { phaseLabel } from "@/components/hold-the-line/lib/difficulty";
import {
  chainTypeLabel,
  formatTimeRemaining,
} from "@/components/hold-the-line/lib/scoring";
import { cn } from "@/lib/utils";

type GameHudProps = {
  state: HoldTheLineState;
};

function isVisible(status: HoldTheLineState["status"]) {
  return (
    status === "countdown" ||
    status === "playing" ||
    status === "compromised" ||
    status === "complete"
  );
}

export default function GameHud({ state }: GameHudProps) {
  if (!isVisible(state.status)) {
    return null;
  }

  const activeThreats = state.activeChains.filter(
    (chain) =>
      chain.state === "emerging" ||
      chain.state === "active" ||
      chain.state === "exposed",
  );
  const selected = activeThreats.find((chain) => chain.id === state.selectedChainId);
  const countdown = state.status === "countdown";

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between px-5 py-6 md:px-10 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d3170c] md:text-xs">
            WORLD WAR AI / FINAL TEST
          </p>
          <h2 className="title-display mt-4 text-4xl font-bold leading-none text-[#f2efe6] md:text-6xl">
            HOLD THE LINE
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/62 md:text-lg">
            The swarm is climbing. Find the weak point before it reaches the
            evac zone.
          </p>
        </div>
        <ScoreDisplay combo={state.comboMultiplier} score={state.score} />
      </div>

      {countdown ? (
        <div className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
            Scanner sync
          </p>
          <p className="title-display mt-3 text-6xl font-bold text-[#d8b35f]">
            READY
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end">
        <div>
          <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
            <div className="border border-white/12 bg-black/45 p-4 backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
                Phase
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#f2efe6]">
                {phaseLabel(state.phase)}
              </p>
            </div>
            <div className="border border-white/12 bg-black/45 p-4 backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
                Timer
              </p>
              <p className="mt-2 font-mono text-2xl leading-none text-[#d8b35f]">
                {formatTimeRemaining(state.elapsedMs)}
              </p>
            </div>
            <div className="border border-white/12 bg-black/45 p-4 backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
                Active threats
              </p>
              <p
                className={cn(
                  "mt-2 font-mono text-2xl leading-none",
                  activeThreats.length >= 3 ? "text-[#d3170c]" : "text-[#f2efe6]",
                )}
              >
                {String(activeThreats.length).padStart(2, "0")}
              </p>
            </div>
          </div>

          <div className="mt-4 max-w-3xl border border-white/12 bg-black/55 p-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                className={cn(
                  "font-mono text-[10px] uppercase tracking-[0.24em]",
                  state.scannerTarget === "core"
                    ? "text-[#d8b35f]"
                    : state.scannerTarget === "false"
                      ? "text-[#d3170c]"
                      : "text-white/38",
                )}
              >
                {selected ? chainTypeLabel(selected.type) : "MOVE TO SCAN"}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/36">
                Chain streak {String(state.chainStreak).padStart(2, "0")}
              </p>
            </div>
            <p className="mt-3 min-h-6 text-sm leading-6 text-white/68" aria-live="polite">
              {state.statusMessage}
            </p>
          </div>

          <div className="mt-4 grid max-w-3xl gap-3 sm:grid-cols-[1fr_1fr_1.2fr]">
            <div className="border border-white/10 bg-black/45 p-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/42">
              Move to scan
            </div>
            <div className="border border-white/10 bg-black/45 p-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/42">
              Hold to charge
            </div>
            <div className="border border-white/10 bg-black/45 p-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/42">
              Release to disrupt
            </div>
          </div>
        </div>

        <AltitudeMeter altitude={state.evacuationAltitude} />
      </div>

      <div className="pointer-events-none absolute inset-x-5 bottom-5 z-30 mx-auto max-w-xl md:bottom-8">
        <div className="grid gap-2">
          <div>
            <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-white/34">
              <span>Scan energy</span>
              <span>{Math.round(state.scannerEnergy)}%</span>
            </div>
            <div className="mt-1 h-1.5 border border-white/10 bg-white/5">
              <div
                className="h-full bg-[#f2efe6]/70 transition-[width] duration-150"
                style={{ width: `${state.scannerEnergy}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-white/34">
              <span>Pulse charge</span>
              <span>{Math.round(state.scannerCharge * 100)}%</span>
            </div>
            <div className="mt-1 h-2 border border-white/10 bg-white/5">
              <div
                className="h-full bg-[#d8b35f] transition-[width] duration-100"
                style={{ width: `${state.scannerCharge * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {state.statusMessage}. Score {state.score}. Altitude{" "}
        {Math.round(state.evacuationAltitude)} percent. Combo x
        {state.comboMultiplier}.
      </div>
    </div>
  );
}
