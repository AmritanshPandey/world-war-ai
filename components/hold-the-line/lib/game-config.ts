export type GameStatus =
  | "intro"
  | "countdown"
  | "playing"
  | "compromised"
  | "complete"
  | "results";

export type ChainState =
  | "emerging"
  | "active"
  | "exposed"
  | "disrupted"
  | "completed"
  | "expired";

export type ChainType = "standard" | "split" | "falseSignal" | "critical";

export type GamePhase = "learn" | "pressure" | "outbreak";

export type ScannerPosition = {
  x: number;
  y: number;
  active: boolean;
};

export type ChainNode = {
  id: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
};

export type InfectionChain = {
  id: string;
  type: ChainType;
  state: ChainState;
  nodes: ChainNode[];
  displayNodes?: ChainNode[];
  links: Array<[number, number]>;
  coreIndex: number | null;
  createdAt: number;
  durationMs: number;
  baseScore: number;
  altitudeLoss: number;
  altitudeGain: number;
  brightness: number;
  phaseOffset: number;
  lastScannedAt: number;
  exposedAt: number | null;
  resolvedAt: number | null;
};

export type PulseEvent = {
  id: number;
  x: number;
  y: number;
  charge: number;
  createdAt: number;
  result: "hit" | "perfect" | "miss" | "false";
};

export type ScorePopup = {
  id: number;
  x: number;
  y: number;
  label: string;
  createdAt: number;
};

export type PersistedBest = {
  score: number;
  combo: number;
  rank: string;
};

export const GAME_DURATION_MS = 45_000;
export const COUNTDOWN_MS = 1_400;
export const STORAGE_KEY = "world-war-ai.hold-the-line.best";

export const SCANNER = {
  radius: 0.24,
  mobileRadius: 0.34,
  chargeMs: 850,
  minPulseRadius: 0.24,
  maxPulseRadius: 0.46,
  maxEnergy: 100,
  minEnergyToPulse: 12,
  basePulseCost: 16,
  fullPulseCost: 32,
  missDrain: 12,
  rechargePerSecond: 28,
};

export const ALTITUDE = {
  start: 100,
  passivePressurePerSecond: 1.2,
  standardGain: 2,
  criticalGain: 4,
  perfectGain: 2,
  warning: 60,
  danger: 30,
};

export const CHAIN_TYPES: Record<
  ChainType,
  {
    label: string;
    baseScore: number;
    altitudeLoss: number;
    altitudeGain: number;
    minNodes: number;
    maxNodes: number;
    durationMs: [number, number];
  }
> = {
  standard: {
    label: "STANDARD CHAIN",
    baseScore: 100,
    altitudeLoss: 8,
    altitudeGain: ALTITUDE.standardGain,
    minNodes: 3,
    maxNodes: 4,
    durationMs: [9_800, 12_600],
  },
  split: {
    label: "SPLIT CHAIN",
    baseScore: 180,
    altitudeLoss: 10,
    altitudeGain: ALTITUDE.standardGain,
    minNodes: 5,
    maxNodes: 6,
    durationMs: [8_800, 11_200],
  },
  falseSignal: {
    label: "FALSE SIGNAL",
    baseScore: 0,
    altitudeLoss: 5,
    altitudeGain: 0,
    minNodes: 4,
    maxNodes: 6,
    durationMs: [8_200, 10_800],
  },
  critical: {
    label: "CRITICAL CHAIN",
    baseScore: 300,
    altitudeLoss: 16,
    altitudeGain: ALTITUDE.criticalGain,
    minNodes: 6,
    maxNodes: 7,
    durationMs: [6_800, 8_800],
  },
};

export const SCORE = {
  perfectBonus: 250,
  fastClearMin: 50,
  fastClearMax: 200,
  altitudeBonusMultiplier: 20,
};

export const COMBO_TIERS = [
  { streak: 10, multiplier: 5 },
  { streak: 6, multiplier: 3 },
  { streak: 3, multiplier: 2 },
  { streak: 0, multiplier: 1 },
];

export const PARTICLE_COUNTS = {
  desktop: 460,
  tablet: 300,
  mobile: 170,
  reducedMotion: 130,
};
