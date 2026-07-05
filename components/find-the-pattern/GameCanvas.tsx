"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";
import type { GameState } from "@/components/find-the-pattern/hooks/useGameState";
import type { ScannerPosition } from "@/components/find-the-pattern/lib/game-config";

const GameFieldCanvas = dynamic(
  () => import("@/components/find-the-pattern/GameFieldCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(211,23,12,0.12),transparent_36%),#030303]" />
    ),
  },
);

type GameCanvasProps = {
  state: GameState;
  scannerRef: RefObject<ScannerPosition>;
};

export default function GameCanvas({ state, scannerRef }: GameCanvasProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <GameFieldCanvas
        activeRound={state.activeRound}
        fieldEvent={state.fieldEvent}
        isMobile={state.isMobile}
        reducedMotion={state.reducedMotion}
        scannerRef={scannerRef}
        seed={state.seed}
        status={state.status}
      />
    </div>
  );
}
