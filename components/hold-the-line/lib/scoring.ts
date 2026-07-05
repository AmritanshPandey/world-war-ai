import {
  COMBO_TIERS,
  GAME_DURATION_MS,
  SCORE,
  type ChainType,
  type PersistedBest,
} from "@/components/hold-the-line/lib/game-config";

export type Rank = {
  title: string;
  description: string;
};

export function formatScore(score: number) {
  return Math.max(0, Math.round(score)).toLocaleString("en-US", {
    minimumIntegerDigits: 6,
  });
}

export function comboMultiplier(streak: number) {
  return COMBO_TIERS.find((tier) => streak >= tier.streak)?.multiplier ?? 1;
}

export function fastClearBonus(progress: number) {
  const remaining = Math.max(0, Math.min(1, 1 - progress));

  return Math.round(
    SCORE.fastClearMin +
      (SCORE.fastClearMax - SCORE.fastClearMin) * remaining,
  );
}

export function chainScore({
  baseScore,
  charge,
  perfect,
  progress,
  streak,
}: {
  baseScore: number;
  charge: number;
  perfect: boolean;
  progress: number;
  streak: number;
}) {
  const nextStreak = streak + 1;
  const multiplier = comboMultiplier(nextStreak);
  const speedBonus = fastClearBonus(progress);
  const perfectBonus = perfect ? SCORE.perfectBonus : 0;
  const chargeBonus = Math.round(charge * 80);
  const raw = baseScore + speedBonus + perfectBonus + chargeBonus;

  return {
    nextStreak,
    multiplier,
    speedBonus,
    perfectBonus,
    total: raw * multiplier,
  };
}

export function altitudeBonus(altitude: number) {
  return Math.round(Math.max(0, altitude) * SCORE.altitudeBonusMultiplier);
}

export function getRank(score: number): Rank {
  if (score >= 12_001) {
    return {
      title: "OUTBREAK COMMANDER",
      description: "You contained chaos before it could define the outcome.",
    };
  }

  if (score >= 7_001) {
    return {
      title: "PATTERN BREAKER",
      description: "You saw where the system could be changed.",
    };
  }

  if (score >= 3_001) {
    return {
      title: "SIGNAL HUNTER",
      description: "You found leverage in the noise.",
    };
  }

  return {
    title: "SYSTEM OBSERVER",
    description: "Chaos is easier to read when you slow down and study behavior.",
  };
}

export function formatTimeRemaining(elapsedMs: number) {
  const remaining = Math.max(0, Math.ceil((GAME_DURATION_MS - elapsedMs) / 1000));

  return `0:${String(remaining).padStart(2, "0")}`;
}

export function completedTier(streak: number) {
  return `x${comboMultiplier(streak)}`;
}

export function chainTypeLabel(type: ChainType) {
  if (type === "falseSignal") {
    return "HIGH ACTIVITY / LOW COHERENCE";
  }

  return type.toUpperCase().replace(/([A-Z])/g, " $1").trim();
}

export function betterBest(
  current: PersistedBest,
  candidate: PersistedBest,
): PersistedBest {
  if (candidate.score > current.score) {
    return candidate;
  }

  if (candidate.score === current.score && candidate.combo > current.combo) {
    return candidate;
  }

  return current;
}
