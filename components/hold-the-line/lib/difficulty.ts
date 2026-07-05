import {
  GAME_DURATION_MS,
  type ChainType,
  type GamePhase,
} from "@/components/hold-the-line/lib/game-config";

export function phaseAt(elapsedMs: number): GamePhase {
  if (elapsedMs < 12_000) {
    return "learn";
  }

  if (elapsedMs < 30_000) {
    return "pressure";
  }

  return "outbreak";
}

export function phaseLabel(phase: GamePhase) {
  if (phase === "learn") {
    return "PHASE 1 / LEARN";
  }

  if (phase === "pressure") {
    return "PHASE 2 / PRESSURE";
  }

  return "PHASE 3 / OUTBREAK";
}

export function maxActiveChains(phase: GamePhase, isMobile: boolean) {
  if (phase === "learn") {
    return 1;
  }

  if (phase === "pressure") {
    return isMobile ? 1 : 2;
  }

  return isMobile ? 2 : 3;
}

export function spawnIntervalMs(phase: GamePhase) {
  if (phase === "learn") {
    return 3_900;
  }

  if (phase === "pressure") {
    return 3_150;
  }

  return 2_450;
}

export function chooseChainType(
  phase: GamePhase,
  random: () => number,
): ChainType {
  const roll = random();

  if (phase === "learn") {
    return "standard";
  }

  if (phase === "pressure") {
    if (roll < 0.58) return "standard";
    if (roll < 0.84) return "split";
    return "falseSignal";
  }

  if (roll < 0.32) return "standard";
  if (roll < 0.56) return "split";
  if (roll < 0.76) return "falseSignal";
  return "critical";
}

export function swarmPressure(elapsedMs: number) {
  return Math.min(1, Math.max(0, elapsedMs / GAME_DURATION_MS));
}
