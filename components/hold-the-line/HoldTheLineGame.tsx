"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import GameHud from "@/components/hold-the-line/GameHud";
import GameIntro from "@/components/hold-the-line/GameIntro";
import GameResults from "@/components/hold-the-line/GameResults";
import ScannerCursor from "@/components/hold-the-line/ScannerCursor";
import { useHoldTheLineGame } from "@/components/hold-the-line/hooks/useHoldTheLineGame";
import { cn } from "@/lib/utils";

const HoldTheLineCanvas = dynamic(
  () => import("@/components/hold-the-line/HoldTheLineCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(216,179,95,0.12),transparent_26%),radial-gradient(circle_at_50%_72%,rgba(211,23,12,0.18),transparent_38%),#030303]" />
    ),
  },
);

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? Boolean(target.closest("button, a, input, textarea, select"))
    : false;
}

function scannerVisible(status: string) {
  return status === "countdown" || status === "playing";
}

export default function HoldTheLineGame() {
  const game = useHoldTheLineGame();
  const sectionRef = useRef<HTMLElement>(null);
  const visibleScanner = scannerVisible(game.state.status);

  const updateScannerFromPointer = useCallback(
    (clientX: number, clientY: number, active = true) => {
      const section = sectionRef.current;

      if (!section || !visibleScanner) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const y = ((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;

      game.setScannerPosition({ x, y, active });
    },
    [game, visibleScanner],
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

      event.currentTarget.setPointerCapture(event.pointerId);
      updateScannerFromPointer(event.clientX, event.clientY, true);
      game.beginCharge();
    },
    [game, updateScannerFromPointer],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (isInteractiveTarget(event.target)) {
        return;
      }

      updateScannerFromPointer(event.clientX, event.clientY, true);
      game.releasePulse();
    },
    [game, updateScannerFromPointer],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target) || !visibleScanner) {
        return;
      }

      const key = event.key.toLowerCase();
      const step = game.state.isMobile ? 0.085 : 0.06;

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
        game.beginCharge();
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target) || !visibleScanner) {
        return;
      }

      if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        game.releasePulse();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [game, visibleScanner]);

  return (
    <section
      ref={sectionRef}
      id="hold-the-line"
      aria-labelledby="hold-the-line-title"
      className={cn(
        "story-slide grain-overlay relative isolate min-h-svh overflow-hidden border-t border-white/10 bg-[#030303] text-white touch-none",
        visibleScanner ? "cursor-none" : "cursor-auto",
      )}
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(245,245,240,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(245,245,240,0.035)_1px,transparent_1px)] bg-[size:64px_64px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_20%,rgba(211,23,12,0.16),transparent_26rem),radial-gradient(circle_at_74%_30%,rgba(216,179,95,0.08),transparent_22rem),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.82))]"
      />
      <div aria-hidden="true" className="find-pattern-scanlines" />

      <h2 id="hold-the-line-title" className="sr-only">
        Hold The Line
      </h2>

      <div className="pointer-events-none absolute inset-0 z-0">
        <HoldTheLineCanvas scannerRef={game.scannerRef} state={game.state} />
      </div>

      {game.state.scorePopups.map((popup) => (
        <span
          key={popup.id}
          aria-hidden="true"
          className="hold-score-float pointer-events-none absolute z-40 -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#d8b35f]"
          style={{
            left: `${((popup.x + 1) / 2) * 100}%`,
            top: `${((popup.y + 1) / 2) * 100}%`,
          }}
        >
          {popup.label}
        </span>
      ))}

      <GameIntro
        visible={game.state.status === "intro"}
        onBegin={game.startGame}
      />
      <GameHud state={game.state} />
      <GameResults
        onContinue={game.continueToManifesto}
        onReplay={game.resetGame}
        state={game.state}
      />
      <ScannerCursor
        charge={game.state.scannerCharge}
        confidence={game.state.scannerConfidence}
        energy={game.state.scannerEnergy}
        position={game.state.scannerPosition}
        target={game.state.scannerTarget}
        visible={visibleScanner}
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
