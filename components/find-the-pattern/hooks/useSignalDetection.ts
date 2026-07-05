"use client";

import { useEffect, type RefObject } from "react";
import {
  ROUND_COPY,
  SIGNAL_ZONES,
  type ActiveRound,
  type GameStatus,
  type ScannerPosition,
  type ScannerTarget,
} from "@/components/find-the-pattern/lib/game-config";
import { isInsideZone } from "@/components/find-the-pattern/lib/game-utils";

type UseSignalDetectionOptions = {
  activeRound: ActiveRound;
  isMobile: boolean;
  scannerRef: RefObject<ScannerPosition>;
  status: GameStatus;
  onSample: (target: ScannerTarget, dt: number, thresholdSeconds: number) => void;
};

function isScanningStatus(status: GameStatus) {
  return (
    status === "round1-scanning" ||
    status === "round1-lock-ready" ||
    status === "round2-scanning" ||
    status === "round2-lock-ready" ||
    status === "round3-final-scan"
  );
}

function getThresholdSeconds(activeRound: ActiveRound) {
  if (activeRound === 1) {
    return ROUND_COPY[1].thresholdSeconds;
  }

  if (activeRound === 2) {
    return ROUND_COPY[2].thresholdSeconds;
  }

  return ROUND_COPY[3].thresholdSeconds;
}

function detectTarget(
  scanner: ScannerPosition,
  activeRound: ActiveRound,
  isMobile: boolean,
): ScannerTarget {
  if (!scanner.active || activeRound === 0) {
    return "inactive";
  }

  const zones = SIGNAL_ZONES[activeRound as 1 | 2 | 3];

  if (!zones) {
    return "noise";
  }

  if (isInsideZone(scanner, zones.true, isMobile)) {
    return "true";
  }

  if (zones.false && isInsideZone(scanner, zones.false, isMobile)) {
    return "false";
  }

  return "noise";
}

export function useSignalDetection({
  activeRound,
  isMobile,
  scannerRef,
  status,
  onSample,
}: UseSignalDetectionOptions) {
  useEffect(() => {
    if (!isScanningStatus(status)) {
      return;
    }

    let frame = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.12, (now - previous) / 1000);
      previous = now;

      onSample(
        detectTarget(scannerRef.current, activeRound, isMobile),
        dt,
        getThresholdSeconds(activeRound),
      );

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeRound, isMobile, onSample, scannerRef, status]);
}
