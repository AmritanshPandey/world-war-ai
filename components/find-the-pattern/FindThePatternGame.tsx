"use client";

import { useCallback, useEffect, useRef } from "react";
import GameCanvas from "@/components/find-the-pattern/GameCanvas";
import GameHud from "@/components/find-the-pattern/GameHud";
import GameIntro from "@/components/find-the-pattern/GameIntro";
import GameResults from "@/components/find-the-pattern/GameResults";
import ScannerCursor from "@/components/find-the-pattern/ScannerCursor";
import { useGameState } from "@/components/find-the-pattern/hooks/useGameState";
import {
  SIGNAL_ZONES,
  type SignalZone,
} from "@/components/find-the-pattern/lib/game-config";
import { clampRange } from "@/components/find-the-pattern/lib/game-utils";
import { cn } from "@/lib/utils";

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? Boolean(target.closest("button, a, input, textarea, select"))
    : false;
}

function usesScanner(status: string) {
  return (
    status === "round1-scanning" ||
    status === "round1-lock-ready" ||
    status === "round2-scanning" ||
    status === "round2-lock-ready" ||
    status === "round3-final-scan"
  );
}

function zonePositionStyle(zone: SignalZone) {
  return {
    left: `${((zone.x + 1) / 2) * 100}%`,
    top: `${((zone.y + 1) / 2) * 100}%`,
  };
}

function SignalHints({
  falseAttempts,
  reducedMotion,
  roundElapsedMs,
  scannerConfidence,
  visible,
  wrongDecisionCount,
  activeRound,
}: {
  activeRound: 0 | 1 | 2 | 3;
  falseAttempts: number;
  reducedMotion: boolean;
  roundElapsedMs: number;
  scannerConfidence: number;
  visible: boolean;
  wrongDecisionCount: number;
}) {
  if (!visible || activeRound === 0) {
    return null;
  }

  const zones = SIGNAL_ZONES[activeRound];
  const reveal =
    scannerConfidence > 0.65 ||
    roundElapsedMs > 3600 ||
    falseAttempts > 0 ||
    wrongDecisionCount > 0;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-10 transition-opacity duration-700",
        reveal ? "opacity-100" : "opacity-0",
      )}
    >
      <span
        className={cn(
          "absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d8b35f]/40 shadow-[0_0_34px_rgba(216,179,95,0.16)] md:h-28 md:w-28",
          reducedMotion
            ? ""
            : "animate-[scanner-pulse_2.8s_ease-out_infinite]",
        )}
        style={zonePositionStyle(zones.true)}
      />
      {zones.false ? (
        <span
          className={cn(
            "absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d3170c]/24 shadow-[0_0_26px_rgba(211,23,12,0.12)] md:h-32 md:w-32",
            reducedMotion
              ? ""
              : "animate-[scanner-pulse_1.9s_ease-out_infinite]",
          )}
          style={zonePositionStyle(zones.false)}
        />
      ) : null}
    </div>
  );
}

export default function FindThePatternGame() {
  const game = useGameState();
  const sectionRef = useRef<HTMLElement>(null);
  const scannerVisible = usesScanner(game.state.status);

  const updateScannerFromPointer = useCallback(
    (clientX: number, clientY: number, active = true) => {
      const section = sectionRef.current;

      if (!section || !scannerVisible) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const y = ((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;

      game.setScannerPosition({
        x: clampRange(x, -1, 1),
        y: clampRange(y, -1, 1),
        active,
      });
    },
    [game, scannerVisible],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      updateScannerFromPointer(event.clientX, event.clientY, true);
    },
    [updateScannerFromPointer],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (isInteractiveTarget(event.target)) {
        return;
      }

      updateScannerFromPointer(event.clientX, event.clientY, true);
      game.pulseScan();
    },
    [game, updateScannerFromPointer],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        game.state.status === "intro" ||
        game.state.status === "results" ||
        game.state.status === "round3-decision" ||
        isInteractiveTarget(event.target)
      ) {
        return;
      }

      const step = game.state.isMobile ? 0.09 : 0.055;

      const key = event.key.toLowerCase();

      if (event.key === "ArrowUp" || key === "w") {
        event.preventDefault();
        game.nudgeScanner(0, -step);
      } else if (event.key === "ArrowDown" || key === "s") {
        event.preventDefault();
        game.nudgeScanner(0, step);
      } else if (event.key === "ArrowLeft" || key === "a") {
        event.preventDefault();
        game.nudgeScanner(-step, 0);
      } else if (event.key === "ArrowRight" || key === "d") {
        event.preventDefault();
        game.nudgeScanner(step, 0);
      } else if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        game.pulseScan();
      } else if (event.key === "Enter") {
        event.preventDefault();
        game.confirmLock();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [game]);

  return (
    <section
      ref={sectionRef}
      id="find-the-pattern"
      aria-labelledby="find-the-pattern-title"
      className={cn(
        "story-slide grain-overlay relative isolate min-h-svh overflow-hidden border-t border-white/10 bg-[#030303] text-white",
        scannerVisible ? "cursor-none" : "cursor-auto",
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(245,245,240,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(245,245,240,0.035)_1px,transparent_1px)] bg-[size:64px_64px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_22%,rgba(211,23,12,0.14),transparent_26rem),radial-gradient(circle_at_78%_62%,rgba(216,179,95,0.08),transparent_24rem),linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.78))]"
      />
      <div aria-hidden="true" className="find-pattern-scanlines" />
      <SignalHints
        activeRound={game.state.activeRound}
        falseAttempts={game.state.falseAttempts}
        reducedMotion={game.state.reducedMotion}
        roundElapsedMs={game.state.roundElapsedMs}
        scannerConfidence={game.state.scannerConfidence}
        visible={scannerVisible}
        wrongDecisionCount={game.state.wrongDecisionCount}
      />

      <h2 id="find-the-pattern-title" className="sr-only">
        Find the Pattern
      </h2>

      <GameCanvas state={game.state} scannerRef={game.scannerRef} />
      <GameIntro visible={game.state.status === "intro"} onBegin={game.startGame} />
      <GameHud
        state={game.state}
        onLock={game.confirmLock}
        onChooseDecision={game.chooseDecision}
        onPreviewDecision={game.previewDecision}
      />
      <GameResults state={game.state} onReplay={game.resetGame} />
      <ScannerCursor
        active={scannerVisible}
        confidence={game.state.scannerConfidence}
        position={game.state.scannerPosition}
        target={game.state.scannerTarget}
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-4 z-20 h-5 w-5 border-l border-t border-[#d3170c]/55"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-4 z-20 h-5 w-5 border-r border-t border-[#d3170c]/55"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-4 left-4 z-20 h-5 w-5 border-b border-l border-[#d3170c]/55"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-4 right-4 z-20 h-5 w-5 border-b border-r border-[#d3170c]/55"
      />
    </section>
  );
}
