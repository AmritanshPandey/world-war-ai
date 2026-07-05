import {
  PRECISION_BONUS,
  ROUND_CONFIGS,
  type RoundNumber,
} from "@/components/spot-the-human/lib/game-config";

export type ScoreBreakdown = {
  base: number;
  speed: number;
  precision: number;
  total: number;
};

export type ScoreRank = {
  label: string;
  copy: string;
};

export function formatScore(score: number) {
  return Math.max(0, Math.round(score)).toLocaleString("en-US", {
    minimumIntegerDigits: 6,
  });
}

export function clampScore(score: number) {
  return Math.max(0, Math.round(score));
}

export function speedBonus(remainingMs: number, totalMs: number) {
  const ratio = remainingMs / Math.max(1, totalMs);

  if (ratio >= 0.55) return 2000;
  if (ratio >= 0.25) return 1000;
  return 300;
}

export function scoreRound({
  remainingMs,
  round,
  wrongClicks,
}: {
  remainingMs: number;
  round: RoundNumber;
  wrongClicks: number;
}): ScoreBreakdown {
  const config = ROUND_CONFIGS[round];
  const speed = speedBonus(remainingMs, config.timeLimitMs);
  const precision = wrongClicks === 0 ? PRECISION_BONUS : 0;
  const base = config.baseScore;

  return {
    base,
    speed,
    precision,
    total: base + speed + precision,
  };
}

export function accuracyFor(correctClicks: number, wrongClicks: number) {
  const total = correctClicks + wrongClicks;

  if (total === 0) {
    return 100;
  }

  return Math.round((correctClicks / total) * 100);
}

export function rankForScore(score: number): ScoreRank {
  if (score > 16000) {
    return {
      label: "OUTBREAK ANALYST",
      copy: "You identified the system before it identified you.",
    };
  }

  if (score > 12000) {
    return {
      label: "PATTERN ARCHITECT",
      copy: "You found structure before chaos could define the outcome.",
    };
  }

  if (score > 8000) {
    return {
      label: "SIGNAL HUNTER",
      copy: "You saw patterns others overlooked.",
    };
  }

  if (score > 4000) {
    return {
      label: "OBSERVER",
      copy: "You found the anomaly inside the noise.",
    };
  }

  return {
    label: "SURVIVOR",
    copy: "You stayed in the field. Observation starts there.",
  };
}

export function formatDuration(ms: number) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}
