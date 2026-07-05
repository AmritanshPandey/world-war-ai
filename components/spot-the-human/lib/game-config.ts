export type RoundNumber = 1 | 2 | 3;

export type GameStatus =
  | "intro"
  | "round1"
  | "round1Success"
  | "round2"
  | "round2Success"
  | "round3"
  | "round3Success"
  | "results"
  | "replaying";

export type ScannerPosition = {
  x: number;
  y: number;
  active: boolean;
};

export type CrowdPose =
  | "rush"
  | "climb"
  | "reach"
  | "fall"
  | "crouch"
  | "calm"
  | "still"
  | "sidestep";

export type FigureRole = "infected" | "target" | "decoy" | "cluster";

export type CrowdFigure = {
  id: string;
  role: FigureRole;
  pose: CrowdPose;
  baseX: number;
  baseY: number;
  depth: number;
  scale: number;
  seed: number;
  speed: number;
  sway: number;
  avoidRadius: number;
};

export type TargetBehavior =
  | "counterflow"
  | "coherentAvoidance"
  | "pressureGap";

export type RoundScene = {
  round: RoundNumber;
  figures: CrowdFigure[];
  target: CrowdFigure;
  decoys: CrowdFigure[];
};

export type ScoreEventTone = "gain" | "loss" | "hint" | "success";

export type ScoreEvent = {
  id: string;
  label: string;
  tone: ScoreEventTone;
  x: number;
  y: number;
  createdAt: number;
};

export type ScanPingTone = "neutral" | "coherence" | "warning" | "success";

export type ScanPing = {
  id: string;
  tone: ScanPingTone;
  x: number;
  y: number;
  createdAt: number;
};

export type PersistedBest = {
  score: number;
  rank: string;
};

export type RoundConfig = {
  round: RoundNumber;
  status: Extract<GameStatus, "round1" | "round2" | "round3">;
  successStatus: Extract<
    GameStatus,
    "round1Success" | "round2Success" | "round3Success"
  >;
  label: string;
  prompt: string;
  objective: string;
  targetRule: string;
  behavior: TargetBehavior;
  baseScore: number;
  timeLimitMs: number;
  desktopCount: number;
  mobileCount: number;
  hitRadius: number;
  nearRadius: number;
  correctMessage: string;
  wrongMessage: string;
  decoyMessage: string;
  targetMessage: string;
};

export const STORAGE_KEY = "world-war-ai:spot-the-human-best";
export const HINT_DELAY_MS = 6500;
export const WRONG_CLICK_PENALTY = 500;
export const HINT_PENALTY = 1000;
export const PRECISION_BONUS = 1000;
export const SUCCESS_HOLD_MS = 1450;

export const ROUND_CONFIGS: Record<RoundNumber, RoundConfig> = {
  1: {
    round: 1,
    status: "round1",
    successStatus: "round1Success",
    label: "ROUND 01 / OBSERVE",
    prompt: "Find the one moving against the crowd.",
    objective: "Motion anomaly",
    targetRule: "One calm figure moves against the dominant swarm vector.",
    behavior: "counterflow",
    baseScore: 2000,
    timeLimitMs: 15000,
    desktopCount: 64,
    mobileCount: 54,
    hitRadius: 0.15,
    nearRadius: 0.34,
    correctMessage: "ANOMALY CONFIRMED",
    wrongMessage: "FALSE SIGNAL",
    decoyMessage: "HIGH ACTIVITY / LOW COHERENCE",
    targetMessage: "MOTION ANOMALY DETECTED",
  },
  2: {
    round: 2,
    status: "round2",
    successStatus: "round2Success",
    label: "ROUND 02 / DISTRACTION",
    prompt: "The loudest signal is not always the important one.",
    objective: "Low activity / high coherence",
    targetRule: "The swarm bends around one controlled, consistent figure.",
    behavior: "coherentAvoidance",
    baseScore: 3500,
    timeLimitMs: 18000,
    desktopCount: 126,
    mobileCount: 88,
    hitRadius: 0.155,
    nearRadius: 0.32,
    correctMessage: "PATTERN CONFIRMED",
    wrongMessage: "ACTIVITY IS NOT INSIGHT",
    decoyMessage: "HIGH ACTIVITY / LOW COHERENCE",
    targetMessage: "LOW ACTIVITY / HIGH COHERENCE",
  },
  3: {
    round: 3,
    status: "round3",
    successStatus: "round3Success",
    label: "ROUND 03 / THE WALL",
    prompt: "Find the one the swarm cannot touch.",
    objective: "Pressure gap",
    targetRule: "A small empty space forms around one still figure in the wall.",
    behavior: "pressureGap",
    baseScore: 5000,
    timeLimitMs: 22000,
    desktopCount: 206,
    mobileCount: 112,
    hitRadius: 0.165,
    nearRadius: 0.3,
    correctMessage: "COHERENT PATTERN FOUND",
    wrongMessage: "NO COHERENT PATTERN",
    decoyMessage: "NO COHERENT PATTERN",
    targetMessage: "COHERENCE DETECTED",
  },
};

export const INTRO_STEPS = [
  {
    label: "SCAN THE SWARM",
    detail: "Observe movement patterns.",
  },
  {
    label: "FIND THE OUTLIER",
    detail: "Different behavior. Different fate.",
  },
  {
    label: "LOCK & CONFIRM",
    detail: "Click the human.",
  },
] as const;

export const PARTICLE_COUNTS = {
  desktop: 190,
  tablet: 145,
  mobile: 82,
  reducedMotion: 34,
} as const;

export function isActiveRoundStatus(status: GameStatus): status is RoundConfig["status"] {
  return status === "round1" || status === "round2" || status === "round3";
}

export function roundFromStatus(status: GameStatus): RoundNumber {
  if (status === "round2" || status === "round2Success") return 2;
  if (status === "round3" || status === "round3Success") return 3;
  return 1;
}
