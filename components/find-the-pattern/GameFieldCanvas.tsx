"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { useParticleQuality } from "@/components/webgl/useParticleQuality";
import {
  FIELD_BOUNDS,
  PARTICLE_COUNTS,
  SIGNAL_ZONES,
  type ActiveRound,
  type FieldEvent,
  type GameStatus,
  type ScannerPosition,
} from "@/components/find-the-pattern/lib/game-config";
import {
  clampRange,
  normalizedToWorld,
  seededRandom,
} from "@/components/find-the-pattern/lib/game-utils";

type GameFieldCanvasProps = {
  activeRound: ActiveRound;
  fieldEvent: FieldEvent;
  isMobile: boolean;
  reducedMotion: boolean;
  scannerRef: RefObject<ScannerPosition>;
  seed: number;
  status: GameStatus;
};

type ParticleKind = "noise" | "signal-one" | "false-two" | "true-two";

type Particle = {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  phase: number;
  seed: number;
  size: number;
  orbit: number;
  kind: ParticleKind;
};

type ParticleSet = {
  particles: Particle[];
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  groups: Record<ParticleKind, number[]>;
  signalOnePairs: Array<[number, number]>;
  trueTwoPairs: Array<[number, number]>;
  falseTwoPairs: Array<[number, number]>;
  noisePairs: Array<[number, number]>;
};

const particleVertexShader = `
  attribute float size;
  varying vec3 vColor;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (260.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  varying vec3 vColor;

  void main() {
    float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
    float alpha = smoothstep(0.5, 0.12, distanceFromCenter);
    float core = smoothstep(0.18, 0.0, distanceFromCenter);
    gl_FragColor = vec4(vColor + core * 0.18, alpha * 0.95);
  }
`;

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clampRange((value - edge0) / (edge1 - edge0), 0, 1);

  return x * x * (3 - 2 * x);
}

function zoneWorld(round: 1 | 2 | 3, type: "true" | "false" = "true") {
  const zone = SIGNAL_ZONES[round][type];

  return normalizedToWorld(zone ?? SIGNAL_ZONES[round].true);
}

function createPairs(indices: number[], count: number, random: () => number) {
  const pairs: Array<[number, number]> = [];

  if (indices.length < 2) {
    return pairs;
  }

  for (let index = 0; index < count; index += 1) {
    const from = indices[index % indices.length];
    const to =
      indices[
        (index + 1 + Math.floor(random() * Math.max(1, indices.length - 1))) %
          indices.length
      ];

    if (from !== to) {
      pairs.push([from, to]);
    }
  }

  return pairs;
}

function createParticleSet(count: number, seed: number): ParticleSet {
  const random = seededRandom(seed * 131 + count);
  const signalOneCenter = zoneWorld(1);
  const falseTwoCenter = zoneWorld(2, "false");
  const trueTwoCenter = zoneWorld(2);
  const signalOneCount = Math.max(14, Math.round(count * 0.1));
  const falseTwoCount = Math.max(22, Math.round(count * 0.15));
  const trueTwoCount = Math.max(14, Math.round(count * 0.09));
  const groups: Record<ParticleKind, number[]> = {
    noise: [],
    "signal-one": [],
    "false-two": [],
    "true-two": [],
  };
  const particles: Particle[] = [];

  for (let index = 0; index < count; index += 1) {
    let kind: ParticleKind = "noise";
    let center = {
      x: (random() * 2 - 1) * FIELD_BOUNDS.halfWidth,
      y: (random() * 2 - 1) * FIELD_BOUNDS.halfHeight,
    };
    let spread = 1;

    if (index < signalOneCount) {
      kind = "signal-one";
      center = signalOneCenter;
      spread = 0.58;
    } else if (index < signalOneCount + falseTwoCount) {
      kind = "false-two";
      center = falseTwoCenter;
      spread = 0.88;
    } else if (index < signalOneCount + falseTwoCount + trueTwoCount) {
      kind = "true-two";
      center = trueTwoCenter;
      spread = 0.5;
    }

    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * spread;
    const x =
      kind === "noise"
        ? center.x
        : center.x + Math.cos(angle) * radius * FIELD_BOUNDS.halfWidth * 0.16;
    const y =
      kind === "noise"
        ? center.y
        : center.y + Math.sin(angle) * radius * FIELD_BOUNDS.halfHeight * 0.18;

    particles.push({
      baseX: x,
      baseY: y,
      x,
      y,
      z: (random() - 0.5) * 0.8,
      vx: (random() - 0.5) * 0.34,
      vy: (random() - 0.5) * 0.34,
      phase: random() * Math.PI * 2,
      seed: random() * 1000,
      size: 0.052 + random() * 0.052,
      orbit: 0.55 + random() * 0.75,
      kind,
    });

    groups[kind].push(index);
  }

  return {
    particles,
    positions: new Float32Array(count * 3),
    colors: new Float32Array(count * 3),
    sizes: new Float32Array(count),
    groups,
    signalOnePairs: createPairs(groups["signal-one"], 58, random),
    trueTwoPairs: createPairs(groups["true-two"], 52, random),
    falseTwoPairs: createPairs(groups["false-two"], 82, random),
    noisePairs: createPairs(groups.noise, 72, random),
  };
}

function updateLinePositions(
  array: Float32Array,
  pairs: Array<[number, number]>,
  particles: Particle[],
) {
  for (let index = 0; index < pairs.length; index += 1) {
    const [fromIndex, toIndex] = pairs[index];
    const from = particles[fromIndex];
    const to = particles[toIndex];
    const offset = index * 6;

    array[offset] = from.x;
    array[offset + 1] = from.y;
    array[offset + 2] = from.z - 0.03;
    array[offset + 3] = to.x;
    array[offset + 4] = to.y;
    array[offset + 5] = to.z - 0.03;
  }

  for (let index = pairs.length; index < array.length / 6; index += 1) {
    const offset = index * 6;

    array[offset] = 0;
    array[offset + 1] = 0;
    array[offset + 2] = -6;
    array[offset + 3] = 0;
    array[offset + 4] = 0;
    array[offset + 5] = -6;
  }
}

function getParticleCount(width: number, reducedMotion: boolean) {
  if (reducedMotion) {
    return PARTICLE_COUNTS.reducedMotion;
  }

  if (width < 768) {
    return PARTICLE_COUNTS.mobile;
  }

  if (width < 1024) {
    return PARTICLE_COUNTS.tablet;
  }

  return PARTICLE_COUNTS.desktop;
}

function ContextLossGuard({
  onContextLostChange,
}: {
  onContextLostChange: (lost: boolean) => void;
}) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onContextLostChange(true);
    };
    const handleContextRestored = () => {
      onContextLostChange(false);
    };

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener(
      "webglcontextrestored",
      handleContextRestored,
      false,
    );

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost, false);
      canvas.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
        false,
      );
    };
  }, [gl, onContextLostChange]);

  return null;
}

function ParticleField({
  activeRound,
  fieldEvent,
  isMobile,
  reducedMotion,
  scannerRef,
  seed,
  status,
}: GameFieldCanvasProps) {
  const pointsGeometryRef = useRef<THREE.BufferGeometry>(null);
  const signalGeometryRef = useRef<THREE.BufferGeometry>(null);
  const falseGeometryRef = useRef<THREE.BufferGeometry>(null);
  const noiseGeometryRef = useRef<THREE.BufferGeometry>(null);
  const signalMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const falseMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const noiseMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const statusRef = useRef(status);
  const activeRoundRef = useRef(activeRound);
  const fieldEventRef = useRef(fieldEvent);
  const reducedMotionRef = useRef(reducedMotion);
  const isMobileRef = useRef(isMobile);
  const count = getParticleCount(
    typeof window === "undefined" ? 1200 : window.innerWidth,
    reducedMotion,
  );
  const particleSet = useMemo(() => createParticleSet(count, seed), [count, seed]);
  const signalLinePositions = useMemo(() => new Float32Array(58 * 6), []);
  const trueLinePositions = useMemo(() => new Float32Array(82 * 6), []);
  const noiseLinePositions = useMemo(() => new Float32Array(72 * 6), []);

  useEffect(() => {
    statusRef.current = status;
    activeRoundRef.current = activeRound;
    fieldEventRef.current = fieldEvent;
    reducedMotionRef.current = reducedMotion;
    isMobileRef.current = isMobile;
  }, [activeRound, fieldEvent, isMobile, reducedMotion, status]);

  useFrame(() => {
    const time = performance.now() * 0.001;
    const scanner = scannerRef.current;
    const scannerWorld = normalizedToWorld(scanner);
    const round = activeRoundRef.current;
    const currentStatus = statusRef.current;
    const event = fieldEventRef.current;
    const mobile = isMobileRef.current;
    const reduced = reducedMotionRef.current;
    const resolve =
      currentStatus === "results" ||
      (event === "resolve" && currentStatus === "round3-final-scan");
    const extraNoise = event === "extra-noise";
    const collapseFalse = event === "false-collapse";
    const scanRadius = mobile ? 1.85 : 1.2;
    const signalOneCenter = zoneWorld(1);
    const falseTwoCenter = zoneWorld(2, "false");
    const trueTwoCenter = resolve ? zoneWorld(3) : zoneWorld(2);
    const activeSignalCenter = round === 1 ? signalOneCenter : trueTwoCenter;
    const signalDistance = Math.sqrt(
      (activeSignalCenter.x - scannerWorld.x) ** 2 +
        (activeSignalCenter.y - scannerWorld.y) ** 2,
    );
    const signalProximity =
      scanner.active && !resolve
        ? 1 - smoothstep(0, scanRadius * 1.45, signalDistance)
        : 0;

    particleSet.particles.forEach((particle, index) => {
      const isSignalOne = particle.kind === "signal-one" && round === 1;
      const isTrueTwo =
        particle.kind === "true-two" && (round === 2 || round === 3);
      const isFalseTwo = particle.kind === "false-two" && round === 2;
      const activeTrueSignal = isSignalOne || isTrueTwo || resolve;
      let targetX = particle.baseX;
      let targetY = particle.baseY;
      const targetZ = particle.z;
      let red = 0.68;
      let green = 0.055;
      let blue = 0.04;
      let targetSize = particle.size;

      if (particle.kind === "signal-one") {
        const angle = particle.phase + time * (reduced ? 0.08 : 0.48);
        const triangle = Math.floor(((angle % (Math.PI * 2)) / (Math.PI * 2)) * 3);
        const triAngle = triangle * ((Math.PI * 2) / 3) + particle.phase * 0.08;

        targetX =
          signalOneCenter.x +
          Math.cos(angle) * 0.28 * particle.orbit +
          Math.cos(triAngle) * 0.24;
        targetY =
          signalOneCenter.y +
          Math.sin(angle) * 0.2 * particle.orbit +
          Math.sin(triAngle) * 0.2;
      } else if (particle.kind === "true-two") {
        const angle = particle.phase + time * (reduced ? 0.06 : 0.34);

        targetX =
          trueTwoCenter.x +
          Math.cos(angle) * 0.22 * particle.orbit +
          Math.cos(angle * 2.0) * 0.08;
        targetY =
          trueTwoCenter.y +
          Math.sin(angle) * 0.28 * particle.orbit +
          Math.sin(angle * 0.5) * 0.06;
      } else if (particle.kind === "false-two") {
        const burst = collapseFalse ? 0.18 : extraNoise ? 1.45 : 1;
        const angle =
          particle.phase +
          time * (reduced ? 0.12 : 1.16 + Math.sin(particle.seed) * 0.2);

        targetX =
          falseTwoCenter.x +
          Math.cos(angle * 1.7) * 0.6 * particle.orbit * burst +
          Math.sin(time * 5.0 + particle.seed) * 0.12 * burst;
        targetY =
          falseTwoCenter.y +
          Math.sin(angle) * 0.42 * particle.orbit * burst +
          Math.cos(time * 4.4 + particle.phase) * 0.12 * burst;
        red = 0.88;
        green = 0.06;
        blue = 0.04;
      } else {
        const drift = reduced ? 0.1 : extraNoise ? 0.72 : 0.38;

        targetX =
          particle.baseX +
          Math.sin(time * 0.42 + particle.seed) * drift +
          Math.cos(time * 0.73 + particle.phase) * drift * 0.46;
        targetY =
          particle.baseY +
          Math.cos(time * 0.37 + particle.seed) * drift +
          Math.sin(time * 0.86 + particle.phase) * drift * 0.42;
      }

      if (resolve) {
        const finalCenter = zoneWorld(3);
        const finalAngle = particle.phase + time * (reduced ? 0.04 : 0.18);
        const finalRadius =
          particle.kind === "noise"
            ? 2.0 + (particle.seed % 1) * 1.1
            : 0.45 + particle.orbit * 0.42;

        targetX =
          finalCenter.x +
          Math.cos(finalAngle) * finalRadius +
          Math.sin(particle.seed) * 0.12;
        targetY =
          finalCenter.y +
          Math.sin(finalAngle * 0.72) * finalRadius * 0.55;
        red = particle.kind === "noise" ? 0.18 : 0.86;
        green = particle.kind === "noise" ? 0.08 : 0.68;
        blue = particle.kind === "noise" ? 0.06 : 0.34;
        targetSize = particle.kind === "noise" ? particle.size * 0.55 : particle.size * 1.3;
      }

      const dx = targetX - scannerWorld.x;
      const dy = targetY - scannerWorld.y;
      const scanDistance = Math.sqrt(dx * dx + dy * dy);
      const scanInfluence =
        scanner.active && !resolve
          ? 1 - smoothstep(0, scanRadius, scanDistance)
          : 0;

      if (scanInfluence > 0.001) {
        if (activeTrueSignal) {
          red = 0.88;
          green = 0.68 + scanInfluence * 0.16;
          blue = 0.36 + scanInfluence * 0.2;
          targetSize += scanInfluence * 0.035;
          targetX += (particle.x - targetX) * scanInfluence * 0.04;
          targetY += (particle.y - targetY) * scanInfluence * 0.04;
        } else if (isFalseTwo) {
          red = 1;
          green = 0.08;
          blue = 0.04;
          targetSize += scanInfluence * 0.045;
          targetX += Math.sin(time * 9 + particle.seed) * scanInfluence * 0.24;
          targetY += Math.cos(time * 8 + particle.phase) * scanInfluence * 0.24;
        } else {
          const safeDistance = Math.max(0.001, scanDistance);

          targetX += (dx / safeDistance) * scanInfluence * 0.36;
          targetY += (dy / safeDistance) * scanInfluence * 0.36;
          red = 0.72 + scanInfluence * 0.2;
          green = 0.04;
          blue = 0.035;
        }
      }

      const speed = reduced ? 0.035 : activeTrueSignal ? 0.09 : 0.055;
      particle.x += (targetX - particle.x) * speed;
      particle.y += (targetY - particle.y) * speed;
      particle.z += (targetZ - particle.z) * 0.04;

      const positionOffset = index * 3;
      particleSet.positions[positionOffset] = particle.x;
      particleSet.positions[positionOffset + 1] = particle.y;
      particleSet.positions[positionOffset + 2] = particle.z;
      particleSet.colors[positionOffset] = red;
      particleSet.colors[positionOffset + 1] = green;
      particleSet.colors[positionOffset + 2] = blue;
      particleSet.sizes[index] = targetSize;
    });

    const positionAttribute = pointsGeometryRef.current?.getAttribute(
      "position",
    ) as THREE.BufferAttribute | undefined;
    const colorAttribute = pointsGeometryRef.current?.getAttribute("color") as
      | THREE.BufferAttribute
      | undefined;
    const sizeAttribute = pointsGeometryRef.current?.getAttribute("size") as
      | THREE.BufferAttribute
      | undefined;

    if (positionAttribute && colorAttribute && sizeAttribute) {
      positionAttribute.needsUpdate = true;
      colorAttribute.needsUpdate = true;
      sizeAttribute.needsUpdate = true;
    }

    const signalPairs =
      round === 1 ? particleSet.signalOnePairs : particleSet.trueTwoPairs;

    updateLinePositions(
      signalLinePositions,
      resolve ? particleSet.trueTwoPairs : signalPairs,
      particleSet.particles,
    );
    updateLinePositions(
      trueLinePositions,
      particleSet.falseTwoPairs,
      particleSet.particles,
    );
    updateLinePositions(
      noiseLinePositions,
      particleSet.noisePairs,
      particleSet.particles,
    );

    const signalLineAttribute = signalGeometryRef.current?.getAttribute(
      "position",
    ) as THREE.BufferAttribute | undefined;
    const falseLineAttribute = falseGeometryRef.current?.getAttribute(
      "position",
    ) as THREE.BufferAttribute | undefined;
    const noiseLineAttribute = noiseGeometryRef.current?.getAttribute(
      "position",
    ) as THREE.BufferAttribute | undefined;

    if (signalLineAttribute) {
      signalLineAttribute.needsUpdate = true;
    }

    if (falseLineAttribute) {
      falseLineAttribute.needsUpdate = true;
    }

    if (noiseLineAttribute) {
      noiseLineAttribute.needsUpdate = true;
    }

    if (signalMaterialRef.current) {
      signalMaterialRef.current.opacity = resolve
        ? 0.34
        : round === 3
          ? 0.18
          : 0.025 + signalProximity * 0.32;
    }

    if (falseMaterialRef.current) {
      falseMaterialRef.current.opacity =
        round === 2 ? (collapseFalse ? 0.07 : extraNoise ? 0.34 : 0.24) : 0.07;
    }

    if (noiseMaterialRef.current) {
      noiseMaterialRef.current.opacity = resolve ? 0.03 : extraNoise ? 0.24 : 0.12;
    }
  });

  return (
    <group>
      <points>
        <bufferGeometry ref={pointsGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[particleSet.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particleSet.colors, 3]}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[particleSet.sizes, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          transparent
          vertexColors
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fragmentShader={particleFragmentShader}
          vertexShader={particleVertexShader}
        />
      </points>

      <lineSegments>
        <bufferGeometry ref={signalGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[signalLinePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={signalMaterialRef}
          color="#d8b35f"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </lineSegments>

      <lineSegments>
        <bufferGeometry ref={falseGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[trueLinePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={falseMaterialRef}
          color="#d3170c"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </lineSegments>

      <lineSegments>
        <bufferGeometry ref={noiseGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[noiseLinePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={noiseMaterialRef}
          color="#d3170c"
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

export default function GameFieldCanvas(props: GameFieldCanvasProps) {
  const quality = useParticleQuality();
  const [contextLost, setContextLost] = useState(false);
  const [webglAvailable] = useState(() => {
    if (typeof document === "undefined") {
      return false;
    }

    const canvas = document.createElement("canvas");

    return Boolean(
      canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl"),
    );
  });

  if (!webglAvailable) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_44%_42%,rgba(216,179,95,0.12),transparent_28%),radial-gradient(circle_at_58%_55%,rgba(211,23,12,0.14),transparent_34%),#030303]" />
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 8.4], fov: 44 }}
      dpr={quality.dpr}
      frameloop={quality.reducedMotion || contextLost ? "demand" : "always"}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference:
          quality.tier === "low-power-mobile"
            ? "low-power"
            : "high-performance",
      }}
      style={{
        background: "transparent",
        opacity: contextLost ? 0 : 1,
      }}
    >
      <color attach="background" args={["#030303"]} />
      <fog attach="fog" args={["#030303", 7, 14]} />
      <ContextLossGuard onContextLostChange={setContextLost} />
      {contextLost ? null : (
        <ParticleField
          {...props}
          reducedMotion={props.reducedMotion || quality.reducedMotion}
        />
      )}
    </Canvas>
  );
}
