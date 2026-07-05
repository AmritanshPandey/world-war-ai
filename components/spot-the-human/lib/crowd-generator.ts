import {
  ROUND_CONFIGS,
  type CrowdFigure,
  type CrowdPose,
  type FigureRole,
  type RoundNumber,
  type RoundScene,
} from "@/components/spot-the-human/lib/game-config";

type RandomFn = () => number;

const POSES: CrowdPose[] = ["rush", "climb", "reach", "fall", "crouch"];
const DECOY_POSES: CrowdPose[] = ["rush", "reach", "fall"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createSeededRandom(seed: number): RandomFn {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pick<T>(items: T[], random: RandomFn): T {
  return items[Math.floor(random() * items.length)] ?? items[0];
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function targetForRound(round: RoundNumber): CrowdFigure {
  if (round === 1) {
    return {
      id: "target-r1",
      role: "target",
      pose: "calm",
      baseX: -0.38,
      baseY: 0.16,
      depth: 0.82,
      scale: 1.08,
      seed: 101,
      speed: 0.11,
      sway: 0.025,
      avoidRadius: 0.2,
    };
  }

  if (round === 2) {
    return {
      id: "target-r2",
      role: "target",
      pose: "sidestep",
      baseX: 0.24,
      baseY: 0.04,
      depth: 0.78,
      scale: 1.02,
      seed: 202,
      speed: 0.07,
      sway: 0.045,
      avoidRadius: 0.24,
    };
  }

  return {
    id: "target-r3",
    role: "target",
    pose: "still",
    baseX: -0.08,
    baseY: 0.02,
    depth: 0.74,
    scale: 1.0,
    seed: 303,
    speed: 0.025,
    sway: 0.018,
    avoidRadius: 0.25,
  };
}

function roleForRound(round: RoundNumber, index: number, random: RandomFn): FigureRole {
  if (round === 2) {
    if (index % 17 === 0 || random() > 0.93) return "decoy";
    if (index % 23 === 0) return "cluster";
  }

  if (round === 3 && index % 29 === 0) {
    return "decoy";
  }

  return "infected";
}

function positionForRound(
  round: RoundNumber,
  random: RandomFn,
  target: CrowdFigure,
) {
  if (round === 1) {
    return {
      x: random() * 1.62 - 0.81,
      y: random() * 1.08 - 0.18,
    };
  }

  if (round === 2) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 0.88;
    let x = Math.cos(angle) * radius;
    let y = Math.sin(angle) * radius * 0.72 + 0.05;
    const targetDistance = distance({ x, y }, { x: target.baseX, y: target.baseY });

    if (targetDistance < target.avoidRadius) {
      const push = (target.avoidRadius - targetDistance) / Math.max(0.001, targetDistance);
      x += (x - target.baseX) * push;
      y += (y - target.baseY) * push;
    }

    return {
      x: clamp(x, -0.9, 0.9),
      y: clamp(y, -0.62, 0.78),
    };
  }

  const vertical = random();
  const width = 0.16 + Math.pow(vertical, 0.72) * 0.64;
  let x = (random() * 2 - 1) * width;
  let y = -0.52 + vertical * 1.28;
  const targetDistance = distance({ x, y }, { x: target.baseX, y: target.baseY });

  if (targetDistance < target.avoidRadius + 0.03) {
    const push =
      (target.avoidRadius + 0.03 - targetDistance) / Math.max(0.001, targetDistance);
    x += (x - target.baseX) * push * 1.1;
    y += (y - target.baseY) * push * 0.82;
  }

  return {
    x: clamp(x, -0.88, 0.88),
    y: clamp(y, -0.56, 0.82),
  };
}

export function createRoundCrowd(
  round: RoundNumber,
  isMobile: boolean,
  reducedMotion: boolean,
): RoundScene {
  const config = ROUND_CONFIGS[round];
  const random = createSeededRandom(round * 4481 + (isMobile ? 19 : 0));
  const target = targetForRound(round);
  const count = isMobile ? config.mobileCount : config.desktopCount;
  const figures: CrowdFigure[] = [];

  for (let index = 0; index < count; index += 1) {
    const role = roleForRound(round, index, random);
    const position = positionForRound(round, random, target);
    const depth = 0.42 + random() * 0.58;
    const pose =
      role === "cluster"
        ? "crouch"
        : role === "decoy"
          ? pick(DECOY_POSES, random)
          : pick(POSES, random);

    figures.push({
      id: `r${round}-f${index}`,
      role,
      pose,
      baseX: position.x,
      baseY: position.y,
      depth,
      scale:
        (0.68 + random() * 0.58) *
        (role === "decoy" ? 1.08 : 1) *
        (reducedMotion ? 1.05 : 1),
      seed: random() * 1000,
      speed:
        (0.08 + random() * 0.18) *
        (role === "decoy" ? 1.45 : 1) *
        (round === 3 ? 1.28 : 1),
      sway: 0.015 + random() * 0.06,
      avoidRadius: target.avoidRadius,
    });
  }

  return {
    round,
    figures,
    target,
    decoys: figures.filter((figure) => figure.role === "decoy"),
  };
}
