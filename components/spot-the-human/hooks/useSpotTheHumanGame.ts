"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createRoundCrowd } from "@/components/spot-the-human/lib/crowd-generator";
import {
  HINT_DELAY_MS,
  HINT_PENALTY,
  ROUND_CONFIGS,
  STORAGE_KEY,
  SUCCESS_HOLD_MS,
  WRONG_CLICK_PENALTY,
  isActiveRoundStatus,
  type GameStatus,
  type PersistedBest,
  type RoundNumber,
  type RoundScene,
  type ScanPing,
  type ScannerPosition,
  type ScoreEvent,
  type ScoreEventTone,
} from "@/components/spot-the-human/lib/game-config";
import {
  accuracyFor,
  clampScore,
  rankForScore,
  scoreRound,
} from "@/components/spot-the-human/lib/scoring";

type ScannerTarget = "target" | "decoy" | "swarm";
type FeedbackTone = "neutral" | "coherence" | "warning" | "success";

export type SpotTheHumanState = {
  status: GameStatus;
  currentRound: RoundNumber;
  scene: RoundScene;
  activeTargetId: string;
  targetPosition: { x: number; y: number };
  score: number;
  accuracy: number;
  correctClicks: number;
  wrongClicks: number;
  roundWrongClicks: number;
  hintUsedRounds: RoundNumber[];
  hintAvailable: boolean;
  roundStartTime: number;
  overallStartTime: number;
  elapsedRoundTime: number;
  timeRemainingMs: number;
  roundTimeLimitMs: number;
  scannerPosition: ScannerPosition;
  scannerNearTarget: boolean;
  scannerConfidence: number;
  scannerTarget: ScannerTarget;
  scannerFeedback: string;
  feedbackTone: FeedbackTone;
  scoreEvents: ScoreEvent[];
  scanPings: ScanPing[];
  isMobile: boolean;
  reducedMotion: boolean;
  threat: number;
  totalTimeMs: number;
  finalRank: string;
  finalRankCopy: string;
  personalBestScore: number;
  personalBestRank: string;
  statusMessage: string;
};

const INITIAL_SCANNER: ScannerPosition = {
  x: 0,
  y: 0.1,
  active: false,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function readBest(): PersistedBest {
  if (typeof window === "undefined") {
    return { score: 0, rank: "UNRANKED" };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { score: 0, rank: "UNRANKED" };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedBest>;

    return {
      score: typeof parsed.score === "number" ? parsed.score : 0,
      rank: typeof parsed.rank === "string" ? parsed.rank : "UNRANKED",
    };
  } catch {
    return { score: 0, rank: "UNRANKED" };
  }
}

function createInitialState(
  isMobile: boolean,
  reducedMotion: boolean,
  best: PersistedBest,
): SpotTheHumanState {
  const scene = createRoundCrowd(1, isMobile, reducedMotion);
  const config = ROUND_CONFIGS[1];

  return {
    status: "intro",
    currentRound: 1,
    scene,
    activeTargetId: scene.target.id,
    targetPosition: {
      x: scene.target.baseX,
      y: scene.target.baseY,
    },
    score: 0,
    accuracy: 100,
    correctClicks: 0,
    wrongClicks: 0,
    roundWrongClicks: 0,
    hintUsedRounds: [],
    hintAvailable: false,
    roundStartTime: 0,
    overallStartTime: 0,
    elapsedRoundTime: 0,
    timeRemainingMs: config.timeLimitMs,
    roundTimeLimitMs: config.timeLimitMs,
    scannerPosition: INITIAL_SCANNER,
    scannerNearTarget: false,
    scannerConfidence: 0,
    scannerTarget: "swarm",
    scannerFeedback: "SCAN THE SWARM",
    feedbackTone: "neutral",
    scoreEvents: [],
    scanPings: [],
    isMobile,
    reducedMotion,
    threat: 0,
    totalTimeMs: 0,
    finalRank: "UNRANKED",
    finalRankCopy: "",
    personalBestScore: best.score,
    personalBestRank: best.rank,
    statusMessage:
      "One person in the swarm is behaving differently. Begin observation.",
  };
}

function analyzeScanner(
  scanner: ScannerPosition,
  scene: RoundScene,
  isMobile: boolean,
) {
  const config = ROUND_CONFIGS[scene.round];
  const target = {
    x: scene.target.baseX,
    y: scene.target.baseY,
  };
  const targetDistance = distance(scanner, target);
  const nearRadius = config.nearRadius + (isMobile ? 0.08 : 0);
  const confidence = clamp(1 - targetDistance / nearRadius, 0, 1);
  const nearestDecoyDistance = scene.decoys.reduce(
    (nearest, decoy) =>
      Math.min(nearest, distance(scanner, { x: decoy.baseX, y: decoy.baseY })),
    Number.POSITIVE_INFINITY,
  );
  const decoyNear = nearestDecoyDistance < nearRadius * 0.62;
  const scannerTarget: ScannerTarget =
    confidence > 0.58 ? "target" : decoyNear ? "decoy" : "swarm";
  const feedback =
    scannerTarget === "target"
      ? config.targetMessage
      : scannerTarget === "decoy"
        ? config.decoyMessage
        : config.objective;

  return {
    confidence,
    nearTarget: confidence > 0.58,
    scannerTarget,
    feedback,
    feedbackTone:
      scannerTarget === "target"
        ? ("coherence" as const)
        : scannerTarget === "decoy"
          ? ("warning" as const)
          : ("neutral" as const),
    targetDistance,
  };
}

function scoreEvent(
  id: string,
  label: string,
  tone: ScoreEventTone,
  x: number,
  y: number,
): ScoreEvent {
  return {
    id,
    label,
    tone,
    x,
    y,
    createdAt: Date.now(),
  };
}

function scanPing(id: string, tone: ScanPing["tone"], x: number, y: number) {
  return {
    id,
    tone,
    x,
    y,
    createdAt: Date.now(),
  };
}

export function useSpotTheHumanGame() {
  const scannerRef = useRef<ScannerPosition>(INITIAL_SCANNER);
  const eventIdRef = useRef(0);
  const transitionRef = useRef<number | null>(null);
  const [state, setState] = useState<SpotTheHumanState>(() =>
    createInitialState(false, false, { score: 0, rank: "UNRANKED" }),
  );

  const nextId = useCallback((prefix: string) => {
    eventIdRef.current += 1;
    return `${prefix}-${eventIdRef.current}`;
  }, []);

  const clearTransition = useCallback(() => {
    if (transitionRef.current !== null) {
      window.clearTimeout(transitionRef.current);
      transitionRef.current = null;
    }
  }, []);

  const beginRound = useCallback(
    (round: RoundNumber) => {
      clearTransition();
      const now = Date.now();

      setState((current) => {
        const scene = createRoundCrowd(
          round,
          current.isMobile,
          current.reducedMotion,
        );
        const config = ROUND_CONFIGS[round];
        const scanner = {
          x: round === 1 ? -0.15 : round === 2 ? 0.08 : 0,
          y: round === 3 ? 0.08 : 0.12,
          active: true,
        };
        const scan = analyzeScanner(scanner, scene, current.isMobile);
        scannerRef.current = scanner;

        return {
          ...current,
          status: config.status,
          currentRound: round,
          scene,
          activeTargetId: scene.target.id,
          targetPosition: {
            x: scene.target.baseX,
            y: scene.target.baseY,
          },
          roundWrongClicks: 0,
          hintAvailable: false,
          roundStartTime: now,
          overallStartTime:
            current.overallStartTime > 0 ? current.overallStartTime : now,
          elapsedRoundTime: 0,
          timeRemainingMs: config.timeLimitMs,
          roundTimeLimitMs: config.timeLimitMs,
          scannerPosition: scanner,
          scannerNearTarget: scan.nearTarget,
          scannerConfidence: scan.confidence,
          scannerTarget: scan.scannerTarget,
          scannerFeedback: config.prompt,
          feedbackTone: "neutral",
          scanPings: [
            scanPing(nextId("round"), "neutral", scanner.x, scanner.y),
          ],
          threat: round === 1 ? 0.12 : round === 2 ? 0.3 : 0.5,
          statusMessage: `${config.label}. ${config.prompt}`,
        };
      });
    },
    [clearTransition, nextId],
  );

  const showResults = useCallback(() => {
    clearTransition();
    setState((current) => {
      const rank = rankForScore(current.score);
      const totalTimeMs =
        current.overallStartTime > 0
          ? Date.now() - current.overallStartTime
          : current.totalTimeMs;
      const personalBestScore = Math.max(
        current.personalBestScore,
        current.score,
      );
      const personalBestRank =
        current.score >= current.personalBestScore
          ? rank.label
          : current.personalBestRank;

      return {
        ...current,
        status: "results",
        finalRank: rank.label,
        finalRankCopy: rank.copy,
        totalTimeMs,
        scannerPosition: { ...current.scannerPosition, active: false },
        statusMessage: `${rank.label}. Final score ${current.score}.`,
        personalBestScore,
        personalBestRank,
      };
    });
  }, [clearTransition]);

  useEffect(
    () => () => {
      clearTransition();
    },
    [clearTransition],
  );

  useEffect(() => {
    const updatePreferences = () => {
      const isMobile =
        window.matchMedia("(max-width: 767px)").matches ||
        window.matchMedia("(pointer: coarse)").matches;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const best = readBest();

      setState((current) => {
        if (current.status !== "intro") {
          return {
            ...current,
            isMobile,
            reducedMotion,
            personalBestScore: best.score,
            personalBestRank: best.rank,
          };
        }

        const scene = createRoundCrowd(1, isMobile, reducedMotion);

        return {
          ...current,
          isMobile,
          reducedMotion,
          scene,
          activeTargetId: scene.target.id,
          targetPosition: {
            x: scene.target.baseX,
            y: scene.target.baseY,
          },
          personalBestScore: best.score,
          personalBestRank: best.rank,
        };
      });
    };

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    updatePreferences();
    mobileQuery.addEventListener("change", updatePreferences);
    pointerQuery.addEventListener("change", updatePreferences);
    motionQuery.addEventListener("change", updatePreferences);

    return () => {
      mobileQuery.removeEventListener("change", updatePreferences);
      pointerQuery.removeEventListener("change", updatePreferences);
      motionQuery.removeEventListener("change", updatePreferences);
    };
  }, []);

  useEffect(() => {
    if (state.status !== "results") {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          score: state.personalBestScore,
          rank: state.personalBestRank,
        } satisfies PersistedBest),
      );
    } catch {
      // Best score persistence is non-critical and should not block results.
    }
  }, [state.personalBestRank, state.personalBestScore, state.status]);

  useEffect(() => {
    if (!isActiveRoundStatus(state.status)) {
      return;
    }

    const interval = window.setInterval(() => {
      const now = Date.now();

      setState((current) => {
        if (!isActiveRoundStatus(current.status)) {
          return current;
        }

        const config = ROUND_CONFIGS[current.currentRound];
        const elapsedRoundTime = now - current.roundStartTime;
        const timeRemainingMs = Math.max(
          0,
          config.timeLimitMs - elapsedRoundTime,
        );
        const scan = analyzeScanner(
          scannerRef.current,
          current.scene,
          current.isMobile,
        );
        const hintAvailable =
          elapsedRoundTime >= HINT_DELAY_MS &&
          !current.hintUsedRounds.includes(current.currentRound);
        const timedThreat = clamp(
          elapsedRoundTime / Math.max(1, config.timeLimitMs),
          0,
          1,
        );
        const threat = clamp(
          timedThreat * 0.72 + (current.currentRound - 1) * 0.16,
          0,
          1,
        );

        return {
          ...current,
          elapsedRoundTime,
          timeRemainingMs,
          scannerNearTarget: scan.nearTarget,
          scannerConfidence: scan.confidence,
          scannerTarget: scan.scannerTarget,
          scannerFeedback: scan.feedback,
          feedbackTone: scan.feedbackTone,
          hintAvailable,
          threat,
          scoreEvents: current.scoreEvents.filter(
            (event) => now - event.createdAt < 1450,
          ),
          scanPings: current.scanPings.filter(
            (event) => now - event.createdAt < 1550,
          ),
        };
      });
    }, 90);

    return () => window.clearInterval(interval);
  }, [state.status]);

  const startGame = useCallback(() => {
    const best = {
      score: state.personalBestScore,
      rank: state.personalBestRank,
    };
    const initial = createInitialState(state.isMobile, state.reducedMotion, best);

    clearTransition();
    eventIdRef.current = 0;
    setState({
      ...initial,
      status: "replaying",
      overallStartTime: Date.now(),
      statusMessage: "Observation interface armed.",
    });

    window.setTimeout(() => beginRound(1), 160);
  }, [
    beginRound,
    clearTransition,
    state.isMobile,
    state.personalBestRank,
    state.personalBestScore,
    state.reducedMotion,
  ]);

  const resetGame = useCallback(() => {
    const best = {
      score: state.personalBestScore,
      rank: state.personalBestRank,
    };

    clearTransition();
    scannerRef.current = INITIAL_SCANNER;
    setState(createInitialState(state.isMobile, state.reducedMotion, best));
  }, [
    clearTransition,
    state.isMobile,
    state.personalBestRank,
    state.personalBestScore,
    state.reducedMotion,
  ]);

  const setScannerPosition = useCallback((position: ScannerPosition) => {
    const next = {
      x: clamp(position.x, -1, 1),
      y: clamp(position.y, -1, 1),
      active: position.active,
    };

    scannerRef.current = next;
    setState((current) => {
      const scan = analyzeScanner(next, current.scene, current.isMobile);

      return {
        ...current,
        scannerPosition: next,
        scannerNearTarget: scan.nearTarget,
        scannerConfidence: scan.confidence,
        scannerTarget: scan.scannerTarget,
        scannerFeedback: isActiveRoundStatus(current.status)
          ? scan.feedback
          : current.scannerFeedback,
        feedbackTone: scan.feedbackTone,
      };
    });
  }, []);

  const nudgeScanner = useCallback(
    (dx: number, dy: number) => {
      const current = scannerRef.current;

      setScannerPosition({
        x: current.x + dx,
        y: current.y + dy,
        active: true,
      });
    },
    [setScannerPosition],
  );

  const requestHint = useCallback(() => {
    if (
      !isActiveRoundStatus(state.status) ||
      !state.hintAvailable ||
      state.hintUsedRounds.includes(state.currentRound)
    ) {
      return;
    }

    const round = state.currentRound;
    const target = state.targetPosition;
    const offset = round === 1 ? -0.12 : round === 2 ? 0.14 : 0.09;
    const hintX = clamp(target.x + offset, -0.92, 0.92);
    const hintY = clamp(target.y + (round === 3 ? -0.08 : 0.08), -0.85, 0.85);

    setState((current) => ({
      ...current,
      score: clampScore(current.score - HINT_PENALTY),
      accuracy: accuracyFor(current.correctClicks, current.wrongClicks),
      hintUsedRounds: [...current.hintUsedRounds, round],
      hintAvailable: false,
      scoreEvents: [
        ...current.scoreEvents,
        scoreEvent(nextId("hint-score"), "-1,000 HINT", "hint", hintX, hintY),
      ],
      scanPings: [
        ...current.scanPings,
        scanPing(nextId("hint-ping"), "coherence", hintX, hintY),
      ],
      scannerFeedback: "SIGNAL HINT REQUESTED",
      feedbackTone: "coherence",
      statusMessage: `Round ${round} signal hint requested. Score reduced by 1000.`,
    }));
  }, [nextId, state]);

  const pulseScan = useCallback(() => {
    if (!isActiveRoundStatus(state.status)) {
      return;
    }

    const scanner = scannerRef.current;
    const scan = analyzeScanner(scanner, state.scene, state.isMobile);

    setState((current) => ({
      ...current,
      scanPings: [
        ...current.scanPings,
        scanPing(
          nextId("scan"),
          scan.scannerTarget === "target"
            ? "coherence"
            : scan.scannerTarget === "decoy"
              ? "warning"
              : "neutral",
          scanner.x,
          scanner.y,
        ),
      ],
      scannerFeedback: scan.feedback,
      feedbackTone: scan.feedbackTone,
      statusMessage:
        scan.scannerTarget === "target"
          ? "Coherence detected near scanner."
          : "Scanner pulse did not isolate the human.",
    }));
  }, [nextId, state]);

  const confirmSelection = useCallback(() => {
    if (!isActiveRoundStatus(state.status)) {
      return;
    }

    const scanner = scannerRef.current;
    const config = ROUND_CONFIGS[state.currentRound];
    const target = state.targetPosition;
    const hitRadius =
      config.hitRadius +
      (state.isMobile ? 0.065 : 0) +
      (state.hintUsedRounds.includes(state.currentRound) ? 0.025 : 0);
    const hit = distance(scanner, target) <= hitRadius;

    if (!hit) {
      const wrongMessage = config.wrongMessage;

      setState((current) => ({
        ...current,
        score: clampScore(current.score - WRONG_CLICK_PENALTY),
        wrongClicks: current.wrongClicks + 1,
        roundWrongClicks: current.roundWrongClicks + 1,
        accuracy: accuracyFor(current.correctClicks, current.wrongClicks + 1),
        scannerFeedback: wrongMessage,
        feedbackTone: "warning",
        scoreEvents: [
          ...current.scoreEvents,
          scoreEvent(nextId("wrong"), "-500 FALSE SIGNAL", "loss", scanner.x, scanner.y),
        ],
        scanPings: [
          ...current.scanPings,
          scanPing(nextId("wrong-ping"), "warning", scanner.x, scanner.y),
        ],
        statusMessage: `${wrongMessage}. The round continues.`,
      }));
      return;
    }

    const remainingMs = Math.max(
      0,
      config.timeLimitMs - (Date.now() - state.roundStartTime),
    );
    const breakdown = scoreRound({
      remainingMs,
      round: state.currentRound,
      wrongClicks: state.roundWrongClicks,
    });
    const successStatus = config.successStatus;
    const round = state.currentRound;

    setState((current) => ({
      ...current,
      status: successStatus,
      score: clampScore(current.score + breakdown.total),
      correctClicks: current.correctClicks + 1,
      accuracy: accuracyFor(current.correctClicks + 1, current.wrongClicks),
      scannerNearTarget: true,
      scannerConfidence: 1,
      scannerTarget: "target",
      scannerFeedback: config.correctMessage,
      feedbackTone: "success",
      threat: round === 3 ? 0.16 : current.threat,
      scoreEvents: [
        ...current.scoreEvents,
        scoreEvent(
          nextId("base"),
          `+${breakdown.base.toLocaleString("en-US")}`,
          "gain",
          target.x,
          target.y,
        ),
        scoreEvent(
          nextId("speed"),
          `+${breakdown.speed.toLocaleString("en-US")} SPEED`,
          "gain",
          clamp(target.x + 0.1, -0.9, 0.9),
          target.y,
        ),
        ...(breakdown.precision > 0
          ? [
              scoreEvent(
                nextId("precision"),
                "+1,000 PRECISION",
                "success",
                clamp(target.x - 0.1, -0.9, 0.9),
                target.y,
              ),
            ]
          : []),
      ],
      scanPings: [
        ...current.scanPings,
        scanPing(nextId("success-ping"), "success", target.x, target.y),
      ],
      statusMessage: `${config.correctMessage}. ${breakdown.total} points awarded.`,
    }));

    clearTransition();
    transitionRef.current = window.setTimeout(() => {
      if (round < 3) {
        beginRound((round + 1) as RoundNumber);
      } else {
        showResults();
      }
    }, SUCCESS_HOLD_MS);
  }, [beginRound, clearTransition, nextId, showResults, state]);

  const continueToManifesto = useCallback(() => {
    document.getElementById("manifesto")?.scrollIntoView({
      behavior: state.reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [state.reducedMotion]);

  return {
    state,
    scannerRef: scannerRef as RefObject<ScannerPosition>,
    startGame,
    resetGame,
    setScannerPosition,
    nudgeScanner,
    pulseScan,
    confirmSelection,
    requestHint,
    continueToManifesto,
  };
}
