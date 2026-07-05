"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import GameHud from "@/components/spot-the-human/GameHud";
import GameIntro from "@/components/spot-the-human/GameIntro";
import GameResults from "@/components/spot-the-human/GameResults";
import ScannerCursor from "@/components/spot-the-human/ScannerCursor";
import { useSpotTheHumanGame } from "@/components/spot-the-human/hooks/useSpotTheHumanGame";
import { isActiveRoundStatus } from "@/components/spot-the-human/lib/game-config";
import { cn } from "@/lib/utils";

const SpotTheHumanCanvas = dynamic(
  () => import("@/components/spot-the-human/SpotTheHumanCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(216,179,95,0.08),transparent_22%),radial-gradient(circle_at_50%_70%,rgba(211,23,12,0.16),transparent_38%),#030303]" />
    ),
  },
);

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? Boolean(target.closest("button, a, input, textarea, select"))
    : false;
}

export default function SpotTheHumanGame() {
  const game = useSpotTheHumanGame();
  const sectionRef = useRef<HTMLElement>(null);
  const scannerVisible = isActiveRoundStatus(game.state.status);

  const updateScannerFromPointer = useCallback(
    (clientX: number, clientY: number, active = true) => {
      const section = sectionRef.current;

      if (!section || !scannerVisible) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const y = ((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;

      game.setScannerPosition({ x, y, active });
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
      if (isInteractiveTarget(event.target) || !scannerVisible) {
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      updateScannerFromPointer(event.clientX, event.clientY, true);
      game.confirmSelection();
    },
    [game, scannerVisible, updateScannerFromPointer],
  );

  const handlePointerLeave = useCallback(() => {
    if (!scannerVisible) {
      return;
    }

    game.setScannerPosition({
      ...game.state.scannerPosition,
      active: false,
    });
  }, [game, scannerVisible]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target) || !scannerVisible) {
        return;
      }

      const key = event.key.toLowerCase();
      const step = game.state.isMobile ? 0.09 : 0.058;

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
      } else if (event.key === "Enter") {
        event.preventDefault();
        game.confirmSelection();
      } else if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();

        if (!event.repeat) {
          game.pulseScan();
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        game.resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [game, scannerVisible]);

  return (
    <section
      ref={sectionRef}
      id="spot-the-human"
      aria-labelledby="spot-the-human-title"
      className={cn(
        "story-slide grain-overlay relative isolate min-h-svh overflow-hidden border-t border-white/10 bg-[#030303] text-white touch-none",
        scannerVisible ? "cursor-none" : "cursor-auto",
      )}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(245,245,240,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(245,245,240,0.035)_1px,transparent_1px)] bg-[size:64px_64px]"
      />
      <div aria-hidden="true" className="spot-human-city" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_24%,rgba(211,23,12,0.14),transparent_26rem),radial-gradient(circle_at_72%_30%,rgba(216,179,95,0.08),transparent_22rem),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.82))]"
      />
      <div aria-hidden="true" className="find-pattern-scanlines" />

      <h2 id="spot-the-human-title" className="sr-only">
        Spot The Human
      </h2>

      <div className="pointer-events-none absolute inset-0 z-0">
        <SpotTheHumanCanvas scannerRef={game.scannerRef} state={game.state} />
      </div>

      {game.state.scoreEvents.map((event) => (
        <span
          key={event.id}
          aria-hidden="true"
          className={cn(
            "spot-score-float pointer-events-none absolute z-40 -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.2em]",
            event.tone === "loss"
              ? "text-[#d3170c]"
              : event.tone === "hint"
                ? "text-white/62"
                : "text-[#d8b35f]",
          )}
          style={{
            left: `${((event.x + 1) / 2) * 100}%`,
            top: `${((event.y + 1) / 2) * 100}%`,
          }}
        >
          {event.label}
        </span>
      ))}

      <GameIntro
        visible={game.state.status === "intro"}
        onBegin={game.startGame}
      />
      <GameHud state={game.state} onHint={game.requestHint} />
      <GameResults
        onContinue={game.continueToManifesto}
        onReplay={game.resetGame}
        state={game.state}
      />
      <ScannerCursor
        confidence={game.state.scannerConfidence}
        position={game.state.scannerPosition}
        target={game.state.scannerTarget}
        visible={scannerVisible}
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
