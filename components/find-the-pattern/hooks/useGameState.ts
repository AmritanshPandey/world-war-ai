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
  ROUND_COPY,
  SCORE_LIMITS,
  type ActiveRound,
  type DecisionId,
  type FieldEvent,
  type GameStatus,
  type ScannerPosition,
  type ScannerTarget,
} from "@/components/find-the-pattern/lib/game-config";
import { clampRange } from "@/components/find-the-pattern/lib/game-utils";
import {
  calculateTimeBonus,
  clampScore,
  getResultCategory,
  type ResultCategory,
} from "@/components/find-the-pattern/hooks/useScore";
import { useSignalDetection } from "@/components/find-the-pattern/hooks/useSignalDetection";

export type GameState = {
  status: GameStatus;
  activeRound: ActiveRound;
  score: number;
  streak: number;
  bestStreak: number;
  lastGain: number;
  lockQuality: "idle" | "clean" | "steady" | "rushed" | "decoy" | "decision";
  elapsedMs: number;
  roundElapsedMs: number;
  falseAttempts: number;
  wrongDecisionCount: number;
  scannerPosition: ScannerPosition;
  scannerConfidence: number;
  scannerTarget: ScannerTarget;
  scanLabel: string;
  statusMessage: string;
  lesson: string;
  fieldEvent: FieldEvent;
  seed: number;
  isMobile: boolean;
  reducedMotion: boolean;
  result: ResultCategory;
};

export type GameController = {
  state: GameState;
  scannerRef: RefObject<ScannerPosition>;
  startGame: () => void;
  resetGame: () => void;
  setScannerPosition: (position: ScannerPosition) => void;
  nudgeScanner: (dx: number, dy: number) => void;
  pulseScan: () => void;
  confirmLock: () => void;
  previewDecision: (decisionId: DecisionId | null) => void;
  chooseDecision: (decisionId: DecisionId) => void;
};

const DEFAULT_SCANNER: ScannerPosition = { x: 0, y: 0, active: false };

function createInitialState(seed = 1): GameState {
  return {
    status: "intro",
    activeRound: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    lastGain: 0,
    lockQuality: "idle",
    elapsedMs: 0,
    roundElapsedMs: 0,
    falseAttempts: 0,
    wrongDecisionCount: 0,
    scannerPosition: DEFAULT_SCANNER,
    scannerConfidence: 0,
    scannerTarget: "inactive",
    scanLabel: "STANDBY",
    statusMessage: ROUND_COPY.intro.prompt,
    lesson: ROUND_COPY.intro.instruction,
    fieldEvent: "idle",
    seed,
    isMobile: false,
    reducedMotion: false,
    result: getResultCategory(0),
  };
}

function lockQualityFromBonus(timeBonus: number, maxBonus: number) {
  if (timeBonus >= maxBonus * 0.7) {
    return "clean";
  }

  if (timeBonus > 0) {
    return "steady";
  }

  return "rushed";
}

function targetLabel(activeRound: ActiveRound, target: ScannerTarget) {
  if (target === "inactive") {
    return "SCANNER IDLE";
  }

  if (target === "true") {
    if (activeRound === 1) {
      return "ANOMALY DETECTED";
    }

    if (activeRound === 2) {
      return ROUND_COPY[2].trueLabel;
    }

    return "COHERENT SIGNAL";
  }

  return "HIGH ACTIVITY / LOW COHERENCE";
}

function roundLabel(activeRound: ActiveRound) {
  if (activeRound === 1) {
    return ROUND_COPY[1].prompt;
  }

  if (activeRound === 2) {
    return ROUND_COPY[2].prompt;
  }

  if (activeRound === 3) {
    return ROUND_COPY[3].prompt;
  }

  return ROUND_COPY.intro.prompt;
}

export function useGameState(): GameController {
  const scannerRef = useRef<ScannerPosition>(DEFAULT_SCANNER);
  const stateRef = useRef<GameState>(createInitialState());
  const gameStartAtRef = useRef<number | null>(null);
  const roundStartAtRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const finishScheduledRef = useRef(false);
  const [state, setState] = useState(() => createInitialState());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const schedule = useCallback(
    (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        timersRef.current = timersRef.current.filter((item) => item !== timer);
        callback();
      }, delay);

      timersRef.current.push(timer);
    },
    [],
  );

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const mobileQuery = window.matchMedia("(max-width: 767px)");

    const updateEnvironment = () => {
      setState((previous) => ({
        ...previous,
        isMobile: mobileQuery.matches,
        reducedMotion: reducedMotionQuery.matches,
      }));
    };

    updateEnvironment();
    reducedMotionQuery.addEventListener("change", updateEnvironment);
    mobileQuery.addEventListener("change", updateEnvironment);

    return () => {
      reducedMotionQuery.removeEventListener("change", updateEnvironment);
      mobileQuery.removeEventListener("change", updateEnvironment);
    };
  }, []);

  useEffect(() => {
    if (state.status === "intro" || state.status === "results") {
      return;
    }

    const timer = window.setInterval(() => {
      const gameStartAt = gameStartAtRef.current;
      const roundStartAt = roundStartAtRef.current;

      if (!gameStartAt || !roundStartAt) {
        return;
      }

      setState((previous) => ({
        ...previous,
        elapsedMs: performance.now() - gameStartAt,
        roundElapsedMs: performance.now() - roundStartAt,
      }));
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [state.status]);

  const enterRound = useCallback((round: 1 | 2 | 3) => {
    roundStartAtRef.current = performance.now();

    setState((previous) => ({
      ...previous,
      activeRound: round,
      status:
        round === 1
          ? "round1-scanning"
          : round === 2
            ? "round2-scanning"
            : "round3-decision",
      scannerConfidence: 0,
      scannerTarget: "inactive",
      scanLabel: "SCANNER IDLE",
      statusMessage: roundLabel(round),
      lesson: "",
      fieldEvent: "idle",
      roundElapsedMs: 0,
      lastGain: 0,
      lockQuality: "idle",
    }));
  }, []);

  const startGame = useCallback(() => {
    clearTimers();
    const now = performance.now();

    finishScheduledRef.current = false;
    gameStartAtRef.current = now;
    roundStartAtRef.current = now;
    scannerRef.current = { x: 0, y: 0, active: true };

    setState((previous) => ({
      ...createInitialState(previous.seed),
      isMobile: previous.isMobile,
      reducedMotion: previous.reducedMotion,
      status: "round1-scanning",
      activeRound: 1,
      scannerPosition: scannerRef.current,
      scanLabel: "SCANNER IDLE",
      statusMessage: ROUND_COPY[1].prompt,
      lesson: "",
    }));
  }, [clearTimers]);

  const resetGame = useCallback(() => {
    clearTimers();
    finishScheduledRef.current = false;
    gameStartAtRef.current = null;
    roundStartAtRef.current = null;
    scannerRef.current = DEFAULT_SCANNER;

    setState((previous) => ({
      ...createInitialState(previous.seed + 1),
      isMobile: previous.isMobile,
      reducedMotion: previous.reducedMotion,
      scannerPosition: DEFAULT_SCANNER,
    }));
  }, [clearTimers]);

  const setScannerPosition = useCallback((position: ScannerPosition) => {
    const nextPosition = {
      x: clampRange(position.x, -1, 1),
      y: clampRange(position.y, -1, 1),
      active: position.active,
    };

    scannerRef.current = nextPosition;
    setState((previous) => ({
      ...previous,
      scannerPosition: nextPosition,
    }));
  }, []);

  const nudgeScanner = useCallback((dx: number, dy: number) => {
    const nextPosition = {
      x: clampRange(scannerRef.current.x + dx, -1, 1),
      y: clampRange(scannerRef.current.y + dy, -1, 1),
      active: true,
    };

    scannerRef.current = nextPosition;
    setState((previous) => ({
      ...previous,
      scannerPosition: nextPosition,
    }));
  }, []);

  const pulseScan = useCallback(() => {
    scannerRef.current = {
      ...scannerRef.current,
      active: true,
    };

    setState((previous) => ({
      ...previous,
      scannerPosition: scannerRef.current,
      scanLabel:
        previous.scannerTarget === "true"
          ? targetLabel(previous.activeRound, "true")
          : "SCAN PULSE",
    }));
  }, []);

  const completeRoundOne = useCallback(() => {
    const elapsed = roundStartAtRef.current
      ? performance.now() - roundStartAtRef.current
      : 0;
    const timeBonus = calculateTimeBonus(
      elapsed,
      SCORE_LIMITS.round1TimeBonus,
      7000,
      18000,
    );
    const gained = Math.min(
      SCORE_LIMITS.round1Max,
      SCORE_LIMITS.round1Base + timeBonus,
    );

    setState((previous) => ({
      ...previous,
      status: "round1-complete",
      score: clampScore(
        previous.score + gained + SCORE_LIMITS.streakBonus,
      ),
      streak: previous.streak + 1,
      bestStreak: Math.max(previous.bestStreak, previous.streak + 1),
      lastGain: gained + SCORE_LIMITS.streakBonus,
      lockQuality: lockQualityFromBonus(timeBonus, SCORE_LIMITS.round1TimeBonus),
      scannerConfidence: 0,
      scannerTarget: "inactive",
      scanLabel: "LOCK CONFIRMED",
      statusMessage: ROUND_COPY[1].complete,
      lesson: `${ROUND_COPY[1].lesson} +${SCORE_LIMITS.streakBonus} streak bonus.`,
      fieldEvent: "idle",
    }));

    schedule(() => enterRound(2), 2100);
  }, [enterRound, schedule]);

  const completeRoundTwo = useCallback(() => {
    const elapsed = roundStartAtRef.current
      ? performance.now() - roundStartAtRef.current
      : 0;
    const timeBonus = calculateTimeBonus(
      elapsed,
      SCORE_LIMITS.round2TimeBonus,
      8000,
      22000,
    );
    const gained = Math.min(
      SCORE_LIMITS.round2Max,
      SCORE_LIMITS.round2Base + timeBonus,
    );

    setState((previous) => {
      const nextStreak = previous.streak + 1;
      const streakBonus = SCORE_LIMITS.streakBonus * nextStreak;
      const totalGain = gained + streakBonus;

      return {
        ...previous,
        status: "round2-complete",
        score: clampScore(previous.score + totalGain),
        streak: nextStreak,
        bestStreak: Math.max(previous.bestStreak, nextStreak),
        lastGain: totalGain,
        lockQuality: lockQualityFromBonus(
          timeBonus,
          SCORE_LIMITS.round2TimeBonus,
        ),
        scannerConfidence: 0,
        scannerTarget: "inactive",
        scanLabel: "SIGNAL CONFIRMED",
        statusMessage: ROUND_COPY[2].complete,
        lesson: `${ROUND_COPY[2].lesson} +${streakBonus} streak bonus.`,
        fieldEvent: "idle",
      };
    });

    schedule(() => enterRound(3), 2100);
  }, [enterRound, schedule]);

  const falseLock = useCallback(() => {
    setState((previous) => ({
      ...previous,
      status: "round2-false-feedback",
      score: clampScore(previous.score - SCORE_LIMITS.round2FalsePenalty),
      streak: 0,
      lastGain: -SCORE_LIMITS.round2FalsePenalty,
      lockQuality: "decoy",
      falseAttempts: previous.falseAttempts + 1,
      scannerConfidence: 0,
      scannerTarget: "false",
      scanLabel: ROUND_COPY[2].falseLabel,
      statusMessage: ROUND_COPY[2].falseLock,
      lesson: "Activity is not insight.",
      fieldEvent: "false-collapse",
    }));

    schedule(() => {
      setState((previous) => ({
        ...previous,
        status: "round2-scanning",
        scannerConfidence: 0,
        statusMessage: ROUND_COPY[2].prompt,
        lesson: "",
        fieldEvent: "idle",
      }));
    }, 1350);
  }, [schedule]);

  const confirmLock = useCallback(() => {
    const current = stateRef.current;

    if (current.status === "round1-lock-ready") {
      completeRoundOne();
      return;
    }

    if (current.status === "round2-lock-ready") {
      completeRoundTwo();
      return;
    }

    if (
      current.status === "round2-scanning" &&
      current.scannerTarget === "false"
    ) {
      falseLock();
      return;
    }

    if (
      current.status === "round1-scanning" ||
      current.status === "round2-scanning"
    ) {
      setState((previous) => ({
        ...previous,
        statusMessage: "Hold the scanner on coherent movement before locking.",
      }));
    }
  }, [completeRoundOne, completeRoundTwo, falseLock]);

  const previewDecision = useCallback((decisionId: DecisionId | null) => {
    const current = stateRef.current;

    if (current.status !== "round3-decision") {
      return;
    }

    setState((previous) => ({
      ...previous,
      fieldEvent:
        decisionId === "generate-more"
          ? "extra-noise"
          : decisionId === "copy-trend"
            ? "false-collapse"
            : decisionId === "observe-system"
              ? "resolve"
              : "idle",
    }));
  }, []);

  const finishGame = useCallback(() => {
    setState((previous) => {
      const result = getResultCategory(previous.score);

      return {
        ...previous,
        status: "results",
        activeRound: 3,
        scannerConfidence: 1,
        scannerTarget: "true",
        scanLabel: "SIGNAL RESOLVED",
        statusMessage: "You won by noticing what others missed.",
        lesson: "",
        fieldEvent: "resolve",
        result,
      };
    });
  }, []);

  const chooseDecision = useCallback(
    (decisionId: DecisionId) => {
      const current = stateRef.current;

      if (current.status !== "round3-decision") {
        return;
      }

      if (decisionId === "observe-system") {
        const nextStreak =
          current.wrongDecisionCount === 0 ? current.streak + 1 : 1;
        const streakBonus =
          current.wrongDecisionCount === 0
            ? SCORE_LIMITS.streakBonus * nextStreak
            : 0;
        const gained =
          current.wrongDecisionCount === 0
            ? SCORE_LIMITS.round3Bonus + streakBonus
            : 0;

        roundStartAtRef.current = performance.now();
        finishScheduledRef.current = false;

        setState((previous) => ({
          ...previous,
          status: "round3-final-scan",
          score: clampScore(previous.score + gained),
          streak: nextStreak,
          bestStreak: Math.max(previous.bestStreak, nextStreak),
          lastGain: gained,
          lockQuality: "decision",
          scannerConfidence: 0,
          scannerTarget: "inactive",
          scanLabel: "TRACE SIGNAL",
          statusMessage: "Trace the coherent signal.",
          lesson:
            gained > 0
              ? `${ROUND_COPY[3].complete} +${streakBonus} streak bonus.`
              : ROUND_COPY[3].complete,
          fieldEvent: "resolve",
        }));

        return;
      }

      const isGenerateMore = decisionId === "generate-more";

      setState((previous) => ({
        ...previous,
        wrongDecisionCount: previous.wrongDecisionCount + 1,
        score: clampScore(previous.score - SCORE_LIMITS.round3WrongPenalty),
        streak: 0,
        lastGain: -SCORE_LIMITS.round3WrongPenalty,
        lockQuality: "decoy",
        statusMessage: isGenerateMore
          ? "More output did not create more clarity."
          : "The visible pattern was not the meaningful one.",
        lesson: ROUND_COPY[3].prompt,
        fieldEvent: isGenerateMore ? "extra-noise" : "false-collapse",
      }));

      schedule(() => {
        setState((previous) => ({
          ...previous,
          fieldEvent: "idle",
        }));
      }, 1300);
    },
    [schedule],
  );

  const handleDetectionSample = useCallback(
    (target: ScannerTarget, dt: number, thresholdSeconds: number) => {
      setState((previous) => {
        if (
          previous.status === "round1-complete" ||
          previous.status === "round2-complete" ||
          previous.status === "round2-false-feedback" ||
          previous.status === "round3-decision" ||
          previous.status === "results" ||
          previous.status === "intro"
        ) {
          return previous;
        }

        const confidenceDelta =
          target === "true"
            ? dt / thresholdSeconds
            : -dt / (thresholdSeconds * 1.55);
        const nextConfidence = clampRange(
          previous.scannerConfidence + confidenceDelta,
          0,
          1,
        );
        let nextStatus = previous.status;
        let nextMessage = previous.statusMessage;
        const nextLabel = targetLabel(previous.activeRound, target);

        if (target === "true") {
          nextMessage =
            previous.activeRound === 3
              ? "Trace the coherent signal."
              : "Hold scan to build pattern lock.";
        } else if (target === "false") {
          nextMessage = ROUND_COPY[2].falseLabel;
        } else if (target === "noise") {
          nextMessage =
            previous.activeRound === 2
              ? ROUND_COPY[2].prompt
              : roundLabel(previous.activeRound);
        }

        if (nextConfidence >= 1) {
          if (previous.status === "round1-scanning") {
            nextStatus = "round1-lock-ready";
            nextMessage = "Lock pattern.";
          }

          if (previous.status === "round2-scanning") {
            nextStatus = "round2-lock-ready";
            nextMessage = "Lock pattern.";
          }

          if (
            previous.status === "round3-final-scan" &&
            !finishScheduledRef.current
          ) {
            finishScheduledRef.current = true;
            schedule(finishGame, 350);
          }
        } else if (
          previous.status === "round1-lock-ready" &&
          nextConfidence < 0.72
        ) {
          nextStatus = "round1-scanning";
        } else if (
          previous.status === "round2-lock-ready" &&
          nextConfidence < 0.72
        ) {
          nextStatus = "round2-scanning";
        }

        return {
          ...previous,
          status: nextStatus,
          scannerConfidence: nextConfidence,
          scannerTarget: target,
          scanLabel: nextLabel,
          statusMessage: nextMessage,
        };
      });
    },
    [finishGame, schedule],
  );

  useSignalDetection({
    activeRound: state.activeRound,
    isMobile: state.isMobile,
    scannerRef,
    status: state.status,
    onSample: handleDetectionSample,
  });

  const controller = useMemo<GameController>(
    () => ({
      state,
      scannerRef,
      startGame,
      resetGame,
      setScannerPosition,
      nudgeScanner,
      pulseScan,
      confirmLock,
      previewDecision,
      chooseDecision,
    }),
    [
      chooseDecision,
      confirmLock,
      nudgeScanner,
      previewDecision,
      pulseScan,
      resetGame,
      setScannerPosition,
      startGame,
      state,
    ],
  );

  return controller;
}
