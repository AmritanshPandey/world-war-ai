import {
  CHAIN_TYPES,
  type ChainNode,
  type ChainType,
  type InfectionChain,
} from "@/components/hold-the-line/lib/game-config";

export function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function pickInt(random: () => number, min: number, max: number) {
  return Math.floor(min + random() * (max - min + 1));
}

function pickDuration(random: () => number, duration: [number, number]) {
  return Math.round(duration[0] + random() * (duration[1] - duration[0]));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function makeNode(
  chainId: string,
  index: number,
  x: number,
  y: number,
  type: ChainType,
  random: () => number,
): ChainNode {
  return {
    id: `${chainId}-${index}`,
    x: clamp(x, -0.88, 0.88),
    y,
    radius: type === "critical" ? 0.048 : type === "falseSignal" ? 0.052 : 0.044,
    intensity:
      type === "falseSignal" ? 0.92 + random() * 0.08 : 0.62 + random() * 0.25,
  };
}

function baseChainNodes(
  chainId: string,
  type: ChainType,
  count: number,
  random: () => number,
) {
  const x = -0.62 + random() * 1.24;
  const drift = -0.28 + random() * 0.56;
  const wiggle = 0.08 + random() * 0.12;
  const spacing = type === "critical" ? 0.12 : 0.15;

  return Array.from({ length: count }, (_, index) => {
    const t = count <= 1 ? 0 : index / (count - 1);
    const wave = Math.sin(t * Math.PI * 1.4 + random() * 0.8) * wiggle;

    return makeNode(
      chainId,
      index,
      x + drift * t + wave,
      0.92 - index * spacing,
      type,
      random,
    );
  });
}

function createSplitNodes(
  chainId: string,
  count: number,
  random: () => number,
) {
  const rootX = -0.5 + random() * 1;
  const branch = random() > 0.5 ? 1 : -1;
  const nodes: ChainNode[] = [
    makeNode(chainId, 0, rootX, 0.9, "split", random),
    makeNode(chainId, 1, rootX + branch * 0.07, 0.73, "split", random),
    makeNode(chainId, 2, rootX + branch * 0.04, 0.56, "split", random),
    makeNode(chainId, 3, rootX + branch * 0.24, 0.39, "split", random),
    makeNode(chainId, 4, rootX - branch * 0.2, 0.41, "split", random),
  ];

  if (count > 5) {
    nodes.push(makeNode(chainId, 5, rootX + branch * 0.36, 0.24, "split", random));
  }

  return nodes;
}

function linksFor(type: ChainType, count: number): Array<[number, number]> {
  if (type === "split") {
    return count > 5
      ? [
          [0, 1],
          [1, 2],
          [2, 3],
          [2, 4],
          [3, 5],
        ]
      : [
          [0, 1],
          [1, 2],
          [2, 3],
          [2, 4],
        ];
  }

  if (type === "falseSignal") {
    return Array.from({ length: count + 1 }, (_, index) => [
      index % count,
      (index + 1 + (index % 2)) % count,
    ]);
  }

  return Array.from({ length: count - 1 }, (_, index) => [index, index + 1]);
}

export function createChain({
  id,
  now,
  random,
  type,
}: {
  id: string;
  now: number;
  random: () => number;
  type: ChainType;
}): InfectionChain {
  const config = CHAIN_TYPES[type];
  const count = pickInt(random, config.minNodes, config.maxNodes);
  const nodes =
    type === "split"
      ? createSplitNodes(id, count, random)
      : baseChainNodes(id, type, count, random);
  const coreIndex =
    type === "falseSignal"
      ? null
      : type === "split"
        ? random() > 0.5
          ? 3
          : Math.min(5, nodes.length - 1)
        : type === "critical"
          ? pickInt(random, 2, nodes.length - 2)
          : pickInt(random, 1, nodes.length - 2);

  return {
    id,
    type,
    state: "emerging",
    nodes,
    links: linksFor(type, nodes.length),
    coreIndex,
    createdAt: now,
    durationMs: pickDuration(random, config.durationMs),
    baseScore: config.baseScore,
    altitudeLoss: config.altitudeLoss,
    altitudeGain: config.altitudeGain,
    brightness: type === "falseSignal" ? 1 : 0.68 + random() * 0.28,
    phaseOffset: random() * Math.PI * 2,
    lastScannedAt: 0,
    exposedAt: null,
    resolvedAt: null,
  };
}

export function projectedNodes(chain: InfectionChain, now: number) {
  const age = Math.max(0, now - chain.createdAt);
  const progress = Math.min(1, age / chain.durationMs);
  const leadingStart = Math.min(...chain.nodes.map((node) => node.y));
  const travel = leadingStart + 0.82;
  const jitter =
    chain.type === "falseSignal"
      ? Math.sin(now * 0.011 + chain.phaseOffset) * 0.035
      : Math.sin(now * 0.0028 + chain.phaseOffset) * 0.012;
  const branchJitter = chain.type === "split" ? Math.sin(now * 0.003) * 0.015 : 0;

  return chain.nodes.map((node, index) => {
    const branchOffset =
      chain.type === "split" && index >= 3
        ? (index % 2 === 0 ? -branchJitter : branchJitter)
        : 0;
    const falseScatter =
      chain.type === "falseSignal"
        ? Math.sin(now * 0.008 + index * 1.9 + chain.phaseOffset) * 0.035
        : 0;

    return {
      ...node,
      x: clamp(node.x + jitter + branchOffset + falseScatter, -0.9, 0.9),
      y: node.y - progress * travel,
    };
  });
}

export function chainProgress(chain: InfectionChain, now: number) {
  return Math.min(1, Math.max(0, (now - chain.createdAt) / chain.durationMs));
}

export function leadingY(chain: InfectionChain, now: number) {
  return Math.min(...projectedNodes(chain, now).map((node) => node.y));
}
