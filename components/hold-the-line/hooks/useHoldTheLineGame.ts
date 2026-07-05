"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  ALTITUDE,
  COUNTDOWN_MS,
  GAME_DURATION_MS,
  SCANNER,
  STORAGE_KEY,
  type GamePhase,
  type GameStatus,
  type InfectionChain,
  type PersistedBest,
  type PulseEvent,
  type ScannerPosition,
  type ScorePopup,
} from "@/components/hold-the-line/lib/game-config";
import {
  chainProgress,
  createChain,
  createSeededRandom,
  projectedNodes,
} from "@/components/hold-the-line/lib/chain-factory";
import {
  chooseChainType,
  maxActiveChains,
  phaseAt,
  spawnIntervalMs,
} from "@/components/hold-the-line/lib/difficulty";
import {
  altitudeBonus,
  betterBest,
  chainScore,
  comboMultiplier,
  getRank,
  type Rank,
} from "@/components/hold-the-line/lib/scoring";

type Outcome = "contained" | "compromised" | null;
type ScannerTarget = "none" | "core" | "false";

export type HoldTheLineState = {
  status: GameStatus;
  outcome: Outcome;
  score: number;
  baseScore: number;
  altitudeBonus: number;
  comboMultiplier: number;
  chainStreak: number;
  bestCombo: number;
  perfectBreaches: number;
  evacuationAltitude: number;
  elapsedMs: number;
  phase: GamePhase;
  activeChains: InfectionChain[];
  resolvedChains: InfectionChain[];
  scannerPosition: ScannerPosition;
  scannerCharge: number;
  scannerEnergy: number;
  scannerConfidence: number;
  scannerTarget: ScannerTarget;
  selectedChainId: string | null;
  statusMessage: string;
  pulses: PulseEvent[];
  scorePopups: ScorePopup[];
  best: PersistedBest;
  rank: Rank;
  isMobile: boolean;
  reducedMotion: boolean;
};

export type HoldTheLineController = {
  state: HoldTheLineState;
  scannerRef: RefObject<ScannerPosition>;
  startGame: () => void;
  resetGame: () => void;
  setScannerPosition: (position: ScannerPosition) => void;
  nudgeScanner: (dx: number, dy: number) => void;
  beginCharge: () => void;
  releasePulse: () => void;
  continueToManifesto: () => void;
};

const DEFAULT_SCANNER: ScannerPosition = { x: 0, y: 0.28, active: false };
const EMPTY_BEST: PersistedBest = {
  score: 0,
  combo: 0,
  rank: "SYSTEM OBSERVER",
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function activeChain(chain: InfectionChain) {
  return (
    chain.state === "emerging" ||
    chain.state === "active" ||
    chain.state === "exposed"
  );
}

function lowerComboTier(streak: number) {
  if (streak >= 10) return 6;
  if (streak >= 6) return 3;
  if (streak >= 3) return 1;
  return 0;
}

function loadBest(): PersistedBest {
  if (typeof window === "undefined") {
    return EMPTY_BEST;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return EMPTY_BEST;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedBest>;

    return {
      score: Number(parsed.score) || 0,
      combo: Number(parsed.combo) || 0,
      rank: parsed.rank || EMPTY_BEST.rank,
    };
  } catch {
    return EMPTY_BEST;
  }
}

function saveBest(best: PersistedBest) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(best));
  } catch {
    // Best score persistence is a bonus; gameplay should not depend on it.
  }
}

function createInitialState(best = EMPTY_BEST): HoldTheLineState {
  return {
    status: "intro",
    outcome: null,
    score: 0,
    baseScore: 0,
    altitudeBonus: 0,
    comboMultiplier: 1,
    chainStreak: 0,
    bestCombo: 1,
    perfectBreaches: 0,
    evacuationAltitude: ALTITUDE.start,
    elapsedMs: 0,
    phase: "learn",
    activeChains: [],
    resolvedChains: [],
    scannerPosition: DEFAULT_SCANNER,
    scannerCharge: 0,
    scannerEnergy: SCANNER.maxEnergy,
    scannerConfidence: 0,
    scannerTarget: "none",
    selectedChainId: null,
    statusMessage: "The swarm is climbing. Find the weak point.",
    pulses: [],
    scorePopups: [],
    best,
    rank: getRank(0),
    isMobile: false,
    reducedMotion: false,
  };
}

function normalizedScannerRadius(isMobile: boolean) {
  return isMobile ? SCANNER.mobileRadius : SCANNER.radius;
}

export function useHoldTheLineGame(): HoldTheLineController {
  const scannerRef = useRef<ScannerPosition>(DEFAULT_SCANNER);
  const stateRef = useRef<HoldTheLineState>(createInitialState());
  const countdownStartedAtRef = useRef(0);
  const gameStartedAtRef = useRef(0);
  const lastTickAtRef = useRef(0);
  const lastSpawnAtRef = useRef(0);
  const chainIdRef = useRef(1);
  const pulseIdRef = useRef(1);
  const popupIdRef = useRef(1);
  const chargingStartedAtRef = useRef<number | null>(null);
  const finalQueuedRef = useRef(false);
  const randomRef = useRef(createSeededRandom(42));
  const [state, setState] = useState(() => createInitialState());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const applyEnvironment = () => {
      setState((previous) => ({
        ...previous,
        best: previous.best.score > 0 ? previous.best : loadBest(),
        isMobile: mobileQuery.matches,
        reducedMotion: reducedMotionQuery.matches,
      }));
    };

    applyEnvironment();
    mobileQuery.addEventListener("change", applyEnvironment);
    reducedMotionQuery.addEventListener("change", applyEnvironment);

    return () => {
      mobileQuery.removeEventListener("change", applyEnvironment);
      reducedMotionQuery.removeEventListener("change", applyEnvironment);
    };
  }, []);

  const queueResults = useCallback((outcome: Exclude<Outcome, null>) => {
    if (finalQueuedRef.current) {
      return;
    }

    finalQueuedRef.current = true;

    window.setTimeout(() => {
      setState((previous) => {
        const bonus = altitudeBonus(previous.evacuationAltitude);
        const finalScore = previous.baseScore + bonus;
        const rank = getRank(finalScore);
        const candidate = {
          score: finalScore,
          combo: previous.bestCombo,
          rank: rank.title,
        };
        const best = betterBest(previous.best, candidate);

        saveBest(best);

        return {
          ...previous,
          status: "results",
          outcome,
          score: finalScore,
          altitudeBonus: bonus,
          comboMultiplier: comboMultiplier(previous.chainStreak),
          rank,
          best,
          statusMessage:
            outcome === "contained"
              ? "OUTBREAK CONTAINED"
              : "EVACUATION COMPROMISED",
        };
      });
    }, outcome === "compromised" ? 1_200 : 850);
  }, []);

  const spawnChain = useCallback((now: number, phase: GamePhase) => {
    const type = chooseChainType(phase, randomRef.current);
    const chain = createChain({
      id: `chain-${chainIdRef.current}`,
      now,
      random: randomRef.current,
      type,
    });

    chainIdRef.current += 1;

    return chain;
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = performance.now();
      const previous = stateRef.current;

      if (previous.status === "intro" || previous.status === "results") {
        lastTickAtRef.current = now;
        return;
      }

      const dt = Math.min(0.2, Math.max(0.016, (now - lastTickAtRef.current) / 1000));
      lastTickAtRef.current = now;

      if (previous.status === "countdown") {
        const countdownElapsed = now - countdownStartedAtRef.current;

        if (countdownElapsed < COUNTDOWN_MS) {
          setState((stateBefore) => ({
            ...stateBefore,
            statusMessage: "Scanner online. Hold to charge. Release to disrupt.",
          }));
          return;
        }

        gameStartedAtRef.current = now;
        lastSpawnAtRef.current = now - 9_999;
        setState((stateBefore) => ({
          ...stateBefore,
          status: "playing",
          statusMessage: "CHAIN DETECTED",
          scannerPosition: { ...scannerRef.current, active: true },
        }));
        return;
      }

      if (previous.status !== "playing") {
        return;
      }

      const elapsedMs = now - gameStartedAtRef.current;
      const phase = phaseAt(elapsedMs);
      let nextChains = previous.activeChains;
      let nextResolved = previous.resolvedChains.filter(
        (chain) => chain.resolvedAt && now - chain.resolvedAt < 1_800,
      );
      let altitude = previous.evacuationAltitude;
      let chainStreak = previous.chainStreak;
      let statusMessage = previous.statusMessage;
      let scannerConfidence = previous.scannerConfidence;
      let scannerTarget: HoldTheLineState["scannerTarget"] = "none";
      let selectedChainId: string | null = null;
      const scanRadius = normalizedScannerRadius(previous.isMobile);
      const scanner = scannerRef.current;
      const activeCount = nextChains.filter(activeChain).length;

      if (
        activeCount < maxActiveChains(phase, previous.isMobile) &&
        now - lastSpawnAtRef.current > spawnIntervalMs(phase)
      ) {
        nextChains = [...nextChains, spawnChain(now, phase)];
        lastSpawnAtRef.current = now;
        statusMessage = "CHAIN DETECTED";
      }

      const updatedChains: InfectionChain[] = [];
      let completedCount = 0;

      for (const chain of nextChains) {
        const chainNodes = projectedNodes(chain, now);

        if (chain.resolvedAt && now - chain.resolvedAt > 1_000) {
          nextResolved = [...nextResolved, chain];
          continue;
        }

        if (
          activeChain(chain) &&
          Math.min(...chainNodes.map((node) => node.y)) <= -0.82
        ) {
          completedCount += 1;
          altitude -= chain.altitudeLoss;
          chainStreak = lowerComboTier(chainStreak);
          statusMessage =
            chain.type === "critical"
              ? "CRITICAL CHAIN BREACHED EVAC ZONE"
              : "CHAIN REACHED UPPER SWARM ZONE";
          updatedChains.push({
            ...chain,
            displayNodes: chainNodes,
            state: "completed",
            resolvedAt: now,
          });
          continue;
        }

        const progress = chainProgress(chain, now);
        const nearestFalse =
          chain.type === "falseSignal"
            ? Math.min(...chainNodes.map((node) => distance(node, scanner)))
            : Infinity;
        const core =
          chain.coreIndex === null ? null : chainNodes[chain.coreIndex] ?? null;
        const coreDistance = core ? distance(core, scanner) : Infinity;

        if (scanner.active && core && coreDistance <= scanRadius) {
          const closeness = 1 - clamp(coreDistance / scanRadius);
          scannerTarget = "core";
          selectedChainId = chain.id;
          scannerConfidence = clamp(scannerConfidence + dt * (0.55 + closeness));
          statusMessage = "COHERENCE DETECTED";
        } else if (
          scanner.active &&
          nearestFalse <= scanRadius * 1.12 &&
          scannerTarget !== "core"
        ) {
          scannerTarget = "false";
          selectedChainId = chain.id;
          scannerConfidence = clamp(scannerConfidence - dt * 0.8);
          statusMessage = "HIGH ACTIVITY / LOW COHERENCE";
        }

        const exposed =
          chain.state === "exposed" ||
          (selectedChainId === chain.id && scannerTarget === "core") ||
          (chain.type !== "falseSignal" && progress > 0.62);

        updatedChains.push({
          ...chain,
          displayNodes: chainNodes,
          state: exposed ? "exposed" : progress < 0.16 ? "emerging" : "active",
          lastScannedAt: selectedChainId === chain.id ? now : chain.lastScannedAt,
          exposedAt:
            exposed && chain.exposedAt === null ? now : chain.exposedAt,
        });
      }

      if (scannerTarget === "none") {
        scannerConfidence = clamp(scannerConfidence - dt * 0.55);
      }

      const unresolvedPressure = Math.max(
        0,
        updatedChains.filter(activeChain).length - 1,
      );

      if (unresolvedPressure > 0) {
        altitude -=
          unresolvedPressure * ALTITUDE.passivePressurePerSecond * dt *
          (phase === "outbreak" ? 1.35 : 1);
      }

      const scannerCharge =
        chargingStartedAtRef.current === null
          ? 0
          : clamp((now - chargingStartedAtRef.current) / SCANNER.chargeMs);
      const scannerEnergy = clamp(
        previous.scannerEnergy + SCANNER.rechargePerSecond * dt,
        0,
        SCANNER.maxEnergy,
      );
      const recentPulses = previous.pulses.filter(
        (pulse) => now - pulse.createdAt < 1_100,
      );
      const recentPopups = previous.scorePopups.filter(
        (popup) => now - popup.createdAt < 1_300,
      );

      if (completedCount > 0) {
        statusMessage =
          completedCount > 1
            ? "MULTIPLE CHAINS REACHED EVAC ZONE"
            : statusMessage;
      }

      if (altitude <= 0) {
        altitude = 0;
        setState((stateBefore) => ({
          ...stateBefore,
          status: "compromised",
          outcome: "compromised",
          elapsedMs,
          phase,
          activeChains: updatedChains,
          resolvedChains: nextResolved,
          evacuationAltitude: altitude,
          comboMultiplier: comboMultiplier(chainStreak),
          chainStreak,
          scannerCharge,
          scannerEnergy,
          scannerConfidence,
          scannerTarget,
          selectedChainId,
          pulses: recentPulses,
          scorePopups: recentPopups,
          statusMessage: "EVACUATION COMPROMISED",
        }));
        queueResults("compromised");
        return;
      }

      if (elapsedMs >= GAME_DURATION_MS) {
        setState((stateBefore) => ({
          ...stateBefore,
          status: "complete",
          outcome: "contained",
          elapsedMs: GAME_DURATION_MS,
          phase,
          activeChains: updatedChains,
          resolvedChains: nextResolved,
          evacuationAltitude: altitude,
          comboMultiplier: comboMultiplier(chainStreak),
          chainStreak,
          scannerCharge,
          scannerEnergy,
          scannerConfidence,
          scannerTarget,
          selectedChainId,
          pulses: recentPulses,
          scorePopups: recentPopups,
          statusMessage: "OUTBREAK CONTAINED",
        }));
        queueResults("contained");
        return;
      }

      setState((stateBefore) => ({
        ...stateBefore,
        elapsedMs,
        phase,
        activeChains: updatedChains,
        resolvedChains: nextResolved,
        evacuationAltitude: altitude,
        comboMultiplier: comboMultiplier(chainStreak),
        chainStreak,
        scannerCharge,
        scannerEnergy,
        scannerConfidence,
        scannerTarget,
        selectedChainId,
        pulses: recentPulses,
        scorePopups: recentPopups,
        statusMessage,
        scannerPosition: scanner,
      }));
    }, 90);

    return () => window.clearInterval(interval);
  }, [queueResults, spawnChain]);

  const startGame = useCallback(() => {
    const now = performance.now();
    const best = loadBest();

    finalQueuedRef.current = false;
    randomRef.current = createSeededRandom(Math.round(now));
    chainIdRef.current = 1;
    pulseIdRef.current = 1;
    popupIdRef.current = 1;
    countdownStartedAtRef.current = now;
    lastTickAtRef.current = now;
    chargingStartedAtRef.current = null;
    scannerRef.current = { x: 0, y: 0.28, active: true };

    setState((previous) => ({
      ...createInitialState(best),
      status: "countdown",
      isMobile: previous.isMobile,
      reducedMotion: previous.reducedMotion,
      scannerPosition: scannerRef.current,
      statusMessage: "Scanner online. Hold to charge. Release to disrupt.",
    }));
  }, []);

  const resetGame = useCallback(() => {
    finalQueuedRef.current = false;
    chargingStartedAtRef.current = null;
    scannerRef.current = DEFAULT_SCANNER;
    setState((previous) => ({
      ...createInitialState(previous.best),
      isMobile: previous.isMobile,
      reducedMotion: previous.reducedMotion,
    }));
  }, []);

  const setScannerPosition = useCallback((position: ScannerPosition) => {
    scannerRef.current = {
      x: clamp(position.x, -1, 1),
      y: clamp(position.y, -1, 1),
      active: position.active,
    };

    setState((previous) => ({
      ...previous,
      scannerPosition: scannerRef.current,
    }));
  }, []);

  const nudgeScanner = useCallback((dx: number, dy: number) => {
    const next = {
      x: clamp(scannerRef.current.x + dx, -1, 1),
      y: clamp(scannerRef.current.y + dy, -1, 1),
      active: true,
    };

    scannerRef.current = next;
    setState((previous) => ({ ...previous, scannerPosition: next }));
  }, []);

  const beginCharge = useCallback(() => {
    const current = stateRef.current;

    if (
      current.status !== "playing" ||
      current.scannerEnergy < SCANNER.minEnergyToPulse
    ) {
      return;
    }

    chargingStartedAtRef.current = performance.now();
    scannerRef.current = { ...scannerRef.current, active: true };
  }, []);

  const releasePulse = useCallback(() => {
    const current = stateRef.current;

    if (current.status !== "playing") {
      chargingStartedAtRef.current = null;
      return;
    }

    const now = performance.now();
    const chargeStart = chargingStartedAtRef.current ?? now;
    const charge = clamp((now - chargeStart) / SCANNER.chargeMs);
    const effectiveCharge = Math.max(0.22, charge);
    const energyCost =
      SCANNER.basePulseCost + SCANNER.fullPulseCost * effectiveCharge;

    chargingStartedAtRef.current = null;

    if (current.scannerEnergy < SCANNER.minEnergyToPulse) {
      setState((previous) => ({
        ...previous,
        scannerCharge: 0,
        statusMessage: "SCANNER ENERGY RECOVERING",
      }));
      return;
    }

    const pulseRadius =
      SCANNER.minPulseRadius +
      (SCANNER.maxPulseRadius - SCANNER.minPulseRadius) * effectiveCharge;
    const scanner = scannerRef.current;
    let bestHit:
      | {
          chain: InfectionChain;
          distance: number;
          progress: number;
        }
      | null = null;
    let falseHit: InfectionChain | null = null;

    for (const chain of current.activeChains) {
      if (!activeChain(chain)) {
        continue;
      }

      const nodes = projectedNodes(chain, now);

      if (chain.coreIndex !== null) {
        const core = nodes[chain.coreIndex];
        const coreDistance = distance(core, scanner);

        if (coreDistance <= pulseRadius && (!bestHit || coreDistance < bestHit.distance)) {
          bestHit = {
            chain,
            distance: coreDistance,
            progress: chainProgress(chain, now),
          };
        }
      } else {
        const nearestFalse = Math.min(
          ...nodes.map((node) => distance(node, scanner)),
        );

        if (nearestFalse <= pulseRadius) {
          falseHit = chain;
        }
      }
    }

    const pulseId = pulseIdRef.current;
    pulseIdRef.current += 1;

    if (bestHit) {
      const perfect =
        effectiveCharge >= 0.65 &&
        bestHit.distance <= 0.09 &&
        bestHit.progress <= 0.78;
      const scoreResult = chainScore({
        baseScore: bestHit.chain.baseScore,
        charge: effectiveCharge,
        perfect,
        progress: bestHit.progress,
        streak: current.chainStreak,
      });
      const altitudeGain =
        bestHit.chain.altitudeGain + (perfect ? ALTITUDE.perfectGain : 0);
      const label = perfect
        ? `+${scoreResult.total} PERFECT x${scoreResult.multiplier}`
        : `+${scoreResult.total} x${scoreResult.multiplier}`;

      setState((previous) => ({
        ...previous,
        score: previous.score + scoreResult.total,
        baseScore: previous.baseScore + scoreResult.total,
        chainStreak: scoreResult.nextStreak,
        bestCombo: Math.max(
          previous.bestCombo,
          comboMultiplier(scoreResult.nextStreak),
        ),
        comboMultiplier: scoreResult.multiplier,
        perfectBreaches: previous.perfectBreaches + (perfect ? 1 : 0),
        evacuationAltitude: clamp(
          previous.evacuationAltitude + altitudeGain,
          0,
          ALTITUDE.start,
        ),
        scannerCharge: 0,
        scannerEnergy: clamp(
          previous.scannerEnergy - energyCost,
          0,
          SCANNER.maxEnergy,
        ),
        scannerConfidence: 0,
        scannerTarget: "none",
        selectedChainId: null,
        activeChains: previous.activeChains.map((chain) =>
          chain.id === bestHit.chain.id
            ? {
                ...chain,
                state: "disrupted",
                resolvedAt: now,
              }
            : chain,
        ),
        pulses: [
          ...previous.pulses,
          {
            id: pulseId,
            x: scanner.x,
            y: scanner.y,
            charge: effectiveCharge,
            createdAt: now,
            result: perfect ? "perfect" : "hit",
          },
        ],
        scorePopups: [
          ...previous.scorePopups,
          {
            id: popupIdRef.current++,
            x: scanner.x,
            y: scanner.y,
            label,
            createdAt: now,
          },
        ],
        statusMessage: perfect ? "PERFECT BREACH" : "CONTAINMENT SUCCESSFUL",
      }));
      return;
    }

    if (falseHit) {
      setState((previous) => ({
        ...previous,
        chainStreak: 0,
        comboMultiplier: 1,
        scannerCharge: 0,
        scannerEnergy: clamp(
          previous.scannerEnergy - energyCost - SCANNER.missDrain,
          0,
          SCANNER.maxEnergy,
        ),
        scannerConfidence: 0,
        activeChains: previous.activeChains.map((chain) =>
          chain.id === falseHit?.id
            ? {
                ...chain,
                state: "expired",
                resolvedAt: now,
              }
            : chain,
        ),
        pulses: [
          ...previous.pulses,
          {
            id: pulseId,
            x: scanner.x,
            y: scanner.y,
            charge: effectiveCharge,
            createdAt: now,
            result: "false",
          },
        ],
        statusMessage: "HIGH ACTIVITY / LOW COHERENCE",
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      chainStreak: 0,
      comboMultiplier: 1,
      scannerCharge: 0,
      scannerEnergy: clamp(
        previous.scannerEnergy - energyCost - SCANNER.missDrain,
        0,
        SCANNER.maxEnergy,
      ),
      scannerConfidence: 0,
      pulses: [
        ...previous.pulses,
        {
          id: pulseId,
          x: scanner.x,
          y: scanner.y,
          charge: effectiveCharge,
          createdAt: now,
          result: "miss",
        },
      ],
      statusMessage: "NO COHERENT SIGNAL",
    }));
  }, []);

  const continueToManifesto = useCallback(() => {
    document.getElementById("manifesto")?.scrollIntoView({
      behavior: stateRef.current.reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  return useMemo(
    () => ({
      state,
      scannerRef,
      startGame,
      resetGame,
      setScannerPosition,
      nudgeScanner,
      beginCharge,
      releasePulse,
      continueToManifesto,
    }),
    [
      beginCharge,
      continueToManifesto,
      nudgeScanner,
      releasePulse,
      resetGame,
      setScannerPosition,
      startGame,
      state,
    ],
  );
}
