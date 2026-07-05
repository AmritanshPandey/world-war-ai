export type GameStatus =
  | "intro"
  | "round1-scanning"
  | "round1-lock-ready"
  | "round1-complete"
  | "round2-scanning"
  | "round2-false-feedback"
  | "round2-lock-ready"
  | "round2-complete"
  | "round3-decision"
  | "round3-final-scan"
  | "results";

export type ActiveRound = 0 | 1 | 2 | 3;

export type ScannerTarget = "inactive" | "noise" | "true" | "false";

export type FieldEvent =
  | "idle"
  | "extra-noise"
  | "false-collapse"
  | "resolve";

export type DecisionId = "generate-more" | "copy-trend" | "observe-system";

export type ScannerPosition = {
  x: number;
  y: number;
  active: boolean;
};

export type SignalZone = {
  x: number;
  y: number;
  radius: number;
  mobileRadius: number;
};

export const FIELD_BOUNDS = {
  halfWidth: 5.8,
  halfHeight: 3.25,
};

export const SIGNAL_ZONES: Record<
  1 | 2 | 3,
  {
    true: SignalZone;
    false?: SignalZone;
  }
> = {
  1: {
    true: { x: -0.34, y: -0.04, radius: 0.22, mobileRadius: 0.32 },
  },
  2: {
    true: { x: 0.34, y: 0.12, radius: 0.2, mobileRadius: 0.3 },
    false: { x: -0.34, y: -0.12, radius: 0.26, mobileRadius: 0.36 },
  },
  3: {
    true: { x: 0.02, y: 0.02, radius: 0.26, mobileRadius: 0.38 },
  },
};

export const ROUND_COPY = {
  intro: {
    eyebrow: "WORLD WAR AI / FINAL TEST",
    title: "FIND THE PATTERN",
    prompt: "The system is noisy. Find the signal.",
    instruction: "Move to scan. Observe behavior. Lock the pattern.",
  },
  1: {
    label: "ROUND 1 / NOISE",
    prompt: "The system is noisy. Find the signal.",
    complete: "Consistency detected.",
    lesson: "Volume is not signal.",
    thresholdSeconds: 1.4,
  },
  2: {
    label: "ROUND 2 / FALSE CERTAINTY",
    prompt: "The most visible pattern is not always the important one.",
    falseLabel: "HIGH ACTIVITY / LOW COHERENCE",
    trueLabel: "LOW ACTIVITY / HIGH COHERENCE",
    falseLock: "Pattern unstable. Activity is not insight.",
    complete: "Signal confirmed.",
    lesson: "The loudest output is not always the best answer.",
    thresholdSeconds: 1.6,
  },
  3: {
    label: "ROUND 3 / DECISION",
    prompt: "Choose what matters.",
    complete: "Judgment begins where generation ends.",
    thresholdSeconds: 1.5,
  },
};

export const DECISIONS: Array<{
  id: DecisionId;
  label: string;
  description: string;
}> = [
  {
    id: "generate-more",
    label: "GENERATE MORE",
    description: "Create additional options.",
  },
  {
    id: "copy-trend",
    label: "COPY THE TREND",
    description: "Follow the largest pattern.",
  },
  {
    id: "observe-system",
    label: "OBSERVE THE SYSTEM",
    description: "Understand the signal before acting.",
  },
];

export const SCORE_LIMITS = {
  round1Base: 30,
  round1TimeBonus: 10,
  round1Max: 40,
  round2Base: 35,
  round2TimeBonus: 10,
  round2Max: 45,
  round2FalsePenalty: 8,
  round3WrongPenalty: 5,
  round3Bonus: 15,
  streakBonus: 3,
  max: 100,
};

export const PARTICLE_COUNTS = {
  desktop: 420,
  tablet: 280,
  mobile: 160,
  reducedMotion: 130,
};
